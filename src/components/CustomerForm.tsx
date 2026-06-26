"use client";

import { useState } from 'react';

export default function CustomerForm({ onCustomerAdded }: { onCustomerAdded: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });

      if (!res.ok) throw new Error('Failed to create customer');

      setName('');
      setEmail('');
      setPhone('');
      setSuccess(true);
      onCustomerAdded();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold mb-3">Add Customer</h3>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-500 text-sm mb-2">Customer added!</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="text" placeholder="Name" required value={name} onChange={e => setName(e.target.value)}
               className="p-2 border rounded text-sm" />
        <input type="email" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)}
               className="p-2 border rounded text-sm" />
        <input type="tel" placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)}
               className="p-2 border rounded text-sm" />
        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded text-sm font-medium">
          {loading ? 'Adding...' : 'Save Customer'}
        </button>
      </form>
    </div>
  );
}
