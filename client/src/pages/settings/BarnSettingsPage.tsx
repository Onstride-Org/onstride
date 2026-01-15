import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { barnsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Barn } from '../../types';

export default function BarnSettingsPage() {
  const { currentBarnId } = useAuthStore();
  const [barn, setBarn] = useState<Barn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const loadBarn = async () => {
    if (!currentBarnId) return;
    try {
      const response = await barnsApi.getById(currentBarnId);
      setBarn(response);
    } catch (error) {
      console.error('Failed to load barn:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBarn();
  }, [currentBarnId]);

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page barn-settings-page">
      <div className="page-header">
        <Link to="/settings" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="page-title">Barn Settings</h1>
      </div>

      <div className="settings-content">
        {/* Barn Info Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Barn Information</h3>
            {!isEditing && (
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>
          <div className="card-content">
            {isEditing ? (
              <EditBarnForm
                barn={barn!}
                onCancel={() => setIsEditing(false)}
                onSuccess={() => {
                  setIsEditing(false);
                  loadBarn();
                }}
              />
            ) : (
              <dl className="detail-list">
                <dt>Barn Name</dt>
                <dd>{barn?.name}</dd>
                <dt>Total Horses</dt>
                <dd>{barn?.horseCount || 0}</dd>
                <dt>Total Users</dt>
                <dd>{barn?.userCount || 0}</dd>
              </dl>
            )}
          </div>
        </div>

        {/* Stall Layout Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Stall Layout</h3>
          </div>
          <div className="card-content">
            {barn?.setup ? (
              <dl className="detail-list">
                <dt>Layout Shape</dt>
                <dd className="capitalize">{barn.setup.shape}</dd>
                <dt>Total Stalls</dt>
                <dd>{barn.setup.stalls}</dd>
                {barn.setup.stallsPerAisle && (
                  <>
                    <dt>Stalls Per Aisle</dt>
                    <dd>{barn.setup.stallsPerAisle}</dd>
                  </>
                )}
              </dl>
            ) : (
              <div className="empty-state-small">
                <p>No stall layout configured</p>
                <button className="btn btn-primary btn-sm">Configure Layout</button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Statistics</h3>
          </div>
          <div className="card-content">
            <div className="stats-row">
              <div className="stat">
                <span className="stat-value">{barn?.horseCount || 0}</span>
                <span className="stat-label">Horses</span>
              </div>
              <div className="stat">
                <span className="stat-value">{barn?.userCount || 0}</span>
                <span className="stat-label">Users</span>
              </div>
              <div className="stat">
                <span className="stat-value">{barn?.setup?.stalls || 0}</span>
                <span className="stat-label">Stalls</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditBarnForm({
  barn,
  onCancel,
  onSuccess,
}: {
  barn: Barn;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(barn.name);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await barnsApi.update(barn.id, { name });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update barn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Barn Name</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
