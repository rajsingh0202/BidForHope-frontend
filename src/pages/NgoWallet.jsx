import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getNGOTransactions } from '../services/api';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { io } from 'socket.io-client';

const SOCKET_BACKEND_URL = 'https://bidforhope.onrender.com';

const NgoWallet = ({ ngoId, ngoEmail, isOwner, domains = [] }) => {
  const [transactions, setTransactions] = useState([]);
  const [walletAmount, setWalletAmount] = useState(0);
  const [amount, setAmount] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const socket = useRef();

  // Bank details state (includes phone)
  const [bankDetails, setBankDetails] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: '',
    phone: '',
  });
  const [bankStatus, setBankStatus] = useState('');

  // Fetch Transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await getNGOTransactions(ngoId);
      setTransactions(Array.isArray(res.data.data) ? res.data.data : []);
      setWalletAmount(res.data.walletAmount);
    } catch (error) {
      alert('Error loading wallet');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Bank Details (send email in query param)
  const fetchBankDetails = async () => {
      console.log("Fetching bank details for: ", ngoEmail); // ADD THIS
    if (!ngoEmail) {
      setBankDetails(null);
      return;
    }
    try {
      const res = await axios.get(`/api/ngos/bank-details`, {
        params: { email: ngoEmail }
      });
      setBankDetails(res.data.data);
      setBankForm({
        accountHolderName: res.data.data?.accountHolderName || '',
        accountNumber: res.data.data?.accountNumber || '',
        ifscCode: res.data.data?.ifscCode || '',
        bankName: res.data.data?.bankName || '',
        branch: res.data.data?.branch || '',
        phone: res.data.data?.phone || '',
      });
    } catch (error) {
      setBankDetails(null);
    }
  };

  // Fetch Withdrawal Requests for this NGO (now by email)
  const fetchWithdrawalRequests = async () => {
    try {
      const res = await axios.get(`/api/withdrawals/my-requests`, {
        params: { ngoEmail }
      });
      setWithdrawalRequests(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (error) {
      setWithdrawalRequests([]);
    }
  };

  // Handle Withdraw (request admin approval, with domain & description)
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    if (Number(amount) > walletAmount) {
      alert('Cannot withdraw more than available wallet amount!');
      return;
    }
    if (!domain || !description) {
      alert('Please fill in the domain and description.');
      return;
    }
    setWithdrawing(true);
    try {
      await axios.post('/api/withdrawals/request', {
        ngoEmail,
        amount: Number(amount),
        domain,
        description
      });
      setAmount('');
      setDomain('');
      setDescription('');
      fetchWithdrawalRequests();
      alert('Withdrawal request submitted for admin approval!');
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Withdrawal request failed');
    } finally {
      setWithdrawing(false);
    }
  };

  // Handle Bank Form Change
  const handleBankFormChange = (e) => {
    setBankForm({ ...bankForm, [e.target.name]: e.target.value });
  };

  // Submit Bank Details (send email in body)
  const handleBankFormSubmit = async (e) => {
    e.preventDefault();
    setBankStatus('Saving...');
    try {
      await axios.put(`/api/ngos/bank-details`, {
        email: ngoEmail,
        ...bankForm
      });
      setBankStatus('Bank details saved ✅');
      setShowBankForm(false);
      fetchBankDetails();
    } catch (e) {
      setBankStatus(e.response?.data?.message || e.message || 'Failed to save bank details');
    }
  };

  // Protect all fetching with email guards, and log on client for debug
  useEffect(() => {
    fetchTransactions();
    if (ngoEmail) {
      fetchBankDetails();
      fetchWithdrawalRequests();
    }
    // Socket.IO listen for wallet updates
    socket.current = io(SOCKET_BACKEND_URL, { transports: ['websocket'] });
    socket.current.on(`walletUpdate:${ngoId}`, () => {
      fetchTransactions();
      if (ngoEmail) fetchWithdrawalRequests();
    });

    return () => {
      if (socket.current) socket.current.disconnect();
    };
    // eslint-disable-next-line
  }, [ngoId, ngoEmail]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-7 bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl border border-blue-900 mt-10 relative">
      {/* Bank details add/update logic */}
      {isOwner && (
        <div className="mb-8">
          <button
            onClick={() => setShowBankForm(v => !v)}
            className={bankDetails
              ? "bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold mr-3"
              : "bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold mr-3"}
          >
            {bankDetails ? 'Update Bank Details' : 'Add Bank Details'}
          </button>
          {bankDetails && (
            <span className="bg-green-800 text-green-100 px-3 py-1 rounded-lg text-xs">
              {bankDetails.accountHolderName} / {bankDetails.accountNumber} / {bankDetails.phone}
            </span>
          )}
          {showBankForm && (
            <form onSubmit={handleBankFormSubmit}
              className="bg-black/70 p-6 mt-4 rounded-xl border border-gray-800 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <input name="accountHolderName" placeholder="Account Holder Name"
                  required className="border rounded-lg px-2 py-1"
                  value={bankForm.accountHolderName}
                  onChange={handleBankFormChange} />
                <input name="accountNumber" placeholder="Account Number"
                  required className="border rounded-lg px-2 py-1"
                  value={bankForm.accountNumber} onChange={handleBankFormChange} />
                <input name="ifscCode" placeholder="IFSC Code"
                  required className="border rounded-lg px-2 py-1"
                  value={bankForm.ifscCode} onChange={handleBankFormChange} />
                <input name="bankName" placeholder="Bank Name"
                  required className="border rounded-lg px-2 py-1"
                  value={bankForm.bankName} onChange={handleBankFormChange} />
                <input name="branch" placeholder="Branch"
                  required className="border rounded-lg px-2 py-1"
                  value={bankForm.branch} onChange={handleBankFormChange} />
                <input name="phone" placeholder="Phone Number"
                  required className="border rounded-lg px-2 py-1"
                  value={bankForm.phone} onChange={handleBankFormChange} />
              </div>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg mt-4 font-bold">
                Save Bank Details
              </button>
              {bankStatus && (
                <div className="mt-2 text-blue-300 text-sm">{bankStatus}</div>
              )}
            </form>
          )}
        </div>
      )}

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
      <div className="border-t border-blue-800 mb-5"></div>

      {/* Withdraw Controls */}
      {isOwner && (
        <form onSubmit={handleWithdraw} className="mb-8">
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
              disabled={withdrawing || !bankDetails}
            />
            <select
              value={domain}
              onChange={e => setDomain(e.target.value)}
              required
              className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-950/80 text-blue-200 font-semibold w-28 focus:w-36 transition-all"
              style={{ minWidth: 0 }}
              disabled={withdrawing || !bankDetails}
            >
              <option value="">Tag/Domain</option>
              {Array.isArray(domains) && domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Spent on..."
              required
              className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-950/80 text-white font-semibold w-36 focus:w-44 transition-all focus:ring-2 focus:ring-red-500"
              style={{ minWidth: 0 }}
              disabled={withdrawing || !bankDetails}
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg transition"
              disabled={withdrawing || !bankDetails}
            >
              {withdrawing ? 'Withdrawing...' : 'Request Withdrawal'}
            </button>
            {!bankDetails && (
              <span className="text-red-400 ml-2 font-bold">Add bank details to enable withdrawal.</span>
            )}
          </div>
        </form>
      )}

      {/* Withdrawal Requests */}
      <h3 className="font-bold text-white mb-3 text-lg">Withdrawal Requests</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/90 mt-2 ring-1 ring-blue-900">
        <table className="min-w-full text-xs md:text-sm">
          <thead>
            <tr className="bg-blue-900/90 text-blue-200 sticky top-0 z-10">
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Domain</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Requested At</th>
              <th className="px-3 py-2">Processed At</th>
              <th className="px-3 py-2">Admin Note</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(withdrawalRequests) && withdrawalRequests.map((req, idx) => (
              <tr
                key={req._id}
                className={`border-t border-gray-800 text-gray-400
                  ${idx % 2 === 0 ? 'bg-gray-950/80' : 'bg-gray-950/60'}
                  hover:bg-blue-950/40 transition`}
              >
                <td className="px-2 py-2 font-bold text-green-200">
                  ₹{req.amount}
                </td>
                <td className="px-2 py-2 font-bold">
                  {req.status === 'pending' && <span className="bg-yellow-700 text-yellow-200 px-2 py-1 rounded-full">Pending</span>}
                  {req.status === 'approved' && <span className="bg-green-700 text-green-200 px-2 py-1 rounded-full">Approved</span>}
                  {req.status === 'rejected' && <span className="bg-red-700 text-red-100 px-2 py-1 rounded-full">Rejected</span>}
                </td>
                <td className="px-2 py-2">{req.domain || '-'}</td>
                <td className="px-2 py-2">{req.description || '-'}</td>
                <td className="px-2 py-2 text-blue-200">{new Date(req.requestedAt).toLocaleString()}</td>
                <td className="px-2 py-2 text-yellow-200">{req.processedAt ? new Date(req.processedAt).toLocaleString() : '-'}</td>
                <td className="px-2 py-2 text-white max-w-xs break-words whitespace-normal">{req.adminNote || '-'}</td>
              </tr>
            ))}
            {(!Array.isArray(withdrawalRequests) || withdrawalRequests.length === 0) && (
              <tr>
                <td colSpan={7} className="py-5 text-center text-gray-300">No withdrawal requests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction History */}
      <h3 className="font-bold text-white mb-3 text-lg mt-8">Transaction History</h3>
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
              {Array.isArray(transactions) && transactions.map((tx, idx) => (
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
              {(!Array.isArray(transactions) || transactions.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-7 text-center text-gray-300 text-sm">
                    No wallet transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NgoWallet;
