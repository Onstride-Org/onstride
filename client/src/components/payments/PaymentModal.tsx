import { useState } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId: string;
  amount: number;
  description?: string;
}

interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  amount,
  description,
}: PaymentModalProps) {
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateCard();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiBase}/invoices/${invoiceId}/pay-direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
        throw new Error(data.error || 'Payment failed');
      }

      if (data.status === 'paid' || data.authorised) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        throw new Error(data.responseText || 'Payment was declined');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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

              {/* Card Form */}
              <div className="payment-form">
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
