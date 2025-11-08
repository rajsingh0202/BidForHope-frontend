import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getNGOTransactions } from '../services/api';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, BanknotesIcon } from '@heroicons/react/24/outline';

const NgoWallet = ({ ngoId, isOwner, domains = [] }) => {
  const [transactions, setTransactions] = useState([]);
  const [walletAmount, setWalletAmount] = useState(0);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [debiting, setDebiting] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await getNGOTransactions(ngoId);
      setTransactions(res.data.data);
      setWalletAmount(res.data.walletAmount);
    } catch (error) {
      alert('Error loading wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDebit = async (e) => {
    e.preventDefault();
    const debitAmount = Number(amount);
    if (debitAmount > walletAmount) {
      alert('Cannot debit more than wallet amount!');
      return;
    }
    setDebiting(true);
    try {
      await axios.post(
        `http://localhost:5000/api/ngos/${ngoId}/transactions/debit`,
        { amount: Number(amount), description, domain }
      );
      setAmount('');
      setDescription('');
      setDomain('');
      fetchTransactions();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        error.message ||
        'Debit failed'
      );
    } finally {
      setDebiting(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [ngoId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-7 bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl border border-blue-900 mt-10 relative">
      {/* Wallet Balance */}
      <div className="flex items-center gap-3 mb-8">
        <BanknotesIcon className="w-10 h-10 text-green-400 animate-bounce" />
        <h2 className="text-3xl font-extrabold text-gray-100 tracking-tight flex items-center gap-2">
          Wallet:&nbsp;
          <span className="text-green-400 animate-pulse">
            ₹{walletAmount.toLocaleString()}
          </span>
        </h2>
      </div>
      {/* Divider */}
      <div className="border-t border-blue-800 mb-5"></div>
      {/* Debit Controls */}
      {isOwner && (
        <form onSubmit={handleDebit} className="mb-8">
          <div className="flex flex-wrap gap-2 items-center bg-black/70 backdrop-blur-md px-3 py-3 rounded-xl border border-gray-800 shadow-lg">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              required
              className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-950/80 text-green-200 font-semibold w-24 focus:w-32 transition-all focus:ring-2 focus:ring-red-500"
              style={{ minWidth: 0 }}
              disabled={debiting}
            />
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-950/80 text-blue-200 font-semibold w-28 focus:w-36 transition-all"
              style={{ minWidth: 0 }}
              disabled={debiting}
            >
              <option value="">Tag/Domain</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Spent on..."
              required
              className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-950/80 text-white font-semibold w-36 focus:w-44 transition-all focus:ring-2 focus:ring-red-500"
              style={{ minWidth: 0 }}
              disabled={debiting}
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg transition"
              disabled={debiting}
            >
              {debiting ? 'Debiting...' : 'Debit'}
            </button>
          </div>
        </form>
      )}
      {/* Transaction History */}
      <h3 className="font-bold text-white mb-3 text-lg">Transaction History</h3>
      {loading ? (
        <div className="text-blue-400 py-8 text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/90 mt-2 ring-1 ring-blue-900">
          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="bg-blue-900/90 text-blue-200 sticky top-0 z-10">
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Ref.</th>
                <th className="px-3 py-2">Tag/Domain</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx._id}
                  className={`border-t border-gray-800 text-gray-400
                    ${idx % 2 === 0 ? 'bg-gray-950/80' : 'bg-gray-950/60'}
                    hover:bg-blue-950/40 transition`}
                >
                  <td className="px-2 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1
                        ${tx.type === 'debit'
                          ? 'bg-red-700/90 text-red-100'
                          : 'bg-green-700/90 text-green-100'}`}
                    >
                      {tx.type.toUpperCase()}
                      {tx.type === 'debit'
                        ? <ArrowTrendingDownIcon className="w-4 h-4 ml-1 inline-block" />
                        : <ArrowTrendingUpIcon className="w-4 h-4 ml-1 inline-block" />}
                    </span>
                  </td>
                  <td className="px-2 py-2 font-bold text-green-200">
                    ₹{tx.amount}
                  </td>
                  <td className="px-2 py-2">{tx.reference}</td>
                  <td className="px-2 py-2">
                    {tx.domain &&
                      <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full uppercase font-bold text-xs">{tx.domain}</span>
                    }
                  </td>
<td className="px-2 py-2 text-white max-w-xs break-words whitespace-normal">
  {tx.description}
</td>
                  <td className="px-2 py-2 text-yellow-200">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="py-7 text-center text-gray-300 text-sm">
              No wallet transactions yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NgoWallet;
