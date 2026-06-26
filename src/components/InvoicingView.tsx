"use client";

import { useState, useEffect } from 'react';

export default function InvoicingView({ onAction }: { onAction: () => void }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [lines, setLines] = useState([{ itemId: '', quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = () => {
    fetch('/api/customers').then(res => res.json()).then(data => setCustomers(data));
    fetch('/api/items').then(res => res.json()).then(data => setItems(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Expose fetchData to the window so parent can trigger refresh (or we could pass it up)
  useEffect(() => {
    (window as any).refreshInvoicingData = fetchData;
    return () => { delete (window as any).refreshInvoicingData; }
  }, []);

  const addLine = () => setLines([...lines, { itemId: '', quantity: 1, unitPrice: 0 }]);

  const removeLine = (index: number) => {
    if (lines.length > 1) setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // Auto-fill price when item is selected
    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id === value);
      if (selectedItem) {
        newLines[index].unitPrice = selectedItem.price;
      }
    }
    setLines(newLines);
  };

  const totalAmount = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!selectedCustomer) return setError('Please select a customer.');
    if (lines.some(l => !l.itemId)) return setError('All lines must have an item selected.');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer,
          lineItems: lines
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Invoice ${data.invoiceNumber} created successfully! (Journal entry automatically recorded)`);
      setLines([{ itemId: '', quantity: 1, unitPrice: 0 }]);
      setSelectedCustomer('');
      onAction(); // Trigger refresh in parent
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Sales Invoice</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">Auto-Accounting</span>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
          <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} required
                  className="w-full sm:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
            <option value="">Select Customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item / Product</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lines.map((line, index) => (
              <tr key={index}>
                <td className="px-4 py-2">
                  <select required value={line.itemId} onChange={e => updateLine(index, 'itemId', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 p-2 border text-sm">
                    <option value="">Select Item...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.stockQty} in stock)</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 w-24">
                  <input type="number" min="1" required value={line.quantity} onChange={e => updateLine(index, 'quantity', parseInt(e.target.value)||1)}
                         className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-right text-sm" />
                </td>
                <td className="px-4 py-2 w-32">
                  <input type="number" min="0" step="0.01" required value={line.unitPrice} onChange={e => updateLine(index, 'unitPrice', parseFloat(e.target.value)||0)}
                         className="w-full rounded-md border-gray-300 shadow-sm p-2 border text-right text-sm" />
                </td>
                <td className="px-4 py-2 text-right font-medium text-gray-700 w-32">
                  ${(line.quantity * line.unitPrice).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-center w-12">
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(index)} className="text-red-500 hover:text-red-700">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 font-bold text-right text-gray-700">Invoice Total:</td>
              <td className="px-4 py-3 font-bold text-right text-blue-700 text-lg">${totalAmount.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <div className="flex justify-between items-center">
          <button type="button" onClick={addLine} className="text-sm font-medium text-blue-600 hover:text-blue-500">
            + Add Another Item
          </button>

          <button type="submit" disabled={totalAmount === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow disabled:opacity-50">
            Generate Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
