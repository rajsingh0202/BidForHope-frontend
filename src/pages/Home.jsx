import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAuctions, getAuctionBids } from '../services/api';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

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

const Home = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('live');
  const [timeLeftMap, setTimeLeftMap] = useState({});
  const [winnerMap, setWinnerMap] = useState({});

  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchAuctions();
    // eslint-disable-next-line
  }, []);

  // Time left live interval
  useEffect(() => {
    if (!auctions || auctions.length === 0) return;
    const live = auctions.filter((a) => a.status === 'active');
    if (live.length === 0) return;

    const updateTimers = () => {
      const map = {};
      live.forEach(a => {
        map[a._id] = getTimeLeft(a.endDate) || 'Ending soon';
      });
      setTimeLeftMap(map);
    };
    updateTimers();
    const id = setInterval(updateTimers, 1000);
    return () => clearInterval(id);
  }, [auctions]);

  // Fetch ended auction winners
  useEffect(() => {
    async function fetchWinners() {
      const ended = auctions.filter(a => a.status === 'ended');
      const winMap = {};
      await Promise.all(
        ended.map(async a => {
          try {
            const { data } = await getAuctionBids(a._id);
            if (data?.data && data.data.length > 0) {
              const highest = data.data.reduce((max, bid) =>
                bid.amount > (max.amount || 0) ? bid : max
              , {});
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
    if (auctions.length > 0) fetchWinners();
  }, [auctions]);

  const fetchAuctions = async () => {
    try {
      const { data } = await getAuctions();
      setAuctions(data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load auctions');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.info('Logged out successfully');
  };

  // Filter by tab
  const liveAuctions = auctions.filter(a => a.status === 'active');
  const endedAuctions = auctions.filter(a => a.status === 'ended');

  // Reduced stat
  const Stat = ({ label, value, color }) => (
    <div className="flex flex-col items-center flex-1 px-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`font-bold ${color || 'text-white'} text-sm`}>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 relative">
      {/* Glass top nav */}
      <header className="bg-gray-950 bg-opacity-80 backdrop-blur-md shadow-sm sticky top-0 z-20 ring-1 ring-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">🎗️ Auctions</h1>
              <p className="text-xs text-gray-400 mt-1">Bid for a cause, make a difference</p>
            </div>
            <div className="flex gap-2 items-center">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="bg-blue-700/90 shadow text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition font-semibold"
                  >
                    Dashboard
                  </Link>
                  {(user?.role === 'admin' || user?.role === 'ngo') && (
                    <Link
                      to="/create-auction"
                      className="bg-green-600/80 shadow text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition font-semibold"
                    >
                      + Auction
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-700/90 shadow text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition font-semibold"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-blue-700/90 shadow text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-green-600/80 shadow text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition font-semibold"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-6 border-b border-gray-800">
          <button
            className={`text-lg font-bold pb-2 px-2 border-b-4 transition ${
              tab === 'live'
                ? 'border-blue-500 text-blue-300 backdrop-blur-md'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
            onClick={() => setTab('live')}
          >
            Live Auctions
          </button>
          <button
            className={`text-lg font-bold pb-2 px-2 border-b-4 transition ${
              tab === 'ended'
                ? 'border-pink-500 text-pink-300 backdrop-blur-md'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
            onClick={() => setTab('ended')}
          >
            Ended Auctions
          </button>
        </div>
      </div>

      {/* Auction Cards */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <p className="mt-4 text-gray-300">Loading auctions...</p>
          </div>
        ) : (tab === 'live' ? liveAuctions : endedAuctions).length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-lg shadow">
            <p className="text-gray-200 text-lg">
              {tab === 'live'
                ? 'No live auctions at the moment.'
                : 'No ended auctions found yet.'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {tab === 'live'
                ? 'Check back soon for new charity auctions!'
                : 'Ended auctions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(tab === 'live' ? liveAuctions : endedAuctions).map((auction) => (
              <div
                key={auction._id}
                className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-800 transition-all hover:scale-[1.024] hover:shadow-2xl backdrop-blur-md"
              >
                {/* Overlay badge */}
                <div className="absolute top-3 left-3 z-10 flex gap-2 items-center">
                  {auction.isUrgent && (
                    <span className="backdrop-blur-md bg-red-600/90 text-white text-xs font-bold px-2 py-1 rounded shadow">
                      🚨 URGENT
                    </span>
                  )}
                  <span
                    className={`backdrop-blur-md px-2 py-1 rounded shadow text-xs font-semibold ${
                      auction.status === 'active'
                        ? 'bg-blue-700/80 text-blue-200'
                        : 'bg-gray-700/80 text-gray-200'
                    }`}
                  >
                    {auction.status === 'active' ? 'LIVE' : 'ENDED'}
                  </span>
                </div>
                {/* Winner badge for ended */}
                {auction.status === 'ended' && winnerMap[auction._id] && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="backdrop-blur-lg bg-black/70 text-green-200 font-bold px-2 py-1 rounded text-xs shadow">
                      🎉 Winner: <span className="text-yellow-300">{winnerMap[auction._id]}</span>
                    </span>
                  </div>
                )}
                {/* Image */}
                <div className="h-44 w-full relative overflow-hidden">
                  {auction.images && auction.images.length > 0 ? (
                    <img
                      src={auction.images[0].url}
                      alt={auction.title}
                      className="w-full h-full object-cover scale-105"
                      style={{ filter: 'brightness(0.85)' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-800 to-purple-900 flex items-center justify-center">
                      <span className="text-white text-5xl">🎨</span>
                    </div>
                  )}
                  {/* Time left for live */}
                  {auction.status === 'active' && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded px-3 py-1 text-center shadow">
                      <span className="text-yellow-300 font-bold tracking-wide text-sm">
                        ⏳ {timeLeftMap[auction._id] || 'Ending soon'}
                      </span>
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="flex flex-col gap-1 p-4 pt-3">
                  <div className="flex flex-wrap gap-2 mb-1">
                    <span className="bg-blue-900/70 text-blue-200 text-xs px-2 py-1 rounded-full capitalize">
                      {auction.category}
                    </span>
                    <span className="bg-gray-700/70 text-gray-200 text-xs px-2 py-1 rounded-full capitalize">
                      {auction.itemType}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mb-1 leading-tight line-clamp-1">
                    {auction.title}
                  </h3>
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
                  {/* Dates row */}
                  <div className="flex gap-1 justify-between mb-1 text-xs text-gray-400">
                    <span>
                      Start: <span className="text-white">{new Date(auction.startDate).toLocaleDateString()}</span>
                    </span>
                    <span>
                      End: <span className="text-white">{new Date(auction.endDate).toLocaleDateString()}</span>
                    </span>
                  </div>
                  {/* Action button */}
                  <Link
                    to={`/auction/${auction._id}`}
                    className="mt-2 mb-0 text-center bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold transition-all shadow"
                  >
                    {auction.status === 'active' ? 'View & Bid' : 'View Details'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
