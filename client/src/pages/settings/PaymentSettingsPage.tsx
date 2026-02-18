import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, Plus, Trash2, ExternalLink, CheckCircle,
  AlertCircle, RefreshCw, Shield, Wallet, X, Lock
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripeApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { SavedPaymentMethod, StripeConnectStatus } from '../../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function AddPaymentMethodForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/app/settings/payments?setup=success`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Failed to save payment method');
        setIsProcessing(false);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save payment method');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement onReady={() => setIsReady(true)} options={{ layout: 'tabs' }} />

      {error && (
        <div className="alert alert-error mt-3">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="payment-security" style={{ marginTop: '12px' }}>
        <Lock size={14} />
        <span>Your payment info is secured with 256-bit encryption</span>
      </div>

      <div className="form-actions" style={{ marginTop: '16px' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!stripe || !elements || !isReady || isProcessing}>
          {isProcessing ? 'Saving...' : 'Save Payment Method'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentSettingsPage() {
  const { currentBarnRole } = useAuthStore();
  const isStaff = currentBarnRole && !['boarder'].includes(currentBarnRole.role);

  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConnect, setIsLoadingConnect] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [isInitializingSetup, setIsInitializingSetup] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
    if (isStaff) {
      loadConnectStatus();
    } else {
      setIsLoadingConnect(false);
    }
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const result = await stripeApi.getPaymentMethods();
      setPaymentMethods(result.paymentMethods || []);
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnectStatus = async () => {
    try {
      const result = await stripeApi.getConnectStatus();
      setConnectStatus(result);
    } catch (err) {
      console.error('Failed to load connect status:', err);
    } finally {
      setIsLoadingConnect(false);
    }
  };

  const handleStartOnboarding = async () => {
    setIsOnboarding(true);
    setError(null);
    try {
      const result = connectStatus?.connected
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

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Stripe account? You can reconnect later.')) return;
    try {
      await stripeApi.disconnectAccount();
      setSuccess('Stripe account disconnected');
      loadConnectStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect');
    }
  };

  const handleAddPaymentMethod = async () => {
    setIsInitializingSetup(true);
    setError(null);
    try {
      // Ensure user has a Stripe customer first
      await stripeApi.createCustomer();
      const result = await stripeApi.createSetupIntent();
      setSetupClientSecret(result.clientSecret);
      setShowAddForm(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize. Please try again.');
    } finally {
      setIsInitializingSetup(false);
    }
  };

  const handlePaymentMethodAdded = () => {
    setShowAddForm(false);
    setSetupClientSecret(null);
    setSuccess('Payment method saved successfully');
    loadPaymentMethods();
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Remove this payment method?')) return;
    setDeletingId(paymentMethodId);
    try {
      await stripeApi.deletePaymentMethod(paymentMethodId);
      setSuccess('Payment method removed');
      loadPaymentMethods();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const getCardIcon = (brand: string) => {
    const brandMap: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      diners: 'Diners Club',
      jcb: 'JCB',
      unionpay: 'UnionPay',
    };
    return brandMap[brand] || brand;
  };

  if (isLoading && isLoadingConnect) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page payment-settings-page">
      <div className="page-header">
        <Link to="/app/settings" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="page-title">Payment Settings</h1>
        <p className="page-subtitle">Manage your payment methods and Stripe connection</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-4">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setSuccess(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="settings-content">
        {/* Stripe Connect - Only for barn owners/managers */}
        {isStaff && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Wallet size={20} />
                Stripe Connect - Accept Payments
              </h3>
            </div>
            <div className="card-body">
              {isLoadingConnect ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div className="spinner spinner-md"></div>
                </div>
              ) : connectStatus?.connected ? (
                <div>
                  <div className="stripe-connect-status">
                    <div className="stripe-status-row">
                      <span className="stripe-status-label">Account</span>
                      <span className="stripe-status-value">
                        <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                        Connected
                      </span>
                    </div>
                    <div className="stripe-status-row">
                      <span className="stripe-status-label">Charges</span>
                      <span className={`stripe-status-value ${connectStatus.chargesEnabled ? 'text-success' : 'text-warning'}`}>
                        {connectStatus.chargesEnabled ? 'Enabled' : 'Pending Setup'}
                      </span>
                    </div>
                    <div className="stripe-status-row">
                      <span className="stripe-status-label">Payouts</span>
                      <span className={`stripe-status-value ${connectStatus.payoutsEnabled ? 'text-success' : 'text-warning'}`}>
                        {connectStatus.payoutsEnabled ? 'Enabled' : 'Pending Setup'}
                      </span>
                    </div>
                  </div>

                  <div className="form-actions" style={{ marginTop: '16px' }}>
                    {connectStatus.requiresAction && (
                      <button className="btn btn-primary" onClick={handleStartOnboarding} disabled={isOnboarding}>
                        {isOnboarding ? 'Loading...' : 'Complete Setup'}
                      </button>
                    )}
                    {connectStatus.chargesEnabled && (
                      <button className="btn btn-outline" onClick={handleOpenDashboard}>
                        <ExternalLink size={16} />
                        Stripe Dashboard
                      </button>
                    )}
                    <button className="btn btn-outline btn-danger" onClick={handleDisconnect}>
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-muted mb-4">
                    Connect your barn to Stripe to accept credit card and bank payments from clients.
                    Funds are deposited directly into your bank account.
                  </p>
                  <div className="stripe-connect-features">
                    <div className="stripe-feature">
                      <CreditCard size={18} />
                      <span>Accept credit/debit cards and ACH bank transfers</span>
                    </div>
                    <div className="stripe-feature">
                      <Shield size={18} />
                      <span>PCI-compliant secure payment processing</span>
                    </div>
                    <div className="stripe-feature">
                      <Wallet size={18} />
                      <span>Automatic payouts to your bank account</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleStartOnboarding}
                    disabled={isOnboarding}
                    style={{ marginTop: '16px' }}
                  >
                    {isOnboarding ? (
                      <>
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Connect with Stripe
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Payment Methods */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CreditCard size={20} />
              Saved Payment Methods
            </h3>
            {!showAddForm && (
              <button
                className="btn btn-outline btn-sm"
                onClick={handleAddPaymentMethod}
                disabled={isInitializingSetup}
              >
                {isInitializingSetup ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Plus size={16} />
                )}
                Add Method
              </button>
            )}
          </div>
          <div className="card-body">
            {/* Add Payment Method Form */}
            {showAddForm && setupClientSecret && (
              <div className="add-payment-form" style={{ marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '16px' }}>Add Payment Method</h4>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: setupClientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#405D4B',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      },
                    },
                  }}
                >
                  <AddPaymentMethodForm
                    onSuccess={handlePaymentMethodAdded}
                    onCancel={() => {
                      setShowAddForm(false);
                      setSetupClientSecret(null);
                    }}
                  />
                </Elements>
              </div>
            )}

            {/* Existing Payment Methods */}
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div className="spinner spinner-md"></div>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="empty-state-small">
                <CreditCard size={32} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p>No saved payment methods</p>
                <p className="text-muted" style={{ fontSize: '13px' }}>
                  Add a card to make invoice payments faster
                </p>
              </div>
            ) : (
              <div className="payment-methods-list">
                {paymentMethods.map((method) => (
                  <div key={method.paymentMethodId} className="payment-method-item">
                    <div className="payment-method-info">
                      <div className="payment-method-icon">
                        <CreditCard size={20} />
                      </div>
                      <div className="payment-method-details">
                        <span className="payment-method-brand">
                          {method.card ? getCardIcon(method.card.brand) : method.type}
                        </span>
                        {method.card && (
                          <span className="payment-method-number">
                            ending in {method.card.last4}
                          </span>
                        )}
                        {method.card && (
                          <span className="payment-method-expiry">
                            Exp {String(method.card.expMonth).padStart(2, '0')}/{method.card.expYear}
                          </span>
                        )}
                      </div>
                      {method.isDefault && (
                        <span className="badge badge-success badge-sm">Default</span>
                      )}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-danger"
                      onClick={() => handleDeletePaymentMethod(method.paymentMethodId)}
                      disabled={deletingId === method.paymentMethodId}
                    >
                      {deletingId === method.paymentMethodId ? (
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Shield size={20} />
              Payment Security
            </h3>
          </div>
          <div className="card-body">
            <div className="security-info">
              <p>
                All payments are processed securely through Stripe. Your card details are never stored
                on our servers - they are encrypted and held securely by Stripe, a PCI Level 1
                certified payment processor.
              </p>
              <div className="security-badges" style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span className="badge badge-outline">
                  <Lock size={12} /> PCI DSS Compliant
                </span>
                <span className="badge badge-outline">
                  <Shield size={12} /> 256-bit Encryption
                </span>
                <span className="badge badge-outline">
                  <CreditCard size={12} /> Stripe Secured
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
