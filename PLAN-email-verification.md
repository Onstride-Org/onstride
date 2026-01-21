# Email Verification Implementation Plan

## Overview
Implement email verification for new user signups and existing unverified users on login. Uses SendGrid for email delivery.

---

## Current State (What Already Exists)

### User Model (`server/src/models/User.js`)
- `emailVerified: Boolean` (default: false)
- `emailVerificationToken: String`
- `emailVerificationExpires: Date`

### Backend Route (`server/src/routes/auth.js`)
- `POST /auth/verify-email` endpoint already exists (lines 442-469)
- Uses same pattern as password reset (crypto token hashing)

### Client API (`client/src/services/api.ts`)
- `authApi.verifyEmail(token)` method already exists (line 160)

### Email Service (`server/src/services/email.js`)
- SendGrid configured and working
- Templates exist for welcome, password reset, invitations, invoices

---

## Implementation Steps

### 1. Backend: Add Email Verification Email Function

**File:** `server/src/services/email.js`

Add new function:
```javascript
const sendEmailVerificationEmail = async ({ to, name, token }) => {
  const verifyUrl = `${CLIENT_URL}/verify-email/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Hi ${name},</p>
      <p>Thanks for signing up for OnStride! Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `;

  const text = `Hi ${name},\n\nVerify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`;

  return sendEmail({
    to,
    subject: 'Verify your OnStride email',
    html,
    text
  });
};
```

Export the function.

---

### 2. Backend: Update Registration to Send Verification Email

**File:** `server/src/routes/auth.js`

In the register endpoint (around line 94), after creating the user:

```javascript
// Generate email verification token
const verificationToken = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

user.emailVerificationToken = hashedToken;
user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
await user.save();

// Send verification email (non-blocking)
sendEmailVerificationEmail({
  to: user.email,
  name: user.name,
  token: verificationToken
}).catch(err => console.error('Failed to send verification email:', err));
```

---

### 3. Backend: Add Resend Verification Email Endpoint

**File:** `server/src/routes/auth.js`

Add new route:
```javascript
// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
  validate
], async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account exists, a verification email has been sent' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Rate limit: only allow resend if no token or token expired or 2+ minutes since last send
    const canResend = !user.emailVerificationExpires ||
      user.emailVerificationExpires < Date.now() ||
      user.emailVerificationExpires < Date.now() + (24 * 60 * 60 * 1000) - (2 * 60 * 1000);

    if (!canResend) {
      return res.status(429).json({ error: 'Please wait before requesting another email' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
});
```

---

### 4. Backend: Add Email Verification Check to Login

**File:** `server/src/routes/auth.js`

In the login endpoint, after password verification but before returning tokens, add a check:

```javascript
// Check if email is verified
if (!user.emailVerified) {
  // Generate new verification token if needed
  if (!user.emailVerificationToken || user.emailVerificationExpires < Date.now()) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Send verification email
    sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken
    }).catch(err => console.error('Failed to send verification email:', err));
  }

  return res.status(403).json({
    error: 'Email not verified',
    code: 'EMAIL_NOT_VERIFIED',
    email: user.email
  });
}
```

---

### 5. Frontend: Create Email Verification Page

**File:** `client/src/pages/auth/VerifyEmailPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

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
        await authApi.verifyEmail(token);
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setStatus('error');
        setError(err.response?.data?.error || 'Verification failed');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src="/gl-logo.png" alt="OnStride" className="auth-logo" />
          </div>

          <div className="auth-body" style={{ textAlign: 'center', padding: '2rem' }}>
            {status === 'loading' && (
              <>
                <Loader size={48} className="spinner" style={{ margin: '0 auto 1rem' }} />
                <h2>Verifying your email...</h2>
                <p className="text-muted">Please wait while we verify your email address.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
                <h2>Email Verified!</h2>
                <p className="text-muted">Your email has been successfully verified.</p>
                <p className="text-muted">Redirecting to login...</p>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Go to Login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                <h2>Verification Failed</h2>
                <p className="text-muted">{error}</p>
                <p className="text-muted">The link may have expired or already been used.</p>
                <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Go to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 6. Frontend: Create Email Verification Required Page

**File:** `client/src/pages/auth/VerificationRequiredPage.tsx`

```tsx
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { Mail, RefreshCw } from 'lucide-react';

