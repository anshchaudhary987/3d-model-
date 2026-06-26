"use client";

import { useState, useEffect } from 'react';

export default function BankFeedsView({ onReconcile }: { onReconcile: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // For inline manual selection if AI is wrong
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch('/api/bank-feeds');
    const data = await res.json();
    setTransactions(data.transactions || []);
    setAccounts(data.accounts || []);

    // Pre-fill selection state with AI suggestions
    const initialSelections: Record<string, string> = {};
    if (data.transactions) {
      data.transactions.forEach((tx: any) => {
        if (tx.suggestedAccountId) {
          initialSelections[tx.id] = tx.suggestedAccountId;
        }
      });
    }
    setSelectedAccounts(initialSelections);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    await fetch('/api/bank-feeds/simulate', { method: 'POST' });
    await fetchData();
    setSimulating(false);
  };

  const handleReconcile = async (txId: string) => {
    const accountId = selectedAccounts[txId];
    if (!accountId) {
      alert('Please select an account for this transaction first.');
      return;
    }

    try {
      const res = await fetch('/api/bank-feeds/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankTransactionId: txId, accountId })
      });

      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error);
      }

      await fetchData();
      onReconcile(); // Trigger refresh for other widgets
    } catch (e: any) {
      alert(e.message || 'Failed to reconcile');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Smart Bank Inbox</h2>
          <p className="text-sm text-gray-500 mt-1">Review raw transactions and accept AI categorizations.</p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold py-2 px-4 rounded shadow-sm text-sm border border-indigo-300">
          {simulating ? 'Syncing...' : '↻ Simulate Bank Sync'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading inbox...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-500 mb-4">Your inbox is empty. All caught up!</p>
          <button onClick={handleSimulate} className="text-indigo-600 font-medium hover:underline">Simulate an incoming transaction</button>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition-shadow bg-gray-50">

              {/* Left Side: Raw Details */}
              <div className="flex-1">
                <div className="text-xs text-gray-500 font-mono mb-1">{new Date(tx.date).toLocaleString()}</div>
                <div className="font-bold text-gray-800 font-mono tracking-tight">{tx.description}</div>
                <div className={`text-lg font-black mt-1 ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                </div>
              </div>

              {/* Middle: AI Match */}
              <div className="flex-1 bg-white p-3 border rounded-md relative">
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Categorize As
                  {tx.confidenceScore > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${getConfidenceColor(tx.confidenceScore)}`}>
                      {Math.round(tx.confidenceScore * 100)}% Match
                    </span>
                  )}
                </div>

                <select
                  value={selectedAccounts[tx.id] || ''}
                  onChange={(e) => setSelectedAccounts({...selectedAccounts, [tx.id]: e.target.value})}
                  className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 p-1.5 border bg-gray-50"
                >
                  <option value="">-- Manual Selection Needed --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>

              {/* Right: Action */}
              <div>
                <button
                  onClick={() => handleReconcile(tx.id)}
                  disabled={!selectedAccounts[tx.id]}
                  className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-2 px-6 rounded shadow transition-colors"
                >
                  Accept
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
