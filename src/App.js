import React from 'react';
import CreateAuction from './pages/CreateAuction';
import ProtectedRoute from './components/ProtectedRoute';
import AuctionDetails from './pages/AuctionDetails';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Login from './pages/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminPendingAuctions from './pages/AdminPendingAuctions';
import MyBids from './pages/MyBids';
import AdminPendingNGOs from './pages/AdminPendingNGOs';
import AllNgoTransactions from './pages/AllNgoTransactions'; // <-- ADD THIS IMPORT
import AdminPendingWithdrawals from './pages/AdminPendingWithdrawals';

function App() {
  return (
    <Router>
      <div className="App">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />

          {/* NEW PUBLIC PAGE FOR ALL NGO TRANSACTIONS */}
          <Route path="/all-ngos-transactions" element={<AllNgoTransactions />} />

          {/* Protected Routes - Require Login */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin/pending-ngos"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPendingNGOs />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/pending" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPendingAuctions />
              </ProtectedRoute>
            }
          />
          {/* Protected Routes - Only Admin and NGO */}
          <Route 
            path="/create-auction" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'ngo']}>
                <CreateAuction />
              </ProtectedRoute>
            } 
          />
          <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />  
          <Route path="/admin/pending-transactions" element={<AdminPendingWithdrawals />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
