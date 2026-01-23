import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoicesApi, usersApi, horsesApi, billingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Invoice, InvoiceStatus, User, Horse, BillingTemplate, ChargeType } from '../../types';
import { format } from 'date-fns';
import { Plus, FileText, X, ChevronRight, Calendar } from 'lucide-react';
import FilterTabs from '../../components/FilterTabs';

export default function InvoicesPage() {
  const { currentBarnRole } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check if user is staff
  const isStaff = currentBarnRole && !['boarder'].includes(currentBarnRole.role);

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
      refunded: 'neutral',
    };
    return styles[status] || 'neutral';
  };

  return (
    <div className="page invoices-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isStaff ? 'Invoices' : 'My Invoices'}</h1>
          <p className="page-subtitle">{pagination.total} total invoice{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} />
            Create Invoice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="page-filters">
        <FilterTabs
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'paid', label: 'Paid' },
            { value: 'failed', label: 'Failed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as InvoiceStatus | 'all');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          label="Filter by status"
        />
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
          <div className="invoice-cards">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="invoice-card"
              >
                <div className="invoice-card-main">
                  <div className="invoice-card-info">
                    <div className="invoice-card-header">
                      <span className="invoice-card-name">
                        {invoice.boarder?.name || 'Unknown'}
                      </span>
                      <span className={`badge badge-${getStatusBadge(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                    {invoice.horse?.name && (
                      <span className="invoice-card-horse">{invoice.horse.name}</span>
                    )}
                    <div className="invoice-card-meta">
                      <span className="invoice-card-date">
                        <Calendar size={14} />
                        Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="invoice-card-amount">
                    <span className="amount">${invoice.subtotal.toFixed(2)}</span>
                    <ChevronRight size={20} className="chevron" />
                  </div>
                </div>
              </Link>
            ))}
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
  const { user: currentUser } = useAuthStore();
  const [boarderId, setBoarderId] = useState('');
  const [horseId, setHorseId] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [charges, setCharges] = useState<Array<{ description: string; amount: string; quantity: string; type: ChargeType }>>([{ description: '', amount: '', quantity: '1', type: 'board' }]);
  const [users, setUsers] = useState<User[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [templates, setTemplates] = useState<BillingTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Filter out current user from billable users (can't bill yourself)
  const billableUsers = users.filter(user => user.id !== currentUser?.id);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, horsesRes, templatesRes] = await Promise.all([
          usersApi.getAll({ limit: 100 }),
          horsesApi.getAll({ limit: 100 }),
          billingApi.getTemplates()
        ]);
        setUsers(usersRes.data || []);
        setHorses(horsesRes.data || []);
        setTemplates(templatesRes || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find(t => (t.id || t._id) === templateId);
    if (template) {
      setCharges(template.charges.map(c => ({
        type: c.type,
        description: c.description,
        amount: c.amount.toFixed(2),
        quantity: c.quantity.toString(),
      })));
    }
  };

  const addCharge = () => {
    setCharges([...charges, { description: '', amount: '', quantity: '1', type: 'board' as ChargeType }]);
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
                      {billableUsers.map(user => (
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

                {templates.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Load from Template (Optional)</label>
                    <select
                      className="form-select"
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                    >
                      <option value="">-- Select a template to auto-fill charges --</option>
                      {templates.map(template => (
                        <option key={template.id || template._id} value={template.id || template._id}>
                          {template.name} - ${template.charges.reduce((sum, c) => sum + c.amount * c.quantity, 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <p className="form-hint">Select a template to pre-fill charges below</p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Charges</label>
                  {charges.map((charge, index) => (
                    <div key={index} className="charge-row">
                      <select
                        className="form-select charge-type"
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
                      <div className="charge-amount-wrapper">
                        <span className="charge-amount-prefix">$</span>
                        <input
                          type="text"
                          className="form-input charge-amount"
                          value={charge.amount}
                          onChange={(e) => {
                            // Allow only numbers and decimal
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            // Ensure only one decimal point
                            const parts = val.split('.');
                            const formatted = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
                            updateCharge(index, 'amount', formatted);
                          }}
                          onBlur={(e) => {
                            // Format to 2 decimal places on blur
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              updateCharge(index, 'amount', val.toFixed(2));
                            }
                          }}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        className="form-input charge-description"
                        value={charge.description}
                        onChange={(e) => updateCharge(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                      />
                      <input
                        type="number"
                        className="form-input charge-quantity"
                        value={charge.quantity}
                        onChange={(e) => updateCharge(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        min="1"
                        required
                      />
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
