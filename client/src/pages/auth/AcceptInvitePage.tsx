import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invitationsApi, setTokens, setCurrentBarn } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface InviteDetails {
  barnName: string;
  role: string;
  inviterName: string;
  email: string;
}

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loadUser } = useAuthStore();

  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        const response = await invitationsApi.validate(token);
        setInviteDetails(response);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired invitation');
      } finally {
        setIsLoading(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    if (!token) {
      setError('Invalid invitation');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await invitationsApi.accept(token, { name, password });

      if (response.accessToken) {
        setTokens(response.accessToken, response.refreshToken);
        if (response.barnId) {
          setCurrentBarn(response.barnId);
        }
      }

      await loadUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-form-container">
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteDetails) {
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
          <h2 className="auth-form-title">Invalid Invitation</h2>
          <p className="auth-form-subtitle">{error}</p>
          <Link to="/login" className="btn btn-primary btn-block mt-4">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-form-container">
      <h2 className="auth-form-title">Join {inviteDetails?.barnName}</h2>
      <p className="auth-form-subtitle">
        {inviteDetails?.inviterName} has invited you to join as a{' '}
        <strong>{inviteDetails?.role}</strong>
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
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
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={inviteDetails?.email || ''}
            disabled
          />
        </div>

        {!isAuthenticated && (
          <>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Your Name</label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                autoComplete="name"
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
          </>
        )}

        {isAuthenticated && (
          <div className="alert alert-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>You're already signed in. Click accept to join this barn.</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner spinner-sm"></span>
              Accepting...
            </>
          ) : (
            'Accept Invitation'
          )}
        </button>
      </form>

      {!isAuthenticated && (
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link">
              Sign in first
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
