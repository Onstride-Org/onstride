import { useState, useEffect } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Cache for stripe instance to avoid reloading
let stripePromiseCache: Promise<Stripe | null> | null = null;
let cachedPublishableKey: string | null = null;

const getStripeInstance = async (apiBase: string): Promise<Stripe | null> => {
  try {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${apiBase}/stripe/config`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Fallback to env variable
      const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (envKey) {
        return loadStripe(envKey);
      }
      throw new Error('Failed to load Stripe configuration');
    }

    const data = await response.json();
    const key = typeof data.publishableKey === 'string' ? data.publishableKey : null;
    if (key && key !== cachedPublishableKey) {
      cachedPublishableKey = key;
      stripePromiseCache = loadStripe(key);
    }
    return stripePromiseCache;
  } catch (err) {
    console.error('Error loading Stripe config:', err);
    // Fallback to env variable
    const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (envKey) {
      return loadStripe(envKey);
    }
    return null;
  }
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: string;
  amount: number;
  description?: string;
  /** Optional title (default: "Pay Invoice") */
  title?: string;
  /** Optional subtotal - when provided with processingFee, shows line item breakdown */
  subtotal?: number;
  /** Optional processing fee - when provided with subtotal, shows line item breakdown */
  processingFee?: number;
}

interface PaymentFormProps {
  invoiceId: string;
  amount: number;
  onSuccess: () => void;
  onError: (message: string) => void;
  onProcessing: (processing: boolean) => void;
}

// Inner payment form component that uses Stripe hooks
function PaymentForm({ invoiceId, amount, onSuccess, onError, onProcessing }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    onProcessing(true);
    onError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/app/invoices/${invoiceId}?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed. Please try again.');
        onProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        // Payment is processing - will be confirmed via webhook
        onSuccess();
      } else {
        onError('Payment was not completed. Please try again.');
        onProcessing(false);
      }
    } catch (err: any) {
      onError(err.message || 'Payment failed. Please try again.');
      onProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{
          layout: 'tabs',
        }}
      />

      {/* Security Note */}
      <div className="payment-security" style={{ marginTop: '16px' }}>
        <Lock size={14} />
        <span>Your payment is secured with 256-bit encryption</span>
      </div>

      <div className="modal-footer">
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={!stripe || !elements || !isReady}
          style={{ marginTop: '16px' }}
        >
          <Lock size={18} />
          Pay ${amount.toFixed(2)}
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  amount,
  description,
  title = 'Pay Invoice',
  subtotal,
  processingFee,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    if (isOpen && !clientSecret) {
      initializePayment();
    }
  }, [isOpen, invoiceId]);

  const initializePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load Stripe instance first
      const stripe = await getStripeInstance(apiBase);
      if (!stripe) {
        throw new Error('Payment processing is not configured. Please contact support.');
      }
      setStripePromise(Promise.resolve(stripe));

      // Then create payment intent
      const token = localStorage.getItem('accessToken');
      const barnId = localStorage.getItem('currentBarnId');

      const response = await fetch(`${apiBase}/invoices/${invoiceId}/stripe/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(barnId && { 'X-Barn-Id': barnId }),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setClientSecret(null);
      setStripePromise(null);
      setSuccess(false);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal-md payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <CreditCard size={20} />
            {title}
          </h2>
          <button className="btn btn-ghost modal-close" onClick={handleClose} disabled={isProcessing}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="modal-body payment-success">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h3>Payment Successful!</h3>
            <p>Your payment of ${amount.toFixed(2)} has been processed.</p>
          </div>
        ) : (
          <div className="modal-body">
            {/* Amount Display */}
            <div className="payment-amount">
              {subtotal != null && processingFee != null ? (
                <div className="payment-breakdown">
                  {description && <span className="payment-description">{description}</span>}
                  <div className="payment-breakdown-rows">
                    <div className="payment-breakdown-row">
                      <span>Plan subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="payment-breakdown-row">
                      <span>Processing fee (3%)</span>
                      <span>${processingFee.toFixed(2)}</span>
                    </div>
                    <div className="payment-breakdown-row payment-breakdown-total">
                      <span>Total</span>
                      <span>${amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <span className="payment-amount-label">Amount Due</span>
                  <span className="payment-amount-value">${amount.toFixed(2)}</span>
                  {description && <span className="payment-description">{description}</span>}
                </>
              )}
            </div>

            {error && (
              <div className="alert alert-error mb-4">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Payment Form */}
            {isLoading ? (
              <div className="payment-loading" style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner spinner-md"></div>
                <p style={{ marginTop: '16px' }}>Loading secure payment form...</p>
              </div>
            ) : clientSecret && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#405D4B',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    },
                  },
                }}
              >
                <PaymentForm
                  invoiceId={invoiceId}
                  amount={amount}
                  onSuccess={handleSuccess}
                  onError={(msg) => setError(msg)}
                  onProcessing={setIsProcessing}
                />
              </Elements>
            ) : (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>Unable to load payment form. Please try again.</span>
              </div>
            )}

            {isProcessing && (
              <div className="payment-processing-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}>
                <div className="spinner spinner-lg"></div>
                <p style={{ marginTop: '16px' }}>Processing payment...</p>
              </div>
            )}
          </div>
        )}

        {!success && !isLoading && (
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
