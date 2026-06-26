"use client";

import { useState, useEffect } from 'react';

type TransactionLine = {
  accountId: string;
  debit: number;
  credit: number;
};

export default function JournalEntryForm({ onEntryAdded }: { onEntryAdded: () => void }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<TransactionLine[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 }
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => setAccounts(data));
  }, []);

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
  };

  const updateLine = (index: number, field: keyof TransactionLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    // If they type in debit, clear credit and vice versa
    if (field === 'debit' && value > 0) newLines[index].credit = 0;
    if (field === 'credit' && value > 0) newLines[index].debit = 0;
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isBalanced) {
      setError('Debits must equal Credits!');
      return;
    }

    if (lines.some(l => !l.accountId)) {
      setError('All lines must have an account selected.');
      return;
    }

    const payload = {
      description,
      date: new Date(date).toISOString(),
      transactions: lines.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0
      }))
    };

    try {
      const res = await fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create entry');
      } else {
        setSuccess('Journal Entry recorded successfully!');
        setDescription('');
        setLines([
          { accountId: '', debit: 0, credit: 0 },
          { accountId: '', debit: 0, credit: 0 }
        ]);
        onEntryAdded();

        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Record Journal Entry</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description / Narration</label>
            <input type="text" required value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Paid office rent"
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
          </div>
        </div>

        <div className="mt-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">
                    <select required value={line.accountId} onChange={e => updateLine(index, 'accountId', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                      <option value="" disabled>Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.01" value={line.debit || ''} onChange={e => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                           className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-right" placeholder="0.00" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min="0" step="0.01" value={line.credit || ''} onChange={e => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                           className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border text-right" placeholder="0.00" />
                  </td>
                  <td className="px-4 py-2 text-center">
                    {lines.length > 2 && (
                      <button type="button" onClick={() => removeLine(index)} className="text-red-500 hover:text-red-700">✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3 font-semibold text-right">Totals:</td>
                <td className={`px-4 py-3 font-semibold text-right ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>{totalDebit.toFixed(2)}</td>
                <td className={`px-4 py-3 font-semibold text-right ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>{totalCredit.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          <button type="button" onClick={addLine} className="mt-2 text-sm text-indigo-600 hover:text-indigo-900">+ Add Line</button>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={!isBalanced}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                  ${isBalanced ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}>
            Record Entry
          </button>
        </div>
      </form>
    </div>
  );
}
