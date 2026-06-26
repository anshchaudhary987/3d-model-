import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all accounts and their transactions
    const accounts = await prisma.account.findMany({
      include: {
        transactions: true,
      },
      orderBy: { code: 'asc' }
    });

    let totalDebit = 0;
    let totalCredit = 0;

    const trialBalance = accounts.map(account => {
      // Sum all debits and credits for this account
      const debitSum = account.transactions.reduce((sum, t) => sum + t.debit, 0);
      const creditSum = account.transactions.reduce((sum, t) => sum + t.credit, 0);

      let balance = 0;
      let balanceType = 'Credit'; // Default

      // Calculate normal balance based on account type
      // Assets and Expenses have debit balances
      if (account.type === 'Asset' || account.type === 'Expense') {
        balance = debitSum - creditSum;
        balanceType = balance >= 0 ? 'Debit' : 'Credit';
        balance = Math.abs(balance);
      }
      // Liabilities, Equity, and Revenue have credit balances
      else {
        balance = creditSum - debitSum;
        balanceType = balance >= 0 ? 'Credit' : 'Debit';
        balance = Math.abs(balance);
      }

      // Add to totals for the final Trial Balance check
      if (balanceType === 'Debit') {
        totalDebit += balance;
      } else {
        totalCredit += balance;
      }

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debitSum,
        creditSum,
        balance,
        balanceType
      };
    }).filter(a => a.balance > 0); // Only show accounts with activity

    return NextResponse.json({
      accounts: trialBalance,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.001
      }
    });

  } catch (error) {
    console.error('Failed to generate Trial Balance:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
