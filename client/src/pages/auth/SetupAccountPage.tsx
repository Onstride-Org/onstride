import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { clearTokens, clearCurrentBarn } from '../../services/api';

interface SignupData {
  id: string;
  name: string;
  email: string;
  barnName?: string;
  discipline?: string;
  horseCount?: string;
  accountType?: string;
}

export default function SetupAccountPage() {
  const { token: paramToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const token = paramToken || queryToken;
  const isAdminInvite = !!queryToken && !paramToken;
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [signupData, setSignupData] = useState<SignupData | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid verification link');
        setIsLoading(false);
        return;
      }

      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        // Use different endpoint for admin invites vs demo requests
        const endpoint = isAdminInvite
          ? `${apiBase}/auth/verify-setup-token/${token}`
          : `${apiBase}/demo-requests/verify/${token}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid or expired verification link');
          setIsLoading(false);
          return;
        }

        setSignupData(data.data);
        // Pre-fill name if available
        if (data.data?.name) {
          setName(data.data.name);
        }
      } catch (err) {
        setError('Failed to verify link. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token, isAdminInvite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (isAdminInvite && !signupData?.name && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      // Use different endpoint for admin invites vs demo requests
      const endpoint = isAdminInvite
        ? `${apiBase}/auth/complete-setup`
        : `${apiBase}/demo-requests/complete-signup`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          termsAccepted: true,
          ...(isAdminInvite && name && { name }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      setSuccess(true);

      // Clear any existing session before redirecting to login
      clearTokens();
      clearCurrentBarn();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Account created successfully! Please sign in.',
            email: signupData?.email
          }
        });
      }, 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-loading">
              <Loader2 size={40} className="animate-spin" />
              <p>Verifying your link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !signupData) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-error-state">
              <AlertCircle size={48} className="error-icon" />
              <h2>Link Invalid or Expired</h2>
              <p>{error}</p>
              <p className="auth-helper-text">
                Please request a new signup link or contact support if you need help.
              </p>
              <Link to="/" className="btn btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-success-state">
              <div className="success-icon-wrapper">
                <Check size={48} />
              </div>
              <h2>Account Created!</h2>
              <p>Your account has been set up successfully.</p>
              <p className="auth-helper-text">Redirecting you to sign in...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <span className="logo-text">OnStride</span>
            </Link>
            <h1>Complete Your Account</h1>
            <p>Set a password to finish setting up your account</p>
          </div>

          {signupData && (
            <div className="signup-info-card">
              {signupData.name && (
                <div className="signup-info-row">
                  <span className="signup-info-label">Name</span>
                  <span className="signup-info-value">{signupData.name}</span>
                </div>
              )}
              <div className="signup-info-row">
                <span className="signup-info-label">Email</span>
                <span className="signup-info-value">{signupData.email}</span>
              </div>
              {signupData.barnName && (
                <div className="signup-info-row">
                  <span className="signup-info-label">Barn</span>
                  <span className="signup-info-value">{signupData.barnName}</span>
                </div>
              )}
              {signupData.accountType && (
                <div className="signup-info-row">
                  <span className="signup-info-label">Role</span>
                  <span className="signup-info-value" style={{ textTransform: 'capitalize' }}>{signupData.accountType}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Show name input for admin invites if name wasn't provided */}
            {isAdminInvite && !signupData?.name && (
              <div className="form-group">
                <label htmlFor="name" className="form-label">Your Name</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-with-icon">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="form-hint">Must be at least 8 characters</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  I agree to the{' '}
                  <a href="/OnStride_Full_Privacy_Policy.pdf" target="_blank" rel="noopener noreferrer" className="link" onClick={(e) => e.stopPropagation()}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/OnStride_Full_Privacy_Policy.pdf" target="_blank" rel="noopener noreferrer" className="link" onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={isSubmitting || !termsAccepted}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
