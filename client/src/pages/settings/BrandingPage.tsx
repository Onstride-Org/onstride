import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { barnsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface BarnBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  customFontFamily?: string;
  welcomeMessage?: string;
}

export default function BrandingPage() {
  const { currentBarnId } = useAuthStore();
  const [branding, setBranding] = useState<BarnBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [primaryColor, setPrimaryColor] = useState('#405D4B');
  const [secondaryColor, setSecondaryColor] = useState('#A9EEC4');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const loadBranding = async () => {
    if (!currentBarnId) return;
    try {
      const response = await barnsApi.getBranding(currentBarnId);
      setBranding(response);
      if (response) {
        setPrimaryColor(response.primaryColor || '#405D4B');
        setSecondaryColor(response.secondaryColor || '#A9EEC4');
        setWelcomeMessage(response.welcomeMessage || '');
      }
    } catch (error) {
      console.error('Failed to load branding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, [currentBarnId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await barnsApi.updateBranding(currentBarnId!, {
        primaryColor,
        secondaryColor,
        welcomeMessage: welcomeMessage || undefined,
      });
      setSuccess('Branding updated successfully');
      loadBranding();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update branding');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page branding-page">
      <div className="page-header">
        <Link to="/app/settings" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="page-title">Branding</h1>
      </div>

      <div className="settings-content">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
            </div>
          )}

          {/* Colors Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Colors</h3>
            </div>
            <div className="card-content">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Primary Color</label>
                  <div className="color-input">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  <p className="form-hint">Used for primary buttons and navigation</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Color</label>
                  <div className="color-input">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  <p className="form-hint">Used for accents and highlights</p>
                </div>
              </div>

              {/* Preview */}
              <div className="branding-preview">
                <h4>Preview</h4>
                <div className="preview-container">
                  <div
                    className="preview-button"
                    style={{ backgroundColor: primaryColor, color: '#fff' }}
                  >
                    Primary Button
                  </div>
                  <div
                    className="preview-button"
                    style={{
                      backgroundColor: secondaryColor,
                      color: primaryColor,
                    }}
                  >
                    Secondary Button
                  </div>
                  <div
                    className="preview-badge"
                    style={{
                      backgroundColor: primaryColor + '20',
                      color: primaryColor,
                    }}
                  >
                    Badge
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Welcome Message</h3>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  placeholder="Welcome to our barn! We're happy to have you."
                />
                <p className="form-hint">
                  This message will be displayed to new members when they join your barn
                </p>
              </div>
            </div>
          </div>

          {/* Logo Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Logo</h3>
            </div>
            <div className="card-content">
              <div className="logo-upload">
                {branding?.logoUrl ? (
                  <div className="logo-preview">
                    <img src={branding.logoUrl} alt="Barn logo" />
                    <button type="button" className="btn btn-outline btn-sm">
                      Change Logo
                    </button>
                  </div>
                ) : (
                  <div className="logo-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 5,21" />
                    </svg>
                    <p>No logo uploaded</p>
                    <button type="button" className="btn btn-outline btn-sm">
                      Upload Logo
                    </button>
                  </div>
                )}
              </div>
              <p className="form-hint">
                Recommended size: 200x200px. PNG or SVG format.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
