import { useState, useMemo } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { Landmark, Info, Shield } from 'lucide-react';
import ValidationAlert from '../ValidationAlert';

interface BankAccountStepProps {
  application: MerchantApplicationData;
  onSave: (data: Partial<MerchantApplicationData>, goToNext?: boolean) => Promise<void>;
  isSaving?: boolean;
}

export default function BankAccountStep({
  application,
  onSave,
}: BankAccountStepProps) {
  const [formData, setFormData] = useState({
    accountType: application.bankAccount?.accountType || 'checking',
    bankName: application.bankAccount?.bankName || '',
    routingNumber: '',
    accountNumber: '',
    confirmAccountNumber: '',
    bankContactName: application.bankAccount?.bankContactName || '',
    bankContactPhone: application.bankAccount?.bankContactPhone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateRoutingNumber = (routing: string) => {
    // Basic validation: 9 digits
    if (!/^\d{9}$/.test(routing)) {
      return 'Routing number must be 9 digits';
    }
    return '';
  };

  const validateAccountNumber = (account: string) => {
    // Account numbers are typically 4-17 digits
    if (!/^\d{4,17}$/.test(account)) {
      return 'Account number must be 4-17 digits';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Only allow numbers for routing and account numbers
    if (name === 'routingNumber' || name === 'accountNumber' || name === 'confirmAccountNumber') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = () => {
    const newErrors: Record<string, string> = {};

    if (formData.routingNumber) {
      const routingError = validateRoutingNumber(formData.routingNumber);
      if (routingError) newErrors.routingNumber = routingError;
    }

    if (formData.accountNumber) {
      const accountError = validateAccountNumber(formData.accountNumber);
      if (accountError) newErrors.accountNumber = accountError;
    }

    if (formData.accountNumber && formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    setErrors(newErrors);

    // Always save basic bank info
    const updates: any = {
      bankAccount: {
        accountType: formData.accountType,
        bankName: formData.bankName,
        bankContactName: formData.bankContactName,
        bankContactPhone: formData.bankContactPhone,
      },
    };

    // Only include sensitive fields if valid
    if (formData.routingNumber && !newErrors.routingNumber) {
      updates.routingNumber = formData.routingNumber;
    }
    // Only save account number if it matches confirmation and is valid
    if (formData.accountNumber &&
        formData.accountNumber === formData.confirmAccountNumber &&
        !newErrors.accountNumber) {
      updates.accountNumber = formData.accountNumber;
    }

    onSave(updates);
  };

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!formData.bankName) missing.push('Bank Name');
    if (!formData.routingNumber && !(application.bankAccount as any)?.routingNumberProvided) missing.push('Routing Number');
    if (!formData.accountNumber && !(application.bankAccount as any)?.accountNumberProvided) missing.push('Account Number');
    if (formData.accountNumber && formData.accountNumber !== formData.confirmAccountNumber) {
      missing.push('Account Numbers must match');
    }
    return missing;
  }, [formData, application.bankAccount]);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <Landmark size={24} />
        <div>
          <h3>Bank Account Information</h3>
          <p>Enter your bank account details for payment settlements</p>
        </div>
      </div>

      <ValidationAlert missingFields={missingFields} />

      <div className="info-box info-box-info">
        <Shield size={20} />
        <div>
          <strong>Secure Information:</strong> Your bank account details are encrypted and
          stored securely. Funds from customer payments will be deposited into this account.
        </div>
      </div>

      <div className="form-section">
        <h4>Account Details</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Account Type *</label>
            <select
              name="accountType"
              className="form-select"
              value={formData.accountType}
              onChange={handleChange}
              onBlur={handleBlur}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Bank Name *</label>
            <input
              type="text"
              name="bankName"
              className="form-input"
              value={formData.bankName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Chase, Bank of America"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Routing Number *</label>
            <input
              type="text"
              name="routingNumber"
              className={`form-input ${errors.routingNumber ? 'input-error' : ''}`}
              value={formData.routingNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={application.bankAccount?.accountNumberMasked ? '****' : '9 digits'}
              maxLength={9}
              required
            />
            {errors.routingNumber && (
              <p className="form-error">{errors.routingNumber}</p>
            )}
            <p className="form-hint">9-digit number found at the bottom of your check</p>
          </div>
          <div className="form-group">
            <label className="form-label">Account Number *</label>
            <input
              type="password"
              name="accountNumber"
              className={`form-input ${errors.accountNumber ? 'input-error' : ''}`}
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={application.bankAccount?.accountNumberMasked || 'Account number'}
              required
            />
            {errors.accountNumber && (
              <p className="form-error">{errors.accountNumber}</p>
            )}
            {application.bankAccount?.accountNumberMasked && (
              <p className="form-hint">Current: {application.bankAccount.accountNumberMasked}</p>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Account Number *</label>
          <input
            type="password"
            name="confirmAccountNumber"
            className={`form-input ${errors.confirmAccountNumber ? 'input-error' : ''}`}
            value={formData.confirmAccountNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Re-enter account number"
            required
          />
          {errors.confirmAccountNumber && (
            <p className="form-error">{errors.confirmAccountNumber}</p>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Bank Contact (Optional)</h4>
        <p className="section-hint">
          Provide a contact at your bank who can verify account information if needed
        </p>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Contact Name</label>
            <input
              type="text"
              name="bankContactName"
              className="form-input"
              value={formData.bankContactName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Bank representative name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="tel"
              name="bankContactPhone"
              className="form-input"
              value={formData.bankContactPhone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      <div className="bank-check-diagram">
        <Info size={20} />
        <div>
          <strong>Finding Your Numbers:</strong>
          <p>
            At the bottom of a check, the routing number is the first 9 digits,
            followed by your account number, then the check number.
          </p>
          <div className="check-visual">
            <div className="check-number-group">
              <span className="check-number routing">123456789</span>
              <span className="check-label">Routing #</span>
            </div>
            <div className="check-number-group">
              <span className="check-number account">9876543210</span>
              <span className="check-label">Account #</span>
            </div>
            <div className="check-number-group">
              <span className="check-number check-num">1001</span>
              <span className="check-label">Check #</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
