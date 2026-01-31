import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CreditCard, Lock, AlertCircle, CheckCircle, FileText } from 'lucide-react';

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

interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export default function GuestInvoicePage() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<GuestInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  // Get card type from number
  const getCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return null;
  };

  const cardType = getCardType(cardDetails.cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardDetails({ ...cardDetails, cardNumber: formatted });
    }
  };

  const handleExpiryChange = (field: 'expiryMonth' | 'expiryYear', value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (field === 'expiryMonth' && cleaned.length <= 2) {
      setCardDetails({ ...cardDetails, expiryMonth: cleaned });
    } else if (field === 'expiryYear' && cleaned.length <= 2) {
      setCardDetails({ ...cardDetails, expiryYear: cleaned });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    const maxLength = cardType === 'amex' ? 4 : 3;
    if (cleaned.length <= maxLength) {
      setCardDetails({ ...cardDetails, cvv: cleaned });
    }
  };

  const validateCard = (): string | null => {
    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = cardDetails;

    if (!cardholderName.trim()) return 'Please enter the cardholder name';

    const cleanedNumber = cardNumber.replace(/\s/g, '');
    if (cleanedNumber.length < 13 || cleanedNumber.length > 16) {
      return 'Please enter a valid card number';
    }

    const month = parseInt(expiryMonth, 10);
    if (!expiryMonth || month < 1 || month > 12) {
      return 'Please enter a valid expiry month (01-12)';
    }

    const year = parseInt(expiryYear, 10);
    const currentYear = new Date().getFullYear() % 100;
    if (!expiryYear || year < currentYear) {
      return 'Card has expired';
    }

    const cvvLength = cardType === 'amex' ? 4 : 3;
    if (cvv.length !== cvvLength) {
      return `Please enter a valid CVV (${cvvLength} digits)`;
    }

    return null;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const validationError = validateCard();
    if (validationError) {
      setPaymentError(validationError);
      return;
    }

    setIsProcessing(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiBase}/invoices/guest/${token}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
          expiryMonth: cardDetails.expiryMonth.padStart(2, '0'),
          expiryYear: '20' + cardDetails.expiryYear,
          cvv: cardDetails.cvv,
          cardholderName: cardDetails.cardholderName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.responseText || 'Payment failed');
      }

      if (data.status === 'paid' || data.authorised) {
        setPaymentSuccess(true);
        setShowPaymentForm(false);
        // Reload invoice to get updated status
        loadInvoice();
      } else {
        throw new Error(data.responseText || 'Payment was declined');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
          <div className="alert alert-success mb-4">
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
                onClick={() => setShowPaymentForm(true)}
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

                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Name on card"
                    value={cardDetails.cardholderName}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                    disabled={isProcessing}
                    autoComplete="cc-name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <div className="card-input-wrapper">
                    <input
                      type="text"
                      className="form-input card-number-input"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      disabled={isProcessing}
                      autoComplete="cc-number"
                      inputMode="numeric"
                    />
                    {cardType && (
                      <span className={`card-type-badge ${cardType}`}>
                        {cardType.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <div className="expiry-inputs">
                      <input
                        type="text"
                        className="form-input expiry-input"
                        placeholder="MM"
                        value={cardDetails.expiryMonth}
                        onChange={(e) => handleExpiryChange('expiryMonth', e.target.value)}
                        disabled={isProcessing}
                        autoComplete="cc-exp-month"
                        inputMode="numeric"
                        maxLength={2}
                      />
                      <span className="expiry-separator">/</span>
                      <input
                        type="text"
                        className="form-input expiry-input"
                        placeholder="YY"
                        value={cardDetails.expiryYear}
                        onChange={(e) => handleExpiryChange('expiryYear', e.target.value)}
                        disabled={isProcessing}
                        autoComplete="cc-exp-year"
                        inputMode="numeric"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      type="text"
                      className="form-input cvv-input"
                      placeholder={cardType === 'amex' ? '1234' : '123'}
                      value={cardDetails.cvv}
                      onChange={handleCvvChange}
                      disabled={isProcessing}
                      autoComplete="cc-csc"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="payment-security">
                  <Lock size={14} />
                  <span>Your payment is secured with 256-bit encryption</span>
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
                    disabled={isProcessing}
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
