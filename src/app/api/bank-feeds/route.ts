import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.bankTransaction.findMany({
      where: { status: 'PENDING' },
      orderBy: { date: 'desc' }
    });

    // Fetch accounts to map suggested IDs to names on the frontend
    const accounts = await prisma.account.findMany();

    return NextResponse.json({ transactions, accounts });
  } catch (error) {
    console.error('Failed to fetch bank transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch bank transactions' }, { status: 500 });
  }
}
