import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { successResponse } from '../../utils/response';

const BASE_WHERE = { isDeleted: false };

/**
 * GET /api/dashboard/summary
 * Total income, expenses, net balance
 */
export const getSummary = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const records = await prisma.financialRecord.findMany({
      where: BASE_WHERE,
      select: { amount: true, type: true },
    });

    const totalIncome = records
      .filter((r) => r.type === 'INCOME')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalExpenses = records
      .filter((r) => r.type === 'EXPENSE')
      .reduce((sum, r) => sum + r.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    res.status(200).json(
      successResponse(
        {
          totalIncome: parseFloat(totalIncome.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          netBalance: parseFloat(netBalance.toFixed(2)),
          totalTransactions: records.length,
        },
        'Dashboard summary fetched successfully.'
      )
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/by-category
 * Income and expense breakdown by category
 */
export const getByCategory = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const records = await prisma.financialRecord.findMany({
      where: BASE_WHERE,
      select: { amount: true, type: true, category: true },
    });

    // Group by category
    const categoryMap: Record<string, { income: number; expenses: number; net: number; count: number }> = {};

    for (const record of records) {
      if (!categoryMap[record.category]) {
        categoryMap[record.category] = { income: 0, expenses: 0, net: 0, count: 0 };
      }
      categoryMap[record.category].count++;
      if (record.type === 'INCOME') {
        categoryMap[record.category].income += record.amount;
      } else {
        categoryMap[record.category].expenses += record.amount;
      }
      categoryMap[record.category].net =
        categoryMap[record.category].income - categoryMap[record.category].expenses;
    }

    const breakdown = Object.entries(categoryMap).map(([category, stats]) => ({
      category,
      income: parseFloat(stats.income.toFixed(2)),
      expenses: parseFloat(stats.expenses.toFixed(2)),
      net: parseFloat(stats.net.toFixed(2)),
      count: stats.count,
    }));

    // Sort by total volume descending
    breakdown.sort((a, b) => b.income + b.expenses - (a.income + a.expenses));

    res.status(200).json(
      successResponse(breakdown, 'Category breakdown fetched successfully.')
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/trends
 * Monthly income and expense totals for the last 12 months
 */
export const getMonthlyTrends = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const records = await prisma.financialRecord.findMany({
      where: {
        ...BASE_WHERE,
        date: { gte: twelveMonthsAgo },
      },
      select: { amount: true, type: true, date: true },
    });

    // Group by year-month
    const monthMap: Record<string, { month: string; income: number; expenses: number; net: number }> = {};

    for (const record of records) {
      const d = new Date(record.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap[key]) {
        monthMap[key] = {
          month: key,
          income: 0,
          expenses: 0,
          net: 0,
        };
      }

      if (record.type === 'INCOME') {
        monthMap[key].income += record.amount;
      } else {
        monthMap[key].expenses += record.amount;
      }
      monthMap[key].net = monthMap[key].income - monthMap[key].expenses;
    }

    const trends = Object.values(monthMap)
      .map((m) => ({
        ...m,
        income: parseFloat(m.income.toFixed(2)),
        expenses: parseFloat(m.expenses.toFixed(2)),
        net: parseFloat(m.net.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.status(200).json(
      successResponse(trends, 'Monthly trends fetched successfully.')
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent
 * Last 10 transactions
 */
export const getRecentTransactions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recent = await prisma.financialRecord.findMany({
      where: BASE_WHERE,
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json(
      successResponse(recent, 'Recent transactions fetched successfully.')
    );
  } catch (err) {
    next(err);
  }
};
