import { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: string;
  amount: number;
  description?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  amount,
  description,
}: PaymentModalProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);
  const [ajaxSubmitUrl, setAjaxSubmitUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fieldsReady, setFieldsReady] = useState(false);
  const controllerRef = useRef<HostedFieldsController | null>(null);
  const initAttemptedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !initAttemptedRef.current) {
      initAttemptedRef.current = true;
      // Wait for next tick to ensure DOM is rendered
      setTimeout(() => {
        initializeHostedFields();
      }, 100);
    }

    return () => {
      if (!isOpen) {
        initAttemptedRef.current = false;
        controllerRef.current = null;
        setFieldsReady(false);
      }
    };
  }, [isOpen, invoiceId]);

  const initializeHostedFields = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      // 1. Create session on backend
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('accessToken');
      const barnId = localStorage.getItem('currentBarnId');

      const response = await fetch(`${apiBase}/invoices/${invoiceId}/hosted-fields-session`, {
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

      setAjaxSubmitUrl(data.ajaxSubmitCardUrl);
      setSessionId(data.sessionId);

      // 2. Wait for Windcave library to load
      await waitForWindcave();

      // 3. Wait for container elements to exist
      await waitForContainers();

      // 4. Initialize Hosted Fields
      const controller = window.WindcavePayments!.HostedFields.create(
        {
          env: 'uat', // Change to 'sec' for production
          fields: {
            CardNumber: {
              container: 'wc-card-number',
              tabOrder: 1,
              placeholder: '4111 1111 1111 1111',
              supportedCards: ['visa', 'masterCard', 'amex'],
              detectSchema: (type: string) => {
                setCardType(type);
              },
            },
            ExpirationDate: {
              container: 'wc-expiry',
              tabOrder: 2,
              placeholder: 'MM / YY',
            },
            CVV: {
              container: 'wc-cvv',
              tabOrder: 3,
              placeholder: '123',
            },
            CardHolderName: {
              container: 'wc-cardholder',
              tabOrder: 4,
              placeholder: 'Name on card',
            },
          },
          styles: {
            input: {
              'color': '#1a1a1a',
              'font-size': '16px',
              'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              'padding': '12px',
              'background-color': '#ffffff',
            },
            'input-valid': {
              'color': '#059669',
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
          setError('Failed to load payment form. Please refresh and try again.');
          setIsInitializing(false);
        }
      );

      controllerRef.current = controller;
      setFieldsReady(true);
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'Failed to initialize payment');
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
          reject(new Error('Windcave payment library failed to load'));
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
        const cardNumber = document.getElementById('wc-card-number');
        const expiry = document.getElementById('wc-expiry');
        const cvv = document.getElementById('wc-cvv');
        const cardholder = document.getElementById('wc-cardholder');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!controllerRef.current || !ajaxSubmitUrl) {
      setError('Payment form not ready. Please wait and try again.');
      return;
    }

    setIsProcessing(true);

    controllerRef.current.submit(
      ajaxSubmitUrl,
      30,
      async (status) => {
        if (status === 'done') {
          // Payment submitted - check result on backend
          try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const token = localStorage.getItem('accessToken');
            const barnId = localStorage.getItem('currentBarnId');

            const response = await fetch(`${apiBase}/invoices/${invoiceId}/payment-status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                ...(barnId && { 'X-Barn-Id': barnId }),
              },
            });

            const result = await response.json();

            if (result.status === 'paid' || result.transaction?.authorised) {
              setSuccess(true);
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 2000);
            } else {
              setError(result.transaction?.responseText || 'Payment was declined');
              setIsProcessing(false);
            }
          } catch (err) {
            setError('Failed to verify payment status');
            setIsProcessing(false);
          }
        } else if (status === '3DSecure') {
          // 3D Secure popup is being displayed - wait for it to complete
          console.log('3D Secure authentication required');
        }
      },
      (err) => {
        console.error('Payment submission error:', err);
        setError(err || 'Payment failed. Please try again.');
        setIsProcessing(false);
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <CreditCard size={20} />
            Pay Invoice
          </h2>
          <button className="btn btn-ghost modal-close" onClick={onClose} disabled={isProcessing}>
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
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Amount Display */}
              <div className="payment-amount">
                <span className="payment-amount-label">Amount Due</span>
                <span className="payment-amount-value">${amount.toFixed(2)}</span>
                {description && <span className="payment-description">{description}</span>}
              </div>

              {error && (
                <div className="alert alert-error mb-4">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Hosted Fields Form - always rendered so containers exist */}
              <div className="payment-form hosted-fields-form" style={{ position: 'relative' }}>
                {isInitializing && (
                  <div className="payment-loading-overlay">
                    <div className="spinner spinner-md"></div>
                    <p>Loading secure payment form...</p>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <div id="wc-cardholder" className="hosted-field-container"></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <div className="card-input-wrapper">
                    <div id="wc-card-number" className="hosted-field-container"></div>
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
                    <div id="wc-expiry" className="hosted-field-container"></div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <div id="wc-cvv" className="hosted-field-container"></div>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="payment-security">
                <Lock size={14} />
                <span>Your payment is secured with 256-bit encryption</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
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
                    Pay ${amount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
