import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { stripeApi } from '../../services/api';
import type { StripeConnectStatus } from '../../types';

interface StripeConnectStatusCardProps {
  onRefresh?: () => void;
}

export default function StripeConnectStatusCard({ onRefresh }: StripeConnectStatusCardProps) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await stripeApi.getConnectStatus();
      setStatus(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load payment status');
      console.error('Failed to load Stripe Connect status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    setIsOnboarding(true);
    setError('');
    try {
      const result = status?.connected
        ? await stripeApi.getOnboardingLink()
        : await stripeApi.startOnboarding();
      if (result.onboardingUrl) {
        window.location.href = result.onboardingUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start Stripe onboarding');
      setIsOnboarding(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const result = await stripeApi.getDashboardLink();
      if (result.dashboardUrl) {
        window.open(result.dashboardUrl, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to open Stripe dashboard');
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
            <button className="btn btn-ghost btn-sm" onClick={loadStatus}>
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not connected - show connect prompt
  if (!status?.connected) {
    return (
      <div className="vendor-card stripe-status-card">
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
            Connect your barn to Stripe to accept credit card and ACH payments directly through OnStride.
            Funds are deposited directly into your bank account.
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
              <span>Automatic payouts to your bank</span>
            </div>
            <div className="windcave-feature">
              <Shield size={16} className="text-success" />
              <span>PCI-DSS compliant security</span>
            </div>
          </div>
        </div>
        <div className="vendor-card-actions">
          <button
            className="btn btn-primary"
            onClick={handleStartOnboarding}
            disabled={isOnboarding}
          >
            {isOnboarding ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Setting up...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Connect with Stripe
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Connected but requires action (incomplete setup)
  if (status.connected && status.requiresAction) {
    return (
      <div className="vendor-card stripe-status-card">
        <div className="vendor-card-header">
          <div className="vendor-header-info">
            <h3 className="vendor-name">
              <AlertCircle size={18} />
              Complete Stripe Setup
            </h3>
          </div>
          <span className="badge badge-warning">Action Required</span>
        </div>
        <div className="vendor-card-body">
          <div className="windcave-status-message">
            <div className="status-icon status-icon-warning">
              <AlertCircle size={32} />
            </div>
            <div>
              <h4>Your Stripe account needs additional information</h4>
              <p className="text-secondary">
                Please complete the Stripe onboarding process to start accepting payments.
              </p>
            </div>
          </div>
        </div>
        <div className="vendor-card-actions">
          <button
            className="btn btn-primary"
            onClick={handleStartOnboarding}
            disabled={isOnboarding}
          >
            {isOnboarding ? 'Loading...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    );
  }

  // Fully connected and active
  return (
    <div className="vendor-card stripe-status-card windcave-active">
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
            <span className="label">Provider</span>
            <span className="value">Stripe Connect</span>
          </div>
          <div className="active-detail">
            <span className="label">Charges</span>
            <span className="value text-success">
              <CheckCircle size={14} /> {status.chargesEnabled ? 'Enabled' : 'Pending'}
            </span>
          </div>
          <div className="active-detail">
            <span className="label">Payouts</span>
            <span className="value text-success">
              <CheckCircle size={14} /> {status.payoutsEnabled ? 'Enabled' : 'Pending'}
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
      <div className="vendor-card-actions">
        <button className="btn btn-outline btn-sm" onClick={handleOpenDashboard}>
          <ExternalLink size={16} />
          Stripe Dashboard
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => { loadStatus(); onRefresh?.(); }}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
    </div>
  );
}
