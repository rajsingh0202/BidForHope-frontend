import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getPendingAuctions,
  approveAuction,
  rejectAuction,
  endAuction,
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import { UsersIcon, CurrencyRupeeIcon, ClockIcon } from '@heroicons/react/24/outline';

const AdminPendingAuctions = () => {
  const [pendingAuctions, setPendingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPendingAuctions = async () => {
    setLoading(true);
    try {
      const res = await getPendingAuctions();
      setPendingAuctions(res.data.data || res.data.auctions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch pending auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAuctions();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveAuction(id);
      toast.success('Auction approved!');
      fetchPendingAuctions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (!reason) {
      toast.error('Reason required for rejection.');
      return;
    }
    try {
      await rejectAuction(id, reason);
      toast.success('Auction rejected.');
      fetchPendingAuctions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  const handleEndAuction = async (id) => {
    if (!window.confirm('Really end this auction now?')) return;
    try {
      await endAuction(id);
      toast.success('Auction ended.');
      fetchPendingAuctions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'End failed');
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-tr from-black via-gray-900 to-gray-800">
      <div className="max-w-5xl mx-auto px-6">
        {/* BACK TO DASHBOARD BUTTON */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition shadow"
        >
          Back to Dashboard
        </button>
        <h2 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Pending Auction Requests
        </h2>
        {loading ? (
          <div className="text-center py-10 text-lg text-gray-300">
            <span className="animate-spin inline-block mx-2 w-6 h-6 border-b-2 border-blue-400 rounded-full"></span>
            Loading...
          </div>
        ) : pendingAuctions.length === 0 ? (
          <div className="text-center p-8 bg-gray-900 rounded-xl shadow border border-gray-700">
            <p className="text-lg text-gray-200">No pending auctions to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {pendingAuctions.map((auction) => (
              <div
                key={auction._id}
                className="bg-gradient-to-br from-gray-950 to-gray-900 border border-blue-900 rounded-2xl shadow-xl p-6 hover:ring-2 ring-blue-600 transition-all relative"
              >
                {/* Title */}
                <h3 className="text-xl font-bold text-blue-300 mb-2">{auction.title}</h3>
                {/* Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="inline-flex gap-1 items-center bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-xs font-bold shadow">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    {auction.organizer?.name || 'Unknown'}
                  </div>
                  <div className="inline-flex gap-1 items-center bg-green-900 text-green-200 px-3 py-1 rounded-full text-xs font-bold shadow">
                    <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                    ₹{auction.currentPrice?.toLocaleString()}
                  </div>
                  <div className={`inline-flex gap-1 items-center px-3 py-1 rounded-full text-xs font-bold shadow
                    ${auction.status === 'pending'
                      ? 'bg-yellow-700 text-yellow-200'
                      : 'bg-gray-700 text-gray-200'}`}>
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {auction.status}
                  </div>
                </div>
                {/* Description */}
                <p className="text-gray-300 text-xs mb-3 line-clamp-2">{auction.description}</p>
                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg shadow font-semibold transition"
                    onClick={() => handleApprove(auction._id)}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg shadow font-semibold transition"
                    onClick={() => handleReject(auction._id)}
                  >
                    Reject
                  </button>
                  <button
                    className="bg-gray-700 hover:bg-gray-950 text-white px-4 py-2 rounded-lg shadow font-semibold transition"
                    onClick={() => handleEndAuction(auction._id)}
                  >
                    End
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPendingAuctions;
