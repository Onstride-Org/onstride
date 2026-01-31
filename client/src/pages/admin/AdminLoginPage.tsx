import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Store admin token separately
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#141414',
        borderRadius: '12px',
        padding: '40px',
        border: '1px solid #262626'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="OnStride"
            style={{
              height: '56px',
              width: 'auto',
              margin: '0 auto 16px',
              display: 'block'
            }}
          />
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 600, margin: 0 }}>
            Admin Portal
          </h1>
          <p style={{ color: '#737373', fontSize: '14px', marginTop: '8px' }}>
            OnStride Administration
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#7f1d1d',
              border: '1px solid #991b1b',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#a3a3a3', fontSize: '14px', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@onstrideapp.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: '8px',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#a3a3a3', fontSize: '14px', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '48px',
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#737373',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a
            href="/"
            style={{ color: '#737373', fontSize: '13px', textDecoration: 'none' }}
          >
            ← Back to OnStride
          </a>
        </div>
      </div>
    </div>
  );
}
