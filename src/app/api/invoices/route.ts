import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        lineItems: {
          include: { item: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate request
    if (!data.customerId || !data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
      return NextResponse.json({ error: 'Customer ID and at least one line item are required' }, { status: 400 });
    }

    // 1. Fetch related accounts for automated accounting
    // Dynamically find or create the required accounts if they don't exist
    const arAccount = await prisma.account.upsert({
      where: { code: '1100' },
      update: {},
      create: { code: '1100', name: 'Accounts Receivable', type: 'Asset' }
    });

    const revenueAccount = await prisma.account.upsert({
      where: { code: '4000' },
      update: {},
      create: { code: '4000', name: 'Sales Revenue', type: 'Revenue' }
    });

    // Generate a simple Invoice Number
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate total amount
    let totalAmount = 0;
    const validatedLineItems: { itemId: string; quantity: number; unitPrice: number; total: number }[] = [];

    for (const line of data.lineItems) {
      if (!line.itemId || !line.quantity || !line.unitPrice) continue;
      const lineTotal = line.quantity * line.unitPrice;
      totalAmount += lineTotal;
      validatedLineItems.push({
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: lineTotal
      });
    }

    if (totalAmount === 0) {
        return NextResponse.json({ error: 'Invoice total cannot be zero.' }, { status: 400 });
    }

    // Use an interactive transaction for complex logic
    const result = await prisma.$transaction(async (tx) => {
      // 2. Create the Journal Entry first
      const journalEntry = await tx.journalEntry.create({
        data: {
          description: `Automated entry for Invoice ${invoiceNumber}`,
          date: new Date(),
          transactions: {
            create: [
              { accountId: arAccount.id, debit: totalAmount, credit: 0 }, // Debit A/R
              { accountId: revenueAccount.id, debit: 0, credit: totalAmount } // Credit Sales
            ]
          }
        }
      });

      // 3. Create the Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          totalAmount,
          status: "DRAFT",
          journalEntryId: journalEntry.id,
          lineItems: {
            create: validatedLineItems
          }
        },
        include: {
          customer: true,
          lineItems: true
        }
      });

      // 4. Deduct Inventory
      for (const line of validatedLineItems) {
        await tx.item.update({
          where: { id: line.itemId },
          data: {
            stockQty: {
              decrement: line.quantity
            }
          }
        });
      }

      return invoice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice. Ensure sufficient inventory and valid data.' }, { status: 500 });
  }
}
