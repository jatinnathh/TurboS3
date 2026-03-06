import type { PaymentOrder } from '../types';

// Razorpay test credentials
const RAZORPAY_KEY_ID = 'rzp_test_XiEOZcAjQ3Gu0D';

// Load Razorpay script
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create payment order
export const createPaymentOrder = async (amount: number): Promise<PaymentOrder> => {
  // For test mode without backend, we'll skip order creation
  // In production, call your backend API to create a proper Razorpay order
  return {
    orderId: '', // Empty for test mode
    amount: amount * 100, // Convert to paise (Razorpay uses smallest currency unit)
    currency: 'INR'
  };
};

// Initialize Razorpay payment
export const initializePayment = async (
  order: PaymentOrder,
  userDetails: {
    name: string;
    email: string;
    contact: string;
  },
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void
) => {
  const isLoaded = await loadRazorpayScript();
  
  if (!isLoaded) {
    alert('Razorpay SDK failed to load. Please check your internet connection or disable ad blockers.');
    return;
  }

  const options: any = {
    key: RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: 'Hospital Management System',
    description: 'Doctor Appointment Booking',
    image: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png', // Hospital icon
    handler: function (response: any) {
      // Create a mock order ID and signature for testing
      const mockResponse = {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: `order_test_${Date.now()}`,
        razorpay_signature: `sig_test_${Date.now()}`
      };
      onSuccess(mockResponse);
    },
    prefill: {
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.contact
    },
    notes: {
      booking_type: 'doctor_appointment'
    },
    theme: {
      color: '#667eea'
    },
    modal: {
      ondismiss: function() {
        onFailure({ error: 'Payment cancelled by user' });
      },
      escape: true,
      backdropclose: false
    }
  };

  // Don't include order_id if empty (test mode without backend)
  if (order.orderId) {
    options.order_id = order.orderId;
  }

  try {
    // @ts-ignore
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response: any) {
      onFailure(response.error);
    });
    razorpay.open();
  } catch (error) {
    console.error('Razorpay initialization error:', error);
    onFailure({ error: 'Failed to initialize payment. Please try again.' });
  }
};

