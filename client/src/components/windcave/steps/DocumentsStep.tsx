import { useState, useRef, useMemo } from 'react';
import { MerchantApplicationData } from '../WindcaveApplicationWizard';
import { windcaveApi } from '../../../services/api';
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Trash2,
  Eye,
} from 'lucide-react';
import ValidationAlert from '../ValidationAlert';

interface DocumentsStepProps {
  application: MerchantApplicationData;
  onSave: (data: Partial<MerchantApplicationData>, goToNext?: boolean) => Promise<void>;
  isSaving?: boolean;
}

interface DocumentType {
  id: string;
  label: string;
  description: string;
  required: boolean;
  multiple: boolean;
  maxFiles?: number;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'incorporationCert',
    label: 'Business Registration Document',
    description: 'Certificate of Incorporation, W-9, or 501(c)(3) letter',
    required: true,
    multiple: false,
  },
  {
    id: 'proofOfAddress',
    label: 'Proof of Business Address',
    description: 'Utility bill or bank statement showing business address (within 90 days)',
    required: true,
    multiple: false,
  },
  {
    id: 'voidedCheck',
    label: 'Voided Check or Bank Letter',
    description: 'Voided check from your settlement account or bank verification letter',
    required: true,
    multiple: false,
  },
  {
    id: 'ownerId',
    label: 'Owner ID(s)',
    description: 'Government-issued ID or passport for each 25%+ owner',
    required: true,
    multiple: true,
    maxFiles: 4,
  },
  {
    id: 'processingStatement',
    label: 'Processing Statements (if applicable)',
    description: '3 months of statements if you currently process payments elsewhere',
    required: false,
    multiple: true,
    maxFiles: 3,
  },
];

export default function DocumentsStep({
  application,
  onSave,
}: DocumentsStepProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getDocumentFiles = (docType: string): string[] => {
    const docs = application.documents;
    if (!docs) return [];

    switch (docType) {
      case 'incorporationCert':
        return docs.incorporationCert ? [docs.incorporationCert] : [];
      case 'proofOfAddress':
        return docs.proofOfAddress ? [docs.proofOfAddress] : [];
      case 'voidedCheck':
        return docs.voidedCheck ? [docs.voidedCheck] : [];
      case 'ownerId':
        return docs.ownerIds || [];
      case 'processingStatement':
        return docs.processingStatements || [];
      default:
        return [];
    }
  };

  const isDocumentComplete = (docType: DocumentType): boolean => {
    const files = getDocumentFiles(docType.id);
    return docType.required ? files.length > 0 : true;
  };

  const handleFileSelect = async (docType: string, file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, PNG, or JPG files only.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(docType);
    setError('');

    try {
      await windcaveApi.uploadDocument(file, docType);
      // Refresh application data
      const updatedApp = await windcaveApi.getApplication();
      onSave({ documents: updatedApp.documents });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(null);
      // Clear the file input
      if (fileInputRefs.current[docType]) {
        fileInputRefs.current[docType]!.value = '';
      }
    }
  };

  const handleDeleteDocument = async (docType: string, index?: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    setUploading(docType);
    setError('');

    try {
      await windcaveApi.deleteDocument(docType, index);
      // Refresh application data
      const updatedApp = await windcaveApi.getApplication();
      onSave({ documents: updatedApp.documents });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document');
    } finally {
      setUploading(null);
    }
  };

  const getFileName = (filePath: string): string => {
    return filePath.split('/').pop() || 'Document';
  };

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    DOCUMENT_TYPES.filter(d => d.required).forEach(docType => {
      if (!isDocumentComplete(docType)) {
        missing.push(docType.label);
      }
    });
    return missing;
  }, [application.documents]);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <Upload size={24} />
        <div>
          <h3>Required Documents</h3>
          <p>Upload the necessary documents for your merchant application</p>
        </div>
      </div>

      <ValidationAlert missingFields={missingFields} />

      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="documents-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(DOCUMENT_TYPES.filter(d => d.required).filter(isDocumentComplete).length /
                DOCUMENT_TYPES.filter(d => d.required).length) * 100}%`
            }}
          ></div>
        </div>
        <span className="progress-text">
          {DOCUMENT_TYPES.filter(d => d.required).filter(isDocumentComplete).length} of{' '}
          {DOCUMENT_TYPES.filter(d => d.required).length} required documents uploaded
        </span>
      </div>

      <div className="documents-list">
        {DOCUMENT_TYPES.map((docType) => {
          const files = getDocumentFiles(docType.id);
          const isComplete = isDocumentComplete(docType);
          const canUploadMore = docType.multiple
            ? files.length < (docType.maxFiles || 10)
            : files.length === 0;

          return (
            <div
              key={docType.id}
              className={`document-card ${isComplete ? 'complete' : ''} ${uploading === docType.id ? 'uploading' : ''}`}
            >
              <div className="document-card-header">
                <div className="document-info">
                  <div className="document-status">
                    {isComplete ? (
                      <Check size={18} className="text-success" />
                    ) : docType.required ? (
                      <AlertCircle size={18} className="text-warning" />
                    ) : (
                      <FileText size={18} className="text-secondary" />
                    )}
                  </div>
                  <div>
                    <h4 className="document-label">
                      {docType.label}
                      {docType.required && <span className="required">*</span>}
                    </h4>
                    <p className="document-description">{docType.description}</p>
                  </div>
                </div>

                {canUploadMore && (
                  <label className="btn btn-outline btn-sm upload-btn">
                    <Upload size={16} />
                    {uploading === docType.id ? 'Uploading...' : 'Upload'}
                    <input
                      ref={(el) => (fileInputRefs.current[docType.id] = el)}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(docType.id, file);
                      }}
                      disabled={uploading !== null}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {files.length > 0 && (
                <div className="uploaded-files">
                  {files.map((file, index) => (
                    <div key={index} className="uploaded-file">
                      <FileText size={16} />
                      <span className="file-name">{getFileName(file)}</span>
                      <div className="file-actions">
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-danger"
                          onClick={() => handleDeleteDocument(
                            docType.id,
                            docType.multiple ? index : undefined
                          )}
                          disabled={uploading !== null}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="info-box">
        <AlertCircle size={20} />
        <div>
          <strong>Document Requirements:</strong>
          <ul>
            <li>Accepted formats: PDF, PNG, JPG</li>
            <li>Maximum file size: 10MB per file</li>
            <li>Documents must be clear and readable</li>
            <li>All required documents must be uploaded before submission</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
