import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Smartphone, Check, X, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface TwoFactorStatus {
  twoFactorEnabled: boolean;
  twoFactorMethod: string | null;
  phoneVerified: boolean;
  phoneNumber: string | null;
  isConfigured: boolean;
}

export default function SecurityPage() {
  const { user, loadUser } = useAuthStore();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await authApi.get2FAStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleEnabled = () => {
    setShowEnableModal(false);
    loadStatus();
    loadUser();
  };

  const handleDisabled = () => {
    setShowDisableModal(false);
    loadStatus();
    loadUser();
  };

  if (isLoading) {
    return (
      <div className="page security-page">
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page security-page">
      <div className="page-header">
        <Link to="/settings" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="page-title">Security</h1>
      </div>

      <div className="security-content">
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Two-Factor Authentication Card */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="icon-box">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="card-title">Two-Factor Authentication</h3>
                <p className="text-muted text-sm">Add an extra layer of security to your account</p>
              </div>
            </div>
            {status?.twoFactorEnabled ? (
              <span className="badge badge-success">Enabled</span>
            ) : (
              <span className="badge badge-neutral">Disabled</span>
            )}
          </div>
          <div className="card-content">
            {!status?.isConfigured ? (
              <div className="alert alert-warning">
                <AlertCircle size={20} />
                <span>Two-factor authentication is not available. Please contact support.</span>
              </div>
            ) : status?.twoFactorEnabled ? (
              <div className="two-factor-enabled">
                <div className="two-factor-status">
                  <div className="status-item">
                    <Smartphone size={20} />
                    <div>
                      <p className="font-medium">SMS Verification</p>
                      <p className="text-muted text-sm">
                        Codes sent to {status.phoneNumber}
                      </p>
                    </div>
                    <Check size={20} className="text-success" />
                  </div>
                </div>
                <p className="text-muted mt-4">
                  When you sign in, you'll need to enter a verification code sent to your phone.
                </p>
                <button
                  className="btn btn-outline btn-danger mt-4"
                  onClick={() => setShowDisableModal(true)}
                >
                  Disable Two-Factor Authentication
                </button>
              </div>
            ) : (
              <div className="two-factor-disabled">
                <p className="mb-4">
                  Two-factor authentication adds an extra layer of security to your account.
                  When enabled, you'll need to enter a verification code sent to your phone
                  each time you sign in.
                </p>
                {!user?.phoneNumber ? (
                  <div className="alert alert-warning mb-4">
                    <AlertCircle size={20} />
                    <span>
                      Please add a phone number to your profile before enabling 2FA.{' '}
                      <Link to="/settings/profile" className="link">Update Profile</Link>
                    </span>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowEnableModal(true)}
                  >
                    Enable Two-Factor Authentication
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Sessions Card (placeholder for future) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Active Sessions</h3>
          </div>
          <div className="card-content">
            <p className="text-muted">
              You're currently signed in on this device. Session management coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* Enable 2FA Modal */}
      {showEnableModal && (
        <Enable2FAModal
          phoneNumber={user?.phoneNumber || ''}
          onClose={() => setShowEnableModal(false)}
          onSuccess={handleEnabled}
        />
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <Disable2FAModal
          onClose={() => setShowDisableModal(false)}
          onSuccess={handleDisabled}
        />
      )}
    </div>
  );
}

function Enable2FAModal({
  phoneNumber,
  onClose,
  onSuccess,
}: {
  phoneNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      await authApi.send2FACode();
      setStep('verify');
      startResendCooldown();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authApi.enable2FA(code);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await handleSendCode();
  };

  const maskedPhone = phoneNumber.slice(-4);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Enable Two-Factor Authentication</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {step === 'send' ? (
            <>
              <p className="mb-4">
                We'll send a verification code to your phone number ending in <strong>***{maskedPhone}</strong>.
              </p>
              <p className="text-muted text-sm mb-4">
                Make sure you have access to this phone to receive SMS messages.
              </p>
            </>
          ) : (
            <form onSubmit={handleVerify}>
              <p className="mb-4">
                Enter the 6-digit code sent to your phone ending in <strong>***{maskedPhone}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <input
                  type="text"
                  className="form-input text-center"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  style={{ fontSize: '1.25rem', letterSpacing: '0.3em' }}
                  autoFocus
                />
              </div>
              <button
                type="button"
                className="btn btn-link text-sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive code? Resend"}
              </button>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          {step === 'send' ? (
            <button
              className="btn btn-primary"
              onClick={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleVerify}
              disabled={isLoading || code.length < 4}
            >
              {isLoading ? 'Verifying...' : 'Enable 2FA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Disable2FAModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authApi.disable2FA(password);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Disable Two-Factor Authentication</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="alert alert-warning mb-4">
              <AlertCircle size={20} />
              <span>
                Disabling 2FA will make your account less secure. Are you sure you want to continue?
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Enter your password to confirm</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
