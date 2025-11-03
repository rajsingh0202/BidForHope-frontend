import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getPendingNGOs, updateNGOStatus } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, MapPinIcon, CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/outline';

const AdminPendingNGOs = () => {
  const [pendingNGOs, setPendingNGOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPendingNGOs = async () => {
    setLoading(true);
    try {
      const res = await getPendingNGOs();
      setPendingNGOs(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch pending NGOs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingNGOs();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      let password = '';
      if (status === 'approved') {
        password = window.prompt('Set password for NGO login:');
        if (!password) {
          toast.error('Password required for NGO login.');
          return;
        }
      }
      await updateNGOStatus(id, status, password);
      toast.success(`NGO ${status} successfully!`);
      fetchPendingNGOs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black via-gray-900 to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* BACK TO DASHBOARD BUTTON */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition shadow"
        >
          Back to Dashboard
        </button>
        <h2 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Pending NGO Applications
        </h2>
        {loading ? (
          <div className="text-center py-10 text-lg text-gray-300">
            <span className="animate-spin inline-block mx-2 w-6 h-6 border-b-2 border-blue-400 rounded-full"></span>
            Loading...
          </div>
        ) : pendingNGOs.length === 0 ? (
          <div className="text-center p-8 bg-gray-900 rounded-xl shadow border border-gray-700">
            <p className="text-lg text-gray-200">No pending NGOs to review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {pendingNGOs.map((ngo) => (
              <div
                key={ngo._id}
                className="bg-gradient-to-br from-gray-950 to-gray-900 border border-blue-900 rounded-2xl shadow-xl p-6 hover:ring-2 ring-blue-600 transition-all relative flex flex-col"
              >
                <div className="flex flex-col gap-1 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckBadgeIcon className="w-7 h-7 text-blue-300" />
                    <span className="text-xl font-extrabold text-blue-200">{ngo.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <EnvelopeIcon className="w-5 h-5 text-blue-300 ml-1" />
                    <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full">{ngo.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <MapPinIcon className="w-5 h-5 text-yellow-300 ml-1" />
                    <span className="text-yellow-100">{ngo.address?.placeAddress || '-'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-green-900 text-green-200 px-3 py-1 rounded-full text-xs font-bold">
                    {ngo.workingYears} years experience
                  </span>
                  {(ngo.domains || []).map((d) => (
                    <span key={d} className="bg-teal-800 text-teal-100 px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex gap-3">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow font-bold transition flex items-center gap-1"
                    onClick={() => handleStatusChange(ngo._id, 'approved')}
                  >
                    <CheckBadgeIcon className="w-5 h-5" /> Approve
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow font-bold transition flex items-center gap-1"
                    onClick={() => handleStatusChange(ngo._id, 'rejected')}
                  >
                    <XCircleIcon className="w-5 h-5" /> Reject
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

export default AdminPendingNGOs;
