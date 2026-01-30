import { useState, useMemo } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { CreditCard, Info } from 'lucide-react';
import ValidationAlert from '../ValidationAlert';

interface TransactionDetailsStepProps {
  application: MerchantApplicationData;
  onSave: (data: Partial<MerchantApplicationData>, goToNext?: boolean) => Promise<void>;
  isSaving?: boolean;
}

export default function TransactionDetailsStep({
  application,
  onSave,
}: TransactionDetailsStepProps) {
  const [formData, setFormData] = useState({
    averageTicket: application.transactionDetails?.averageTicket || 500,
    highTicket: application.transactionDetails?.highTicket || 5000,
    monthlyCardVolume: application.transactionDetails?.monthlyCardVolume || 10000,
    hasFutureDatedEvents: application.transactionDetails?.hasFutureDatedEvents ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleBlur = () => {
    onSave({
      transactionDetails: {
        averageTicket: formData.averageTicket,
        highTicket: formData.highTicket,
        monthlyCardVolume: formData.monthlyCardVolume,
        hasFutureDatedEvents: formData.hasFutureDatedEvents,
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!formData.averageTicket || formData.averageTicket <= 0) missing.push('Average Transaction Amount');
    if (!formData.highTicket || formData.highTicket <= 0) missing.push('Highest Expected Transaction');
    if (!formData.monthlyCardVolume || formData.monthlyCardVolume <= 0) missing.push('Monthly Card Volume');
    return missing;
  }, [formData]);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <CreditCard size={24} />
        <div>
          <h3>Transaction Details</h3>
          <p>Estimate your typical transaction amounts and volume</p>
        </div>
      </div>

      <ValidationAlert missingFields={missingFields} />

      <div className="info-box info-box-info">
        <Info size={20} />
        <div>
          <strong>Pre-filled Estimates:</strong> These values are typical for equine businesses.
          Adjust them based on your actual expected billing amounts.
        </div>
      </div>

      <div className="form-section">
        <h4>Transaction Amounts</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Average Transaction Amount *</label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="number"
                name="averageTicket"
                className="form-input"
                value={formData.averageTicket}
                onChange={handleChange}
                onBlur={handleBlur}
                min={0}
                step={50}
              />
            </div>
            <p className="form-hint">
              Your typical monthly board or lesson invoice amount
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Highest Expected Transaction *</label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="number"
                name="highTicket"
                className="form-input"
                value={formData.highTicket}
                onChange={handleChange}
                onBlur={handleBlur}
                min={0}
                step={100}
              />
            </div>
            <p className="form-hint">
              Largest single payment you might receive (e.g., multi-month prepay, training package)
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Estimated Monthly Card Volume *</label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              name="monthlyCardVolume"
              className="form-input"
              value={formData.monthlyCardVolume}
              onChange={handleChange}
              onBlur={handleBlur}
              min={0}
              step={1000}
            />
          </div>
          <p className="form-hint">
            Total amount you expect to collect via card payments per month
          </p>
        </div>
      </div>

      <div className="form-section">
        <h4>Payment Timing</h4>

        <div className="form-group">
          <label className="form-label">
            Do you accept deposits or payments for future-dated services?
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="hasFutureDatedEvents"
                checked={formData.hasFutureDatedEvents}
                onChange={() => setFormData(prev => ({ ...prev, hasFutureDatedEvents: true }))}
                onBlur={handleBlur}
              />
              <span>Yes</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="hasFutureDatedEvents"
                checked={!formData.hasFutureDatedEvents}
                onChange={() => setFormData(prev => ({ ...prev, hasFutureDatedEvents: false }))}
                onBlur={handleBlur}
              />
              <span>No</span>
            </label>
          </div>
          <p className="form-hint">
            Examples: Prepaid board, training program deposits, lesson packages
          </p>
        </div>
      </div>

      <div className="transaction-summary">
        <h4>Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Average Transaction</span>
            <span className="summary-value">{formatCurrency(formData.averageTicket)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">High Transaction</span>
            <span className="summary-value">{formatCurrency(formData.highTicket)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Monthly Volume</span>
            <span className="summary-value">{formatCurrency(formData.monthlyCardVolume)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Annual Estimate</span>
            <span className="summary-value">{formatCurrency(formData.monthlyCardVolume * 12)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
