import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const journalEntries = await prisma.journalEntry.findMany({
      include: {
        transactions: {
          include: {
            account: true,
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(journalEntries);
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request
    if (!data.description || !data.transactions || !Array.isArray(data.transactions) || data.transactions.length < 2) {
      return NextResponse.json({ error: 'Invalid request: Must provide description and at least two transactions (debit and credit)' }, { status: 400 });
    }

    // Calculate total debits and credits
    let totalDebit = 0;
    let totalCredit = 0;

    for (const t of data.transactions) {
      totalDebit += t.debit || 0;
      totalCredit += t.credit || 0;
    }

    // The Golden Rule of Accounting: Debits must equal Credits
    // We use a small epsilon for floating point comparison just in case, though for integers/currency it should be exact.
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
       return NextResponse.json({
         error: 'Accounting Rule Violation: Total Debits must equal Total Credits',
         debits: totalDebit,
         credits: totalCredit
       }, { status: 400 });
    }

    if (totalDebit === 0 && totalCredit === 0) {
        return NextResponse.json({ error: 'Invalid entry: Total transaction amount cannot be zero' }, { status: 400 });
    }

    // Create Journal Entry and Transactions in a single Prisma Transaction to ensure atomicity (ACID compliance)
    const result = await prisma.$transaction(async (tx) => {
      const journalEntry = await tx.journalEntry.create({
        data: {
          description: data.description,
          date: data.date ? new Date(data.date) : new Date(),
        }
      });

      const transactionsToCreate = data.transactions.map((t: any) => ({
        accountId: t.accountId,
        journalEntryId: journalEntry.id,
        debit: t.debit || 0,
        credit: t.credit || 0,
      }));

      await tx.transaction.createMany({
        data: transactionsToCreate
      });

      return await tx.journalEntry.findUnique({
        where: { id: journalEntry.id },
        include: { transactions: true }
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
  }
}
