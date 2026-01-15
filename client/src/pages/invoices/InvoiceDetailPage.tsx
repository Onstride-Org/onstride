import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoicesApi } from '../../services/api';
import { Invoice, InvoiceStatus } from '../../types';
import { format } from 'date-fns';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const getStatusBadge = (status: InvoiceStatus) => {
    const styles: Record<InvoiceStatus, string> = {
      pending: 'warning',
      processing: 'info',
      paid: 'success',
      failed: 'error',
      cancelled: 'neutral',
    };
    return styles[status] || 'neutral';
  };

  const handleMarkPaid = async () => {
    if (!id || !invoice) return;
    try {
      await invoicesApi.markPaid(id, { method: 'other' });
      loadInvoice();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
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
            {invoice.status === 'pending' && (
              <>
                <button className="btn btn-primary" onClick={handleMarkPaid}>
                  Mark as Paid
                </button>
                <button className="btn btn-outline btn-danger" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

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
                    <tr>
                      <td colSpan={4} className="text-right">Processing Fee</td>
                      <td>${invoice.paymentBreakdown.stripeFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="text-right font-bold">Total</td>
                      <td className="font-bold">${invoice.paymentBreakdown.total.toFixed(2)}</td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
