import { useState, useEffect } from 'react';
import { billingApi } from '../../services/api';
import { BillingTemplate, ChargeType } from '../../types';
import { Plus, FileText, X, Edit2, Trash2, Copy, DollarSign } from 'lucide-react';

export default function BillingTemplatesPage() {
  const [templates, setTemplates] = useState<BillingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BillingTemplate | null>(null);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await billingApi.getTemplates();
      setTemplates(response || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await billingApi.deleteTemplate(id);
      loadTemplates();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleDuplicate = async (template: BillingTemplate) => {
    try {
      await billingApi.createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        charges: template.charges.map(c => ({
          type: c.type,
          description: c.description,
          amount: c.amount,
          quantity: c.quantity,
        })),
      });
      loadTemplates();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to duplicate template');
    }
  };

  return (
    <div className="page billing-templates-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing Templates</h1>
          <p className="page-subtitle">Create reusable billing templates for recurring charges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Create Template
        </button>
      </div>

      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={64} strokeWidth={1.5} />
          </div>
          <h3>No billing templates</h3>
          <p>Create your first template to speed up invoice creation</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} />
            Create Template
          </button>
        </div>
      ) : (
        <div className="template-grid">
          {templates.map((template) => (
            <div key={template.id || template._id} className="template-card">
              <div className="template-card-header">
                <div className="template-icon">
                  <DollarSign size={24} />
                </div>
                <div className="template-header-info">
                  <h3 className="template-name">{template.name}</h3>
                  {template.description && (
                    <p className="template-description">{template.description}</p>
                  )}
                </div>
              </div>

              <div className="template-card-body">
                <div className="template-charges">
                  <h4>Charges ({template.charges.length})</h4>
                  <ul className="charge-list">
                    {template.charges.slice(0, 4).map((charge, idx) => (
                      <li key={idx} className="charge-item">
                        <span className="charge-desc">
                          {charge.description}
                          {charge.quantity > 1 && ` (x${charge.quantity})`}
                        </span>
                        <span className="charge-amount">
                          ${(charge.amount * charge.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))}
                    {template.charges.length > 4 && (
                      <li className="charge-item more">
                        +{template.charges.length - 4} more charges
                      </li>
                    )}
                  </ul>
                </div>

                <div className="template-total">
                  <span>Total:</span>
                  <span className="total-amount">
                    ${template.charges.reduce((sum, c) => sum + c.amount * c.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="template-card-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingTemplate(template)}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDuplicate(template)}
                  title="Duplicate"
                >
                  <Copy size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-sm text-error"
                  onClick={() => handleDelete(template.id || template._id!)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
}

function TemplateModal({
  template,
  onClose,
  onSuccess,
}: {
  template: BillingTemplate | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [charges, setCharges] = useState<Array<{
    type: ChargeType;
    description: string;
    amount: string;
    quantity: string;
  }>>(
    template?.charges.map(c => ({
      type: c.type,
      description: c.description,
      amount: c.amount.toString(),
      quantity: c.quantity.toString(),
    })) || [{ type: 'board', description: '', amount: '', quantity: '1' }]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addCharge = () => {
    setCharges([...charges, { type: 'board', description: '', amount: '', quantity: '1' }]);
  };

  const removeCharge = (index: number) => {
    if (charges.length === 1) return;
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

    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    if (charges.some(c => !c.description || !c.amount)) {
      setError('All charges must have a description and amount');
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        charges: charges.map(c => ({
          type: c.type,
          description: c.description,
          amount: parseFloat(c.amount),
          quantity: parseInt(c.quantity) || 1,
        })),
      };

      if (template) {
        await billingApi.updateTemplate(template.id || template._id!, data);
      } else {
        await billingApi.createTemplate(data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const total = charges.reduce((sum, c) => {
    const amount = parseFloat(c.amount) || 0;
    const quantity = parseInt(c.quantity) || 1;
    return sum + amount * quantity;
  }, 0);

  const chargeTypes: { value: ChargeType; label: string }[] = [
    { value: 'board', label: 'Board' },
    { value: 'lesson', label: 'Lesson' },
    { value: 'training', label: 'Training' },
    { value: 'farrier', label: 'Farrier' },
    { value: 'vet', label: 'Vet' },
    { value: 'feed', label: 'Feed' },
    { value: 'supplies', label: 'Supplies' },
    { value: 'service', label: 'Service' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {template ? 'Edit Template' : 'Create Billing Template'}
          </h2>
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

            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Board - Full Care"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of this template..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Charges</label>
              <div className="charges-container">
                {charges.map((charge, index) => (
                  <div key={index} className="charge-row">
                    <select
                      className="form-select"
                      value={charge.type}
                      onChange={(e) => updateCharge(index, 'type', e.target.value)}
                      style={{ width: '120px' }}
                    >
                      {chargeTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-input"
                      value={charge.description}
                      onChange={(e) => updateCharge(index, 'description', e.target.value)}
                      placeholder="Description"
                      style={{ flex: 1 }}
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
                      style={{ width: '100px' }}
                      required
                    />
                    <input
                      type="number"
                      className="form-input"
                      value={charge.quantity}
                      onChange={(e) => updateCharge(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      min="1"
                      style={{ width: '70px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeCharge(index)}
                      disabled={charges.length === 1}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={addCharge}
                style={{ marginTop: '0.5rem' }}
              >
                <Plus size={16} />
                Add Charge
              </button>
            </div>

            <div className="template-summary">
              <div className="summary-row">
                <span>Total Charges:</span>
                <span className="total">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
