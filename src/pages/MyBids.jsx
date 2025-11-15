import React, { useEffect, useState } from 'react';
import { getUserBids } from '../services/api';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';


const MyBids = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchBids();
    // eslint-disable-next-line
  }, []);


  const fetchBids = async () => {
    try {
      const { data } = await getUserBids();
      setBids(data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load your bids');
      setLoading(false);
    }
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-lg text-red-400 font-semibold">Please login to view your bids.</p>
      </div>
    );
  }


  // Glass badge helper with null check
  const getResultBadge = (bid) => {
    // Check if auction exists
    if (!bid.auction) {
      return 'bg-gray-600/70 text-gray-300 backdrop-blur-lg shadow';
    }

    if (bid.auction.status === 'ended') {
      return bid.amount === bid.auction.currentPrice
        ? 'bg-green-600/70 text-green-100 backdrop-blur-lg shadow'
        : 'bg-red-600/70 text-red-100 backdrop-blur-lg shadow';
    }
    return bid.amount === bid.auction.currentPrice
      ? 'bg-blue-700/70 text-blue-100 backdrop-blur-lg shadow'
      : 'bg-yellow-700/70 text-yellow-100 backdrop-blur-lg shadow';
  };


  const getResultText = (bid) => {
    // Check if auction exists
    if (!bid.auction) {
      return 'UNAVAILABLE';
    }

    if (bid.auction.status === 'ended')
      return bid.amount === bid.auction.currentPrice ? 'WON' : 'LOST';
    return bid.amount === bid.auction.currentPrice ? 'WINNING' : 'OUTBID';
  };


  // Auction status badge with null check
  const getAuctionBadge = (status) => {
    if (!status) return 'bg-gray-700/70 text-gray-200 backdrop-blur-lg shadow';
    
    if (status === 'active')
      return 'bg-green-700/70 text-green-200 backdrop-blur-lg shadow';
    if (status === 'ended')
      return 'bg-red-700/70 text-red-200 backdrop-blur-lg shadow';
    return 'bg-gray-700/70 text-gray-200 backdrop-blur-lg shadow';
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-900 pt-10 pb-20">
      <div className="max-w-4xl mx-auto p-7 bg-gray-950/90 rounded-2xl shadow-2xl border border-blue-900 ring-2 ring-blue-900">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            <span className="bg-blue-900/80 rounded text-blue-200 px-3 py-1 mr-2">📝</span>
            My Bids
          </h1>
          <Link
            to="/dashboard"
            className="text-sm text-blue-400 hover:bg-blue-800 hover:text-white px-3 py-2 rounded transition font-medium shadow-lg"
          >
            Back to Dashboard
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-28">
            <div className="animate-spin h-10 w-10 border-[6px] border-blue-400 border-t-transparent rounded-full"></div>
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl border shadow">
            <p className="text-gray-200 text-lg mb-2 font-semibold">No bids yet!</p>
            <Link to="/" className="mt-4 inline-block text-blue-400 hover:text-white underline">
              Start Bidding
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {bids.map((bid) => {
              // Check if auction exists before rendering
              if (!bid.auction) {
                return (
                  <div
                    key={bid._id}
                    className="border border-gray-700 rounded-xl shadow-lg p-5 bg-gradient-to-br from-gray-900 to-gray-800"
                  >
                    <p className="text-gray-400 text-center">Auction data unavailable</p>
                    <div className="mt-3 text-center">
                      <span className="text-blue-400 text-sm">
                        Your bid: ₹{bid.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={bid._id}
                  className="border border-blue-950 rounded-xl shadow-lg p-5 bg-gradient-to-br from-gray-900 to-gray-800 hover:scale-[1.016] hover:shadow-2xl transition-all duration-150 relative"
                >
                  {/* Status/Result badges */}
                  <div className="absolute top-5 right-6 flex gap-2 z-10">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getResultBadge(
                        bid
                      )}`}
                    >
                      {getResultText(bid)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getAuctionBadge(
                        bid.auction.status
                      )}`}
                    >
                      {bid.auction.status ? bid.auction.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      <Link
                        to={`/auction/${bid.auction._id}`}
                        className="hover:text-blue-300 underline"
                      >
                        {bid.auction.title || 'Untitled Auction'}
                      </Link>
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-1 text-xs">
                      <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full capitalize">
                        {bid.auction.category || 'Unknown'}
                      </span>
                      <span className="bg-gray-700/70 text-gray-200 px-2 py-1 rounded-full capitalize">
                        {bid.auction.itemType || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                      {bid.auction.description || 'No description available'}
                    </p>
                    {/* Stats row */}
                    <div className="flex gap-1 justify-between items-center mb-2 mt-2">
                      <div className="flex-1 flex flex-col items-center">
                        <span className="text-[11px] text-gray-400">Your Bid</span>
                        <span className="font-bold text-blue-400 text-sm">
                          ₹{bid.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <span className="text-[11px] text-gray-400">Current</span>
                        <span className="font-bold text-green-300 text-sm">
                          ₹{bid.auction.currentPrice ? bid.auction.currentPrice.toLocaleString() : '0'}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <span className="text-[11px] text-gray-400">Total Bids</span>
                        <span className="font-bold text-yellow-200 text-sm">
                          {bid.auction.totalBids || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 mb-1">
                      <span>
                        {bid.time ? format(new Date(bid.time), 'MMM dd, yyyy HH:mm') : ''}
                      </span>
                      <span>
                        · <span className="capitalize font-semibold">{bid.auction.status || 'unknown'}</span>
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        to={`/auction/${bid.auction._id}`}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-bold text-xs transition-all shadow mt-2"
                      >
                        View Auction
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


export default MyBids;
