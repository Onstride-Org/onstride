import { useState, useMemo } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { Building2 } from 'lucide-react';
import ValidationAlert from '../ValidationAlert';

interface BusinessInfoStepProps {
  application: MerchantApplicationData;
  onSave: (data: Partial<MerchantApplicationData>, goToNext?: boolean) => Promise<void>;
  isSaving?: boolean;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const BUSINESS_TYPES = [
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'nonprofit_501c3', label: 'Nonprofit 501(c)(3)' },
  { value: 'government', label: 'Government' },
  { value: 'publicly_traded', label: 'Publicly Traded' },
];

const EIN_MAX_DIGITS = 9;

/** Format EIN as XX-XXXXXXX; only digits, max 9, hyphen after 2. */
function formatEIN(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, EIN_MAX_DIGITS);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

export default function BusinessInfoStep({
  application,
  onSave,
}: BusinessInfoStepProps) {
  const [formData, setFormData] = useState({
    legalName: application.merchantInfo?.legalName || '',
    tradingName: application.merchantInfo?.tradingName || '',
    businessType: application.merchantInfo?.businessType || '',
    tickerSymbol: application.merchantInfo?.tickerSymbol || '',
    locationStreet: application.merchantInfo?.locationAddress?.street || '',
    locationCity: application.merchantInfo?.locationAddress?.city || '',
    locationState: application.merchantInfo?.locationAddress?.state || '',
    locationZipCode: application.merchantInfo?.locationAddress?.zipCode || '',
    postalSameAsLocation: application.merchantInfo?.postalSameAsLocation ?? true,
    postalStreet: application.merchantInfo?.postalAddress?.street || '',
    postalCity: application.merchantInfo?.postalAddress?.city || '',
    postalState: application.merchantInfo?.postalAddress?.state || '',
    postalZipCode: application.merchantInfo?.postalAddress?.zipCode || '',
    email: application.merchantInfo?.email || '',
    phone: application.merchantInfo?.phone || '',
    website: application.merchantInfo?.website || '',
    einTin: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === 'einTin') {
      setFormData(prev => ({ ...prev, einTin: formatEIN(value) }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBlur = () => {
    // Auto-save on blur
    const merchantInfo: any = {
      legalName: formData.legalName,
      tradingName: formData.tradingName,
      businessType: formData.businessType,
      tickerSymbol: formData.tickerSymbol,
      locationAddress: {
        street: formData.locationStreet,
        city: formData.locationCity,
        state: formData.locationState,
        zipCode: formData.locationZipCode,
      },
      postalSameAsLocation: formData.postalSameAsLocation,
      postalAddress: formData.postalSameAsLocation
        ? {
            street: formData.locationStreet,
            city: formData.locationCity,
            state: formData.locationState,
            zipCode: formData.locationZipCode,
          }
        : {
            street: formData.postalStreet,
            city: formData.postalCity,
            state: formData.postalState,
            zipCode: formData.postalZipCode,
          },
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
    };

    const updates: any = { merchantInfo };

    // Only include EIN if provided (don't send empty string); send digits only
    const einDigits = formData.einTin.replace(/\D/g, '');
    if (einDigits.length === EIN_MAX_DIGITS) {
      updates.einTin = einDigits;
    }

    onSave(updates);
  };

  // Compute missing required fields
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!formData.legalName) missing.push('Legal Business Name');
    if (!formData.businessType) missing.push('Business Type');
    if (!formData.einTin && !application.merchantInfo?.einTinMasked) missing.push('EIN / Tax ID');
    if (!formData.locationStreet) missing.push('Street Address');
    if (!formData.locationCity) missing.push('City');
    if (!formData.locationState) missing.push('State');
    if (!formData.locationZipCode) missing.push('ZIP Code');
    if (!formData.email) missing.push('Business Email');
    if (!formData.phone) missing.push('Business Phone');
    return missing;
  }, [formData, application.merchantInfo?.einTinMasked]);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <Building2 size={24} />
        <div>
          <h3>Business Information</h3>
          <p>Enter your business details as they appear on legal documents</p>
        </div>
      </div>

      <ValidationAlert missingFields={missingFields} />

      <div className="form-section">
        <h4>Business Details</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Legal Business Name *</label>
            <input
              type="text"
              name="legalName"
              className="form-input"
              value={formData.legalName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Legal name as registered"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Trading Name (DBA)</label>
            <input
              type="text"
              name="tradingName"
              className="form-input"
              value={formData.tradingName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Doing Business As (if different)"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Business Type *</label>
            <select
              name="businessType"
              className="form-select"
              value={formData.businessType}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">Select business type...</option>
              {BUSINESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          {formData.businessType === 'publicly_traded' && (
            <div className="form-group">
              <label className="form-label">Ticker Symbol</label>
              <input
                type="text"
                name="tickerSymbol"
                className="form-input"
                value={formData.tickerSymbol}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., AAPL"
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">EIN / Tax ID *</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              name="einTin"
              className="form-input"
              value={formData.einTin}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={application.merchantInfo?.einTinMasked || 'XX-XXXXXXX'}
              maxLength={10}
            />
            {application.merchantInfo?.einTinMasked && (
              <p className="form-hint">Current: {application.merchantInfo.einTinMasked}</p>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Physical Location Address</h4>
        <p className="section-hint">No PO Box - must be the actual business location</p>

        <div className="form-group">
          <label className="form-label">Street Address *</label>
          <input
            type="text"
            name="locationStreet"
            className="form-input"
            value={formData.locationStreet}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="123 Main Street"
            required
          />
        </div>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="form-label">City *</label>
            <input
              type="text"
              name="locationCity"
              className="form-input"
              value={formData.locationCity}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">State *</label>
            <select
              name="locationState"
              className="form-select"
              value={formData.locationState}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">Select state...</option>
              {US_STATES.map(state => (
                <option key={state.value} value={state.value}>{state.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">ZIP Code *</label>
            <input
              type="text"
              name="locationZipCode"
              className="form-input"
              value={formData.locationZipCode}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="12345"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Mailing Address</h4>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="postalSameAsLocation"
              checked={formData.postalSameAsLocation}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <span>Same as physical location</span>
          </label>
        </div>

        {!formData.postalSameAsLocation && (
          <>
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                name="postalStreet"
                className="form-input"
                value={formData.postalStreet}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>

            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="postalCity"
                  className="form-input"
                  value={formData.postalCity}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <select
                  name="postalState"
                  className="form-select"
                  value={formData.postalState}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select state...</option>
                  {US_STATES.map(state => (
                    <option key={state.value} value={state.value}>{state.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">ZIP Code</label>
                <input
                  type="text"
                  name="postalZipCode"
                  className="form-input"
                  value={formData.postalZipCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="form-section">
        <h4>Contact Information</h4>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="form-label">Business Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="contact@yourbarn.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Business Phone *</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="(555) 123-4567"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="url"
              name="website"
              className="form-input"
              value={formData.website}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="https://yourbarn.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
