import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CreditCard, Lock, AlertCircle, CheckCircle, FileText } from 'lucide-react';

// Declare Windcave types
declare global {
  interface Window {
    WindcavePayments?: {
      HostedFields: {
        create: (
          options: HostedFieldsOptions,
          timeout: number,
          onSuccess: () => void,
          onError: (error: string) => void
        ) => HostedFieldsController;
      };
    };
  }
}

interface HostedFieldsOptions {
  env: 'uat' | 'sec';
  fields: {
    CardNumber?: FieldConfig;
    ExpirationDate?: FieldConfig;
    CVV?: FieldConfig;
    CardHolderName?: FieldConfig;
  };
  styles?: {
    input?: Record<string, string>;
    'input-valid'?: Record<string, string>;
    'input-invalid'?: Record<string, string>;
    'input-focus'?: Record<string, string>;
  };
}

interface FieldConfig {
  container: string;
  tabOrder?: number;
  placeholder?: string;
  isOptional?: boolean;
  supportedCards?: string[];
  styles?: Record<string, Record<string, string>>;
  onValid?: () => void;
  onInvalid?: () => void;
  detectSchema?: (cardType: string) => void;
}

interface HostedFieldsController {
  submit: (
    ajaxSubmitUrl: string,
    timeout: number,
    onResult: (status: string) => void,
    onError: (error: string) => void
  ) => void;
  validateField: (fieldName: string) => { valid: boolean; error?: string };
}

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
  const [cardType, setCardType] = useState<string | null>(null);
  const [ajaxSubmitUrl, setAjaxSubmitUrl] = useState<string | null>(null);
  const controllerRef = useRef<HostedFieldsController | null>(null);

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

  const initializeHostedFields = async () => {
    if (!token) return;

    setIsInitializing(true);
    setPaymentError(null);

    try {
      // 1. Create session on backend
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiBase}/invoices/guest/${token}/hosted-fields-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Server falls back to barn address for AVS
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setAjaxSubmitUrl(data.ajaxSubmitCardUrl);

      // 2. Wait for Windcave library to load
      await waitForWindcave();

      // 3. Wait for container elements to exist
      await waitForContainers();

      // 4. Initialize Hosted Fields
      const controller = window.WindcavePayments!.HostedFields.create(
        {
          env: 'sec',
          fields: {
            CardNumber: {
              container: 'guest-wc-card-number',
              tabOrder: 1,
              placeholder: '4111 1111 1111 1111',
              supportedCards: ['visa', 'masterCard', 'amex'],
              detectSchema: (type: string) => {
                setCardType(type);
              },
            },
            ExpirationDate: {
              container: 'guest-wc-expiry',
              tabOrder: 2,
              placeholder: 'MM / YY',
            },
            CVV: {
              container: 'guest-wc-cvv',
              tabOrder: 3,
              placeholder: '123',
            },
            CardHolderName: {
              container: 'guest-wc-cardholder',
              tabOrder: 4,
              placeholder: 'Name on card',
            },
          },
          styles: {
            input: {
              'color': '#1a1a1a',
              'font-size': '16px',
              'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              'padding': '14px 16px',
              'background-color': '#ffffff',
              'line-height': '1.5',
            },
            'input-valid': {
              'color': '#1a1a1a',
            },
            'input-invalid': {
              'color': '#dc2626',
            },
            'input-focus': {
              'outline': 'none',
            },
          },
        },
        30,
        () => {
          // Success - fields loaded
          setIsInitializing(false);
        },
        (err) => {
          // Error loading fields
          console.error('Hosted fields error:', err);
          setPaymentError('Failed to load payment form. Please refresh and try again.');
          setIsInitializing(false);
        }
      );

      controllerRef.current = controller;
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setPaymentError(err.message || 'Failed to initialize payment');
      setIsInitializing(false);
    }
  };

  const waitForWindcave = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds

      const check = () => {
        if (window.WindcavePayments?.HostedFields) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Payment library failed to load'));
        } else {
          attempts++;
          setTimeout(check, 100);
        }
      };

      check();
    });
  };

  const waitForContainers = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds

      const check = () => {
        const cardNumber = document.getElementById('guest-wc-card-number');
        const expiry = document.getElementById('guest-wc-expiry');
        const cvv = document.getElementById('guest-wc-cvv');
        const cardholder = document.getElementById('guest-wc-cardholder');

        if (cardNumber && expiry && cvv && cardholder) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Payment form containers not found'));
        } else {
          attempts++;
          setTimeout(check, 100);
        }
      };

      check();
    });
  };

  const handleShowPaymentForm = () => {
    setShowPaymentForm(true);
    // Initialize hosted fields after DOM renders
    setTimeout(() => {
      initializeHostedFields();
    }, 150);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!controllerRef.current || !ajaxSubmitUrl) {
      setPaymentError('Payment form not ready. Please wait and try again.');
      return;
    }

    setIsProcessing(true);

    controllerRef.current.submit(
      ajaxSubmitUrl,
      30,
      async (status) => {
        if (status === 'done') {
          // Payment submitted - reload invoice to check status
          try {
            await loadInvoice();
            if (invoice?.status === 'paid') {
              setPaymentSuccess(true);
              setShowPaymentForm(false);
            } else {
              // Check status from API
              const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
              const response = await fetch(`${apiBase}/invoices/guest/${token}`);
              const data = await response.json();

              if (data.status === 'paid') {
                setPaymentSuccess(true);
                setShowPaymentForm(false);
                setInvoice(data);
              } else {
                setPaymentError('Payment was declined. Please try again.');
              }
            }
          } catch (err) {
            setPaymentError('Failed to verify payment status');
          }
          setIsProcessing(false);
        } else if (status === '3DSecure') {
          // 3D Secure popup is being displayed
          console.log('3D Secure authentication required');
        }
      },
      (err) => {
        console.error('Payment submission error:', err);
        setPaymentError(err || 'Payment failed. Please try again.');
        setIsProcessing(false);
      }
    );
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
              <form onSubmit={handlePayment} className="payment-form">
                <h3>Payment Details</h3>

                {paymentError && (
                  <div className="alert alert-error mb-4">
                    <AlertCircle size={18} />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Hosted Fields Form - always rendered so containers exist */}
                <div style={{ position: 'relative' }}>
                  {isInitializing && (
                    <div className="payment-loading-overlay">
                      <div className="spinner spinner-md"></div>
                      <p>Loading secure payment form...</p>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Cardholder Name</label>
                    <div id="guest-wc-cardholder" className="hosted-field-container"></div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <div className="card-input-wrapper">
                      <div id="guest-wc-card-number" className="hosted-field-container"></div>
                      {cardType && (
                        <span className={`card-type-badge ${cardType.toLowerCase()}`}>
                          {cardType.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <div id="guest-wc-expiry" className="hosted-field-container"></div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <div id="guest-wc-cvv" className="hosted-field-container"></div>
                    </div>
                  </div>

                  <div className="payment-security">
                    <Lock size={14} />
                    <span>Your payment is secured with 256-bit encryption</span>
                  </div>
                </div>

                <div className="payment-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isProcessing || isInitializing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner spinner-sm"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        Pay ${total.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </form>
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
