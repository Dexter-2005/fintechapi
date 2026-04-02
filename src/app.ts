import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import recordRoutes from './modules/records/records.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Swagger ──────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Dashboard API',
      version: '1.0.0',
      description:
        'A robust REST API for managing financial records with role-based access control. ' +
        'Roles: VIEWER (read records), ANALYST (+ dashboard), ADMIN (full access).',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT ?? 3000}`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Finance API is running.', timestamp: new Date().toISOString() });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: 'Route not found.' });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
