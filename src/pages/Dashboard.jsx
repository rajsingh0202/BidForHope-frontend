import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { getAllAuctions, getPendingAuctions, getAuctionBids } from '../services/api';
import AdminPendingNGOs from './AdminPendingNGOs'; // Adjust path if needed

function getTimeLeft(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return `${hours}h ${mins}m ${secs}s`;
}

const Stat = ({ label, value, color }) => (
  <div className="flex flex-col items-center flex-1 px-1">
    <span className="text-xs text-gray-400">{label}</span>
    <span className={`font-bold ${color || 'text-white'} text-sm`}>{value}</span>
  </div>
);

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [myAuctions, setMyAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [timeLeftMap, setTimeLeftMap] = useState({});
  const [winnerMap, setWinnerMap] = useState({});

  useEffect(() => {
    if (user?.role === 'ngo' || user?.role === 'admin') {
      fetchMyAuctions();
    } else {
      setLoading(false);
    }
    if (user?.role === 'admin') {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line
  }, [user]);

  // Countdown
  useEffect(() => {
    const live = myAuctions.filter((a) => a.status === 'active');
    if (live.length === 0) return;
    const updateTimes = () => {
      const map = {};
      live.forEach(auction => {
        map[auction._id] = getTimeLeft(auction.endDate) || 'Ending soon';
      });
      setTimeLeftMap(map);
    };
    updateTimes();
    const timerId = setInterval(updateTimes, 1000);
    return () => clearInterval(timerId);
  }, [myAuctions]);

  // Winner
  useEffect(() => {
    async function fetchWinners() {
      const ended = myAuctions.filter(a => a.status === 'ended');
      const winMap = {};
      await Promise.all(
        ended.map(async a => {
          try {
            const { data } = await getAuctionBids(a._id);
            if (data?.data && data.data.length > 0) {
              const highest = data.data.reduce((max, bid) =>
                bid.amount > (max.amount || 0) ? bid : max,
                {}
              );
              winMap[a._id] = highest.bidder?.name || 'Unknown';
            } else {
              winMap[a._id] = 'No bids';
            }
          } catch {
            winMap[a._id] = 'Unknown';
          }
        })
      );
      setWinnerMap(winMap);
    }
    if (myAuctions.length > 0) fetchWinners();
  }, [myAuctions]);

  const fetchMyAuctions = async () => {
    try {
      const { data } = await getAllAuctions();
      const filtered = (data.data || data.auctions || []).filter(
        (auction) =>
          auction.organizer &&
          (auction.organizer._id === user.id || auction.organizer === user.id)
      );
      setMyAuctions(filtered);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load auctions');
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const { data } = await getPendingAuctions();
      setPendingCount(data.count || 0);
    } catch (error) {
      // Silent fail
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-900 text-red-300 border-red-600';
      case 'ngo':
        return 'bg-purple-900 text-purple-200 border-purple-600';
      case 'user':
        return 'bg-blue-900 text-blue-200 border-blue-600';
      default:
        return 'bg-gray-900 text-gray-400 border-gray-500';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-900 text-green-200',
      pending: 'bg-yellow-900 text-yellow-300',
      draft: 'bg-gray-800 text-gray-300',
      ended: 'bg-red-900 text-red-300',
    };
    return badges[status] || badges.draft;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 relative">
      {/* Glass top nav */}
      <nav className="bg-gray-950/90 backdrop-blur-md shadow-md sticky top-0 z-20 ring-1 ring-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-2xl font-extrabold text-white tracking-tight">
                🎗️ Charity Auction
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-lg transition"
              >
                Browse
              </Link>
              {(user?.role === 'admin' || user?.role === 'ngo') && (
                <Link
                  to="/create-auction"
                  className="bg-green-600 shadow hover:bg-green-500 text-white px-4 py-2 rounded-lg transition font-medium"
                >
                  + Auction
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 shadow hover:bg-red-500 text-white px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-2xl ring-1 ring-blue-900 p-8 mb-10">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg ring-2 ring-blue-800">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Hello, {user?.name}!</h2>
            <p className="text-gray-300 mb-4">{user?.email}</p>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getRoleBadgeColor(
                user?.role
              )}`}
            >
              {user?.role?.toUpperCase()}
            </span>
          </div>
          {/* Quick Actions */}
          <div className="border-t border-blue-900 pt-8 mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Link
                to="/"
                className="bg-blue-950/85 backdrop-blur-lg shadow p-5 rounded-lg hover:ring-2 ring-blue-600 transition cursor-pointer"
              >
                <h4 className="font-semibold text-blue-300 mb-2">Browse Auctions</h4>
                <p className="text-xs text-blue-300">View all live and ended charity auctions.</p>
              </Link>
              {(user?.role === 'admin' || user?.role === 'ngo') && (
                <Link
                  to="/create-auction"
                  className="bg-green-900/80 backdrop-blur-lg shadow p-5 rounded-lg hover:ring-2 ring-green-500 transition cursor-pointer"
                >
                  <h4 className="font-semibold text-green-300 mb-2">Create Auction</h4>
                  <p className="text-xs text-green-300">
                    {user?.role === 'ngo'
                      ? 'Get approval for your fundraiser'
                      : 'Launch a new auction event'}
                  </p>
                </Link>
              )}
              <Link
                to="/my-bids"
                className="bg-purple-900/80 backdrop-blur-lg shadow p-5 rounded-lg hover:ring-2 ring-purple-400 transition cursor-pointer"
              >
                <h4 className="font-semibold text-purple-200 mb-2">My Bids</h4>
                <p className="text-xs text-purple-200">Track your bidding history</p>
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/pending"
                  className="bg-orange-900/85 backdrop-blur-lg shadow p-5 rounded-lg hover:ring-2 ring-orange-400 transition cursor-pointer relative"
                >
                  <h4 className="font-semibold text-orange-200 mb-2 flex items-center">
                    Pending Approvals
                    {pendingCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full shadow ring-2 ring-yellow-300">
                        {pendingCount}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-orange-300">Review new NGO auctions</p>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/pending-ngos"
                  className="bg-yellow-900/85 backdrop-blur-lg shadow p-5 rounded-lg hover:ring-2 ring-yellow-400 transition cursor-pointer"
                >
                  <h4 className="font-semibold text-yellow-200 mb-2">Pending NGOs</h4>
                  <p className="text-xs text-yellow-200">
                    Approve or reject NGO registrations
                  </p>
                </Link>
              )}
              <Link
                to="/all-ngos-transactions"
                className="bg-teal-900/80 backdrop-blur-lg shadow p-5 rounded-lg hover:ring-2 ring-teal-400 transition cursor-pointer"
              >
                <h4 className="font-semibold text-teal-200 mb-2">NGO Wallets</h4>
                <p className="text-xs text-teal-200">
                  View donation history, wallets, and spending.
                </p>
              </Link>
              {/* This is the newly added link for admin pending transactions */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin/pending-transactions"
                  className="bg-red-900/85 backdrop-blur-lg shadow p-5 rounded-lg hover:ring-2 ring-red-400 transition cursor-pointer"
                >
                  <h4 className="font-semibold text-red-200 mb-2 flex items-center">
                    Pending Transactions
                  </h4>
                  <p className="text-xs text-red-300">Review and approve/decline NGO withdrawal requests</p>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* My Auctions Section (NGO/Admin) */}
        {(user?.role === 'ngo' || user?.role === 'admin') && (
          <div className="bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl shadow-xl ring-1 ring-blue-900 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-extrabold text-white">My Auctions</h3>
              <Link
                to="/create-auction"
                className="bg-green-600 shadow hover:bg-green-500 text-white px-4 py-2 rounded-lg transition text-sm font-bold"
              >
                + New
              </Link>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : myAuctions.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 mb-4">No auctions yet.</p>
                <Link
                  to="/create-auction"
                  className="inline-block bg-blue-700 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Create First Auction
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {myAuctions.map((auction) => (
                  <div
                    key={auction._id}
                    className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all border border-blue-950 overflow-hidden"
                  >
                    {/* Overlay top badges */}
                    <div className="absolute top-3 left-3 z-10 flex gap-2 items-center">
                      <span
                        className={`backdrop-blur-md px-2 py-1 rounded shadow text-xs font-semibold ${getStatusBadge(
                          auction.status
                        )}`}
                      >
                        {auction.status.toUpperCase()}
                      </span>
                      {auction.isUrgent && (
                        <span className="backdrop-blur-md bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded shadow">
                          🚨 URGENT
                        </span>
                      )}
                    </div>
                    {auction.status === 'ended' && winnerMap[auction._id] && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="backdrop-blur-lg bg-black/70 text-green-200 font-bold px-2 py-1 rounded text-xs shadow">
                          🎉 Winner: <span className="text-yellow-300">{winnerMap[auction._id]}</span>
                        </span>
                      </div>
                    )}
                    {auction.status === 'active' && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="backdrop-blur-lg bg-black/80 text-yellow-300 font-bold px-2 py-1 rounded text-xs shadow">
                          ⏳ {timeLeftMap[auction._id] || 'Ending soon'}
                        </span>
                      </div>
                    )}
                    {/* Image */}
                    <div className="h-28 w-full relative overflow-hidden rounded-t-lg">
                      {auction.logo ? (
                        <img
                          src={auction.logo}
                          alt="Auction Logo"
                          className="w-full h-full object-cover scale-105"
                          style={{ filter: 'brightness(0.90)' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                          <span className="text-white text-3xl">🎨</span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex flex-col gap-1 p-4 pt-3">
                      <h4 className="text-lg font-extrabold text-white mb-1 leading-tight line-clamp-1">
                        {auction.title}
                      </h4>
                      <div className="flex gap-2 mb-1 text-xs">
                        {auction.category && (
                          <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full capitalize">
                            {auction.category}
                          </span>
                        )}
                        <span className="bg-gray-700/70 text-gray-200 px-2 py-1 rounded-full capitalize">
                          {auction.itemType}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs mb-2 line-clamp-2 flex-1">
                        {auction.description}
                      </p>
                      {/* Stats row */}
                      <div className="flex gap-1 justify-between items-center mb-2">
                        <Stat
                          label="Price"
                          value={`₹${auction.currentPrice.toLocaleString()}`}
                          color="text-green-300"
                        />
                        <Stat label="Bids" value={auction.totalBids} color="text-blue-200" />
                        <Stat label="Views" value={auction.views} color="text-yellow-200" />
                      </div>
                      {/* Status Section */}
                      {auction.status === 'pending' && user?.role === 'ngo' && (
                        <div className="mt-2 p-2 bg-yellow-900 border border-yellow-800 rounded-lg text-yellow-200 text-xs text-center">
                          ⏳ Waiting for admin approval
                        </div>
                      )}
                      {auction.status === 'draft' && auction.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded-lg text-red-200 text-xs">
                          <div className="font-bold">❌ REJECTED</div>
                          <div>Reason: <span className="text-red-300">{auction.rejectionReason}</span></div>
                          <div className="text-red-400 mt-1">Edit & resubmit</div>
                        </div>
                      )}
                      {auction.status === 'active' && (
                        <div className="mt-2 p-2 bg-green-900 border border-green-800 rounded-lg text-green-200 text-xs text-center">
                          ✅ Live & accepting bids
                        </div>
                      )}
                      {auction.status === 'ended' && (
                        <div className="mt-2 p-2 bg-red-900 border border-red-700 rounded-lg text-red-200 text-xs text-center">
                          🛑 Auction Ended
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Link
                          to={`/auction/${auction._id}`}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-xs transition-all shadow mt-2"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Development Notice */}
        <div className="mt-10 p-4 bg-yellow-900 border border-yellow-800 rounded-lg text-yellow-300 shadow-inner font-mono text-xs">
          🚧 Under Development: More features coming soon. Stay tuned for advanced auction browsing and tracking!
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
