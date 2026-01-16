import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoicesApi, usersApi, horsesApi } from '../../services/api';
import { Invoice, InvoiceStatus, User, Horse } from '../../types';
import { format } from 'date-fns';
import { Plus, FileText, X } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await invoicesApi.getAll(params);
      setInvoices(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [pagination.page, statusFilter]);

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

  return (
    <div className="page invoices-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{pagination.total} total invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="page-filters">
        <div className="filter-tabs">
          {(['all', 'pending', 'processing', 'paid', 'failed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={64} strokeWidth={1.5} />
          </div>
          <h3>No invoices found</h3>
          <p>
            {statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first invoice to get started'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Boarder</th>
                  <th>Horse</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <span className="font-medium">{invoice.boarder?.name || 'Unknown'}</span>
                    </td>
                    <td>{invoice.horse?.name || '-'}</td>
                    <td className="font-medium">${invoice.subtotal.toFixed(2)}</td>
                    <td>{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</td>
                    <td>
                      <span className={`badge badge-${getStatusBadge(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</td>
                    <td>
                      <Link to={`/invoices/${invoice.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadInvoices();
          }}
        />
      )}
    </div>
  );
}

function CreateInvoiceModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [boarderId, setBoarderId] = useState('');
  const [horseId, setHorseId] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [charges, setCharges] = useState([{ description: '', amount: '', quantity: '1', type: 'board' as const }]);
  const [users, setUsers] = useState<User[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, horsesRes] = await Promise.all([
          usersApi.getAll({ limit: 100 }),
          horsesApi.getAll({ limit: 100 })
        ]);
        setUsers(usersRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const addCharge = () => {
    setCharges([...charges, { description: '', amount: '', quantity: '1', type: 'board' }]);
  };

  const removeCharge = (index: number) => {
    setCharges(charges.filter((_, i) => i !== index));
  };

  const updateCharge = (index: number, field: string, value: string) => {
    const updated = [...charges];
    (updated[index] as any)[field] = value;
    setCharges(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!boarderId) {
      setError('Please select a user');
      return;
    }

    setIsLoading(true);

    try {
      await invoicesApi.create({
        boarderId,
        horseId: horseId || undefined,
        dueDate,
        charges: charges.map((c) => ({
          description: c.description,
          amount: parseFloat(c.amount),
          quantity: parseInt(c.quantity),
          type: c.type,
        })),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Invoice</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            {isLoadingData ? (
              <div className="page-loading">
                <div className="spinner spinner-lg"></div>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bill To *</label>
                    <select
                      className="form-select"
                      value={boarderId}
                      onChange={(e) => setBoarderId(e.target.value)}
                      required
                    >
                      <option value="">Select a user...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.accountType}) - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Related Horse (Optional)</label>
                  <select
                    className="form-select"
                    value={horseId}
                    onChange={(e) => setHorseId(e.target.value)}
                  >
                    <option value="">No specific horse</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>
                        {horse.name} {horse.breed?.label ? `(${horse.breed.label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Charges</label>
                  {charges.map((charge, index) => (
                    <div key={index} className="charge-row">
                      <input
                        type="text"
                        className="form-input"
                        value={charge.description}
                        onChange={(e) => updateCharge(index, 'description', e.target.value)}
                        placeholder="Description"
                        required
                      />
                      <input
                        type="number"
                        className="form-input"
                        value={charge.amount}
                        onChange={(e) => updateCharge(index, 'amount', e.target.value)}
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                        required
                      />
                      <input
                        type="number"
                        className="form-input"
                        value={charge.quantity}
                        onChange={(e) => updateCharge(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        min="1"
                        required
                      />
                      <select
                        className="form-select"
                        value={charge.type}
                        onChange={(e) => updateCharge(index, 'type', e.target.value)}
                      >
                        <option value="board">Board</option>
                        <option value="lesson">Lesson</option>
                        <option value="training">Training</option>
                        <option value="farrier">Farrier</option>
                        <option value="vet">Vet</option>
                        <option value="feed">Feed</option>
                        <option value="supplies">Supplies</option>
                        <option value="service">Service</option>
                        <option value="other">Other</option>
                      </select>
                      {charges.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-danger"
                          onClick={() => removeCharge(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline btn-sm" onClick={addCharge}>
                    Add Charge
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || isLoadingData}>
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
