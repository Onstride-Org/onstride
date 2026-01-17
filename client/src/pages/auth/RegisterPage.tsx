import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';
import { Shield } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [barnName, setBarnName] = useState('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // 2FA setup state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    if (!phoneNumber) {
      setValidationError('Phone number is required');
      return;
    }

    if (!barnName.trim()) {
      setValidationError('Barn name is required');
      return;
    }

    try {
      await register({ email, password, name, phoneNumber, barnName: barnName.trim() });

      // If user wants 2FA, show setup screen
      if (enable2FA) {
        setShow2FASetup(true);
        // Send verification code
        try {
          await authApi.send2FACode();
          startResendCooldown();
        } catch (err) {
          console.error('Failed to send 2FA code:', err);
        }
      } else {
        navigate('/dashboard');
      }
    } catch {
      // Error is handled by the store
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

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setValidationError('');

    try {
      await authApi.enable2FA(verificationCode);
      navigate('/dashboard');
    } catch (err: any) {
      setValidationError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.send2FACode();
      startResendCooldown();
    } catch (err: any) {
      setValidationError(err.response?.data?.error || 'Failed to resend code');
    }
  };

  const handleSkip2FA = () => {
    navigate('/dashboard');
  };

  const displayError = validationError || error;

  // Show 2FA setup screen after registration
  if (show2FASetup) {
    const maskedPhone = phoneNumber.slice(-4);

    return (
      <div className="auth-form-container">
        <div className="flex justify-center mb-4">
          <div className="icon-box icon-box-lg">
            <Shield size={32} />
          </div>
        </div>
        <h2 className="auth-form-title">Set Up Two-Factor Authentication</h2>
        <p className="auth-form-subtitle">
          We sent a verification code to your phone ending in ***{maskedPhone}
        </p>

        <form onSubmit={handleVerify2FA} className="auth-form">
          {validationError && (
            <div className="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="code" className="form-label">Verification Code</label>
            <input
              type="text"
              id="code"
              className="form-input text-center"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              style={{ fontSize: '1.5rem', letterSpacing: '0.5em' }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isVerifying || verificationCode.length < 4}
          >
            {isVerifying ? (
              <>
                <span className="spinner spinner-sm"></span>
                Verifying...
              </>
            ) : (
              'Enable 2FA & Continue'
            )}
          </button>

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              className="btn btn-link text-sm"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || isVerifying}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              className="btn btn-link text-sm"
              onClick={handleSkip2FA}
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <h2 className="auth-form-title">Create Account</h2>
      <p className="auth-form-subtitle">Start managing your barn today</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {displayError && (
          <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{displayError}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name" className="form-label">Full Name</label>
          <input
            type="text"
            id="name"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            className="form-input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="(555) 123-4567"
            autoComplete="tel"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="barnName" className="form-label">Barn Name *</label>
          <input
            type="text"
            id="barnName"
            className="form-input"
            value={barnName}
            onChange={(e) => setBarnName(e.target.value)}
            placeholder="Your barn or stable name"
            required
          />
          <p className="form-hint">This will be the name displayed to your clients and staff</p>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="input-addon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
          />
        </div>

        {/* 2FA Option */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={(e) => setEnable2FA(e.target.checked)}
              className="checkbox"
            />
            <span className="checkbox-text">
              <Shield size={16} className="inline mr-1" />
              Enable two-factor authentication
            </span>
          </label>
          <p className="form-hint">
            Add extra security by requiring a code sent to your phone when signing in
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner spinner-sm"></span>
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
