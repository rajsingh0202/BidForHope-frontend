import axios from 'axios';

// Get the base URL from the environment variable
// This will be 'http://localhost:5000' in development (from your .env file)
// and 'https://bidforhope.onrender.com' in production (from Vercel's settings)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const API = axios.create({
  // Use the environment variable for the base URL
  baseURL: `${API_URL}/api`, 
});

// Add token to requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const register = (userData) => API.post('/auth/register', userData);
export const login = (userData) => API.post('/auth/login', userData);
export const getMe = () => API.get('/auth/me');

// Auction APIs
export const getAuctions = () => API.get('/auctions');
export const getAllAuctions = () => API.get('/auctions/all');

export const getAuction = (id) => API.get(`/auctions/${id}`);
export const createAuction = (auctionData) => API.post('/auctions', auctionData);
export const updateAuction = (id, auctionData) => API.put(`/auctions/${id}`, auctionData);
export const deleteAuction = (id) => API.delete(`/auctions/${id}`);
export const getUrgentAuctions = () => API.get('/auctions/urgent');

// NGO APIs
export const getNGOs = () => API.get('/ngos');
export const createNGO = (ngoData) => API.post('/ngos', ngoData);

// Pending NGO APIs (Admin-only)
export const getPendingNGOs = () => API.get('/ngos/pending');
export const updateNGOStatus = (id, status, password) =>
  API.put(`/ngos/${id}/status`, { status, password });

// Admin approval APIs
export const getPendingAuctions = () => API.get('/auctions/pending');
export const approveAuction = (id) => API.put(`/auctions/${id}/approve`);
export const rejectAuction = (id, reason) => API.put(`/auctions/${id}/reject`, { reason });
export const endAuction = (id) => API.put(`/auctions/${id}/end`);

// Bid APIs
export const placeBid = (auctionId, amount) => API.post(`/bids/${auctionId}`, { amount });
export const getAuctionBids = (auctionId) => API.get(`/bids/auction/${auctionId}`);
export const getUserBids = () => API.get('/bids/user');

// Image Upload APIs
export const uploadImage = (formData) => API.post('/upload/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const uploadImages = (formData) => API.post('/upload/images', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Get all transactions for a given NGO
export const getNGOTransactions = (ngoId) => API.get(`/ngos/${ngoId}/transactions`);

// Add a credit transaction (admin or system, used for testing/manual)
export const addCreditTransaction = (ngoId, creditData) =>
  API.post(`/ngos/${ngoId}/transactions/credit`, creditData);

// Add a debit transaction (for logged-in NGO)
export const addDebitTransaction = (ngoId, debitData) =>
  API.post(`/ngos/${ngoId}/transactions/debit`, debitData);

// Direct Donation
export const directDonate = (auctionId, donationData) =>
  // Use the dynamic API_URL here as well, and fix the axios instance
  axios.post(`${API_URL}/api/auctions/${auctionId}/donate`, donationData);

// ---- Auto-bid Backend API functions ----

export const enableAutoBid = (auctionId, maxAmount) => {
  return API.post('/autobid/enable', { auctionId, maxAmount });
};

export const disableAutoBid = (auctionId) => {
  return API.post('/autobid/disable', { auctionId });
};

export const getAutoBidStatus = (auctionId) => {
  return API.get(`/autobid/status/${auctionId}`);
};

export default API;