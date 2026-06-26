"use client";

import { useState } from 'react';
import AccountsList from '@/components/AccountsList';
import JournalEntryForm from '@/components/JournalEntryForm';
import JournalEntriesList from '@/components/JournalEntriesList';
import InvoicingView from '@/components/InvoicingView';
import CustomerForm from '@/components/CustomerForm';
import ItemForm from '@/components/ItemForm';
import ReportsView from '@/components/ReportsView';
import BankFeedsView from '@/components/BankFeedsView';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'accounting' | 'invoicing' | 'reports' | 'bank'>('bank'); // Default to new feature

  const handleAction = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold tracking-tight">TallyClone Cloud ERP</h1>

            <nav className="hidden md:flex space-x-4">
              <button
                onClick={() => setActiveTab('invoicing')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'invoicing' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`}>
                Invoicing & Inventory
              </button>
              <button
                onClick={() => setActiveTab('accounting')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'accounting' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`}>
                Core Accounting
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'reports' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`}>
                Financial Reports
              </button>
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'bank' ? 'bg-indigo-800 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}`}>
                Smart Bank Inbox
              </button>
            </nav>
          </div>

          <span className="px-3 py-1 bg-indigo-700 rounded-full text-xs font-bold tracking-wide">Phase 4 (AI)</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Tab Navigation for Mobile (visible only on small screens) */}
        <div className="md:hidden flex flex-wrap gap-2 mb-6 text-sm">
           <button onClick={() => setActiveTab('bank')} className={`flex-1 min-w-[80px] py-2 text-center rounded-md ${activeTab === 'bank' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-white border text-gray-500'}`}>Bank</button>
           <button onClick={() => setActiveTab('invoicing')} className={`flex-1 min-w-[80px] py-2 text-center rounded-md ${activeTab === 'invoicing' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-white border text-gray-500'}`}>Invoices</button>
           <button onClick={() => setActiveTab('accounting')} className={`flex-1 min-w-[80px] py-2 text-center rounded-md ${activeTab === 'accounting' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-white border text-gray-500'}`}>Ledger</button>
           <button onClick={() => setActiveTab('reports')} className={`flex-1 min-w-[80px] py-2 text-center rounded-md ${activeTab === 'reports' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-white border text-gray-500'}`}>Reports</button>
        </div>

        {activeTab === 'invoicing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2">
               <InvoicingView onAction={handleAction} />
             </div>
             <div className="lg:col-span-1">
               <CustomerForm onCustomerAdded={() => (window as any).refreshInvoicingData?.()} />
               <ItemForm onItemAdded={() => (window as any).refreshInvoicingData?.()} />
             </div>
          </div>
        )}

        {activeTab === 'accounting' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form & History */}
            <div className="lg:col-span-2">
              <JournalEntryForm onEntryAdded={handleAction} />
              <JournalEntriesList refreshTrigger={refreshTrigger} />
            </div>

            {/* Right Column - Chart of Accounts */}
            <div className="lg:col-span-1">
              <AccountsList key={`acc-${refreshTrigger}`} />
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="mt-4">
            <ReportsView />
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <BankFeedsView onReconcile={handleAction} />
            </div>
            <div className="lg:col-span-1">
              <AccountsList key={`acc-${refreshTrigger}`} />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
