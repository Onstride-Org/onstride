import { useState, useMemo } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { FileText, AlertCircle } from 'lucide-react';
import ValidationAlert from '../ValidationAlert';

interface BusinessDetailsStepProps {
  application: MerchantApplicationData;
  onSave: (data: Partial<MerchantApplicationData>, goToNext?: boolean) => Promise<void>;
  isSaving?: boolean;
}

const NATURE_OF_BUSINESS = [
  { value: 'administrative', label: 'Administrative' },
  { value: 'arts_recreation', label: 'Arts & Recreation' },
  { value: 'construction', label: 'Construction' },
  { value: 'education', label: 'Education' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'food_services', label: 'Food Services' },
  { value: 'health_care', label: 'Health Care' },
  { value: 'hospitality_lodging', label: 'Hospitality & Lodging' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media' },
  { value: 'parking_car_wash', label: 'Parking / Car Wash' },
  { value: 'retail', label: 'Retail' },
  { value: 'technical_services', label: 'Technical Services' },
  { value: 'utility_services', label: 'Utility Services' },
  { value: 'wholesale', label: 'Wholesale' },
];

export default function BusinessDetailsStep({
  application,
  onSave,
}: BusinessDetailsStepProps) {
  const [formData, setFormData] = useState({
    description: application.businessDescription?.description || 'Equine boarding, training, lessons, and related services',
    natureOfBusiness: application.businessDescription?.natureOfBusiness || 'arts_recreation',
    legalActionByRegulator: application.businessDescription?.legalActionByRegulator || false,
    legalActionExplanation: application.businessDescription?.legalActionExplanation || '',
    finedByCardNetwork: application.businessDescription?.finedByCardNetwork || false,
    fineExplanation: application.businessDescription?.fineExplanation || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBlur = () => {
    onSave({
      businessDescription: {
        description: formData.description,
        natureOfBusiness: formData.natureOfBusiness,
        legalActionByRegulator: formData.legalActionByRegulator,
        legalActionExplanation: formData.legalActionExplanation,
        finedByCardNetwork: formData.finedByCardNetwork,
        fineExplanation: formData.fineExplanation,
      },
    });
  };

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!formData.description) missing.push('Description of Services');
    if (!formData.natureOfBusiness) missing.push('Nature of Business');
    if (formData.legalActionByRegulator && !formData.legalActionExplanation) {
      missing.push('Legal Action Explanation');
    }
    if (formData.finedByCardNetwork && !formData.fineExplanation) {
      missing.push('Card Network Fine Explanation');
    }
    return missing;
  }, [formData]);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <FileText size={24} />
        <div>
          <h3>Business Details</h3>
          <p>Describe your business and compliance history</p>
        </div>
      </div>

      <ValidationAlert missingFields={missingFields} />

      <div className="form-section">
        <h4>Business Description</h4>

        <div className="form-group">
          <label className="form-label">Description of Services *</label>
          <textarea
            name="description"
            className="form-textarea"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            rows={3}
            placeholder="Describe the products/services your business offers..."
          />
          <p className="form-hint">
            Pre-filled for equine services. Modify if your business offers additional services.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Nature of Business *</label>
          <select
            name="natureOfBusiness"
            className="form-select"
            value={formData.natureOfBusiness}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            {NATURE_OF_BUSINESS.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <p className="form-hint">
            "Arts & Recreation" is typically appropriate for equine businesses
          </p>
        </div>
      </div>

      <div className="form-section">
        <h4>Compliance History</h4>
        <p className="section-hint">
          Please answer these questions honestly. A "Yes" answer does not automatically
          disqualify your application.
        </p>

        <div className="compliance-question">
          <div className="form-group">
            <label className="form-label">
              Has your business ever had legal action taken against it by a federal or state regulator?
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="legalActionByRegulator"
                  value="false"
                  checked={!formData.legalActionByRegulator}
                  onChange={() => setFormData(prev => ({ ...prev, legalActionByRegulator: false }))}
                  onBlur={handleBlur}
                />
                <span>No</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="legalActionByRegulator"
                  value="true"
                  checked={formData.legalActionByRegulator}
                  onChange={() => setFormData(prev => ({ ...prev, legalActionByRegulator: true }))}
                  onBlur={handleBlur}
                />
                <span>Yes</span>
              </label>
            </div>
          </div>

          {formData.legalActionByRegulator && (
            <div className="form-group conditional-field">
              <label className="form-label">Please explain:</label>
              <textarea
                name="legalActionExplanation"
                className="form-textarea"
                value={formData.legalActionExplanation}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                placeholder="Provide details about the legal action..."
              />
            </div>
          )}
        </div>

        <div className="compliance-question">
          <div className="form-group">
            <label className="form-label">
              Has your business or any principal ever been placed on a card network's monitoring program
              or been fined by a card network?
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="finedByCardNetwork"
                  value="false"
                  checked={!formData.finedByCardNetwork}
                  onChange={() => setFormData(prev => ({ ...prev, finedByCardNetwork: false }))}
                  onBlur={handleBlur}
                />
                <span>No</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="finedByCardNetwork"
                  value="true"
                  checked={formData.finedByCardNetwork}
                  onChange={() => setFormData(prev => ({ ...prev, finedByCardNetwork: true }))}
                  onBlur={handleBlur}
                />
                <span>Yes</span>
              </label>
            </div>
          </div>

          {formData.finedByCardNetwork && (
            <div className="form-group conditional-field">
              <label className="form-label">Please explain:</label>
              <textarea
                name="fineExplanation"
                className="form-textarea"
                value={formData.fineExplanation}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                placeholder="Provide details about the fine or monitoring program..."
              />
            </div>
          )}
        </div>
      </div>

      <div className="info-box">
        <AlertCircle size={20} />
        <div>
          <strong>Note:</strong> Most equine businesses do not have any compliance issues.
          If you're unsure about any question, contact support@onstride.app for guidance.
        </div>
      </div>
    </div>
  );
}
