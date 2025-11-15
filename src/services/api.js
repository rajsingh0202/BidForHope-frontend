import axios from 'axios';

// Base URL (handles local and production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const API = axios.create({
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

// ---- AUTH APIs ----
export const register = (userData) => API.post('/auth/register', userData);
export const login = (userData) => API.post('/auth/login', userData);
export const getMe = () => API.get('/auth/me');

// ---- Auction APIs ----
export const getAuctions = () => API.get('/auctions');
export const getAllAuctions = () => API.get('/auctions/all');
export const getAuction = (id) => API.get(`/auctions/${id}`);
export const createAuction = (auctionData) => API.post('/auctions', auctionData);
export const updateAuction = (id, auctionData) => API.put(`/auctions/${id}`, auctionData);
export const deleteAuction = (id) => API.delete(`/auctions/${id}`);
export const getUrgentAuctions = () => API.get('/auctions/urgent');

// ---- NGO APIs ----
export const getNGOs = () => API.get('/ngos');
export const createNGO = (ngoData) => API.post('/ngos', ngoData);

// ---- Pending NGO APIs (Admin-only) ----
export const getPendingNGOs = () => API.get('/ngos/pending');
export const updateNGOStatus = (id, status, password) =>
  API.put(`/ngos/${id}/status`, { status, password });

// ---- Admin auction approval APIs ----
export const getPendingAuctions = () => API.get('/auctions/pending');
export const approveAuction = (id) => API.put(`/auctions/${id}/approve`);
export const rejectAuction = (id, reason) => API.put(`/auctions/${id}/reject`, { reason });
export const endAuction = (id) => API.put(`/auctions/${id}/end`);

// ---- Bid APIs ----
export const placeBid = (auctionId, amount) => API.post(`/bids/${auctionId}`, { amount });
export const getAuctionBids = (auctionId) => API.get(`/bids/auction/${auctionId}`);
export const getUserBids = () => API.get('/bids/user');

// ---- Image Upload APIs ----
export const uploadImage = (formData) => API.post('/upload/image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const uploadImages = (formData) => API.post('/upload/images', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ---- Transaction APIs ----
export const getNGOTransactions = (ngoId) => API.get(`/ngos/${ngoId}/transactions`);
export const addCreditTransaction = (ngoId, creditData) =>
  API.post(`/ngos/${ngoId}/transactions/credit`, creditData);
export const addDebitTransaction = (ngoId, debitData) =>
  API.post(`/ngos/${ngoId}/transactions/debit`, debitData);

// ---- Donation APIs ----
// CHANGE: Always pass ngoEmail, not ngoId!
export const directDonate = (auctionId, donationData) =>
  axios.post(`${API_URL}/api/auctions/${auctionId}/donate`, {
    ...donationData,
    ngoEmail: donationData.ngoEmail, // ensure email is present in payload
  });

// ---- Auto-bid Backend APIs ----
export const enableAutoBid = (auctionId, maxAmount) => {
  return API.post('/autobid/enable', { auctionId, maxAmount });
};
export const disableAutoBid = (auctionId) => {
  return API.post('/autobid/disable', { auctionId });
};
export const getAutoBidStatus = (auctionId) => {
  return API.get(`/autobid/status/${auctionId}`);
};
export const getPendingAuctionsCount = () =>
  axios.get('/api/auctions/pending/count');

// ---- Email-based OTP APIs (Registration) ----
export const sendOtp = (userData) => API.post('/auth/request-otp', userData);
export const verifyOtp = (otpData) => API.post('/auth/verify-otp', otpData);

// ---- Login OTP flow ----
export const loginSendOtp = (credentials) =>
  API.post('/auth/login-send-otp', credentials);

export const loginVerifyOtp = ({ email, role, otp }) =>
  API.post('/auth/login-verify-otp', { email, role, otp });

// ---- Payment APIs ----
// CHANGE: Always use ngoEmail, not ngoId!
export const createPaymentOrder = (orderData) => 
  API.post('/payment/create-order', {
    ...orderData,
    ngoEmail: orderData.ngoEmail, // ensure email string instead of id
  });

export const verifyPayment = (paymentData) => 
  API.post('/payment/verify', paymentData);

export const getUserPayments = () => 
  API.get('/payment/user-payments');

// CHANGE: Always use ngoEmail!
export const getNGOPayments = (ngoEmail) => 
  API.get(`/payment/ngo-payments/${ngoEmail}`);

// ---- Withdrawal APIs ----
export const createWithdrawalRequest = (withdrawalData) => 
  API.post('/withdrawal/request', withdrawalData);

// If your backend uses emails, update these as required:
export const getNGOWithdrawals = (ngoEmail) => 
  API.get(`/withdrawal/ngo/${ngoEmail}`);

export const getPendingWithdrawals = () => 
  API.get('/withdrawal/pending');

export const updateWithdrawalStatus = (id, statusData) => 
  API.put(`/withdrawal/${id}/status`, statusData);

export default API;
