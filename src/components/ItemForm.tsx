"use client";

import { useState } from 'react';

export default function ItemForm({ onItemAdded }: { onItemAdded: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, price, stockQty })
      });

      if (!res.ok) throw new Error('Failed to create item');

      setName('');
      setDescription('');
      setPrice('');
      setStockQty('');
      setSuccess(true);
      onItemAdded();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Add Inventory Item</h3>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-500 text-sm mb-2">Item added!</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="text" placeholder="Item Name" required value={name} onChange={e => setName(e.target.value)}
               className="p-2 border rounded text-sm" />
        <input type="text" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)}
               className="p-2 border rounded text-sm" />
        <div className="flex gap-2">
           <input type="number" step="0.01" min="0" placeholder="Price" required value={price} onChange={e => setPrice(e.target.value)}
                  className="p-2 border rounded text-sm w-1/2" />
           <input type="number" min="0" placeholder="Stock Qty" required value={stockQty} onChange={e => setStockQty(e.target.value)}
                  className="p-2 border rounded text-sm w-1/2" />
        </div>
        <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded text-sm font-medium">
          {loading ? 'Adding...' : 'Save Item'}
        </button>
      </form>
    </div>
  );
}
