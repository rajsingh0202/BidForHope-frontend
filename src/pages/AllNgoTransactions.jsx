import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getNGOs } from '../services/api';
import NgoWallet from './NgoWallet';
import { UsersIcon, EnvelopeIcon, StarIcon } from '@heroicons/react/24/outline';

const AllNgoTransactions = () => {
  const [ngos, setNgos] = useState([]);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const user = useSelector(state => state.auth?.user);

   console.log('User role:', user?.role);
console.log('User email:', user?.email);
console.log('Selected NGO email:', selectedNgo?.email);
console.log('Is Owner:', user?.role === 'ngo' && user?.email === selectedNgo?.email);

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const res = await getNGOs();
          console.log('NGOs fetched:', res.data.data);
        setNgos(res.data.data);
      } catch (error) {
        alert('Failed to fetch NGOs');
      }
    };
    fetchNgos();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back To Dashboard Button */}
        <div className="mb-8 flex justify-end">
          <Link
            to="/dashboard"
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h2 className="text-3xl font-extrabold mb-8 text-center text-white">
          NGO Donations & Wallet Dashboard
        </h2>
        {!selectedNgo ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {ngos.map(ngo => (
                <div
                  key={ngo._id}
                  className="bg-gradient-to-br from-gray-950 to-gray-900 border border-blue-900 rounded-2xl shadow-xl p-6 flex flex-col relative group hover:ring-2 ring-blue-400 transition-all"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <UsersIcon className="w-6 h-6 text-blue-400" />
                    <span className="inline-block px-4 py-1 rounded-full bg-blue-900 text-blue-200 text-xs font-bold shadow-lg">
                      {ngo.name}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <EnvelopeIcon className="w-5 h-5 text-teal-300" />
                    <span className="bg-teal-900 text-teal-100 px-2 py-1 rounded-full">{ngo.email}</span>
                  </div>
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <StarIcon className="w-5 h-5 text-yellow-300" />
                    <span className="bg-yellow-900 text-yellow-100 px-2 py-1 rounded-full font-bold">{ngo.workingYears} yrs</span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    {(ngo.domains || []).map(d => (
                      <span key={d} className="bg-purple-900 text-purple-200 px-2 py-1 rounded uppercase font-bold">{d}</span>
                    ))}
                  </div>
                  <button
                    className="mt-5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow transition group-hover:scale-105"
                    onClick={() => 
                      {
                         console.log('Selected NGO on click:', ngo);
                        setSelectedNgo(ngo)
                      }
                    }
                  >
                    View Wallet & Transactions
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400">
              Click any NGO card to view their wallet and donations.
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl p-6 mb-8 border border-blue-500 animate-in fade-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-bold text-blue-400 mb-1 flex items-center gap-2">
                  <UsersIcon className="w-7 h-7 text-blue-400" />
                  {selectedNgo.name} Wallet
                </h3>
                <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <EnvelopeIcon className="w-5 h-5 text-teal-200" />
                  {selectedNgo.email}
                </p>
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <StarIcon className="w-5 h-5 text-yellow-300" />
                  <span className="bg-yellow-900 text-yellow-100 px-2 py-1 rounded-full font-bold">{selectedNgo.workingYears} yrs</span>
                </div>
                {(selectedNgo.domains || []).length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2 text-xs">
                    {(selectedNgo.domains || []).map(d => (
                      <span key={d} className="bg-purple-900 text-purple-200 px-2 py-1 rounded uppercase font-semibold">{d}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-gray-200 font-semibold"
                onClick={() => setSelectedNgo(null)}
              >
                ⬅ All NGOs
              </button>
            </div>
            {selectedNgo?._id && (
              <NgoWallet
                ngoId={selectedNgo._id}
                ngoEmail={selectedNgo.email}
                isOwner={
                  user?.role === 'ngo' &&
                  user?.email === selectedNgo?.email
                }
                domains={selectedNgo.domains}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllNgoTransactions;
