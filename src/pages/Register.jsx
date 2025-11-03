import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import { register, createNGO } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    ngoName: '',
    placeAddress: '',
    workingYears: '',
    domains: [],
    domainInput: '', // For tag input
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle domain/tag input
  const handleDomainInput = (e) => {
    setFormData({ ...formData, domainInput: e.target.value });
  };
  const handleAddDomain = (e) => {
    e.preventDefault();
    const value = formData.domainInput.trim();
    if (value && !formData.domains.includes(value)) {
      setFormData({
        ...formData,
        domains: [...formData.domains, value],
        domainInput: '',
      });
    }
  };
  const handleRemoveDomain = (domain) => {
    setFormData({
      ...formData,
      domains: formData.domains.filter((d) => d !== domain),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let sendData = { ...formData };
    delete sendData.domainInput;
    if (sendData.role === 'ngo') {
      try {
        // Only required fields for NGO payload
        const ngoPayload = {
          name: formData.ngoName,
          registrationNumber: 'REG' + Date.now(),
          email: formData.email,
          address: {
            placeAddress: formData.placeAddress,
          },
          workingYears: formData.workingYears,
          domains: formData.domains,
        };
        await createNGO(ngoPayload);
        toast.success('NGO registration submitted! Awaiting admin approval.');
        navigate('/login');
      } catch (error) {
        const message = error.response?.data?.message || 'NGO registration failed';
        toast.error(message);
      }
    } else {
      try {
        await register(sendData);
        toast.success('Registration successful! Please log in.');
        navigate('/login');
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed';
        toast.error(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <Link 
        to="/" 
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        <FiArrowLeft /> Back to Home
      </Link>
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Join our community and support meaningful causes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
              placeholder="John Doe"
            />
          </div>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
              placeholder="you@example.com"
            />
          </div>
          {/* Password */}
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
              className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
              placeholder="********"
            />
          </div>
          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="user">User (Bidder/Donor)</option>
              <option value="ngo">NGO Representative</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* NGO Extra Fields: Only show if role is ngo */}
          {formData.role === 'ngo' && (
            <>
              {/* NGO Name */}
              <div>
                <label htmlFor="ngoName" className="block text-sm font-medium text-gray-300 mb-2">
                  NGO Name
                </label>
                <input
                  id="ngoName"
                  name="ngoName"
                  type="text"
                  required
                  value={formData.ngoName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  placeholder="Hope for All Foundation"
                />
              </div>
              {/* Place Address */}
              <div>
                <label htmlFor="placeAddress" className="block text-sm font-medium text-gray-300 mb-2">
                  Place Address
                </label>
                <input
                  id="placeAddress"
                  name="placeAddress"
                  type="text"
                  required
                  value={formData.placeAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  placeholder="123 Main Street, Mumbai"
                />
              </div>
              {/* Working Years */}
              <div>
                <label htmlFor="workingYears" className="block text-sm font-medium text-gray-300 mb-2">
                  Working Years
                </label>
                <input
                  id="workingYears"
                  name="workingYears"
                  type="number"
                  required
                  value={formData.workingYears}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  placeholder="5"
                  min="0"
                />
              </div>
              {/* Domains: Tag Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Field of Domain(s)
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.domainInput}
                    onChange={handleDomainInput}
                    className="w-full px-4 py-3 border border-gray-700 rounded-l-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                    placeholder="Enter a domain (students welfare, disaster...)"
                  />
                  <button
                    onClick={handleAddDomain}
                    className="bg-green-700 text-white px-5 rounded-r-lg hover:bg-green-800"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2">
                  {formData.domains.map((domain, idx) => (
                    <span key={idx} className="inline-block bg-green-950 text-green-200 rounded-full px-3 py-1 mr-2 mb-2 border border-green-800">
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="ml-2 text-green-400 hover:text-green-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-green-400 hover:text-green-300">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
