import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CreditCard, Lock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface GuestInvoice {
  id: string;
  barnName: string;
  guestName: string;
  guestEmail: string;
  horse?: string;
  charges: Array<{
    id?: string;
    description: string;
    amount: number;
    quantity: number;
    type: string;
  }>;
  dueDate: string;
  status: string;
  paymentBreakdown: {
    subtotal: number;
    processingFee?: number;
    platformFee?: number;
    total: number;
  };
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

interface PaymentFormProps {
  token: string;
  total: number;
  onSuccess: () => void;
  onError: (message: string) => void;
  onProcessing: (processing: boolean) => void;
}

// Inner payment form component that uses Stripe hooks
function GuestPaymentForm({ token, total, onSuccess, onError, onProcessing }: PaymentFormProps) {
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
          return_url: `${window.location.origin}/invoice/${token}?payment=success`,
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
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Payment Details</h3>

      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{
          layout: 'tabs',
        }}
      />

      <div className="payment-security" style={{ marginTop: '16px' }}>
        <Lock size={14} />
        <span>Your payment is secured with 256-bit encryption</span>
      </div>

      <div className="payment-actions" style={{ marginTop: '16px' }}>
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={!stripe || !elements || !isReady}
        >
          <Lock size={18} />
          Pay ${total.toFixed(2)}
        </button>
      </div>
    </form>
  );
}

export default function GuestInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<GuestInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [token]);

  const loadInvoice = async () => {
    if (!token) return;

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiBase}/invoices/guest/${token}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invoice not found');
      }

      const data = await response.json();
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    if (!token) return;

    setIsInitializing(true);
    setPaymentError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiBase}/invoices/guest/${token}/stripe/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setPaymentError(err.message || 'Failed to initialize payment');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleShowPaymentForm = () => {
    setShowPaymentForm(true);
    createPaymentIntent();
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    setShowPaymentForm(false);
    // Reload invoice to show updated status
    await loadInvoice();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'warning',
      processing: 'info',
      paid: 'success',
      failed: 'error',
      cancelled: 'neutral',
      refunded: 'neutral',
    };
    return styles[status] || 'neutral';
  };

  if (isLoading) {
    return (
      <div className="guest-invoice-page">
        <div className="guest-invoice-container">
          <div className="page-loading">
            <div className="spinner spinner-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="guest-invoice-page">
        <div className="guest-invoice-container">
          <div className="guest-invoice-error">
            <AlertCircle size={48} />
            <h2>Unable to Load Invoice</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="guest-invoice-page">
        <div className="guest-invoice-container">
          <div className="guest-invoice-error">
            <FileText size={48} />
            <h2>Invoice Not Found</h2>
            <p>This invoice may have been removed or the link is invalid.</p>
          </div>
        </div>
      </div>
    );
  }

  const total = invoice.charges.reduce((sum, charge) => sum + charge.amount * charge.quantity, 0);

  return (
    <div className="guest-invoice-page">
      <div className="guest-invoice-container">
        {/* Header */}
        <div className="guest-invoice-header">
          <div className="guest-invoice-logo">
            <img src="/logo.png" alt="OnStride" />
          </div>
          <div className="guest-invoice-title">
            <h1>Invoice from {invoice.barnName}</h1>
            <p>Invoice #{invoice.id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        {/* Success Message */}
        {paymentSuccess && (
          <div className="alert alert-success mb-4" style={{ margin: '16px' }}>
            <CheckCircle size={20} />
            <span>Payment successful! Thank you for your payment.</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="guest-invoice-status">
          <span className={`badge badge-${getStatusBadge(invoice.status)} badge-lg`}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
        </div>

        {/* Invoice Details */}
        <div className="guest-invoice-details">
          <div className="guest-invoice-info">
            <div className="info-row">
              <span className="info-label">Bill To</span>
              <span className="info-value">{invoice.guestName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{invoice.guestEmail}</span>
            </div>
            {invoice.horse && (
              <div className="info-row">
                <span className="info-label">Horse</span>
                <span className="info-value">{invoice.horse}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Due Date</span>
              <span className="info-value">{format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</span>
            </div>
            {invoice.paidAt && (
              <div className="info-row">
                <span className="info-label">Paid On</span>
                <span className="info-value">{format(new Date(invoice.paidAt), 'MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Charges Table */}
        <div className="guest-invoice-charges">
          <h3>Charges</h3>
          <table className="charges-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.charges.map((charge, index) => (
                <tr key={charge.id || index}>
                  <td>{charge.description}</td>
                  <td className="text-center">{charge.quantity}</td>
                  <td className="text-right">${charge.amount.toFixed(2)}</td>
                  <td className="text-right">${(charge.amount * charge.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="charges-total">
            <div className="total-row">
              <span>Total Due</span>
              <span className="total-amount">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="guest-invoice-notes">
            <h4>Notes</h4>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Payment Section */}
        {(invoice.status === 'pending' || invoice.status === 'failed') && (
          <div className="guest-invoice-payment">
            {!showPaymentForm ? (
              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleShowPaymentForm}
              >
                <CreditCard size={20} />
                Pay ${total.toFixed(2)}
              </button>
            ) : (
              <div style={{ position: 'relative' }}>
                {paymentError && (
                  <div className="alert alert-error mb-4">
                    <AlertCircle size={18} />
                    <span>{paymentError}</span>
                  </div>
                )}

                {isInitializing ? (
                  <div className="payment-loading" style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="spinner spinner-md"></div>
                    <p style={{ marginTop: '16px' }}>Loading secure payment form...</p>
                  </div>
                ) : clientSecret && token ? (
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
                    <GuestPaymentForm
                      token={token}
                      total={total}
                      onSuccess={handlePaymentSuccess}
                      onError={(msg) => setPaymentError(msg)}
                      onProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="alert alert-error">
                    <AlertCircle size={18} />
                    <span>Unable to load payment form. Please try again.</span>
                  </div>
                )}

                <div className="payment-actions" style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-outline w-full"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setClientSecret(null);
                      setPaymentError(null);
                    }}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                </div>

                {isProcessing && (
                  <div style={{
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
          </div>
        )}

        {/* Footer */}
        <div className="guest-invoice-footer">
          <p>Powered by <a href="https://onstrideapp.com" target="_blank" rel="noopener noreferrer">OnStride</a></p>
        </div>
      </div>
    </div>
  );
}
