import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { invoicesApi } from '../../services/api';
import { Invoice, InvoiceStatus } from '../../types';
import { format } from 'date-fns';
import { CreditCard, DollarSign, RefreshCw, X } from 'lucide-react';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const loadInvoice = async () => {
    if (!id) return;
    try {
      const response = await invoicesApi.getById(id);
      setInvoice(response);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      navigate('/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  // Check payment status on return from Windcave
  useEffect(() => {
    const status = searchParams.get('status');
    if (status && id) {
      // Poll for payment status after returning from Windcave
      const checkPaymentStatus = async () => {
        try {
          const result = await invoicesApi.getPaymentStatus(id);
          if (result.status === 'paid') {
            setPaymentError(null);
          } else if (result.status === 'failed') {
            setPaymentError(result.transaction?.responseText || 'Payment failed');
          }
          loadInvoice();
        } catch (error) {
          console.error('Failed to check payment status:', error);
        }
      };
      checkPaymentStatus();
    }
  }, [searchParams, id]);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const getStatusBadge = (status: InvoiceStatus | 'refunded') => {
    const styles: Record<InvoiceStatus | 'refunded', string> = {
      pending: 'warning',
      processing: 'info',
      paid: 'success',
      failed: 'error',
      cancelled: 'neutral',
      refunded: 'neutral',
    };
    return styles[status] || 'neutral';
  };

  // Handle card payment via Windcave
  const handleCardPayment = async () => {
    if (!id || !invoice) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const returnUrl = window.location.href.split('?')[0]; // Current page without params
      const result = await invoicesApi.processPayment(id, {
        method: 'card',
        returnUrl,
      });

      if (result.paymentSession?.redirectUrl) {
        // Redirect to Windcave hosted payment page
        window.location.href = result.paymentSession.redirectUrl;
      } else {
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to process payment:', error);
      setPaymentError(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual payment (cash/check) - staff only
  const handleManualPayment = async (method: 'cash' | 'check' | 'other') => {
    if (!id || !invoice) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      await invoicesApi.processPayment(id, { method });
      setShowPaymentOptions(false);
      loadInvoice();
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      setPaymentError(error.response?.data?.error || 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleCancel = async () => {
    if (!id || !invoice) return;
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await invoicesApi.cancel(id);
      loadInvoice();
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
    }
  };

  const handleRefund = async () => {
    if (!id || !invoice) return;
    if (!confirm('Are you sure you want to refund this invoice?')) return;
    setIsProcessing(true);

    try {
      await invoicesApi.refund(id);
      loadInvoice();
    } catch (error: any) {
      console.error('Failed to refund invoice:', error);
      setPaymentError(error.response?.data?.error || 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Invoice not found</h3>
          <Link to="/invoices" className="btn btn-primary">Back to Invoices</Link>
        </div>
      </div>
    );
  }

  const total = invoice.charges.reduce((sum, charge) => sum + charge.amount * charge.quantity, 0);

  return (
    <div className="page invoice-detail-page">
      {/* Header */}
      <div className="detail-header">
        <Link to="/invoices" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Invoices
        </Link>

        <div className="detail-header-content">
          <div className="detail-info">
            <h1 className="detail-title">Invoice for {invoice.boarder?.name}</h1>
            <p className="detail-subtitle">
              Created {format(new Date(invoice.createdAt), 'MMMM d, yyyy')}
            </p>
            <span className={`badge badge-${getStatusBadge(invoice.status)}`}>
              {invoice.status}
            </span>
          </div>
          <div className="detail-actions">
            {(invoice.status === 'pending' || invoice.status === 'failed') && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleCardPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner spinner-sm"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay with Card
                    </>
                  )}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowPaymentOptions(true)}
                  disabled={isProcessing}
                >
                  <DollarSign size={18} />
                  Record Payment
                </button>
                <button className="btn btn-outline btn-danger" onClick={handleCancel}>
                  <X size={18} />
                  Cancel
                </button>
              </>
            )}
            {invoice.status === 'processing' && (
              <button
                className="btn btn-outline"
                onClick={loadInvoice}
                disabled={isProcessing}
              >
                <RefreshCw size={18} />
                Check Status
              </button>
            )}
            {invoice.status === 'paid' && (invoice as any).windcavePaymentInfo?.transactionId && (
              <button
                className="btn btn-outline btn-danger"
                onClick={handleRefund}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Issue Refund'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {paymentError && (
        <div className="alert alert-error mb-4">
          <span>{paymentError}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setPaymentError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Processing Status */}
      {invoice.status === 'processing' && (
        <div className="alert alert-info mb-4">
          <span>Payment is being processed. This may take a few moments.</span>
        </div>
      )}

      <div className="invoice-content">
        {/* Invoice Info */}
        <div className="card">
          <h3 className="card-title">Invoice Details</h3>
          <dl className="detail-list">
            <dt>Boarder</dt>
            <dd>{invoice.boarder?.name || 'Unknown'}</dd>

            {invoice.horse && (
              <>
                <dt>Horse</dt>
                <dd>{invoice.horse.name}</dd>
              </>
            )}

            <dt>Due Date</dt>
            <dd>{format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</dd>

            {invoice.method && (
              <>
                <dt>Payment Method</dt>
                <dd>{invoice.method}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Charges */}
        <div className="card">
          <h3 className="card-title">Charges</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.charges.map((charge, index) => (
                  <tr key={charge.id || index}>
                    <td>{charge.description}</td>
                    <td>
                      <span className="badge badge-outline">{charge.type}</span>
                    </td>
                    <td>{charge.quantity}</td>
                    <td>${charge.amount.toFixed(2)}</td>
                    <td className="font-medium">
                      ${(charge.amount * charge.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="text-right font-medium">Subtotal</td>
                  <td className="font-medium">${total.toFixed(2)}</td>
                </tr>
                {invoice.paymentBreakdown && (
                  <>
                    {(invoice.paymentBreakdown.processingFee || invoice.paymentBreakdown.stripeFee) && (
                      <tr>
                        <td colSpan={4} className="text-right text-muted">Processing Fee (internal)</td>
                        <td className="text-muted">
                          ${(invoice.paymentBreakdown.processingFee || invoice.paymentBreakdown.stripeFee || 0).toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} className="text-right font-bold">Total Due</td>
                      <td className="font-bold">${invoice.paymentBreakdown.total.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Payment Options Modal */}
      {showPaymentOptions && (
        <div className="modal-overlay" onClick={() => setShowPaymentOptions(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Record Payment</h2>
              <button className="btn btn-ghost modal-close" onClick={() => setShowPaymentOptions(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-muted mb-4">Select the payment method used:</p>
              <div className="space-y-3">
                <button
                  className="btn btn-outline w-full justify-start"
                  onClick={() => handleManualPayment('cash')}
                  disabled={isProcessing}
                >
                  <DollarSign size={18} />
                  Cash
                </button>
                <button
                  className="btn btn-outline w-full justify-start"
                  onClick={() => handleManualPayment('check')}
                  disabled={isProcessing}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <line x1="6" y1="12" x2="18" y2="12" />
                  </svg>
                  Check
                </button>
                <button
                  className="btn btn-outline w-full justify-start"
                  onClick={() => handleManualPayment('other')}
                  disabled={isProcessing}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  Other
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
