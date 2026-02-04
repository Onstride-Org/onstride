import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    login,
    verify2FA,
    resend2FA,
    clearTwoFactor,
    isLoading,
    error,
    clearError,
    twoFactor,
    setShowPaymentPrompt,
    setShowOnboarding,
  } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from account setup
  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setSuccessMessage(state.message);
      if (state.email) {
        setEmail(state.email);
      }
      // Clear the state so message doesn't persist on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    try {
      const result = await login(email, password);
      if (!result?.requiresTwoFactor) {
        // Check if user just came from account setup (new signup flow)
        const state = location.state as { message?: string } | null;
        if (state?.message?.includes('created successfully')) {
          // Show payment prompt for new users
          setShowPaymentPrompt(true);
          setShowOnboarding(true);
        }
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      // Check for email not verified error
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verification-required', {
          state: { email: err.response.data.email || email }
        });
        return;
      }
      // Other errors are handled by the store
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await verify2FA(verificationCode);
      navigate('/app/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await resend2FA();
      // Start cooldown
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
    } catch {
      // Error is handled by the store
    }
  };

  const handleBackToLogin = () => {
    clearTwoFactor();
    setVerificationCode('');
  };

  // Show 2FA verification form
  if (twoFactor.required) {
    return (
      <div className="auth-form-container">
        <button
          type="button"
          className="auth-close-btn"
          onClick={handleBackToLogin}
          aria-label="Back to login"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 className="auth-form-title">Verify Your Identity</h2>
        <p className="auth-form-subtitle">
          We sent a verification code to your phone ending in {twoFactor.phoneLastFour}
        </p>

        <form onSubmit={handleVerify2FA} className="auth-form">
          {error && (
            <div className="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
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
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              style={{ fontSize: '1.5rem', letterSpacing: '0.5em' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading || verificationCode.length < 4}
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm"></span>
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </button>

          <div className="form-row justify-center mt-4">
            <button
              type="button"
              className="btn btn-link"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't receive code? Resend"}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <button onClick={handleBackToLogin} className="link">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Show regular login form
  return (
    <div className="auth-form-container">
      <Link to="/" className="auth-close-btn" aria-label="Back to home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Link>
      <h2 className="auth-form-title">Welcome Back</h2>
      <p className="auth-form-subtitle">Sign in to manage your barn</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {successMessage && (
          <div className="alert alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

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
          <label htmlFor="password" className="form-label">Password</label>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
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

        <div className="form-row">
          <Link to="/forgot-password" className="link">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner spinner-sm"></span>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account?{' '}
          <Link to="/register" className="link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
