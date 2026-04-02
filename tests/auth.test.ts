import request from 'supertest';
import { execSync } from 'child_process';
import prisma from '../src/config/db';
import app from '../src/app';

beforeAll(async () => {
  // Push schema to test.db
  execSync('npx prisma db push --force-reset', { env: { ...process.env } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201 with token', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user.role).toBe('VIEWER');
    });

    it('should return 409 if email already exists', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 422 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'password123' });
      expect(res.status).toBe(422);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 422 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test2@example.com', password: '123' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });
      expect(res.status).toBe(401);
    });

    it('should return 422 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email });
      expect(res.status).toBe(422);
    });
  });

  describe('Protected route without token', () => {
    it('GET /api/records should return 401 without auth', async () => {
      const res = await request(app).get('/api/records');
      expect(res.status).toBe(401);
    });
  });
});
