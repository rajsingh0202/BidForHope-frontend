import React, { useState } from 'react';
import { createPaymentOrder, verifyPayment } from '../services/api';
import { toast } from 'react-toastify';

const RazorpayPayment = ({ amount, ngoId, auctionId, type, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null); // null, 'test', or 'real'
  const [testCode, setTestCode] = useState('');

  const SECRET_TEST_CODE = 'TEST123';

  // Test payment bypass
  const handleTestPayment = async () => {
    if (testCode !== SECRET_TEST_CODE) {
      toast.error('Invalid test code!');
      return;
    }

    setLoading(true);
    try {
      const { data } = await createPaymentOrder({
        amount,
        ngoId,
        auctionId: auctionId || null,
        type
      });

      // Simulate successful verification
      const verifyData = await verifyPayment({
        razorpay_order_id: data.order.id,
        razorpay_payment_id: 'test_' + Date.now(),
        razorpay_signature: 'test_signature_' + Date.now(),
        transactionId: data.transactionId
      });

      toast.success('Test payment successful! NGO wallet credited.');
      if (onSuccess) onSuccess(verifyData.data);
      if (onClose) onClose();
    } catch (error) {
      toast.error('Test payment failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Real Razorpay payment
  const handleRealPayment = async () => {
    setLoading(true);
    try {
      const { data } = await createPaymentOrder({
        amount,
        ngoId,
        auctionId: auctionId || null,
        type
      });

      const { order, transactionId } = data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY',
        amount: order.amount,
        currency: order.currency,
        name: 'BidForHope',
        description: type === 'bid' ? 'Auction Payment' : 'Direct Donation',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyData = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId
            });

            toast.success('Payment successful! NGO wallet credited.');
            if (onSuccess) onSuccess(verifyData.data);
            if (onClose) onClose();
          } catch (error) {
            toast.error('Payment verification failed');
            console.error(error);
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled');
            if (onClose) onClose();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || 'Payment failed');
      console.error(error);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
      <h3 className="text-xl font-bold text-white mb-4">Complete Payment</h3>
      <div className="mb-6">
        <p className="text-gray-400">Amount to pay:</p>
        <p className="text-3xl font-bold text-green-400">₹{amount}</p>
      </div>

      {/* Step 1: Choose payment mode */}
      {!paymentMode && (
        <div className="space-y-3">
          <button
            onClick={() => setPaymentMode('test')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition"
          >
            🧪 Test Mode (Secret Code)
          </button>
          <button
            onClick={() => setPaymentMode('real')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
          >
            💳 Real Payment (Razorpay)
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Step 2: Test mode input */}
      {paymentMode === 'test' && (
        <div className="space-y-3">
          <div className="p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded">
            <p className="text-yellow-300 text-sm">🔒 Enter secret test code</p>
          </div>
          <input
            type="text"
            placeholder="Enter test code"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
            className="w-full px-4 py-3 bg-black text-white border border-gray-700 rounded-lg"
            autoFocus
          />
          <button
            onClick={handleTestPayment}
            disabled={loading || !testCode}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Complete Test Payment'}
          </button>
          <button
            onClick={() => setPaymentMode(null)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 3: Real payment confirmation */}
      {paymentMode === 'real' && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-900 bg-opacity-30 border border-blue-600 rounded">
            <p className="text-blue-300 text-sm">Opening Razorpay payment gateway...</p>
          </div>
          <button
            onClick={handleRealPayment}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Opening...' : 'Proceed to Payment'}
          </button>
          <button
            onClick={() => setPaymentMode(null)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
};

export default RazorpayPayment;
