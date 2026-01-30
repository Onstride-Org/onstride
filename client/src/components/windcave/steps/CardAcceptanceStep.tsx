import { useState, useMemo } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import ValidationAlert from '../ValidationAlert';

interface CardAcceptanceStepProps {
  application: MerchantApplicationData;
  onSave: (data: Partial<MerchantApplicationData>, goToNext?: boolean) => Promise<void>;
  isSaving?: boolean;
}

export default function CardAcceptanceStep({
  application,
  onSave,
}: CardAcceptanceStepProps) {
  const [formData, setFormData] = useState({
    // Card acceptance methods (must total 100%)
    swipeContactlessInserted: application.cardAcceptanceMethods?.swipeContactlessInserted || 0,
    mailOrderTelephoneOrder: application.cardAcceptanceMethods?.mailOrderTelephoneOrder || 0,
    ecommerce: application.cardAcceptanceMethods?.ecommerce || 100,
    subscriptionRecurring: application.cardAcceptanceMethods?.subscriptionRecurring || 0,
    posSystem: application.cardAcceptanceMethods?.posSystem || 'OnStride',

    // Additional questionnaire
    businessConsumersPercent: application.additionalQuestionnaire?.businessConsumersPercent || 10,
    individualCustomersPercent: application.additionalQuestionnaire?.individualCustomersPercent || 90,
    ownsProductInventory: application.additionalQuestionnaire?.ownsProductInventory || false,
    productStoredAtLocation: application.additionalQuestionnaire?.productStoredAtLocation || true,
    whoEntersCardInfo: application.additionalQuestionnaire?.whoEntersCardInfo || 'consumer',
    whoShipsProduct: application.additionalQuestionnaire?.whoShipsProduct || 'na',
    daysUntilShipAfterAuth: application.additionalQuestionnaire?.daysUntilShipAfterAuth || 0,
  });

  const cardMethodsTotal =
    formData.swipeContactlessInserted +
    formData.mailOrderTelephoneOrder +
    formData.ecommerce +
    formData.subscriptionRecurring;

  const customerPercentTotal =
    formData.businessConsumersPercent +
    formData.individualCustomersPercent;

  const isCardMethodsValid = cardMethodsTotal === 100;
  const isCustomerPercentValid = customerPercentTotal === 100;

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!isCardMethodsValid) missing.push('Payment Methods must total 100%');
    if (!isCustomerPercentValid) missing.push('Customer Profile must total 100%');
    return missing;
  }, [isCardMethodsValid, isCustomerPercentValid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'number' || type === 'range') {
      newValue = parseInt(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleBlur = () => {
    onSave({
      cardAcceptanceMethods: {
        swipeContactlessInserted: formData.swipeContactlessInserted,
        mailOrderTelephoneOrder: formData.mailOrderTelephoneOrder,
        ecommerce: formData.ecommerce,
        subscriptionRecurring: formData.subscriptionRecurring,
        posSystem: formData.posSystem,
      },
      additionalQuestionnaire: {
        businessConsumersPercent: formData.businessConsumersPercent,
        individualCustomersPercent: formData.individualCustomersPercent,
        ownsProductInventory: formData.ownsProductInventory,
        productStoredAtLocation: formData.productStoredAtLocation,
        whoEntersCardInfo: formData.whoEntersCardInfo,
        whoShipsProduct: formData.whoShipsProduct,
        daysUntilShipAfterAuth: formData.daysUntilShipAfterAuth,
      },
    });
  };

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <CreditCard size={24} />
        <div>
          <h3>Card Acceptance Methods</h3>
          <p>How will you accept payments through OnStride?</p>
        </div>
      </div>

      <ValidationAlert missingFields={missingFields} />

      <div className="form-section">
        <h4>Payment Methods Breakdown</h4>
        <p className="section-hint">
          These percentages must total 100%. For most OnStride users, 100% E-commerce is appropriate.
        </p>

        <div className={`validation-indicator ${isCardMethodsValid ? 'valid' : 'invalid'}`}>
          {isCardMethodsValid ? (
            <><CheckCircle size={16} /> Total: 100%</>
          ) : (
            <><AlertCircle size={16} /> Total: {cardMethodsTotal}% (must equal 100%)</>
          )}
        </div>

        <div className="percentage-inputs">
          <div className="percentage-input-group">
            <label className="form-label">Swipe / Contactless / Inserted</label>
            <div className="percentage-input-row">
              <input
                type="range"
                name="swipeContactlessInserted"
                min={0}
                max={100}
                value={formData.swipeContactlessInserted}
                onChange={handleChange}
                onMouseUp={handleBlur}
              />
              <span className="percentage-value">{formData.swipeContactlessInserted}%</span>
            </div>
            <p className="form-hint">Physical card readers at your location</p>
          </div>

          <div className="percentage-input-group">
            <label className="form-label">Mail Order / Telephone Order</label>
            <div className="percentage-input-row">
              <input
                type="range"
                name="mailOrderTelephoneOrder"
                min={0}
                max={100}
                value={formData.mailOrderTelephoneOrder}
                onChange={handleChange}
                onMouseUp={handleBlur}
              />
              <span className="percentage-value">{formData.mailOrderTelephoneOrder}%</span>
            </div>
            <p className="form-hint">Payments taken over phone or by mail</p>
          </div>

          <div className="percentage-input-group">
            <label className="form-label">E-Commerce (Online)</label>
            <div className="percentage-input-row">
              <input
                type="range"
                name="ecommerce"
                min={0}
                max={100}
                value={formData.ecommerce}
                onChange={handleChange}
                onMouseUp={handleBlur}
              />
              <span className="percentage-value">{formData.ecommerce}%</span>
            </div>
            <p className="form-hint">Payments through OnStride (recommended: 100%)</p>
          </div>

          <div className="percentage-input-group">
            <label className="form-label">Subscription / Recurring</label>
            <div className="percentage-input-row">
              <input
                type="range"
                name="subscriptionRecurring"
                min={0}
                max={100}
                value={formData.subscriptionRecurring}
                onChange={handleChange}
                onMouseUp={handleBlur}
              />
              <span className="percentage-value">{formData.subscriptionRecurring}%</span>
            </div>
            <p className="form-hint">Automatic recurring charges</p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">POS / Software System</label>
          <input
            type="text"
            name="posSystem"
            className="form-input"
            value={formData.posSystem}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled
          />
          <p className="form-hint">Payment processing is managed through OnStride</p>
        </div>
      </div>

      <div className="form-section">
        <h4>Customer Profile</h4>

        <div className={`validation-indicator ${isCustomerPercentValid ? 'valid' : 'invalid'}`}>
          {isCustomerPercentValid ? (
            <><CheckCircle size={16} /> Total: 100%</>
          ) : (
            <><AlertCircle size={16} /> Total: {customerPercentTotal}% (must equal 100%)</>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Business Customers (B2B) %</label>
            <div className="input-with-suffix">
              <input
                type="number"
                name="businessConsumersPercent"
                className="form-input"
                value={formData.businessConsumersPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                min={0}
                max={100}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Individual Customers (B2C) %</label>
            <div className="input-with-suffix">
              <input
                type="number"
                name="individualCustomersPercent"
                className="form-input"
                value={formData.individualCustomersPercent}
                onChange={handleChange}
                onBlur={handleBlur}
                min={0}
                max={100}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4>Additional Questions</h4>

        <div className="form-group">
          <label className="form-label">Do you own product inventory?</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="ownsProductInventory"
                checked={!formData.ownsProductInventory}
                onChange={() => setFormData(prev => ({ ...prev, ownsProductInventory: false }))}
                onBlur={handleBlur}
              />
              <span>No (services only)</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="ownsProductInventory"
                checked={formData.ownsProductInventory}
                onChange={() => setFormData(prev => ({ ...prev, ownsProductInventory: true }))}
                onBlur={handleBlur}
              />
              <span>Yes (sell products)</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Who enters card information?</label>
          <select
            name="whoEntersCardInfo"
            className="form-select"
            value={formData.whoEntersCardInfo}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="consumer">Consumer (customer enters their own card)</option>
            <option value="merchant">Merchant (you enter customer's card)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Who ships products (if applicable)?</label>
          <select
            name="whoShipsProduct"
            className="form-select"
            value={formData.whoShipsProduct}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="na">N/A - No physical products shipped</option>
            <option value="merchant">Merchant ships directly</option>
            <option value="fulfillment_center">Fulfillment center ships</option>
          </select>
        </div>
      </div>
    </div>
  );
}
