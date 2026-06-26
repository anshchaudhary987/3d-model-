import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.bankTransactionId || !data.accountId) {
      return NextResponse.json({ error: 'Missing transaction or account ID' }, { status: 400 });
    }

    const bankTx = await prisma.bankTransaction.findUnique({ where: { id: data.bankTransactionId } });
    if (!bankTx || bankTx.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invalid or already reconciled transaction' }, { status: 400 });
    }

    const targetAccount = await prisma.account.findUnique({ where: { id: data.accountId } });
    if (!targetAccount) {
      return NextResponse.json({ error: 'Target account not found' }, { status: 404 });
    }

    // Ensure we have a main Bank Account (Cash) to reconcile against
    const cashAccount = await prisma.account.upsert({
      where: { code: '1000' },
      update: {},
      create: { code: '1000', name: 'Cash / Main Bank', type: 'Asset' }
    });

    const isDeposit = bankTx.amount > 0;
    const absAmount = Math.abs(bankTx.amount);

    // ACID Transaction to reconcile and generate Journal Entry
    const result = await prisma.$transaction(async (tx) => {

      // 1. Create the Journal Entry
      const journalEntry = await tx.journalEntry.create({
        data: {
          description: `Bank Reconciliation: ${bankTx.description}`,
          date: bankTx.date,
          transactions: {
            create: [
              // If deposit: Debit Cash, Credit Target (e.g. Revenue)
              // If withdrawal: Credit Cash, Debit Target (e.g. Expense)
              {
                accountId: cashAccount.id,
                debit: isDeposit ? absAmount : 0,
                credit: isDeposit ? 0 : absAmount
              },
              {
                accountId: targetAccount.id,
                debit: isDeposit ? 0 : absAmount,
                credit: isDeposit ? absAmount : 0
              }
            ]
          }
        }
      });

      // 2. Mark Bank Transaction as RECONCILED
      const updatedBankTx = await tx.bankTransaction.update({
        where: { id: bankTx.id },
        data: {
          status: 'RECONCILED',
          journalEntryId: journalEntry.id
        }
      });

      return updatedBankTx;
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Failed to reconcile bank feed:', error);
    return NextResponse.json({ error: 'Reconciliation failed' }, { status: 500 });
  }
}
