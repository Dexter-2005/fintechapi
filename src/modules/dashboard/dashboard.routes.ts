import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import {
  getSummary,
  getByCategory,
  getMonthlyTrends,
  getRecentTransactions,
} from './dashboard.controller';

const router = Router();

// All dashboard routes require auth + ANALYST or ADMIN role
router.use(requireAuth, requireRole('ANALYST', 'ADMIN'));

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get total income, expenses, and net balance
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *       403:
 *         description: Forbidden (VIEWER role)
 */
router.get('/summary', getSummary);

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     summary: Get income/expense breakdown by category
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get('/by-category', getByCategory);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get monthly income and expense trends (last 12 months)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trends
 */
router.get('/trends', getMonthlyTrends);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get the last 10 transactions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent transactions
 */
router.get('/recent', getRecentTransactions);

export default router;
