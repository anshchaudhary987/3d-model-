"use client";

import { useState, useEffect } from 'react';

export default function AccountsList() {
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => setAccounts(data));
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Chart of Accounts</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${account.type === 'Asset' ? 'bg-green-100 text-green-800' :
                      account.type === 'Liability' ? 'bg-red-100 text-red-800' :
                      account.type === 'Equity' ? 'bg-blue-100 text-blue-800' :
                      account.type === 'Revenue' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'}`}>
                    {account.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
