import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import { createAuction as createAuctionAPI, getNGOs, uploadImages } from '../services/api';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CreateAuction = () => {

  const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);

// ... inside your component:
const now = new Date();
// Only show times after current time if today is selected!
const isToday = startDate && (
  now.toDateString() === startDate.toDateString()
);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    itemType: 'physical',
    startingPrice: '',
    bidIncrement: 100,
    startDate: '',
    endDate: '',
    status: 'draft',
    isUrgent: false,
    urgentCause: '',
    ngo: '',
    category: 'art',
    allowDirectDonation: true,
    enableAutoBidding: true,
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'ngo')) {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }
    fetchNGOs();
  }, []);

  const fetchNGOs = async () => {
    try {
      const { data } = await getNGOs();
      setNgos(data.data);
    } catch (error) {
      toast.error('Failed to load NGOs');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const file = files[0];
    setUploading(true);
    try {
      const preview = URL.createObjectURL(file);
      setPreviewImages([preview]);
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await uploadImages(formData);
      const uploadedImage = data.data[0];
      setImages([
        uploadedImage.url
          ? { url: uploadedImage.url, public_id: uploadedImage.public_id }
          : { url: uploadedImage.secure_url, public_id: uploadedImage.public_id }
      ]);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      setPreviewImages([]);
      setImages([]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Copy data from formData
    const submissionData = { ...formData };

    // Use startDate and endDate from date picker state
    submissionData.startDate = startDate;
    submissionData.endDate = endDate;

    if (!submissionData.isUrgent) {
      delete submissionData.urgentCause;
    }
    if (images.length > 0) {
      submissionData.images = images;
    }
    await createAuctionAPI(submissionData);
    const successMessage = user?.role === 'ngo'
      ? 'Auction submitted for admin approval!'
      : 'Auction created successfully!';
    toast.success(successMessage);
    navigate('/');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to create auction');
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-blue-400 hover:underline text-sm font-medium"
            >
              <FiArrowLeft size={18} /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">Create New Auction</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 rounded-xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Auction Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                placeholder="e.g., Vintage Art Collection for Education"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                placeholder="Describe the item and its significance..."
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Upload Images (Max 5)
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 bg-gray-900">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-400">
                    {uploading ? 'Uploading...' : 'Click to upload images'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</span>
                </label>
              </div>
              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {previewImages.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Item Type *
                </label>
                <select
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                >
                  <option value="physical">Physical Item</option>
                  <option value="service">Service</option>
                  <option value="experience">Experience</option>
                  <option value="nft">NFT</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                >
                  <option value="art">Art</option>
                  <option value="collectibles">Collectibles</option>
                  <option value="fashion">Fashion</option>
                  <option value="tech">Tech</option>
                  <option value="experiences">Experiences</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Starting Price */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Starting Price (₹) *
                </label>
                <input
                  type="number"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                  placeholder="5000"
                />
              </div>

              {/* Bid Increment */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Bid Increment (₹) *
                </label>
                <input
                  type="number"
                  name="bidIncrement"
                  value={formData.bidIncrement}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                  placeholder="100"
                />
              </div>

    <div>
  <label className="block text-sm font-medium text-gray-200 mb-2">
    Start Date *
  </label>
 <DatePicker
  selected={startDate}
  onChange={date => setStartDate(date)}
  showTimeSelect
  timeIntervals={1}
  dateFormat="Pp"
  className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white"
  placeholderText="Select start date and time"
  minDate={now}
  minTime={isToday ? now : new Date(new Date().setHours(0,0,0,0))}
  maxTime={new Date(new Date().setHours(23,59,59,999))}
/>

</div>

<div>
  <label className="block text-sm font-medium text-gray-200 mb-2">
    End Date *
  </label>
  <DatePicker
    selected={endDate}
    onChange={date => setEndDate(date)}
    showTimeSelect
     timeIntervals={1} 
    dateFormat="Pp"
    className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-black text-white"
    placeholderText="Select end date and time"
  />
</div>


              {/* NGO */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Beneficiary NGO *
                </label>
                <select
                  name="ngo"
                  value={formData.ngo}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                >
                  <option value="">Select NGO</option>
                  {ngos.map((ngo) => (
                    <option key={ngo._id} value={ngo._id}>
                      {ngo.name} {ngo.isVerified && '✓'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 border-t border-gray-700 pt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-black rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-200">
                  Mark as Urgent (Emergency/Disaster Relief)
                </label>
              </div>

              {formData.isUrgent && (
                <div className="ml-6">
                  <select
                    name="urgentCause"
                    value={formData.urgentCause}
                    onChange={handleChange}
                    className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
                  >
                    <option value="">Select urgent cause</option>
                    <option value="disaster-relief">Disaster Relief</option>
                    <option value="medical-emergency">Medical Emergency</option>
                    <option value="humanitarian-crisis">Humanitarian Crisis</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="allowDirectDonation"
                  checked={formData.allowDirectDonation}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-black rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-200">
                  Allow Direct Donations (without bidding)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="enableAutoBidding"
                  checked={formData.enableAutoBidding}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-black rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-200">
                  Enable Auto-Bidding Feature
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Auction'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateAuction;
