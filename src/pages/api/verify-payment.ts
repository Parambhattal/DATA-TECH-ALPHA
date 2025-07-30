import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { savePaymentToAppwrite } from '@/lib/appwrite';

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Type for the request body
type VerifyPaymentRequest = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  userId?: string;
  courseId?: string;
  [key: string]: any;
};

// Type for the response
type VerifyPaymentResponse = {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  status?: string;
  error?: string;
  details?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyPaymentResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const body = req.body as VerifyPaymentRequest;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, ...rest } = body;

    // Validate required parameters
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: razorpay_payment_id, razorpay_order_id, razorpay_signature',
      });
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid signature:', { generatedSignature, receivedSignature: razorpay_signature });
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    // Prepare payment data for Appwrite
    const paymentData = {
      userId: rest.userId || 'anonymous',
      courseId: rest.courseId || 'unknown',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amount: payment.amount / 100, // Convert from paise to currency unit
      currency: payment.currency,
      status: payment.status,
      receipt: payment.receipt || `rcpt_${Date.now()}`,
      metadata: {
        ...rest,
        paymentMethod: payment.method,
        bank: payment.bank,
        cardId: payment.card_id,
        vpa: payment.vpa,
        wallet: payment.wallet,
        verifiedAt: new Date().toISOString(),
      },
    };

    // Save payment to Appwrite
    await savePaymentToAppwrite(paymentData);

    // Return success response
    return res.status(200).json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: payment.status,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        error: 'Payment verification failed',
        details: error.message,
      });
    }

    // Fallback for unknown errors
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during payment verification',
      details: 'Unknown error',
    });
  }
}
