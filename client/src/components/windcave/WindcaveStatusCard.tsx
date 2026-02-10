import { useState, useEffect } from 'react';
import { windcaveApi } from '../../services/api';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Shield,
  Building2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface MerchantApplication {
  exists: boolean;
  status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_info';
  currentStep?: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  additionalInfoRequested?: string;
  windcaveCredentials?: {
    merchantId?: string;
    isActive?: boolean;
    activatedAt?: string;
    testResult?: {
      success: boolean;
      message: string;
    };
  };
}

interface WindcaveStatusCardProps {
  onStartApplication: () => void;
  onContinueApplication: () => void;
  onEnterCredentials: () => void;
  onViewApplication?: () => void;
  onManageCredentials?: () => void;
}

export default function WindcaveStatusCard({
  onStartApplication,
  onContinueApplication,
  onEnterCredentials,
  onViewApplication,
  onManageCredentials,
}: WindcaveStatusCardProps) {
  const [application, setApplication] = useState<MerchantApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await windcaveApi.getApplication();
      setApplication(data);
    } catch (err: any) {
      setError('Failed to load payment status');
      console.error('Failed to load application:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="vendor-card">
        <div className="vendor-card-body">
          <div className="page-loading">
            <div className="spinner spinner-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vendor-card">
        <div className="vendor-card-body">
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={loadApplication}>
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 1: No Application Started - Allow direct credential entry OR full application
  if (!application?.exists) {
    return (
      <div className="vendor-card windcave-status-card">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <CreditCard size={18} />
              Enable Payment Processing
            </h3>
          </div>
        </div>
        <div className="vendor-card-body">
          <p className="windcave-description">
            Accept credit card and ACH payments directly through OnStride. Funds are deposited
            directly into your bank account.
          </p>
          <div className="windcave-features">
            <div className="windcave-feature">
              <CheckCircle size={16} className="text-success" />
              <span>Accept Visa, Mastercard, Discover, Amex</span>
            </div>
            <div className="windcave-feature">
              <CheckCircle size={16} className="text-success" />
              <span>ACH bank transfers</span>
            </div>
            <div className="windcave-feature">
              <CheckCircle size={16} className="text-success" />
              <span>Automatic invoice payment tracking</span>
            </div>
            <div className="windcave-feature">
              <Shield size={16} className="text-success" />
              <span>PCI-DSS compliant security</span>
            </div>
          </div>
        </div>
        <div className="vendor-card-actions windcave-action-buttons">
          <button className="btn btn-primary" onClick={onEnterCredentials}>
            <CreditCard size={18} />
            I Have Windcave Credentials
          </button>
          <button className="btn btn-outline" onClick={onStartApplication}>
            <Building2 size={18} />
            Apply for New Account
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // State 2: Application In Progress (Draft)
  if (application.status === 'draft') {
    return (
      <div className="vendor-card windcave-status-card">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <Clock size={18} />
              Application In Progress
            </h3>
          </div>
          <span className="badge badge-warning">Draft</span>
        </div>
        <div className="vendor-card-body">
          <p className="windcave-description">
            Your merchant application has been started. Continue filling it out to enable payment processing.
          </p>
        </div>
        <div className="vendor-card-actions">
          <button className="btn btn-primary" onClick={onContinueApplication}>
            Continue Application
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // State 3: Application Submitted / Under Review
  if (application.status === 'submitted' || application.status === 'under_review') {
    return (
      <div className="vendor-card windcave-status-card">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <Clock size={18} />
              Application Under Review
            </h3>
          </div>
          <span className="badge badge-info">Under Review</span>
        </div>
        <div className="vendor-card-body">
          <div className="windcave-status-message">
            <div className="status-icon status-icon-pending">
              <Clock size={32} />
            </div>
            <div>
              <h4>Your application is being reviewed</h4>
              <p>
                Submitted on {application.submittedAt
                  ? new Date(application.submittedAt).toLocaleDateString()
                  : 'recently'}
              </p>
              <p className="text-secondary">
                Approval typically takes 3-5 business days. You'll receive an email when approved.
              </p>
            </div>
          </div>
          <div className="windcave-contact-link">
            <a
              href="https://www.windcave.com/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
              Contact Windcave Support
            </a>
          </div>
        </div>
        <div className="vendor-card-actions">
          <button className="btn btn-outline" onClick={onViewApplication}>
            View Application Details
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // State 4: Requires Additional Information
  if (application.status === 'requires_info') {
    return (
      <div className="vendor-card windcave-status-card">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <AlertCircle size={18} />
              Additional Information Required
            </h3>
          </div>
          <span className="badge badge-warning">Action Required</span>
        </div>
        <div className="vendor-card-body">
          <div className="alert alert-warning">
            <AlertCircle size={20} />
            <div>
              <strong>Information Requested:</strong>
              <p>{application.additionalInfoRequested || 'Please update your application with the requested information.'}</p>
            </div>
          </div>
        </div>
        <div className="vendor-card-actions">
          <button className="btn btn-primary" onClick={onContinueApplication}>
            Update Application
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // State 5: Rejected
  if (application.status === 'rejected') {
    return (
      <div className="vendor-card windcave-status-card">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <XCircle size={18} />
              Application Not Approved
            </h3>
          </div>
          <span className="badge badge-error">Rejected</span>
        </div>
        <div className="vendor-card-body">
          <div className="windcave-status-message">
            <div className="status-icon status-icon-error">
              <XCircle size={32} />
            </div>
            <div>
              <h4>Your application was not approved</h4>
              {application.rejectionReason && (
                <p className="text-secondary">{application.rejectionReason}</p>
              )}
              <p className="text-secondary mt-2">
                Please contact admin@onstrideapp.com for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 6: Approved - Awaiting Credentials
  if (application.status === 'approved' && !application.windcaveCredentials?.isActive) {
    return (
      <div className="vendor-card windcave-status-card">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <CheckCircle size={18} />
              Application Approved!
            </h3>
          </div>
          <span className="badge badge-success">Approved</span>
        </div>
        <div className="vendor-card-body">
          <div className="windcave-status-message">
            <div className="status-icon status-icon-success">
              <CheckCircle size={32} />
            </div>
            <div>
              <h4>Congratulations! Your merchant application has been approved.</h4>
              <p className="text-secondary">
                Check your email for your Windcave credentials. Once you receive them,
                enter them below to activate payment processing.
              </p>
            </div>
          </div>
        </div>
        <div className="vendor-card-actions">
          <button className="btn btn-primary" onClick={onEnterCredentials}>
            <CreditCard size={18} />
            Enter Credentials
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // State 7: Active - Processing Enabled
  if (application.status === 'approved' && application.windcaveCredentials?.isActive) {
    return (
      <div className="vendor-card windcave-status-card windcave-active">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <CheckCircle size={18} />
              Payment Processing Active
            </h3>
          </div>
          <span className="badge badge-success">Active</span>
        </div>
        <div className="vendor-card-body">
          <div className="windcave-active-info">
            <div className="active-detail">
              <span className="label">Merchant ID</span>
              <span className="value">{application.windcaveCredentials.merchantId}</span>
            </div>
            <div className="active-detail">
              <span className="label">Activated</span>
              <span className="value">
                {application.windcaveCredentials.activatedAt
                  ? new Date(application.windcaveCredentials.activatedAt).toLocaleDateString()
                  : '-'}
              </span>
            </div>
            <div className="active-detail">
              <span className="label">Status</span>
              <span className="value text-success">
                <CheckCircle size={14} /> Connected
              </span>
            </div>
          </div>
          <div className="windcave-card-types">
            <span className="card-type">Visa</span>
            <span className="card-type">Mastercard</span>
            <span className="card-type">Discover</span>
            <span className="card-type">Amex</span>
            <span className="card-type">ACH</span>
          </div>
        </div>
        {onManageCredentials && (
          <div className="vendor-card-actions">
            <button className="btn btn-outline btn-sm" onClick={onManageCredentials}>
              Update Credentials
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return null;
}
