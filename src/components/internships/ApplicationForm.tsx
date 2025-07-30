import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createApplication, updatePaymentStatus, ApplicationData } from '../../Services/applicationService';
import { saveAs } from 'file-saver';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ApplicationFormProps {
  internshipId: string;
  price: number;
  currency?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  internshipId,
  price,
  currency = 'INR',
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });
  // State to track application ID (not currently used but kept for future use)
  const [_, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      // First, create the application record
      const application = await createApplication({
        $id: 'temp_' + Date.now(), // This will be replaced by Appwrite
        user_id: user.$id,
        internship_id: internshipId,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        payment_id: 'pending_' + Date.now(),
        payment_status: 'pending',
        amount: price.toString(),
      } as ApplicationData);

      setApplicationId(application.$id);
      
      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: price * 100, // Razorpay expects amount in paise
        currency: currency,
        name: 'Internship Program',
        description: `Payment for Internship Application`,
        image: '/logo192.png', // Your logo
        order_id: undefined as string | undefined, // Will be set after creating order
        handler: async function (response: any) {
          try {
            // Update payment status on success
            const updatedApp = await updatePaymentStatus(
              application.$id,
              response.razorpay_payment_id,
              'completed'
            );
            
            // Generate and download receipt
            const receiptContent = generateReceipt(updatedApp, formData, response.razorpay_payment_id);
            const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, `Receipt-${response.razorpay_payment_id}.txt`);
            
            // Show success message
            alert('Payment successful! Your application has been submitted and receipt downloaded.');
            if (onSuccess) onSuccess();
            onClose();
          } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Payment successful but failed to update application status. Please contact support.');
          }
        },
        prefill: {
          name: formData.full_name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          internship_id: internshipId,
          user_id: user.$id,
        },
        theme: {
          color: '#3399cc',
        },
      };

      // In a real app, you would create an order on your server first
      // For now, we'll proceed directly with the payment
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        
        // Handle payment failure
        rzp.on('payment.failed', async function (response: { error: { metadata: { payment_id: string } } }) {
          try {
            await updatePaymentStatus(application.$id, response.error.metadata.payment_id, 'failed');
            alert('Payment failed. Please try again.');
          } catch (error) {
            console.error('Error updating failed payment status:', error);
            alert('Payment failed. Please contact support for assistance.');
          }
        });
        
        rzp.open();
      } else {
        throw new Error('Razorpay SDK failed to load');
      }
      
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apply for Internship</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {currency} {price.toFixed(2)}
              </span>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
            
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              You'll be redirected to a secure payment page
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Function to generate receipt content
const generateReceipt = (
  application: ApplicationData, 
  userData: { full_name: string; email: string; phone: string },
  paymentId: string
) => {
  const receipt = [
    '=== Payment Receipt ===',
    `Receipt #: ${paymentId}`,
    `Date: ${new Date().toLocaleString()}`,
    '\n=== Payment Details ===',
    `Amount: ${application.currency || '₹'} ${application.amount}`,
    `Status: ${application.payment_status}`,
    `Payment ID: ${paymentId}`,
    '\n=== Internship Details ===',
    `Internship ID: ${application.internship_id}`,
    `Application ID: ${application.$id}`,
    '\n=== Student Information ===',
    `Name: ${userData.full_name}`,
    `Email: ${userData.email}`,
    `Phone: ${userData.phone}`,
    '\nThank you for your payment!',
    'This is an auto-generated receipt. Please keep it for your records.'
  ];

  return receipt.join('\n');
};

export default ApplicationForm;
