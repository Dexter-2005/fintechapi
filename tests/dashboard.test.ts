import request from 'supertest';
import { execSync } from 'child_process';
import prisma from '../src/config/db';
import app from '../src/app';

let adminToken: string;
let analystToken: string;
let viewerToken: string;

beforeAll(async () => {
  execSync('npx prisma db push --force-reset', { env: { ...process.env } });

  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin',
    email: 'admin2@example.com',
    password: 'password123',
    role: 'ADMIN',
  });
  adminToken = adminRes.body.data.token;

  const analystRes = await request(app).post('/api/auth/register').send({
    name: 'Analyst',
    email: 'analyst2@example.com',
    password: 'password123',
    role: 'ANALYST',
  });
  analystToken = analystRes.body.data.token;

  const viewerRes = await request(app).post('/api/auth/register').send({
    name: 'Viewer',
    email: 'viewer2@example.com',
    password: 'password123',
    role: 'VIEWER',
  });
  viewerToken = viewerRes.body.data.token;

  // Seed some records
  await request(app)
    .post('/api/records')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ amount: 10000, type: 'INCOME', category: 'Salary', date: '2024-01-01T00:00:00.000Z' });

  await request(app)
    .post('/api/records')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ amount: 2000, type: 'EXPENSE', category: 'Rent', date: '2024-01-05T00:00:00.000Z' });

  await request(app)
    .post('/api/records')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ amount: 500, type: 'EXPENSE', category: 'Food', date: '2024-01-10T00:00:00.000Z' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Dashboard API', () => {
  describe('GET /api/dashboard/summary', () => {
    it('should return summary for ADMIN', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalIncome');
      expect(res.body.data).toHaveProperty('totalExpenses');
      expect(res.body.data).toHaveProperty('netBalance');
      expect(res.body.data.totalIncome).toBe(10000);
      expect(res.body.data.totalExpenses).toBe(2500);
      expect(res.body.data.netBalance).toBe(7500);
    });

    it('should return summary for ANALYST', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 403 for VIEWER', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/dashboard/by-category', () => {
    it('should return category breakdown', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const categories = res.body.data.map((c: { category: string }) => c.category);
      expect(categories).toContain('Salary');
      expect(categories).toContain('Rent');
    });

    it('should return 403 for VIEWER', async () => {
      const res = await request(app)
        .get('/api/dashboard/by-category')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should return monthly trends array', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/dashboard/recent', () => {
    it('should return last 10 transactions', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });
  });
});
