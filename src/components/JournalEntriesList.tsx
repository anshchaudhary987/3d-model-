"use client";

import { useState, useEffect } from 'react';

export default function JournalEntriesList({ refreshTrigger }: { refreshTrigger: number }) {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/journal-entries')
      .then(res => res.json())
      .then(data => setEntries(data));
  }, [refreshTrigger]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Journal Entries</h2>
      {entries.length === 0 ? (
        <p className="text-gray-500">No entries yet. Record one above!</p>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between border-b pb-2 mb-2">
                <span className="font-medium text-gray-700">{new Date(entry.date).toLocaleDateString()}</span>
                <span className="text-gray-600 italic">{entry.description}</span>
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-1">Account</th>
                    <th className="text-right py-1 w-24">Debit</th>
                    <th className="text-right py-1 w-24">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.transactions.map((t: any) => (
                    <tr key={t.id}>
                      <td className="py-1">{t.account.code} - {t.account.name}</td>
                      <td className="text-right py-1">{t.debit > 0 ? t.debit.toFixed(2) : ''}</td>
                      <td className="text-right py-1">{t.credit > 0 ? t.credit.toFixed(2) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
