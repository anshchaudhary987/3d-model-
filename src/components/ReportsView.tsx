"use client";

import { useState, useEffect } from 'react';

export default function ReportsView() {
  const [activeReport, setActiveReport] = useState<'trial' | 'pnl' | 'bs'>('pnl');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    let endpoint = '';
    if (activeReport === 'trial') endpoint = '/api/reports/trial-balance';
    if (activeReport === 'pnl') endpoint = '/api/reports/profit-and-loss';
    if (activeReport === 'bs') endpoint = '/api/reports/balance-sheet';

    fetch(endpoint)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [activeReport]);

  const renderTrialBalance = () => {
    if (!data || !data.accounts) return null;
    return (
      <div>
        <h3 className="text-xl font-bold mb-4 text-center">Trial Balance</h3>
        <table className="min-w-full divide-y divide-gray-200 shadow-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">Account</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-500 uppercase">Credit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.accounts.map((acc: any) => (
              <tr key={acc.id}>
                <td className="px-4 py-2 text-sm">{acc.code} - {acc.name}</td>
                <td className="px-4 py-2 text-sm text-right">{acc.balanceType === 'Debit' ? acc.balance.toFixed(2) : ''}</td>
                <td className="px-4 py-2 text-sm text-right">{acc.balanceType === 'Credit' ? acc.balance.toFixed(2) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-300">
            <tr>
              <td className="px-4 py-3 text-right">Totals:</td>
              <td className={`px-4 py-3 text-right ${data.totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {data.totals.debit.toFixed(2)}
              </td>
              <td className={`px-4 py-3 text-right ${data.totals.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                {data.totals.credit.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
        {!data.totals.isBalanced && (
           <div className="mt-2 text-red-600 font-bold text-center">Warning: Trial Balance does not balance! Check journal entries.</div>
        )}
      </div>
    );
  };

  const renderPnL = () => {
    if (!data || data.netIncome === undefined) return null;
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-bold mb-6 text-center">Profit & Loss Statement</h3>

        {/* Revenues */}
        <h4 className="text-lg font-bold text-gray-700 border-b pb-1 mb-2">Revenues</h4>
        {data.revenues.details.map((acc: any) => (
           <div key={acc.code} className="flex justify-between py-1 text-sm">
             <span>{acc.name}</span>
             <span>${acc.balance.toFixed(2)}</span>
           </div>
        ))}
        {data.revenues.details.length === 0 && <div className="text-sm text-gray-500 italic py-1">No revenue recorded</div>}
        <div className="flex justify-between py-2 font-semibold text-gray-900 border-t mt-2">
           <span>Total Revenue</span>
           <span>${data.revenues.total.toFixed(2)}</span>
        </div>

        {/* Expenses */}
        <h4 className="text-lg font-bold text-gray-700 border-b pb-1 mb-2 mt-6">Expenses</h4>
        {data.expenses.details.map((acc: any) => (
           <div key={acc.code} className="flex justify-between py-1 text-sm">
             <span>{acc.name}</span>
             <span>${acc.balance.toFixed(2)}</span>
           </div>
        ))}
        {data.expenses.details.length === 0 && <div className="text-sm text-gray-500 italic py-1">No expenses recorded</div>}
        <div className="flex justify-between py-2 font-semibold text-gray-900 border-t mt-2">
           <span>Total Expenses</span>
           <span>${data.expenses.total.toFixed(2)}</span>
        </div>

        {/* Net Income */}
        <div className={`flex justify-between py-4 mt-8 font-bold text-xl border-t-4 border-double border-gray-800 ${data.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
           <span>Net Income</span>
           <span>${data.netIncome.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!data || !data.assets) return null;
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-bold mb-6 text-center">Balance Sheet</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Assets Column */}
           <div>
             <h4 className="text-lg font-bold text-gray-700 border-b-2 border-gray-800 pb-1 mb-4">Assets</h4>
             {data.assets.details.map((acc: any) => (
               <div key={acc.code} className="flex justify-between py-1 text-sm">
                 <span>{acc.name}</span>
                 <span>${acc.balance.toFixed(2)}</span>
               </div>
             ))}
             <div className="flex justify-between py-2 font-bold text-gray-900 border-t mt-2">
               <span>Total Assets</span>
               <span>${data.assets.total.toFixed(2)}</span>
             </div>
           </div>

           {/* Liabilities & Equity Column */}
           <div>
             <h4 className="text-lg font-bold text-gray-700 border-b-2 border-gray-800 pb-1 mb-4">Liabilities</h4>
             {data.liabilities.details.map((acc: any) => (
               <div key={acc.code} className="flex justify-between py-1 text-sm">
                 <span>{acc.name}</span>
                 <span>${acc.balance.toFixed(2)}</span>
               </div>
             ))}
             {data.liabilities.details.length === 0 && <div className="text-sm text-gray-500 italic py-1">No liabilities</div>}
             <div className="flex justify-between py-2 font-bold text-gray-900 border-t mt-2">
               <span>Total Liabilities</span>
               <span>${data.liabilities.total.toFixed(2)}</span>
             </div>

             <h4 className="text-lg font-bold text-gray-700 border-b-2 border-gray-800 pb-1 mb-4 mt-6">Equity</h4>
             {data.equity.details.map((acc: any) => (
               <div key={acc.code} className="flex justify-between py-1 text-sm">
                 <span>{acc.name}</span>
                 <span>${acc.balance.toFixed(2)}</span>
               </div>
             ))}
             {data.equity.details.length === 0 && <div className="text-sm text-gray-500 italic py-1">No equity</div>}
             <div className="flex justify-between py-2 font-bold text-gray-900 border-t mt-2">
               <span>Total Equity</span>
               <span>${data.equity.total.toFixed(2)}</span>
             </div>
           </div>
        </div>

        {/* Balance Verification */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300">
           <div className="flex justify-between items-center px-4 font-bold text-lg">
              <span>Assets: <span className="text-blue-700">${data.assets.total.toFixed(2)}</span></span>
              <span>=</span>
              <span>Liabilities + Equity: <span className="text-blue-700">${(data.liabilities.total + data.equity.total).toFixed(2)}</span></span>
           </div>
           {!data.isBalanced && (
             <div className="mt-2 text-red-600 font-bold text-center">Warning: Balance Sheet is out of balance!</div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="flex justify-center space-x-4 mb-8">
        <button onClick={() => setActiveReport('pnl')} className={`px-4 py-2 font-semibold rounded shadow-sm ${activeReport === 'pnl' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
          Profit & Loss
        </button>
        <button onClick={() => setActiveReport('bs')} className={`px-4 py-2 font-semibold rounded shadow-sm ${activeReport === 'bs' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
          Balance Sheet
        </button>
        <button onClick={() => setActiveReport('trial')} className={`px-4 py-2 font-semibold rounded shadow-sm ${activeReport === 'trial' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}>
          Trial Balance
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Generating report...</div>
      ) : (
        <div className="animate-fade-in">
          {activeReport === 'trial' && renderTrialBalance()}
          {activeReport === 'pnl' && renderPnL()}
          {activeReport === 'bs' && renderBalanceSheet()}
        </div>
      )}
    </div>
  );
}
