import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAuction, placeBid, getAuctionBids, endAuction, directDonate, enableAutoBid, disableAutoBid, getAutoBidStatus } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FiArrowLeft } from 'react-icons/fi';
import RazorpayPayment from '../components/RazorpayPayment';
import { io } from 'socket.io-client';

// Socket.io backend URL
const SOCKET_BACKEND_URL = 'https://bidforhope.onrender.com';

function getUniqueTopBids(bids) {
  const sorted = [...bids].sort((a, b) => b.amount - a.amount);
  const seen = new Set();
  const unique = [];
  for (const bid of sorted) {
    const bidderId = bid.bidder?._id || bid.bidder?.name || '';
    if (!seen.has(bidderId)) {
      unique.push(bid);
      seen.add(bidderId);
    }
    if (unique.length === 3) break;
  }
  return unique;
}

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

function isWinner(bids, userId) {
  if (!bids || bids.length === 0 || !userId) return false;
  const sorted = [...bids].sort((a, b) => b.amount - a.amount);
  return sorted[0]?.bidder?._id === userId;
}

const AuctionDetails = () => {
  const [winnerName, setWinnerName] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const [showDonationPayment, setShowDonationPayment] = useState(false);
  const [donationPaymentAmount, setDonationPaymentAmount] = useState(0);

  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorMsg, setDonorMsg] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);

  // For live countdown
  const [timeLeft, setTimeLeft] = useState('');

  // Autobid controls
  const [autoBidActive, setAutoBidActive] = useState(false); // Popup control
  const [autoBidMax, setAutoBidMax] = useState('');         // Input for max amount
  const [autoBidStatus, setAutoBidStatus] = useState(null); // Persistent status from backend

  // --- Socket.io setup for real-time auction ending ---
  const socket = useRef();

  useEffect(() => {
  socket.current = io(SOCKET_BACKEND_URL, { transports: ['websocket'] });

  socket.current.emit('joinAuctionRoom', id);

  socket.current.on('auctionEnded', () => {
    toast.info('Auction ended! Showing winner...');
    fetchAuction();
    fetchBids();
  });

  socket.current.on('connect_error', (err) => {
    console.log('Socket connection error:', err);
  });

  return () => {
    socket.current.emit('leaveAuctionRoom', id);
    socket.current.disconnect();
  };
}, [id]);
// Only run on auction id change

  // Main polling effect: auction, bids, and autoBidStatus every 2 seconds for live updates
  useEffect(() => {
    const pollAll = () => {
      fetchAuction();
      fetchBids();
      if (isAuthenticated) {
        getAutoBidStatus(id)
          .then(res => setAutoBidStatus(res.data.autoBid))
          .catch(() => setAutoBidStatus(null));
      }
    };
    pollAll();
    // eslint-disable-next-line
  }, [id, isAuthenticated]);

  useEffect(() => {
    let timerId;
    if (auction && auction.status === 'ended' && bids.length > 0) {
      const highestBid = [...bids].sort((a, b) => b.amount - a.amount)[0];
      setWinnerName(highestBid?.bidder?.name || 'Unknown');
    } else {
      setWinnerName('');
    }
    if (auction && auction.status === 'active') {
      setTimeLeft(getTimeLeft(auction.endDate));
      timerId = setInterval(() => {
        setTimeLeft(getTimeLeft(auction.endDate));
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [auction, bids]);

  // If auto-bid is stopped (for any reason), reset setup popup so restart button appears
  useEffect(() => {
    if (autoBidStatus && !autoBidStatus.isActive) {
      setAutoBidActive(false);
    }
  }, [autoBidStatus]);


  const fetchAuction = async () => {
    try {
      const { data } = await getAuction(id);
      setAuction(data.data);
      setBidAmount(data.data.currentPrice + data.data.bidIncrement);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load auction details');
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const { data } = await getAuctionBids(id);
      setBids(data.data);
    } catch (error) {
      console.error('Failed to load bids');
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to place a bid');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await placeBid(id, bidAmount);
      toast.success('Bid placed successfully!');
      fetchAuction();
      fetchBids();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to place bid';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndAuction = async () => {
    if (
      !window.confirm(
        'Are you sure you want to end this auction early? This action cannot be undone.'
      )
    ) {
      return;
    }
    try {
      await endAuction(id);
      toast.success('Auction ended successfully');
      // Fetch updated state, Socket will also broadcast to other users
      fetchAuction();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end auction');
    }
  };

  const handleEnableAutoBid = async () => {
    try {
      await enableAutoBid(auction._id, autoBidMax);
      toast.success('Auto-bid enabled! Our system will now bid for you.');
      setAutoBidActive(false);
      setAutoBidMax('');
      getAutoBidStatus(id)
        .then(res => setAutoBidStatus(res.data.autoBid))
        .catch(() => setAutoBidStatus(null));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enable auto-bid');
    }
  };

  const handleDisableAutoBid = async () => {
    try {
      await disableAutoBid(auction._id);
      toast.info('Auto-bid disabled.');
      getAutoBidStatus(id)
        .then(res => setAutoBidStatus(res.data.autoBid))
        .catch(() => setAutoBidStatus(null));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable auto-bid');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Auction not found</h2>
          <Link to="/" className="text-blue-400 hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <header className="bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-blue-400 hover:underline text-sm font-medium"
          >
            <FiArrowLeft size={18} /> Back to Auctions
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Auction Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="rounded-xl h-96 relative overflow-hidden bg-black">
              {auction.isUrgent && (
                <span className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold z-10">
                  🚨 URGENT CAUSE
                </span>
              )}
              {auction.images && auction.images.length > 0 ? (
                <img
                  src={auction.images[0].url}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-800 to-purple-900 flex items-center justify-center">
                  <span className="text-white text-6xl">🎨</span>
                </div>
              )}
            </div>
            {/* Details Card */}
            <div className="bg-gray-900 rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{auction.title}</h1>
                  <span className="inline-block px-3 py-1 bg-blue-800 text-blue-200 rounded-full text-sm font-medium">
                    {auction.category}
                  </span>
                </div>
                <div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      auction.status === 'active'
                        ? 'bg-green-800 text-green-200'
                        : auction.status === 'ended'
                        ? 'bg-red-800 text-red-200'
                        : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {auction.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed">{auction.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-700">
                <div>
                  <p className="text-sm text-gray-400">Item Type</p>
                  <p className="font-semibold text-white capitalize">{auction.itemType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Views</p>
                  <p className="font-semibold text-white">{auction.views}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Start Date</p>
                  <p className="font-semibold text-white">
                    {format(new Date(auction.startDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">End Date</p>
                  <p className="font-semibold text-white">
                    {format(new Date(auction.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            {/* NGO Beneficiary */}
            <div className="bg-gray-900 rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-white mb-4">Beneficiary NGO</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-800 rounded-full flex items-center justify-center text-white text-2xl font-bold select-none">
                  {auction.ngo?.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{auction.ngo?.name}</h4>
                  <p className="text-sm text-gray-300">{auction.ngo?.email}</p>
                  {auction.ngo?.isVerified && (
                    <span className="inline-block mt-1 text-xs bg-green-800 text-green-200 px-2 py-1 rounded select-none">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
              {/* Winner message with payment */}
{auction.status === 'ended' && winnerName && (
  <div className="bg-green-800 bg-opacity-80 rounded-lg p-4">
    <div className="text-center mb-4">
      <p className="text-xl font-extrabold text-yellow-300 mb-1">
        🎉 Congratulations! 🎉
      </p>
      <p className="text-2xl font-extrabold text-white">{winnerName}</p>
    </div>
    
    {/* Show Pay Now button if current user is the winner and hasn't paid */}
    {isAuthenticated && isWinner(bids, user?.id) && !paymentCompleted && (
      <div className="mt-4">
        <button
          onClick={() => setShowPayment(true)}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition transform hover:scale-105"
        >
          💳 Pay Now - Complete Your Donation
        </button>
        <p className="text-xs text-center text-green-200 mt-2">
          Pay ₹{auction.currentPrice.toLocaleString()} to support {auction.ngo?.name}
        </p>
      </div>
    )}
    
    {paymentCompleted && (
      <div className="mt-4 bg-green-900 p-3 rounded-lg text-center">
        <p className="text-white font-semibold">✅ Payment Completed!</p>
        <p className="text-green-200 text-sm mt-1">Thank you for your contribution!</p>
      </div>
    )}
  </div>
)}

            </div>
            {/* Bid History */}
            <div className="bg-gray-900 rounded-xl shadow-md p-6">
              {(() => {
                const topBids = getUniqueTopBids(bids);
                return (
                  <>
                    <h3 className="font-semibold text-white mb-4">Bid History ({topBids.length})</h3>
                    {topBids.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">No bids yet. Be the first!</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {topBids.map((bid, idx) => (
                          <div
                            key={bid._id}
                            className="flex justify-between items-center border-b pb-3 border-gray-700 select-none"
                          >
                            <div>
                              <p className="font-semibold text-white">
                                {bid.bidder?.name || 'Anonymous'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {bid.time ? format(new Date(bid.time), 'MMM dd, yyyy HH:mm') : 'Just now'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-blue-400">₹{bid.amount.toLocaleString()}</p>
                              {idx === 0 && (
                                <span className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded select-none">
                                  Highest
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          {/* Right Column - Bidding */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-white mb-6">Place Your Bid</h2>
              {auction.status === 'active' && (
                <div className="mb-6 text-right font-extrabold text-yellow-400 text-lg select-none">
                  Time Left: {timeLeft || 'Ending soon'}
                </div>
              )}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg select-none">
                  <p className="text-sm text-gray-300 mb-1">Starting Price</p>
                  <p className="text-xl font-bold text-white">₹{auction.startingPrice.toLocaleString()}</p>
                </div>
                <div className="bg-blue-900 p-4 rounded-lg border-2 border-blue-700 select-none">
                  <p className="text-sm text-blue-200 mb-1">Current Highest Bid</p>
                  <p className="text-2xl font-bold text-blue-300">₹{auction.currentPrice.toLocaleString()}</p>
                </div>
                <div className="bg-green-900 p-4 rounded-lg select-none">
                  <p className="text-sm text-green-200 mb-1">Minimum Next Bid</p>
                  <p className="text-xl font-bold text-green-200">
                    ₹{(auction.currentPrice + auction.bidIncrement).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm select-none">
                  <span className="text-gray-300">Total Bids</span>
                  <span className="font-semibold text-white">{auction.totalBids}</span>
                </div>
              </div>
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Bid Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={auction.currentPrice + auction.bidIncrement}
                    step={auction.bidIncrement}
                    className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-black text-white"
                    required
                    disabled={auction.status !== 'active'}
                  />
                  <p className="mt-1 text-xs text-gray-400">Increment: ₹{auction.bidIncrement.toLocaleString()}</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting || auction.status !== 'active'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? 'Placing Bid...'
                    : auction.status !== 'active'
                    ? 'Auction Ended'
                    : isAuthenticated
                    ? 'Place Bid'
                    : 'Login to Bid'}
                </button>
              </form>
              {/* === Enable auto-bid feature always appears here, below Place Bid === */}
              <div className="mt-6">
                {isAuthenticated && auction.status === 'active' && (
                  <>
                    {autoBidStatus && autoBidStatus.isActive ? (
                      <div className="w-full text-center bg-purple-900 rounded-xl p-4 shadow-inner border-2 border-purple-700 flex flex-col items-center mb-4 mt-2">
                        <span className="text-lg font-semibold text-purple-200">
                          🤖 Auto-Bid is <span className="text-green-400 font-extrabold">ACTIVE</span>
                        </span>
                        {autoBidStatus.maxAmount && (
                          <span className="block text-purple-300 mt-1 text-base">
                            Up to <span className="font-bold text-white">₹{autoBidStatus.maxAmount}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={handleDisableAutoBid}
                          className="mt-5 w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 rounded-xl shadow-lg transition text-lg"
                          style={{ fontSize: '1.13rem', letterSpacing:'.01em'}}
                        >
                          🛑 Stop Auto-Bid
                        </button>
                      </div>
                    ) : (
                      <>
                        {autoBidStatus && !autoBidStatus.isActive && autoBidStatus.stopReason && (
                          <div className="w-full text-center bg-orange-700 rounded-xl p-4 shadow-inner border-2 border-orange-500 flex flex-col items-center mb-4 mt-2">
                            <span className="text-lg font-semibold text-white">
                              🤖 Auto-Bid Stopped
                            </span>
                            <span className="block text-yellow-300 mt-2 text-base">
                              {autoBidStatus.stopReason === 'highest-bidder' && "You are the highest bidder!"}
                              {autoBidStatus.stopReason === 'max-amount' && "Maximum auto-bid amount reached."}
                              {autoBidStatus.stopReason === 'auction-ended' && "Auction time is over."}
                              {!["highest-bidder", "max-amount", "auction-ended"].includes(autoBidStatus.stopReason) && "Auto-bidding is no longer active."}
                            </span>
                          </div>
                        )}
                        {(!autoBidStatus || !autoBidStatus.isActive) && !autoBidActive && (
                          <button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-sm transition"
                            onClick={() => setAutoBidActive(true)}
                            style={{ fontFamily: 'inherit', fontSize: '1rem' }}
                          >
                            🤖 Enable Auto Bid
                          </button>
                        )}
                        {autoBidActive && (
                          <div className="mt-0 bg-purple-900 p-4 rounded-xl shadow-inner border border-purple-700">
                            <form
                              onSubmit={e => {
                                e.preventDefault();
                                handleEnableAutoBid();
                              }}
                            >
                              <label className="block text-sm font-medium text-purple-200 mb-2">
                                Max Auto-Bid Amount (₹)
                              </label>
                              <input
                                type="number"
                                required
                                className="mb-3 w-full px-4 py-2 border border-purple-700 bg-black text-white rounded focus:ring-2 focus:ring-purple-500"
                                placeholder={`Max amount (≥ ₹${auction.currentPrice + auction.bidIncrement})`}
                                min={auction.currentPrice + auction.bidIncrement}
                                value={autoBidMax}
                                onChange={e => setAutoBidMax(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded shadow transition"
                                  style={{ fontFamily: 'inherit' }}
                                >
                                  Start Auto-Bid
                                </button>
                                <button
                                  type="button"
                                  className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded shadow"
                                  onClick={() => setAutoBidActive(false)}
                                  style={{ fontFamily: 'inherit' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
              {/* === End Auto-Bid section === */}
              {auction.allowDirectDonation && (
  <div className="mt-4 pt-4 border-t border-gray-700">
    <button
      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
      onClick={() => setShowDonate(true)}
    >
      💚 Donate Directly
    </button>
    {showDonate && !showDonationPayment && (
      <div className="mt-4 bg-gray-800 p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-3">Enter Donation Amount</h4>
        <input
          type="number"
          className="mb-3 w-full px-4 py-2 border border-gray-600 bg-black text-white rounded"
          placeholder="Amount (₹)"
          min={1}
          required
          value={donateAmount}
          onChange={(e) => setDonateAmount(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!donateAmount || donateAmount < 1) {
                toast.error('Please enter a valid amount');
                return;
              }
              setDonationPaymentAmount(Number(donateAmount));
              setShowDonationPayment(true);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
          >
            Proceed to Payment
          </button>
          <button
            type="button"
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded"
            onClick={() => {
              setShowDonate(false);
              setDonateAmount('');
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
)}

              {user?.role === 'admin' && auction.status === 'active' && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleEndAuction}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    🛑 End Auction Early
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2 select-none">
                    Admin only - This will immediately end the auction
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            {/* Add these debug logs: */}
      {console.log("AuctionDetails -- auction object:", auction)}
      {console.log("AuctionDetails -- auction.ngo:", auction && auction.ngo)}
      {console.log("AuctionDetails -- auction.ngo?.email:", auction && auction.ngo && auction.ngo.email)}
            <RazorpayPayment
              amount={auction.currentPrice}
              ngoEmail={auction.ngo?.email}   
              auctionId={auction._id}
              type="bid"
              onSuccess={() => {
                setPaymentCompleted(true);
                setShowPayment(false);
                toast.success('Payment successful! NGO wallet credited.');
              }}
              onClose={() => setShowPayment(false)}
            />
          </div>
        </div>
      )}

      {/* Donation Payment Modal */}
{showDonationPayment && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div className="max-w-md w-full">
      {/* Add these debug logs: */}
      {console.log("AuctionDetails -- auction object:", auction)}
      {console.log("AuctionDetails -- auction.ngo:", auction && auction.ngo)}
      {console.log("AuctionDetails -- auction.ngo?.email:", auction && auction.ngo && auction.ngo.email)}
      <RazorpayPayment
        amount={donationPaymentAmount}
        ngoEmail={auction.ngo?.email}   
        auctionId={auction._id}
        type="donation"
        onSuccess={() => {
          setShowDonationPayment(false);
          setShowDonate(false);
          setDonateAmount('');
          toast.success('Donation successful! NGO wallet credited.');
        }}
        onClose={() => {
          setShowDonationPayment(false);
          setShowDonate(false);
        }}
      />
    </div>
  </div>
)}

    </div>
    
  );
};

export default AuctionDetails;
