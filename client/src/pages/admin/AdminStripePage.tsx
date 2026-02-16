import { useState, useEffect } from 'react';
import {
  CreditCard, Check, X, AlertCircle, RefreshCw,
  Eye, EyeOff, DollarSign, TrendingUp, ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

interface StripeConfig {
  source: 'environment' | 'database';
  stripe: {
    publishableKey: string | null;
    secretKeyMasked: string | null;
    webhookSecretConfigured: boolean;
    platformFeePercent: number;
    isConfigured: boolean;
    lastTestedAt: string | null;
    testResult: {
      success: boolean;
      message: string;
      testedAt: string;
    } | null;
  };
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
}

interface StripeDashboard {
  balance: {
    available: { amount: number; currency: string }[];
    pending: { amount: number; currency: string }[];
  };
  recentPayments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    description: string;
  }[];
  recentPayouts: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrivalDate: string;
  }[];
}

export default function AdminStripePage() {
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [dashboard, setDashboard] = useState<StripeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [secretKey, setSecretKey] = useState('');
  const [publishableKey, setPublishableKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [platformFeePercent, setPlatformFeePercent] = useState('2.5');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
  });

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${apiBase}/admin/stripe/config`, {
        headers: getHeaders(),
      });

      setConfig(response.data);
      setPlatformFeePercent(response.data.stripe.platformFeePercent?.toString() || '2.5');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load Stripe configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${apiBase}/admin/stripe/dashboard`, {
        headers: getHeaders(),
      });
      setDashboard(response.data);
    } catch (err) {
      // Silently fail - dashboard is optional
      console.error('Failed to load Stripe dashboard:', err);
    }
  };

  useEffect(() => {
    loadConfig();
    loadDashboard();
  }, []);

  const handleTest = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const response = await axios.post(`${apiBase}/admin/stripe/test`, {}, {
        headers: getHeaders(),
      });

      if (response.data.success) {
        setSuccess(`Connected to Stripe: ${response.data.account.name || response.data.account.id}`);
        loadConfig();
        loadDashboard();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey && !publishableKey) {
      setError('Please enter at least one key to update');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const data: any = {};
      if (secretKey) data.secretKey = secretKey;
      if (publishableKey) data.publishableKey = publishableKey;
      if (webhookSecret) data.webhookSecret = webhookSecret;
      data.platformFeePercent = parseFloat(platformFeePercent);

      await axios.put(`${apiBase}/admin/stripe/config`, data, {
        headers: getHeaders(),
      });

      setSuccess('Stripe configuration updated successfully');
      setSecretKey('');
      setPublishableKey('');
      setWebhookSecret('');
      loadConfig();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear Stripe configuration from database? The system will use environment variables if available.')) {
      return;
    }

    try {
      setSaving(true);
      await axios.delete(`${apiBase}/admin/stripe/config`, {
        headers: getHeaders(),
      });
      setSuccess('Configuration cleared');
      loadConfig();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear configuration');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Loading Stripe configuration...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CreditCard size={28} />
          Stripe Configuration
        </h1>
        <p style={{ color: '#737373', marginTop: '8px', fontSize: '14px' }}>
          Configure Stripe API credentials for SaaS subscription payments
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: '#450a0a',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#fca5a5'
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#052e16',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#86efac'
        }}>
          <Check size={18} />
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Current Status Card */}
        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
            Current Status
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Configuration Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Status</span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: config?.stripe.isConfigured ? '#22c55e' : '#ef4444',
                fontSize: '14px',
                fontWeight: 500
              }}>
                {config?.stripe.isConfigured ? <Check size={16} /> : <X size={16} />}
                {config?.stripe.isConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>

            {/* Source */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Source</span>
              <span style={{
                background: config?.source === 'database' ? '#1e3a5f' : '#3f3f46',
                color: config?.source === 'database' ? '#60a5fa' : '#a1a1aa',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {config?.source === 'database' ? 'Database' : 'Environment'}
              </span>
            </div>

            {/* Publishable Key */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Publishable Key</span>
              <span style={{ color: '#d4d4d4', fontSize: '13px', fontFamily: 'monospace' }}>
                {config?.stripe.publishableKey ? `${config.stripe.publishableKey.slice(0, 12)}...` : 'Not set'}
              </span>
            </div>

            {/* Secret Key */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Secret Key</span>
              <span style={{ color: '#d4d4d4', fontSize: '13px', fontFamily: 'monospace' }}>
                {config?.stripe.secretKeyMasked || 'Not set'}
              </span>
            </div>

            {/* Webhook Secret */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Webhook Secret</span>
              <span style={{
                color: config?.stripe.webhookSecretConfigured ? '#22c55e' : '#ef4444',
                fontSize: '14px'
              }}>
                {config?.stripe.webhookSecretConfigured ? 'Configured' : 'Not set'}
              </span>
            </div>

            {/* Platform Fee */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Platform Fee</span>
              <span style={{ color: '#d4d4d4', fontSize: '14px' }}>
                {config?.stripe.platformFeePercent}%
              </span>
            </div>

            {/* Last Test */}
            {config?.stripe.testResult && (
              <div style={{
                marginTop: '8px',
                padding: '12px',
                background: config.stripe.testResult.success ? '#052e16' : '#450a0a',
                borderRadius: '8px',
                border: `1px solid ${config.stripe.testResult.success ? '#22c55e' : '#dc2626'}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: config.stripe.testResult.success ? '#86efac' : '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '4px'
                }}>
                  {config.stripe.testResult.success ? <Check size={14} /> : <X size={14} />}
                  Last Test: {config.stripe.testResult.success ? 'Passed' : 'Failed'}
                </div>
                <div style={{ color: '#a3a3a3', fontSize: '12px' }}>
                  {config.stripe.testResult.message}
                </div>
                <div style={{ color: '#525252', fontSize: '11px', marginTop: '4px' }}>
                  {new Date(config.stripe.testResult.testedAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Test Button */}
            <button
              onClick={handleTest}
              disabled={testing || !config?.stripe.isConfigured}
              style={{
                marginTop: '8px',
                padding: '10px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: testing || !config?.stripe.isConfigured ? 'not-allowed' : 'pointer',
                opacity: testing || !config?.stripe.isConfigured ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {testing ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Test Connection
                </>
              )}
            </button>
          </div>
        </div>

        {/* Update Credentials Card */}
        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
            Update Credentials
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Secret Key */}
            <div>
              <label style={{ display: 'block', color: '#a3a3a3', fontSize: '13px', marginBottom: '6px' }}>
                Secret Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="sk_live_xxx or sk_test_xxx"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#525252',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Publishable Key */}
            <div>
              <label style={{ display: 'block', color: '#a3a3a3', fontSize: '13px', marginBottom: '6px' }}>
                Publishable Key
              </label>
              <input
                type="text"
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder="pk_live_xxx or pk_test_xxx"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* Webhook Secret */}
            <div>
              <label style={{ display: 'block', color: '#a3a3a3', fontSize: '13px', marginBottom: '6px' }}>
                Webhook Secret
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="whsec_xxx"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #262626',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#525252',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showWebhookSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Platform Fee */}
            <div>
              <label style={{ display: 'block', color: '#a3a3a3', fontSize: '13px', marginBottom: '6px' }}>
                Platform Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={saving || config?.source !== 'database'}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: saving || config?.source !== 'database' ? 'not-allowed' : 'pointer',
                  opacity: saving || config?.source !== 'database' ? 0.5 : 1
                }}
              >
                Clear
              </button>
            </div>
          </form>

          <p style={{ color: '#525252', fontSize: '12px', marginTop: '16px' }}>
            Get your API keys from{' '}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              Stripe Dashboard <ArrowUpRight size={12} style={{ display: 'inline' }} />
            </a>
          </p>
        </div>
      </div>

      {/* Dashboard Section */}
      {dashboard && config?.stripe.isConfigured && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Stripe Dashboard
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {/* Available Balance */}
            <div style={{
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} style={{ color: '#22c55e' }} />
                <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Available</span>
              </div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 600 }}>
                {dashboard.balance.available.length > 0
                  ? formatCurrency(dashboard.balance.available[0].amount, dashboard.balance.available[0].currency)
                  : '$0.00'}
              </div>
            </div>

            {/* Pending Balance */}
            <div style={{
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} style={{ color: '#f59e0b' }} />
                <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Pending</span>
              </div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 600 }}>
                {dashboard.balance.pending.length > 0
                  ? formatCurrency(dashboard.balance.pending[0].amount, dashboard.balance.pending[0].currency)
                  : '$0.00'}
              </div>
            </div>

            {/* Recent Payments Count */}
            <div style={{
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CreditCard size={18} style={{ color: '#3b82f6' }} />
                <span style={{ color: '#a3a3a3', fontSize: '14px' }}>Recent Payments</span>
              </div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 600 }}>
                {dashboard.recentPayments.length}
              </div>
            </div>
          </div>

          {/* Recent Payments Table */}
          {dashboard.recentPayments.length > 0 && (
            <div style={{
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #262626' }}>
                <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                  Recent Payments
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #262626' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#737373', fontSize: '12px', fontWeight: 500 }}>ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#737373', fontSize: '12px', fontWeight: 500 }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#737373', fontSize: '12px', fontWeight: 500 }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#737373', fontSize: '12px', fontWeight: 500 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentPayments.map((payment) => (
                      <tr key={payment.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                        <td style={{ padding: '12px 16px', color: '#a3a3a3', fontSize: '13px', fontFamily: 'monospace' }}>
                          {payment.id.slice(0, 20)}...
                        </td>
                        <td style={{ padding: '12px 16px', color: 'white', fontSize: '14px' }}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: payment.status === 'succeeded' ? '#052e16' : '#451a03',
                            color: payment.status === 'succeeded' ? '#22c55e' : '#f59e0b'
                          }}>
                            {payment.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#737373', fontSize: '13px' }}>
                          {new Date(payment.created).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #525252;
        }
      `}</style>
    </div>
  );
}