export default function VerificationRequiredPage() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setMessage('');
    setError('');

    try {
      await authApi.resendVerificationEmail(email);
      setMessage('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src="/gl-logo.png" alt="OnStride" className="auth-logo" />
          </div>

          <div className="auth-body" style={{ textAlign: 'center', padding: '2rem' }}>
            <Mail size={48} color="#4F46E5" style={{ margin: '0 auto 1rem' }} />
            <h2>Verify Your Email</h2>
            <p className="text-muted">
              We've sent a verification email to:
            </p>
            <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{email || 'your email address'}</p>
            <p className="text-muted">
              Click the link in the email to verify your account and start using OnStride.
            </p>

            {message && (
              <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                {message}
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <button
                className="btn btn-outline"
                onClick={handleResend}
                disabled={isResending || !email}
              >
                {isResending ? (
                  <>
                    <RefreshCw size={16} className="spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Resend Email
                  </>
                )}
              </button>
            </div>

            <p style={{ marginTop: '1.5rem' }}>
              <Link to="/login" className="auth-link">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 7. Frontend: Add Route Configuration

**File:** `client/src/App.tsx` (or router config)

Add routes:
```tsx
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import VerificationRequiredPage from './pages/auth/VerificationRequiredPage';

// In routes:
<Route path="/verify-email/:token" element={<VerifyEmailPage />} />
<Route path="/verification-required" element={<VerificationRequiredPage />} />
```

---

### 8. Frontend: Add API Method for Resend

**File:** `client/src/services/api.ts`

Add to authApi object:
```typescript
resendVerificationEmail: async (email: string) => {
  const response = await api.post('/auth/resend-verification', { email });
  return response.data;
},
```

---

### 9. Frontend: Update Login to Handle Verification Required

**File:** `client/src/pages/auth/LoginPage.tsx`

In the login error handler, check for EMAIL_NOT_VERIFIED:
```typescript
} catch (error: any) {
  if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
    navigate('/verification-required', {
      state: { email: error.response.data.email }
    });
    return;
  }
  // ... existing error handling
}
```

---

### 10. Frontend: Update Registration Flow

**File:** `client/src/pages/auth/RegisterPage.tsx`

After successful registration, redirect to verification required page:
```typescript
// After successful registration
navigate('/verification-required', { state: { email: data.email } });
```

**Note:** Modify the register function in authStore to NOT auto-login after registration, or create a separate registration path that doesn't set tokens.

---

## Flow Summary

### New User Registration:
1. User fills out registration form
2. Backend creates user with `emailVerified: false`
3. Backend generates verification token and sends email
4. User redirected to `/verification-required` page
5. User clicks email link -> `/verify-email/:token`
6. Backend verifies token, sets `emailVerified: true`
7. User redirected to login page
8. User logs in successfully

### Existing Unverified User Login:
1. User enters credentials on login page
2. Backend validates credentials
3. Backend checks `emailVerified` - returns 403 with code `EMAIL_NOT_VERIFIED`
4. Backend sends new verification email if needed
5. Frontend redirects to `/verification-required` page
6. User clicks email link -> `/verify-email/:token`
7. User can now log in

### Resend Verification:
1. User on `/verification-required` page clicks "Resend Email"
2. Backend generates new token and sends email
3. Rate limited to prevent abuse (2 minute cooldown)

---

## Files to Create/Modify

### Create:
- `client/src/pages/auth/VerifyEmailPage.tsx`
- `client/src/pages/auth/VerificationRequiredPage.tsx`

### Modify:
- `server/src/services/email.js` - Add sendEmailVerificationEmail
- `server/src/routes/auth.js` - Add resend route, update register, add login check
- `client/src/services/api.ts` - Add resendVerificationEmail method
- `client/src/App.tsx` - Add routes
- `client/src/pages/auth/LoginPage.tsx` - Handle EMAIL_NOT_VERIFIED error
- `client/src/pages/auth/RegisterPage.tsx` - Redirect to verification page
- `client/src/stores/authStore.ts` - Update register to not auto-login

---

## Security Considerations

1. **Token hashing** - Tokens stored hashed (SHA256), raw token only in email
2. **Token expiration** - 24 hours for email verification
3. **Rate limiting** - 2 minute cooldown between resend requests
4. **No user enumeration** - Generic response for non-existent emails
5. **HTTPS only** - Verification links should use HTTPS in production

---

## Testing Checklist

- [ ] New user registration sends verification email
- [ ] Clicking verification link verifies email
- [ ] Expired token shows appropriate error
- [ ] Already verified token shows appropriate error
- [ ] Unverified user cannot login
- [ ] Unverified user login sends new verification email
- [ ] Resend verification works with rate limiting
- [ ] Verified user can login normally
- [ ] All email templates render correctly
