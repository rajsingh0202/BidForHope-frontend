import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { login } from '../services/api';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const { data } = await login(formData);
      if (data.user.role !== formData.role) {
        dispatch(loginFailure('Invalid role selected'));
        toast.error(`This account is registered as ${data.user.role}, not ${formData.role}`);
        return;
      }

      dispatch(loginSuccess(data));
      toast.success(`Welcome back, ${data.user.name}! (${data.user.role.toUpperCase()})`);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch(loginFailure(message));
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-300 hover:text-white transition"
      >
        <FiArrowLeft size={18} /> Back to Home
      </Link>
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to your charity auction account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Login As
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition bg-black text-white"
            >
              <option value="user">👤 User (Bidder/Donor)</option>
              <option value="ngo">🏢 NGO Representative</option>
              <option value="admin">⚙️ Admin</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Select the role you registered with</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-black text-white placeholder-gray-500 transition"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-black text-white placeholder-gray-500 transition"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Signing in...'
              : `Sign In as ${formData.role === 'user' ? 'User' : formData.role === 'ngo' ? 'NGO' : 'Admin'}`}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-400 hover:text-blue-200 underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
