import { useState, useRef, useEffect } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { windcaveApi } from '../../../services/api';
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ReviewSignStepProps {
  application: MerchantApplicationData;
  onSave: (data: Partial<MerchantApplicationData>, goToNext?: boolean) => Promise<void>;
  onSubmit?: () => Promise<void>;
  isSaving?: boolean;
}

export default function ReviewSignStep({
  application,
  onSave,
  isSaving = false,
}: ReviewSignStepProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [termsAccepted, setTermsAccepted] = useState(application.signatures?.termsAccepted || false);
  const [printedName, setPrintedName] = useState(application.signatures?.merchantPrintedName || '');
  const [signature, setSignature] = useState<string | null>(application.signatures?.merchantSignature || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing style
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If there's an existing signature, draw it
    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = signature;
    }
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignature(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setSignature(null);
  };

  const handleSaveSignature = async () => {
    if (!signature || !printedName) {
      setError('Please sign and type your name');
      return;
    }

    try {
      await windcaveApi.saveSignature('merchant', signature, printedName);
      if (termsAccepted) {
        await windcaveApi.acceptTerms();
      }
      onSave({
        signatures: {
          merchantSignature: signature,
          merchantPrintedName: printedName,
          termsAccepted,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save signature');
    }
  };

  const canSubmit = termsAccepted && signature && printedName;

  // Validation checks
  const validationChecks = [
    {
      id: 'businessInfo',
      label: 'Business Information',
      valid: !!(application.merchantInfo?.legalName && application.merchantInfo?.businessType),
      fields: [
        { label: 'Legal Name', value: application.merchantInfo?.legalName },
        { label: 'Business Type', value: application.merchantInfo?.businessType },
        { label: 'Address', value: application.merchantInfo?.locationAddress?.street },
        { label: 'Phone', value: application.merchantInfo?.phone },
        { label: 'Email', value: application.merchantInfo?.email },
      ],
    },
    {
      id: 'controllingPerson',
      label: 'Controlling Person',
      valid: !!(application.controllingPerson?.firstName && application.controllingPerson?.lastName),
      fields: [
        { label: 'Name', value: `${application.controllingPerson?.firstName || ''} ${application.controllingPerson?.lastName || ''}`.trim() },
        { label: 'Email', value: application.controllingPerson?.email },
      ],
    },
    {
      id: 'bankAccount',
      label: 'Bank Account',
      valid: !!(application.bankAccount?.bankName),
      fields: [
        { label: 'Bank Name', value: application.bankAccount?.bankName },
        { label: 'Account Type', value: application.bankAccount?.accountType },
        { label: 'Account', value: application.bankAccount?.accountNumberMasked || 'Provided' },
      ],
    },
    {
      id: 'documents',
      label: 'Required Documents',
      valid: !!(application.documents?.incorporationCert && application.documents?.voidedCheck),
      fields: [
        { label: 'Business Registration', value: application.documents?.incorporationCert ? 'Uploaded' : 'Missing' },
        { label: 'Proof of Address', value: application.documents?.proofOfAddress ? 'Uploaded' : 'Missing' },
        { label: 'Voided Check', value: application.documents?.voidedCheck ? 'Uploaded' : 'Missing' },
        { label: 'Owner IDs', value: application.documents?.ownerIds?.length ? `${application.documents.ownerIds.length} uploaded` : 'Missing' },
      ],
    },
  ];

  const allSectionsValid = validationChecks.every(check => check.valid);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <CheckCircle size={24} />
        <div>
          <h3>Review & Sign</h3>
          <p>Review your application and provide your electronic signature</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!allSectionsValid && (
        <div className="alert alert-warning mb-4">
          <AlertCircle size={20} />
          <span>Some required information is missing. Please review and complete all sections.</span>
        </div>
      )}

      <div className="review-sections">
        {validationChecks.map((section) => (
          <div
            key={section.id}
            className={`review-section ${section.valid ? 'valid' : 'invalid'}`}
          >
            <button
              type="button"
              className="review-section-header"
              onClick={() => toggleSection(section.id)}
            >
              <div className="section-status">
                {section.valid ? (
                  <CheckCircle size={18} className="text-success" />
                ) : (
                  <AlertCircle size={18} className="text-warning" />
                )}
                <span>{section.label}</span>
              </div>
              {expandedSections[section.id] ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedSections[section.id] && (
              <div className="review-section-content">
                {section.fields.map((field, index) => (
                  <div key={index} className="review-field">
                    <span className="field-label">{field.label}:</span>
                    <span className={`field-value ${!field.value ? 'missing' : ''}`}>
                      {field.value || 'Not provided'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="form-section">
        <h4>Terms & Conditions</h4>

        <div className="terms-box">
          <p>
            By signing below, I acknowledge that I have read and agree to the Windcave
            Merchant Services Agreement and OnStride Terms of Service. I certify that
            all information provided in this application is true and accurate to the
            best of my knowledge.
          </p>
          <p>
            I authorize Windcave and OnStride to verify the information provided,
            including contacting my bank and credit references. I understand that
            providing false information may result in termination of services.
          </p>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>
              I have read and agree to the Terms & Conditions and authorize the processing
              of my merchant application
            </span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h4>Electronic Signature</h4>

        <div className="form-group">
          <label className="form-label">Print Your Full Legal Name *</label>
          <input
            type="text"
            className="form-input"
            value={printedName}
            onChange={(e) => setPrintedName(e.target.value)}
            placeholder="Type your full legal name"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Sign Below *</label>
          <div className="signature-pad-container">
            <canvas
              ref={canvasRef}
              className="signature-pad"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm clear-signature"
              onClick={clearSignature}
            >
              Clear
            </button>
          </div>
          <p className="form-hint">Draw your signature using your mouse or touch screen</p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleSaveSignature}
          disabled={isSaving || !signature || !printedName}
        >
          Save Signature
        </button>
      </div>

      {canSubmit && allSectionsValid && (
        <div className="submit-section">
          <div className="submit-info">
            <CheckCircle size={24} className="text-success" />
            <div>
              <h4>Ready to Submit</h4>
              <p>Your application is complete and ready to be submitted for review.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
