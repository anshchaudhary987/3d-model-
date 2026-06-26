import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // We dynamically ensure basic accounts exist to prevent errors
    const [softwareExp, marketingExp, stripeRev, officeExp] = await Promise.all([
      prisma.account.upsert({ where: { code: '5010' }, update: {}, create: { code: '5010', name: 'Software Subscriptions', type: 'Expense' } }),
      prisma.account.upsert({ where: { code: '5020' }, update: {}, create: { code: '5020', name: 'Marketing & Ads', type: 'Expense' } }),
      prisma.account.upsert({ where: { code: '4010' }, update: {}, create: { code: '4010', name: 'Stripe Online Sales', type: 'Revenue' } }),
      prisma.account.upsert({ where: { code: '5030' }, update: {}, create: { code: '5030', name: 'Office Supplies', type: 'Expense' } })
    ]);

    // Simulated "raw" bank data arriving from Plaid / API
    const rawFeeds = [
      { desc: 'AWS EMBW-293848 Amazon Web Services', amount: -150.00 },
      { desc: 'STRIPE TRANSFER / PAYOUT', amount: 4500.00 },
      { desc: 'Google Ads CC-8293', amount: -320.50 },
      { desc: 'STARBUCKS STORE #12903', amount: -12.40 },
      { desc: 'Unknown Vendor ACH', amount: -75.00 }
    ];

    // Pick a random transaction to simulate
    const randomFeed = rawFeeds[Math.floor(Math.random() * rawFeeds.length)];

    // -------------------------------------------------------------
    // AI Categorization Engine (Rule-based Simulator)
    // In a real app, this could call OpenAI or a trained ML model.
    // -------------------------------------------------------------
    let suggestedAccountId = null;
    let confidence = 0.0;

    const d = randomFeed.desc.toLowerCase();
    if (d.includes('aws') || d.includes('amazon web services') || d.includes('github')) {
      suggestedAccountId = softwareExp.id;
      confidence = 0.95;
    } else if (d.includes('stripe') || d.includes('payout')) {
      suggestedAccountId = stripeRev.id;
      confidence = 0.88;
    } else if (d.includes('google ads') || d.includes('facebook')) {
      suggestedAccountId = marketingExp.id;
      confidence = 0.92;
    } else if (d.includes('starbucks') || d.includes('office')) {
      suggestedAccountId = officeExp.id;
      confidence = 0.65;
    } else {
      confidence = 0.10; // Unknown
    }

    const tx = await prisma.bankTransaction.create({
      data: {
        date: new Date(),
        description: randomFeed.desc,
        amount: randomFeed.amount,
        suggestedAccountId: suggestedAccountId,
        confidenceScore: confidence,
        status: 'PENDING'
      }
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (error) {
    console.error('Failed to simulate bank feed:', error);
    return NextResponse.json({ error: 'Failed to simulate bank feed' }, { status: 500 });
  }
}
