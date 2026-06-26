import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { code: 'asc' }
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request
    if (!data.code || !data.name || !data.type) {
      return NextResponse.json({ error: 'Missing required fields (code, name, type)' }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create account:', error);
    if (error.code === 'P2002') {
       return NextResponse.json({ error: 'Account with this code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
