import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import { register, createNGO, sendOtp, verifyOtp } from '../services/api';

const Register = () => {
  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    ngoName: '',
    placeAddress: '',
    workingYears: '',
    domains: [],
    domainInput: '',
  });

  // OTP states
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // loading states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const navigate = useNavigate();

  // Handle input change for registration data
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

  const isGmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);

  // Send OTP for email verification
  const handleSendOtp = async () => {
    if (!formData.email) return toast.error("Enter your email first");
    if (!isGmail(formData.email)) return toast.error("Only valid @gmail.com addresses allowed.");

    setIsSendingOtp(true);
    try {
      const response = await sendOtp({ email: formData.email });
      // axios response payload: response.data
      const data = response?.data || {};
      if (data.success) {
        setOtpSent(true); // show OTP UI only on success
        toast.success(data.message || 'OTP sent! Check your email.');

        // If backend returned OTP in dev, show it for debugging (remove in production)
        if (data.otp) {
          console.log('DEV OTP:', data.otp);
          // show a subtle toast so developer can see it
          toast.info(`DEV OTP: ${data.otp}`, { autoClose: 6000 });
        }
      } else {
        // Defensive: if success flag missing but 2xx, still set and show message
        toast.info(data.message || 'OTP request processed. Check your email.');
        if (data.otp) {
          setOtpSent(true);
          console.log('DEV OTP:', data.otp);
        }
      }
    } catch (error) {
      // Do NOT set otpSent here — only when server actually confirmed OTP creation/sending.
      const serverMsg = error?.response?.data?.message;
      const serverDetails = error?.response?.data?.details;
      const serverType = error?.response?.data?.type;

      if (serverType === 'registered') {
        toast.error("Email is already registered. Please login.");
      } else if (serverMsg) {
        // show server message; include details in dev if available
        toast.error(serverMsg + (serverDetails ? ` (${serverDetails})` : ''));
      } else {
        toast.error(error.message || 'Failed to send OTP. Try again later.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP, unlock full registration form
  const handleVerifyOtp = async () => {
    if (!otp) return toast.error('Enter the OTP first');
    setIsVerifyingOtp(true);
    try {
      const response = await verifyOtp({ email: formData.email, otp });
      const data = response?.data || {};
      if (data.success) {
        setOtpVerified(true);
        toast.success(data.message || 'OTP verified! You can now create your account.');
      } else {
        toast.error(data.message || 'Invalid OTP');
        setOtpVerified(false);
      }
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) {
        toast.error(serverMsg);
      } else {
        toast.error(error.message || 'Invalid OTP');
      }
      setOtpVerified(false);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Submit full registration (allowed only after email verified)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error("Please verify your email with OTP before creating account");
      return;
    }
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
          {/* Email with Send OTP */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="flex">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-700 rounded-l-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                placeholder="you@gmail.com"
                disabled={otpVerified || isSendingOtp}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                className="bg-green-700 text-white px-4 rounded-r-lg hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!formData.email || otpVerified || isSendingOtp}
              >
                {isSendingOtp ? 'Sending...' : otpSent ? 'OTP Sent' : 'Send OTP'}
              </button>
            </div>

            {/* OTP input section shows after successful send, until OTP is verified */}
            {otpSent && !otpVerified && (
              <div className="mt-4 flex">
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-700 rounded-l-lg bg-black text-white focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                  placeholder="Enter OTP"
                  maxLength={6}
                />
                <button
                  type="button"
                  className="bg-blue-700 text-white px-4 rounded-r-lg hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleVerifyOtp}
                  disabled={!otp || isVerifyingOtp}
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            )}
            {otpVerified && (
              <div className="mt-2 text-green-400 text-sm">
                OTP verified ✓
              </div>
            )}
          </div>

          {/* Registration Form - Only show if OTP is verified */}
          {otpVerified && (
            <>
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
            </>
          )}
          {/* Only enabled if OTP is verified */}
          <button
            type="submit"
            className={`w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 transform hover:scale-105 ${!otpVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!otpVerified}
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
