"use client";

import { useState } from 'react';
import AccountsList from '@/components/AccountsList';
import JournalEntryForm from '@/components/JournalEntryForm';
import JournalEntriesList from '@/components/JournalEntriesList';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEntryAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">TallyClone Cloud ERP</h1>
          <nav>
            <span className="px-3 py-1 bg-indigo-700 rounded-full text-sm">v0.1.0 MVP</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Form & History */}
        <div className="lg:col-span-2">
          <JournalEntryForm onEntryAdded={handleEntryAdded} />
          <JournalEntriesList refreshTrigger={refreshTrigger} />
        </div>

        {/* Right Column - Chart of Accounts */}
        <div className="lg:col-span-1">
          <AccountsList />
        </div>

      </main>
    </div>
  );
}
