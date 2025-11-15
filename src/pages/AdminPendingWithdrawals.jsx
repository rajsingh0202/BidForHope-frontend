import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from "socket.io-client"; // ← NEW

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://bidforhope.onrender.com"
    : "";

const SOCKET_BACKEND_URL = 'https://bidforhope.onrender.com'; // ← NEW

const AdminPendingWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(""); // "razorpay" or "code"
  const [secretCode, setSecretCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const navigate = useNavigate();
  const socket = useRef(); // ← NEW

  useEffect(() => {
    fetchWithdrawals();

    // 1. Connect socket
    socket.current = io(SOCKET_BACKEND_URL, { transports: ['websocket'] });

    // 2. Listen for new withdrawal request
    socket.current.on("withdrawalRequested", (newRequest) => {
      // Only add if status is pending
      if (newRequest.status === "pending") {
        setRequests((prev) => [newRequest, ...prev]);
        toast.info("New withdrawal request received");
      }
    });

    // 3. Listen for processed/updated request
    socket.current.on("withdrawalProcessed", (updatedRequest) => {
      setRequests((prev) =>
        prev.map(r =>
          r._id === updatedRequest._id
            ? updatedRequest
            : r
        ).filter(r => r.status === "pending") // Remove if no longer pending
      );
      toast.info(`Request updated: ${updatedRequest.status}`);
    });

    // 4. Cleanup
    return () => {
      if (socket.current) socket.current.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/withdrawals/all`);
      setRequests(Array.isArray(res.data.data) ? res.data.data.filter(r => r.status === 'pending') : []);
    } catch (err) {
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  // This version does NOT autopay; waits for dialog 
  const handleApproveClick = (req) => {
    setSelectedReq(req);
    setShowDialog(true);
    setPaymentMethod("");
    setSecretCode("");
    setCodeError("");
  };

  const handleProcess = async (id, status) => {
    setProcessingId(id);
    try {
      if (status === 'approved') {
        await axios.post(`${API_BASE_URL}/api/payouts/withdrawal/${id}/process-and-pay`);
      } else {
        await axios.put(`${API_BASE_URL}/api/withdrawals/${id}/process`, { status });
      }
      toast.success(`Withdrawal ${status}`);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessingId(null);
      setShowDialog(false);
      setSelectedReq(null);
    }
  };

  // Option 1: Use Razorpay flow (replace with actual RazorpayPayment/modal if needed)
  const handleRazorpayPayment = () => {
    toast.info('Razorpay payment flow would go here...');
    setShowDialog(false);
    setSelectedReq(null);
    // integrate RazorpayPayment component/modal as needed
  };

  // Option 2: Enter secret code and call the new API
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (secretCode === "TEST123") {
      setProcessingId(selectedReq._id);
      try {
        await axios.post(`${API_BASE_URL}/api/withdrawals/${selectedReq._id}/approve-manual`, { code: secretCode });
        toast.success("Withdrawal approved (manual)");
        fetchWithdrawals();
        setShowDialog(false);
        setSelectedReq(null);
        setProcessingId(null);
      } catch (err) {
        setCodeError(err.response?.data?.message || "Manual approval failed.");
        setProcessingId(null);
      }
    } else {
      setCodeError("Invalid code. Try again or contact admin.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black via-gray-900 to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold transition shadow"
        >
          Back to Dashboard
        </button>
        <h2 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Pending NGO Withdrawal Requests
        </h2>
        {loading ? (
          <div className="text-center py-10 text-lg text-gray-300">
            <span className="animate-spin inline-block mx-2 w-6 h-6 border-b-2 border-blue-400 rounded-full"></span>
            Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center p-8 bg-gray-900 rounded-xl shadow border border-gray-700">
            <p className="text-lg text-gray-200">No pending withdrawal requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-gradient-to-br from-gray-950 to-gray-900 border border-blue-900 rounded-2xl shadow-xl p-6 hover:ring-2 ring-blue-600 transition-all relative flex flex-col"
              >
                <div className="flex flex-col gap-1 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-extrabold text-blue-200">{req.ngo?.name || 'Unknown NGO'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full">{req.ngo?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="bg-yellow-900 text-yellow-200 px-2 py-1 rounded">{req.bankDetails?.bankName || '-'}</span>
                    <span>Acc#: <span className="bg-gray-900 text-green-200 px-2 py-1 rounded">{req.bankDetails?.accountNumber || '-'}</span></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-green-900 text-green-200 px-3 py-1 rounded-full text-xs font-bold">
                    ₹{req.amount} requested
                  </span>
                  <span className="bg-blue-800 text-blue-100 px-3 py-1 rounded-full text-xs font-bold">
                    {new Date(req.requestedAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-auto flex gap-3">
                  <button
                    className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow font-bold transition ${processingId === req._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleApproveClick(req)}
                    disabled={processingId === req._id}
                  >
                    {processingId === req._id ? 'Processing...' : `Approve & Pay ₹${req.amount}`}
                  </button>
                  <button
                    className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow font-bold transition ${processingId === req._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleProcess(req._id, 'rejected')}
                    disabled={processingId === req._id}
                  >
                    {processingId === req._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment choice dialog/modal */}
      {showDialog && selectedReq && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-blue-600 rounded-lg shadow-xl max-w-sm w-full p-6 relative">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Approve & Pay Withdrawal</h3>
            <p className="text-center mb-4 text-blue-200 font-semibold">
              Select payment option for <span className="text-green-300 font-extrabold">₹{selectedReq.amount}</span> ({selectedReq.ngo?.name})
            </p>
            <div className="flex flex-col gap-4">
              <button
                className={`bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition`}
                onClick={() => {
                  setPaymentMethod("razorpay");
                  handleRazorpayPayment();
                }}
              >
                💳 Razorpay Payment (Demo)
              </button>
              <form onSubmit={handleCodeSubmit} className="mt-2 flex flex-col items-center gap-2">
                <label className="block text-sm text-blue-100 font-semibold mb-1">
                  Or Enter Secret Code:
                </label>
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-blue-300 w-full bg-black text-white"
                  placeholder="Enter code"
                  autoFocus
                  disabled={processingId === selectedReq._id}
                />
                {codeError && <span className="text-red-500 text-xs">{codeError}</span>}
                <button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg mt-1 font-bold"
                  disabled={processingId === selectedReq._id}
                >
                  {processingId === selectedReq._id ? "Approving..." : "Submit Code & Approve"}
                </button>
              </form>
            </div>
            <button
              className="absolute top-2 right-3 text-blue-200 hover:text-red-400 text-xl font-bold"
              onClick={() => {
                setShowDialog(false);
                setSelectedReq(null);
                setPaymentMethod("");
                setSecretCode("");
                setCodeError("");
              }}
              disabled={processingId === selectedReq?._id}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingWithdrawals;
