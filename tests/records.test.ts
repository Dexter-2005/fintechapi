import request from 'supertest';
import { execSync } from 'child_process';
import prisma from '../src/config/db';
import app from '../src/app';

let adminToken: string;
let analystToken: string;
let viewerToken: string;

beforeAll(async () => {
  execSync('npx prisma db push --force-reset', { env: { ...process.env } });

  // Register users with different roles
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN',
  });
  adminToken = adminRes.body.data.token;

  const analystRes = await request(app).post('/api/auth/register').send({
    name: 'Analyst User',
    email: 'analyst@example.com',
    password: 'password123',
    role: 'ANALYST',
  });
  analystToken = analystRes.body.data.token;

  const viewerRes = await request(app).post('/api/auth/register').send({
    name: 'Viewer User',
    email: 'viewer@example.com',
    password: 'password123',
    role: 'VIEWER',
  });
  viewerToken = viewerRes.body.data.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Financial Records API', () => {
  let recordId: string;

  describe('POST /api/records (ADMIN only)', () => {
    it('should create a record when ADMIN', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000,
          type: 'INCOME',
          category: 'Salary',
          date: '2024-01-15T00:00:00.000Z',
          notes: 'January salary',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Salary');
      recordId = res.body.data.id;
    });

    it('should return 403 when ANALYST tries to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          amount: 100,
          type: 'EXPENSE',
          category: 'Food',
          date: '2024-01-16T00:00:00.000Z',
        });
      expect(res.status).toBe(403);
    });

    it('should return 403 when VIEWER tries to create a record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 100,
          type: 'EXPENSE',
          category: 'Food',
          date: '2024-01-16T00:00:00.000Z',
        });
      expect(res.status).toBe(403);
    });

    it('should return 422 for negative amount', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: -100,
          type: 'EXPENSE',
          category: 'Food',
          date: '2024-01-16T00:00:00.000Z',
        });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/records', () => {
    it('should return records for VIEWER', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('records');
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('should paginate correctly', async () => {
      const res = await request(app)
        .get('/api/records?page=1&limit=5')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
    });

    it('should filter by type=INCOME', async () => {
      const res = await request(app)
        .get('/api/records?type=INCOME')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      res.body.data.records.forEach((r: { type: string }) => {
        expect(r.type).toBe('INCOME');
      });
    });
  });

  describe('GET /api/records/:id', () => {
    it('should return a single record', async () => {
      const res = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(recordId);
    });

    it('should return 404 for non-existent ID', async () => {
      const res = await request(app)
        .get('/api/records/non-existent-id')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/records/:id (ADMIN only)', () => {
    it('should update a record when ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Updated notes' });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Updated notes');
    });

    it('should return 403 when VIEWER tries to update', async () => {
      const res = await request(app)
        .patch(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ notes: 'Hacked' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/records/:id (ADMIN only, soft delete)', () => {
    it('should soft delete a record when ADMIN', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should not return soft-deleted records in GET /api/records', async () => {
      const res = await request(app)
        .get(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when VIEWER tries to delete', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });
});
