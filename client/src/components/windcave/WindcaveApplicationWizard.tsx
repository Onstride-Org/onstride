import { useState, useEffect } from 'react';
import { windcaveApi } from '../../services/api';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  FileText,
  CreditCard,
  Users,
  Landmark,
  Upload,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Import step components
import BusinessInfoStep from './steps/BusinessInfoStep';
import BusinessDetailsStep from './steps/BusinessDetailsStep';
import TransactionDetailsStep from './steps/TransactionDetailsStep';
import CardAcceptanceStep from './steps/CardAcceptanceStep';
import OwnershipInfoStep from './steps/OwnershipInfoStep';
import BankAccountStep from './steps/BankAccountStep';
import DocumentsStep from './steps/DocumentsStep';
import ReviewSignStep from './steps/ReviewSignStep';

export interface MerchantApplicationData {
  _id?: string;
  status?: string;
  currentStep?: number;
  completedSteps?: number[];
  merchantInfo?: {
    legalName?: string;
    tradingName?: string;
    businessType?: string;
    tickerSymbol?: string;
    locationAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    postalAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    postalSameAsLocation?: boolean;
    email?: string;
    phone?: string;
    website?: string;
    einTinMasked?: string;
  };
  businessDescription?: {
    description?: string;
    natureOfBusiness?: string;
    legalActionByRegulator?: boolean;
    legalActionExplanation?: string;
    finedByCardNetwork?: boolean;
    fineExplanation?: string;
  };
  transactionDetails?: {
    averageTicket?: number;
    highTicket?: number;
    monthlyCardVolume?: number;
    hasFutureDatedEvents?: boolean;
  };
  cardAcceptanceMethods?: {
    swipeContactlessInserted?: number;
    mailOrderTelephoneOrder?: number;
    ecommerce?: number;
    subscriptionRecurring?: number;
    posSystem?: string;
  };
  additionalQuestionnaire?: {
    businessConsumersPercent?: number;
    individualCustomersPercent?: number;
    ownsProductInventory?: boolean;
    productStoredAtLocation?: boolean;
    whoEntersCardInfo?: string;
    whoShipsProduct?: string;
    daysUntilShipAfterAuth?: number;
  };
  beneficialOwners?: Array<{
    firstName?: string;
    lastName?: string;
    title?: string;
    percentOwnership?: number;
    homePhone?: string;
    email?: string;
    dateOfBirth?: string;
    driversLicense?: {
      state?: string;
    };
    homeAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  }>;
  controllingPerson?: {
    firstName?: string;
    lastName?: string;
    title?: string;
    percentOwnership?: number;
    homePhone?: string;
    email?: string;
    dateOfBirth?: string;
    driversLicense?: {
      state?: string;
    };
    homeAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
  bankAccount?: {
    accountType?: string;
    bankName?: string;
    bankContactName?: string;
    bankContactPhone?: string;
    accountNumberMasked?: string;
  };
  documents?: {
    processingStatements?: string[];
    proofOfAddress?: string;
    incorporationCert?: string;
    voidedCheck?: string;
    ownerIds?: string[];
  };
  signatures?: {
    merchantSignature?: string;
    merchantPrintedName?: string;
    merchantSignatureDate?: string;
    termsAccepted?: boolean;
    termsAcceptedDate?: string;
  };
}

const STEPS = [
  { id: 1, name: 'Business Info', icon: Building2 },
  { id: 2, name: 'Business Details', icon: FileText },
  { id: 3, name: 'Transactions', icon: CreditCard },
  { id: 4, name: 'Card Acceptance', icon: CreditCard },
  { id: 5, name: 'Ownership', icon: Users },
  { id: 6, name: 'Bank Account', icon: Landmark },
  { id: 7, name: 'Documents', icon: Upload },
  { id: 8, name: 'Review & Sign', icon: CheckCircle },
];

interface WindcaveApplicationWizardProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WindcaveApplicationWizard({
  onClose,
  onSuccess,
}: WindcaveApplicationWizardProps) {
  const [application, setApplication] = useState<MerchantApplicationData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadOrCreateApplication();
  }, []);

  const loadOrCreateApplication = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Always check for existing application first
      const existingData = await windcaveApi.getApplication();

      if (existingData.exists) {
        // Use existing application
        setApplication(existingData);
        setCurrentStep(existingData.currentStep || 1);
      } else {
        // No existing application - create new one
        const newApp = await windcaveApi.createApplication();
        setApplication(newApp);
        setCurrentStep(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (updates: Partial<MerchantApplicationData>, goToNext = false) => {
    setIsSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const updatedApp = await windcaveApi.updateApplication({
        ...updates,
        currentStep: goToNext ? currentStep + 1 : currentStep,
        completedSteps: goToNext
          ? [...(application?.completedSteps || []), currentStep]
          : application?.completedSteps,
      });

      setApplication(updatedApp);

      if (goToNext && currentStep < 8) {
        setCurrentStep(currentStep + 1);
      }

      setSaveMessage('Progress saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
      handleSave({ currentStep: currentStep + 1 });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to any step
    setCurrentStep(stepId);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError('');

    try {
      const result = await windcaveApi.submitApplication();
      if (result.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    if (!application) return null;

    const commonProps = {
      application,
      onSave: handleSave,
      isSaving,
    };

    switch (currentStep) {
      case 1:
        return <BusinessInfoStep {...commonProps} />;
      case 2:
        return <BusinessDetailsStep {...commonProps} />;
      case 3:
        return <TransactionDetailsStep {...commonProps} />;
      case 4:
        return <CardAcceptanceStep {...commonProps} />;
      case 5:
        return <OwnershipInfoStep {...commonProps} />;
      case 6:
        return <BankAccountStep {...commonProps} />;
      case 7:
        return <DocumentsStep {...commonProps} />;
      case 8:
        return <ReviewSignStep {...commonProps} onSubmit={handleSubmit} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay windcave-wizard-overlay">
        <div className="modal modal-xl windcave-wizard">
          <div className="modal-body">
            <div className="page-loading">
              <div className="spinner spinner-lg"></div>
              <p>Loading application...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay windcave-wizard-overlay" onClick={onClose}>
      <div className="modal modal-xl windcave-wizard" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-layout">
          {/* Left Sidebar */}
          <div className="wizard-sidebar">
            <div className="wizard-sidebar-header">
              <Building2 size={20} />
              <span>Merchant Application</span>
            </div>
            <div className="wizard-steps-list">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isCompleted = (application?.completedSteps || []).includes(step.id);
                const isCurrent = step.id === currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`wizard-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => handleStepClick(step.id)}
                  >
                    <span className="step-icon">
                      {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                    </span>
                    <span className="step-name">{step.name}</span>
                  </button>
                );
              })}
            </div>
            {saveMessage && (
              <div className="wizard-sidebar-footer">
                <span className="save-message">
                  <CheckCircle size={14} /> {saveMessage}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="wizard-main">
            <div className="wizard-main-header">
              <h2>{STEPS[currentStep - 1].name}</h2>
              <button className="btn btn-ghost modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <div className="wizard-body">
              {error && (
                <div className="alert alert-error mb-4">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {renderStep()}
            </div>

            <div className="wizard-footer">
              {application?.status === 'submitted' || application?.status === 'under_review' ? (
                // Read-only mode for submitted applications
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>

                  <div className="wizard-status-badge">
                    <CheckCircle size={16} />
                    Application Submitted
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleNext}
                    disabled={currentStep === 8}
                  >
                    Next
                    <ChevronRight size={18} />
                  </button>
                </>
              ) : (
                // Editable mode for draft applications
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1 || isSaving}
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>

                  <div className="wizard-step-indicator">
                    Step {currentStep} of 8
                  </div>

                  {currentStep < 8 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNext}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Next'}
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmit}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Submitting...' : 'Submit Application'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="windcave-powered">
          <span className="windcave-powered-label">Payment processing by</span>
          <img src="/windcave-logo.png" alt="Windcave" className="windcave-powered-logo" />
        </div>
      </div>
    </div>
  );
}
