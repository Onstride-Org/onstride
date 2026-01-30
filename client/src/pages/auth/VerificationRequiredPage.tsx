import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi, setTokens, setCurrentBarn } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function VerificationRequiredPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setBarns, setCurrentBarnId } = useAuthStore();
  const email = location.state?.email || '';
  const isNewRegistration = location.state?.isNewRegistration || false;
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll to check if email has been verified on another device
  useEffect(() => {
    if (!email) return;

    const checkVerificationStatus = async () => {
      if (isChecking) return;
      setIsChecking(true);

      try {
        const result = await authApi.checkVerificationStatus(email);
        if (result.verified) {
          // User verified on another device - log them in
          if (result.accessToken && result.refreshToken) {
            setTokens(result.accessToken, result.refreshToken);
            setUser(result.user);
            setBarns(result.barns || []);
            if (result.barns && result.barns.length > 0) {
              const primaryBarn = result.barns.find((b: any) => b.isPrimary) || result.barns[0];
              setCurrentBarn(primaryBarn.barnId);
              setCurrentBarnId(primaryBarn.barnId);
            }
            navigate('/app/dashboard', { replace: true });
          }
        }
      } catch (err) {
        // Silently fail - just keep polling
        console.log('Verification check failed, will retry');
      } finally {
        setIsChecking(false);
      }
    };

    // Check immediately and then every 5 seconds
    checkVerificationStatus();
    pollIntervalRef.current = setInterval(checkVerificationStatus, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [email, navigate, setUser, setBarns, setCurrentBarnId]);

  const handleResend = async () => {
    if (!email) {
      setError('No email address available. Please try logging in again.');
      return;
    }

    setIsResending(true);
    setMessage('');
    setError('');

    try {
      await authApi.resendVerificationEmail(email);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-verify">
        <div className="verify-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <h2 className="auth-form-title">
          {isNewRegistration ? 'Check Your Email' : 'Verify Your Email'}
        </h2>

        <p className="auth-form-subtitle">
          {isNewRegistration
            ? "We've sent a verification email to:"
            : 'Your email is not yet verified. Please check your inbox:'}
        </p>

        {email && (
          <p className="email-display">{email}</p>
        )}

        <p className="auth-form-subtitle">
          Click the link in the email to verify your account and start using OnStride.
        </p>

        {message && (
          <div className="alert alert-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
            <span>{message}</span>
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

        <div className="verify-actions">
          <button
            type="button"
            className="btn btn-outline btn-block"
            onClick={handleResend}
            disabled={isResending || !email}
          >
            {isResending ? (
              <>
                <span className="spinner spinner-sm"></span>
                Sending...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Resend Email
              </>
            )}
          </button>
        </div>

        <div className="auth-footer">
          <p>
            <Link to="/login" className="link">
              Back to Login
            </Link>
          </p>
          <p className="help-text">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );
}
