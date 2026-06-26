import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const revenueAccounts = await prisma.account.findMany({
      where: { type: 'Revenue' },
      include: { transactions: true }
    });

    const expenseAccounts = await prisma.account.findMany({
      where: { type: 'Expense' },
      include: { transactions: true }
    });

    const calculateBalance = (accounts: any[], normalBalance: 'Debit' | 'Credit') => {
      let total = 0;
      const details = accounts.map(account => {
        const debitSum = account.transactions.reduce((sum: number, t: any) => sum + t.debit, 0);
        const creditSum = account.transactions.reduce((sum: number, t: any) => sum + t.credit, 0);

        let balance = normalBalance === 'Credit'
          ? (creditSum - debitSum)
          : (debitSum - creditSum);

        total += balance;
        return { name: account.name, code: account.code, balance };
      }).filter(a => a.balance !== 0);

      return { total, details };
    };

    const revenues = calculateBalance(revenueAccounts, 'Credit');
    const expenses = calculateBalance(expenseAccounts, 'Debit');
    const netIncome = revenues.total - expenses.total;

    return NextResponse.json({
      revenues,
      expenses,
      netIncome
    });

  } catch (error) {
    console.error('Failed to generate P&L:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
