import { useState, useMemo } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { Users, Plus, Trash2, Info } from 'lucide-react';
import ValidationAlert from '../ValidationAlert';

interface OwnershipInfoStepProps {
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

interface BeneficialOwner {
  firstName: string;
  lastName: string;
  title: string;
  percentOwnership: number;
  homePhone: string;
  email: string;
  dateOfBirth: string;
  ssn: string;
  driversLicenseNumber: string;
  driversLicenseState: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

const emptyOwner: BeneficialOwner = {
  firstName: '',
  lastName: '',
  title: '',
  percentOwnership: 25,
  homePhone: '',
  email: '',
  dateOfBirth: '',
  ssn: '',
  driversLicenseNumber: '',
  driversLicenseState: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
};

export default function OwnershipInfoStep({
  application,
  onSave,
}: OwnershipInfoStepProps) {
  const [controllingPerson, setControllingPerson] = useState({
    firstName: application.controllingPerson?.firstName || '',
    lastName: application.controllingPerson?.lastName || '',
    title: application.controllingPerson?.title || '',
    percentOwnership: application.controllingPerson?.percentOwnership || 0,
    homePhone: application.controllingPerson?.homePhone || '',
    email: application.controllingPerson?.email || '',
    dateOfBirth: application.controllingPerson?.dateOfBirth || '',
    ssn: '',
    driversLicenseNumber: '',
    driversLicenseState: application.controllingPerson?.driversLicense?.state || '',
    street: application.controllingPerson?.homeAddress?.street || '',
    city: application.controllingPerson?.homeAddress?.city || '',
    state: application.controllingPerson?.homeAddress?.state || '',
    zipCode: application.controllingPerson?.homeAddress?.zipCode || '',
  });

  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>(
    application.beneficialOwners?.map(owner => ({
      firstName: owner.firstName || '',
      lastName: owner.lastName || '',
      title: owner.title || '',
      percentOwnership: owner.percentOwnership || 25,
      homePhone: owner.homePhone || '',
      email: owner.email || '',
      dateOfBirth: owner.dateOfBirth || '',
      ssn: '',
      driversLicenseNumber: '',
      driversLicenseState: owner.driversLicense?.state || '',
      street: owner.homeAddress?.street || '',
      city: owner.homeAddress?.city || '',
      state: owner.homeAddress?.state || '',
      zipCode: owner.homeAddress?.zipCode || '',
    })) || []
  );

  const handleControllingPersonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setControllingPerson(prev => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (index: number, field: string, value: string | number) => {
    setBeneficialOwners(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const addBeneficialOwner = () => {
    if (beneficialOwners.length < 4) {
      setBeneficialOwners(prev => [...prev, { ...emptyOwner }]);
    }
  };

  const removeBeneficialOwner = (index: number) => {
    setBeneficialOwners(prev => prev.filter((_, i) => i !== index));
  };

  const handleBlur = () => {
    const updates: any = {
      controllingPerson: {
        firstName: controllingPerson.firstName,
        lastName: controllingPerson.lastName,
        title: controllingPerson.title,
        percentOwnership: controllingPerson.percentOwnership,
        homePhone: controllingPerson.homePhone,
        email: controllingPerson.email,
        dateOfBirth: controllingPerson.dateOfBirth,
        driversLicense: {
          state: controllingPerson.driversLicenseState,
        },
        homeAddress: {
          street: controllingPerson.street,
          city: controllingPerson.city,
          state: controllingPerson.state,
          zipCode: controllingPerson.zipCode,
        },
      },
      beneficialOwners: beneficialOwners.map(owner => ({
        firstName: owner.firstName,
        lastName: owner.lastName,
        title: owner.title,
        percentOwnership: owner.percentOwnership,
        homePhone: owner.homePhone,
        email: owner.email,
        dateOfBirth: owner.dateOfBirth,
        driversLicense: {
          state: owner.driversLicenseState,
        },
        homeAddress: {
          street: owner.street,
          city: owner.city,
          state: owner.state,
          zipCode: owner.zipCode,
        },
      })),
    };

    // Include sensitive fields if provided
    if (controllingPerson.ssn) {
      updates.controllingPersonSsn = controllingPerson.ssn;
    }
    if (controllingPerson.driversLicenseNumber) {
      updates.controllingPersonDriversLicense = controllingPerson.driversLicenseNumber;
    }

    onSave(updates);
  };

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!controllingPerson.firstName) missing.push('Controlling Person First Name');
    if (!controllingPerson.lastName) missing.push('Controlling Person Last Name');
    if (!controllingPerson.email) missing.push('Controlling Person Email');
    if (!controllingPerson.dateOfBirth) missing.push('Controlling Person Date of Birth');
    if (!controllingPerson.street) missing.push('Controlling Person Street Address');
    if (!controllingPerson.city) missing.push('Controlling Person City');
    if (!controllingPerson.state) missing.push('Controlling Person State');
    if (!controllingPerson.zipCode) missing.push('Controlling Person ZIP Code');

    beneficialOwners.forEach((owner, index) => {
      if (!owner.firstName) missing.push(`Owner ${index + 1} First Name`);
      if (!owner.lastName) missing.push(`Owner ${index + 1} Last Name`);
    });

    return missing;
  }, [controllingPerson, beneficialOwners]);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <Users size={24} />
        <div>
          <h3>Ownership Information</h3>
          <p>Provide information about business owners and the controlling person</p>
        </div>
      </div>

      <ValidationAlert missingFields={missingFields} />

      <div className="info-box info-box-info">
        <Info size={20} />
        <div>
          <strong>Required Information:</strong>
          <ul>
            <li><strong>Controlling Person:</strong> The individual with significant responsibility for managing the business (required for all businesses)</li>
            <li><strong>Beneficial Owners:</strong> Anyone who owns 25% or more of the business (if applicable)</li>
          </ul>
        </div>
      </div>

      <div className="form-section">
        <h4>Controlling Person (Required)</h4>
        <p className="section-hint">
          The controlling person is typically the owner, CEO, CFO, or managing partner.
        </p>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              name="firstName"
              className="form-input"
              value={controllingPerson.firstName}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              name="lastName"
              className="form-input"
              value={controllingPerson.lastName}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={controllingPerson.title}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              placeholder="e.g., Owner, CEO"
            />
          </div>
        </div>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="form-label">Ownership %</label>
            <div className="input-with-suffix">
              <input
                type="number"
                name="percentOwnership"
                className="form-input"
                value={controllingPerson.percentOwnership}
                onChange={handleControllingPersonChange}
                onBlur={handleBlur}
                min={0}
                max={100}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={controllingPerson.email}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="homePhone"
              className="form-input"
              value={controllingPerson.homePhone}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="form-label">Date of Birth *</label>
            <input
              type="date"
              name="dateOfBirth"
              className="form-input"
              value={controllingPerson.dateOfBirth}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">SSN *</label>
            <input
              type="password"
              name="ssn"
              className="form-input"
              value={controllingPerson.ssn}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              placeholder="XXX-XX-XXXX"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Driver's License #</label>
            <input
              type="text"
              name="driversLicenseNumber"
              className="form-input"
              value={controllingPerson.driversLicenseNumber}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Driver's License State</label>
          <select
            name="driversLicenseState"
            className="form-select"
            value={controllingPerson.driversLicenseState}
            onChange={handleControllingPersonChange}
            onBlur={handleBlur}
          >
            <option value="">Select state...</option>
            {US_STATES.map(state => (
              <option key={state.value} value={state.value}>{state.label}</option>
            ))}
          </select>
        </div>

        <h5>Home Address</h5>
        <div className="form-group">
          <label className="form-label">Street Address *</label>
          <input
            type="text"
            name="street"
            className="form-input"
            value={controllingPerson.street}
            onChange={handleControllingPersonChange}
            onBlur={handleBlur}
            required
          />
        </div>

        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="form-label">City *</label>
            <input
              type="text"
              name="city"
              className="form-input"
              value={controllingPerson.city}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">State *</label>
            <select
              name="state"
              className="form-select"
              value={controllingPerson.state}
              onChange={handleControllingPersonChange}
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
              name="zipCode"
              className="form-input"
              value={controllingPerson.zipCode}
              onChange={handleControllingPersonChange}
              onBlur={handleBlur}
              required
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header-with-action">
          <div>
            <h4>Beneficial Owners (25%+ Ownership)</h4>
            <p className="section-hint">
              Add any individuals who own 25% or more of the business (up to 4 owners)
            </p>
          </div>
          {beneficialOwners.length < 4 && (
            <button type="button" className="btn btn-outline btn-sm" onClick={addBeneficialOwner}>
              <Plus size={16} />
              Add Owner
            </button>
          )}
        </div>

        {beneficialOwners.length === 0 && (
          <div className="empty-owners">
            <p>No beneficial owners with 25%+ ownership added.</p>
            <p className="text-secondary">If no individual owns 25% or more, you can skip this section.</p>
          </div>
        )}

        {beneficialOwners.map((owner, index) => (
          <div key={index} className="owner-card">
            <div className="owner-card-header">
              <h5>Beneficial Owner {index + 1}</h5>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-danger"
                onClick={() => removeBeneficialOwner(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={owner.firstName}
                  onChange={(e) => handleOwnerChange(index, 'firstName', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={owner.lastName}
                  onChange={(e) => handleOwnerChange(index, 'lastName', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ownership %</label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    className="form-input"
                    value={owner.percentOwnership}
                    onChange={(e) => handleOwnerChange(index, 'percentOwnership', parseInt(e.target.value) || 0)}
                    onBlur={handleBlur}
                    min={25}
                    max={100}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>

            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={owner.email}
                  onChange={(e) => handleOwnerChange(index, 'email', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={owner.homePhone}
                  onChange={(e) => handleOwnerChange(index, 'homePhone', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={owner.dateOfBirth}
                  onChange={(e) => handleOwnerChange(index, 'dateOfBirth', e.target.value)}
                  onBlur={handleBlur}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
