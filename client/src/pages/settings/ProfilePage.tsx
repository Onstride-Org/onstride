import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usersApi } from '../../services/api';

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="page profile-page">
      <div className="page-header">
        <Link to="/settings" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Settings
        </Link>
        <h1 className="page-title">Profile</h1>
      </div>

      <div className="profile-content">
        {/* Profile Info Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Personal Information</h3>
            {!isEditing && (
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>
          <div className="card-content">
            {isEditing ? (
              <EditProfileForm
                user={user!}
                onCancel={() => setIsEditing(false)}
                onSuccess={() => {
                  setIsEditing(false);
                  loadUser();
                }}
              />
            ) : (
              <div className="profile-info">
                <div className="profile-avatar-large">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <dl className="detail-list">
                  <dt>Name</dt>
                  <dd>{user?.name}</dd>
                  <dt>Email</dt>
                  <dd>{user?.email}</dd>
                  <dt>Phone</dt>
                  <dd>{user?.phoneNumber || 'Not provided'}</dd>
                  <dt>Account Type</dt>
                  <dd className="capitalize">{user?.accountType}</dd>
                  <dt>Email Verified</dt>
                  <dd>
                    {user?.emailVerified ? (
                      <span className="badge badge-success">Verified</span>
                    ) : (
                      <span className="badge badge-warning">Not Verified</span>
                    )}
                  </dd>
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Password Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Password</h3>
            {!isChangingPassword && (
              <button className="btn btn-outline btn-sm" onClick={() => setIsChangingPassword(true)}>
                Change Password
              </button>
            )}
          </div>
          <div className="card-content">
            {isChangingPassword ? (
              <ChangePasswordForm
                onCancel={() => setIsChangingPassword(false)}
                onSuccess={() => setIsChangingPassword(false)}
              />
            ) : (
              <p className="text-muted">
                Your password was last changed... Use a strong, unique password to protect your account.
              </p>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card card-danger">
          <div className="card-header">
            <h3 className="card-title">Danger Zone</h3>
          </div>
          <div className="card-content">
            <p className="text-muted mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="btn btn-danger">Delete Account</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProfileForm({
  user,
  onCancel,
  onSuccess,
}: {
  user: { id: string; name: string; email: string; phoneNumber?: string };
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await usersApi.update(user.id, {
        name,
        phoneNumber: phoneNumber || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
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
        <label className="form-label">Name</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-input"
          value={user.email}
          disabled
        />
        <p className="form-hint">Email cannot be changed</p>
      </div>

      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input
          type="tel"
          className="form-input"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="(555) 123-4567"
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

function ChangePasswordForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await usersApi.changePassword(currentPassword, newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
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
        <label className="form-label">Current Password</label>
        <input
          type="password"
          className="form-input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">New Password</label>
        <input
          type="password"
          className="form-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Confirm New Password</label>
        <input
          type="password"
          className="form-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
}
