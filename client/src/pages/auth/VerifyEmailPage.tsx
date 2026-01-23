import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authApi, setTokens, setCurrentBarn } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        setStatus('success');

        // If response includes tokens, auto-login the user
        if (response.accessToken && response.refreshToken) {
          setTokens(response.accessToken, response.refreshToken);

          // Set primary barn
          const primaryBarn = response.barns?.find((b: any) => b.isPrimary);
          if (primaryBarn) {
            setCurrentBarn(primaryBarn.id);
          }

          const currentBarn = primaryBarn || response.barns?.[0];

          // Update auth store directly
          useAuthStore.setState({
            user: response.user,
            barns: response.barns || [],
            currentBarnId: currentBarn?.id || null,
            currentBarnRole: currentBarn?.role ? { role: currentBarn.role } : null,
            isAuthenticated: true,
            isLoading: false,
          });

          // Redirect to dashboard after brief success message
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          // Fallback to login if no tokens
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.error || 'Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="auth-form-container">
        <div className="auth-loading">
          <div className="spinner spinner-lg"></div>
          <h2 className="auth-form-title">Verifying your email...</h2>
          <p className="auth-form-subtitle">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-form-container">
        <div className="auth-success">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          </div>
          <h2 className="auth-form-title">Email Verified!</h2>
          <p className="auth-form-subtitle">
            Your email has been successfully verified. Taking you to your dashboard...
          </p>
          <Link to="/dashboard" className="btn btn-primary btn-block mt-4">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <div className="auth-error">
        <div className="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="auth-form-title">Verification Failed</h2>
        <p className="auth-form-subtitle">{error}</p>
        <p className="auth-form-subtitle">
          The link may have expired or already been used.
        </p>
        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <Link to="/login" className="btn btn-primary btn-block">
            Go to Login
          </Link>
          <p style={{ marginTop: '1rem' }}>
            Need a new verification link?{' '}
            <Link to="/login" className="link">
              Try logging in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
