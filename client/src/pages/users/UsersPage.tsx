import { useState, useEffect } from 'react';
import { usersApi, invitationsApi } from '../../services/api';
import { User, AccountType } from '../../types';
import { UserPlus, Search, Users, MoreHorizontal, X, CheckCircle, Link2, Copy, Mail, Clock, RefreshCw, Trash2, ChevronDown, ChevronUp, Share2, Edit, UserMinus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import FilterTabs from '../../components/FilterTabs';
import { formatPhoneNumber } from '../../utils/formatters';

interface Invitation {
  _id: string;
  email?: string;
  accountType: AccountType;
  barnName: string;
  token: string;
  expiresAt: string;
  active: boolean;
  isBulkInvite: boolean;
  useCount: number;
  maxUses: number | null;
  createdAt: string;
  createdById?: { name: string };
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<AccountType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [showInvitations, setShowInvitations] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

  const loadPendingInvitations = async () => {
    try {
      const invitations = await invitationsApi.getAll({ active: true });
      setPendingInvitations(invitations || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await invitationsApi.resend(id);
      loadPendingInvitations();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;
    try {
      await invitationsApi.delete(id);
      loadPendingInvitations();
    } catch (error) {
      console.error('Failed to delete invitation:', error);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this barn? They will lose access but can be re-invited later.`)) return;
    try {
      await usersApi.remove(userId);
      loadUsers();
      setActiveDropdown(null);
    } catch (error: any) {
      console.error('Failed to remove user:', error);
      alert(error.response?.data?.error || 'Failed to remove user');
    }
  };

  useEffect(() => {
    loadUsers();
    loadPendingInvitations();
  }, [pagination.page, roleFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

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

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = date.getTime() - now.getTime();

    if (diffMs < 0) return 'Expired';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h`;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m`;
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

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="card mb-6">
          <div
            className="card-header"
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setShowInvitations(!showInvitations)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={20} />
              <h3 style={{ margin: 0 }}>Pending Invitations ({pendingInvitations.length})</h3>
            </div>
            {showInvitations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {showInvitations && (
            <div className="card-body invitation-list">
              {pendingInvitations.map((invitation) => {
                const isExpired = new Date(invitation.expiresAt) < new Date();
                const expiresIn = getTimeUntil(invitation.expiresAt);

                return (
                  <div key={invitation._id} className="invitation-card">
                    <div className="invitation-card-header">
                      <div className="invitation-info">
                        {invitation.isBulkInvite ? (
                          <div className="invitation-type">
                            <Link2 size={18} />
                            <span>Shareable Link</span>
                          </div>
                        ) : (
                          <div className="invitation-type">
                            <Mail size={18} />
                            <span className="invitation-email">{invitation.email}</span>
                          </div>
                        )}
                        <span className={`badge badge-${getRoleBadge(invitation.accountType)}`}>
                          {roleLabels[invitation.accountType]}
                        </span>
                      </div>
                      <div className="invitation-actions">
                        {!invitation.isBulkInvite && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleResendInvitation(invitation._id)}
                            title="Resend invitation"
                          >
                            <RefreshCw size={16} />
                          </button>
                        )}
                        {invitation.isBulkInvite && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                const url = `${window.location.origin}/invite/${invitation.token}`;
                                navigator.clipboard.writeText(url);
                              }}
                              title="Copy link"
                            >
                              <Copy size={16} />
                            </button>
                            {navigator.share && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={async () => {
                                  const url = `${window.location.origin}/invite/${invitation.token}`;
                                  try {
                                    await navigator.share({
                                      title: 'Join my barn on OnStride',
                                      text: `You've been invited to join as a ${invitation.accountType}. Click the link to get started!`,
                                      url,
                                    });
                                  } catch (err) {
                                    // User cancelled or error - ignore
                                  }
                                }}
                                title="Share link"
                              >
                                <Share2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => handleDeleteInvitation(invitation._id)}
                          title="Delete invitation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="invitation-card-meta">
                      <div className="invitation-meta-item">
                        <Clock size={14} />
                        <span className={isExpired ? 'text-error' : ''}>
                          {isExpired ? 'Expired' : `Expires in ${expiresIn}`}
                        </span>
                      </div>
                      {invitation.isBulkInvite ? (
                        <div className="invitation-meta-item">
                          <Users size={14} />
                          <span>
                            {invitation.useCount} uses
                            {invitation.maxUses && ` / ${invitation.maxUses} max`}
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
          {/* Mobile Card View */}
          <div className="user-cards-mobile">
            {users.map((user) => (
              <div key={user.id} className="user-card-mobile">
                <div className="user-card-header">
                  <div className="user-cell">
                    <span className="user-avatar">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-container">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === user.id ? null : user.id);
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {activeDropdown === user.id && (
                      <div className="dropdown-menu dropdown-menu-right">
                        <button
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingUser(user);
                            setActiveDropdown(null);
                          }}
                        >
                          <Edit size={14} />
                          Edit Role
                        </button>
                        {user.id !== currentUser?.id && user.accountType !== 'owner' && (
                          <button
                            className="dropdown-item text-error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveUser(user.id, user.name);
                            }}
                          >
                            <Trash2 size={14} />
                            Delete user
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="user-card-footer">
                  <span className={`badge badge-${getRoleBadge(user.accountType)}`}>
                    {roleLabels[user.accountType]}
                  </span>
                  {user.phoneNumber && (
                    <span className="user-phone">{formatPhoneNumber(user.phoneNumber)}</span>
                  )}
                  {user.emailVerified ? (
                    <span className="badge badge-success">Verified</span>
                  ) : (
                    <span className="badge badge-warning">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="user-table-desktop">
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
                      <td>{user.phoneNumber ? formatPhoneNumber(user.phoneNumber) : '-'}</td>
                      <td>
                        {user.emailVerified ? (
                          <span className="badge badge-success">Verified</span>
                        ) : (
                          <span className="badge badge-warning">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="dropdown-container">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === user.id ? null : user.id);
                            }}
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {activeDropdown === user.id && (
                            <div className="dropdown-menu dropdown-menu-right">
                              <button
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingUser(user);
                                  setActiveDropdown(null);
                                }}
                              >
                                <Edit size={14} />
                                Edit Role
                              </button>
                              {user.id !== currentUser?.id && user.accountType !== 'owner' && (
                                <button
                                  className="dropdown-item text-error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveUser(user.id, user.name);
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Delete user
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            loadPendingInvitations();
          }}
        />
      )}

      {showBulkInviteModal && (
        <BulkInviteModal
          onClose={() => setShowBulkInviteModal(false)}
          onSuccess={() => {
            loadPendingInvitations();
          }}
        />
      )}

      {editingUser && (
        <EditUserRoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            loadUsers();
          }}
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
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
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
      onSuccess?.();
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

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my barn on OnStride',
          text: `You've been invited to join as a ${role}. Click the link to get started!`,
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled share or error occurred - fall back to copy
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      // Web Share API not supported - fall back to copy
      copyToClipboard();
    }
  };

  const canShare = typeof navigator !== 'undefined' && navigator.share;

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
                  className="btn btn-outline input-addon"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
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

            {/* Native Share Button */}
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleNativeShare}
              >
                <Share2 size={18} />
                {canShare ? 'Share Invite Link' : 'Copy & Share'}
              </button>
              <p className="form-hint text-center mt-2">
                {canShare
                  ? 'Opens your device\'s native sharing options'
                  : 'Copy the link to share via your preferred app'}
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
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

function EditUserRoleModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user: currentUser } = useAuthStore();
  const [role, setRole] = useState<AccountType>(user.accountType);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

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
      await usersApi.updatePermissions(user.id, { role });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!confirm(`Remove ${user.name} from this barn? They will lose access but can be re-invited later.`)) {
      return;
    }

    setError('');
    setIsRemoving(true);

    try {
      await usersApi.remove(user.id);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove user');
      setIsRemoving(false);
    }
  };

  const canRemove = user.id !== currentUser?.id && user.accountType !== 'owner';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit User Role</h2>
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
              <label className="form-label">User</label>
              <p className="text-muted">{user.name} ({user.email})</p>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
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

            {canRemove && (
              <div className="form-group" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-neutral-200)' }}>
                <label className="form-label text-error">Danger Zone</label>
                <button
                  type="button"
                  className="btn btn-outline btn-error btn-block"
                  onClick={handleRemoveUser}
                  disabled={isRemoving}
                >
                  <UserMinus size={16} />
                  {isRemoving ? 'Removing...' : 'Remove from Barn'}
                </button>
                <p className="form-hint text-muted" style={{ marginTop: '8px' }}>
                  This will remove the user's access to this barn. They can be re-invited later.
                </p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
