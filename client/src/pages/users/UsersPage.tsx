import { useState, useEffect } from 'react';
import { usersApi, invitationsApi } from '../../services/api';
import { User, AccountType } from '../../types';
import { UserPlus, Search, Users, MoreHorizontal, X, CheckCircle, Link2, Copy } from 'lucide-react';
import FilterTabs from '../../components/FilterTabs';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<AccountType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: 20 };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;

      const response = await usersApi.getAll(params);
      setUsers(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [pagination.page, roleFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (pagination.page === 1) {
        loadUsers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const getRoleBadge = (role: AccountType) => {
    const styles: Record<AccountType, string> = {
      owner: 'brand',
      manager: 'success',
      trainer: 'info',
      boarder: 'warning',
      groomer: 'neutral',
      admin: 'error',
      vendor: 'neutral',
    };
    return styles[role] || 'neutral';
  };

  const roleLabels: Record<AccountType, string> = {
    owner: 'Owner',
    manager: 'Manager',
    trainer: 'Trainer',
    boarder: 'Boarder',
    groomer: 'Groomer',
    admin: 'Admin',
    vendor: 'Vendor',
  };

  return (
    <div className="page users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{pagination.total} members in your barn</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline" onClick={() => setShowBulkInviteModal(true)}>
            <Link2 size={20} />
            Generate Invite Link
          </button>
          <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={20} />
            Invite by Email
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="page-filters">
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
        <FilterTabs
          options={[
            { value: 'all', label: 'All' },
            { value: 'owner', label: 'Owners' },
            { value: 'manager', label: 'Managers' },
            { value: 'trainer', label: 'Trainers' },
            { value: 'boarder', label: 'Boarders' },
            { value: 'groomer', label: 'Groomers' },
          ]}
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value as AccountType | 'all');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          label="Filter by role"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Users size={64} strokeWidth={1.5} />
          </div>
          <h3>No users found</h3>
          <p>
            {search || roleFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Invite users to join your barn'}
          </p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge badge-${getRoleBadge(user.accountType)}`}>
                        {roleLabels[user.accountType]}
                      </span>
                    </td>
                    <td>{user.phoneNumber || '-'}</td>
                    <td>
                      {user.emailVerified ? (
                        <span className="badge badge-success">Verified</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadUsers();
          }}
        />
      )}

      {showBulkInviteModal && (
        <BulkInviteModal
          onClose={() => setShowBulkInviteModal(false)}
        />
      )}
    </div>
  );
}

function InviteUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccountType>('boarder');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const roles: { value: AccountType; label: string }[] = [
    { value: 'manager', label: 'Manager' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'boarder', label: 'Boarder' },
    { value: 'groomer', label: 'Groomer' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await invitationsApi.create({ email, accountType: role });
      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="success-state">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h3>Invitation Sent!</h3>
              <p>An invitation has been sent to {email}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Invite User</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role *</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as AccountType)}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="form-hint">
                The user will receive an email invitation to join your barn
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkInviteModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [role, setRole] = useState<AccountType>('boarder');
  const [expiresInHours, setExpiresInHours] = useState('24');
  const [maxUses, setMaxUses] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const roles: { value: AccountType; label: string }[] = [
    { value: 'manager', label: 'Manager' },
    { value: 'trainer', label: 'Trainer' },
    { value: 'boarder', label: 'Boarder' },
    { value: 'groomer', label: 'Groomer' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await invitationsApi.createBulk({
        accountType: role,
        expiresInHours: parseInt(expiresInHours),
        maxUses: maxUses ? parseInt(maxUses) : undefined,
      });
      const fullUrl = `${window.location.origin}${result.inviteUrl}`;
      setInviteUrl(fullUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate invite link');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (inviteUrl) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Invite Link Generated</h2>
            <button className="btn btn-ghost modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="success-state mb-4">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h3>Link Ready to Share!</h3>
              <p>Anyone with this link can join your barn as a {role}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Invitation Link</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-input"
                  value={inviteUrl}
                  readOnly
                />
                <button
                  type="button"
                  className="btn btn-primary input-addon"
                  onClick={copyToClipboard}
                >
                  {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="form-hint">
                Link expires in {expiresInHours} hours
                {maxUses && ` or after ${maxUses} uses`}
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Generate Invite Link</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleGenerate}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <p className="mb-4 text-muted">
              Create a shareable link that anyone can use to join your barn.
              Perfect for group chats or posting in client communities.
            </p>

            <div className="form-group">
              <label className="form-label">Role for New Users *</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as AccountType)}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expires In</label>
                <select
                  className="form-select"
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="168">7 days</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Max Uses (Optional)</label>
                <input
                  type="number"
                  className="form-input"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                />
                <p className="form-hint">Leave empty for unlimited uses</p>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
