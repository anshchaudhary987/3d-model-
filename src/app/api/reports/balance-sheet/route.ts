import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const assetAccounts = await prisma.account.findMany({
      where: { type: 'Asset' },
      include: { transactions: true }
    });

    const liabilityAccounts = await prisma.account.findMany({
      where: { type: 'Liability' },
      include: { transactions: true }
    });

    const equityAccounts = await prisma.account.findMany({
      where: { type: 'Equity' },
      include: { transactions: true }
    });

    const calculateBalance = (accounts: any[], normalBalance: 'Debit' | 'Credit') => {
      let total = 0;
      const details = accounts.map(account => {
        const debitSum = account.transactions.reduce((sum: number, t: any) => sum + t.debit, 0);
        const creditSum = account.transactions.reduce((sum: number, t: any) => sum + t.credit, 0);

        let balance = normalBalance === 'Debit'
          ? (debitSum - creditSum)
          : (creditSum - debitSum);

        total += balance;
        return { name: account.name, code: account.code, balance };
      }).filter(a => a.balance !== 0);

      return { total, details };
    };

    const assets = calculateBalance(assetAccounts, 'Debit');
    const liabilities = calculateBalance(liabilityAccounts, 'Credit');
    let equity = calculateBalance(equityAccounts, 'Credit');

    // We must also calculate Net Income (Retained Earnings) and add it to Equity
    // to make the Balance Sheet balance.
    const revenueAccounts = await prisma.account.findMany({ where: { type: 'Revenue' }, include: { transactions: true } });
    const expenseAccounts = await prisma.account.findMany({ where: { type: 'Expense' }, include: { transactions: true } });
    const revenues = calculateBalance(revenueAccounts, 'Credit').total;
    const expenses = calculateBalance(expenseAccounts, 'Debit').total;
    const netIncome = revenues - expenses;

    // Add Net Income to Equity section
    if (netIncome !== 0) {
        equity.details.push({ name: 'Net Income (Current Year)', code: 'RETAINED', balance: netIncome });
        equity.total += netIncome;
    }

    const isBalanced = Math.abs(assets.total - (liabilities.total + equity.total)) < 0.001;

    return NextResponse.json({
      assets,
      liabilities,
      equity,
      isBalanced
    });

  } catch (error) {
    console.error('Failed to generate Balance Sheet:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
