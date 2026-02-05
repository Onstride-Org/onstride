import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Trash2, X, UserPlus } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  accountType: string;
  createdAt: string;
}

interface Barn {
  _id: string;
  name: string;
}

const CONFIRM_WORD = 'delete';
const ACCOUNT_TYPES = ['owner', 'manager', 'boarder', 'groomer', 'trainer', 'vendor'];

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [barns, setBarns] = useState<Barn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ _id: string; name: string } | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Add user modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ email: '', name: '', accountType: 'owner', barnId: '', barnName: '' });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);

  const openDeleteConfirm = (user: User) => {
    setDeleteConfirmUser({ _id: user._id, name: user.name });
    setDeleteConfirmInput('');
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmUser(null);
    setDeleteConfirmInput('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser || deleteConfirmInput.toLowerCase() !== CONFIRM_WORD) return;
    try {
      setDeletingId(deleteConfirmUser._id);
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/admin/users/${deleteConfirmUser._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? null : await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to delete user');
      closeDeleteConfirm();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadData();
    loadBarns();
  }, [search, page]);

  const loadBarns = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/admin/barns?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      setBarns(res.data || []);
    } catch (error) {
      console.error('Failed to load barns:', error);
    }
  };

  const handleAddUser = async () => {
    if (!addUserForm.email) {
      setAddUserError('Email is required');
      return;
    }
    try {
      setAddUserLoading(true);
      setAddUserError(null);
      setAddUserSuccess(null);
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/admin/users/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addUserForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      setAddUserSuccess(`Invitation sent to ${addUserForm.email}`);
      setAddUserForm({ email: '', name: '', accountType: 'owner', barnId: '', barnName: '' });
      await loadData();
      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowAddModal(false);
        setAddUserSuccess(null);
      }, 2000);
    } catch (err: any) {
      setAddUserError(err.message || 'Failed to create user');
    } finally {
      setAddUserLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);

      const res = await fetch(`${apiBase}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());

      setUsers(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      owner: '#22c55e',
      manager: '#3b82f6',
      staff: '#8b5cf6',
      boarder: '#eab308',
      admin: '#ef4444'
    };
    return colors[type] || '#737373';
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>Users</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Add User Button */}
          <button
            onClick={() => { setShowAddModal(true); setAddUserError(null); setAddUserSuccess(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <UserPlus size={14} />
            Add User
          </button>
          {/* Search */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} color="#525252" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '6px 8px 6px 32px',
                background: '#141414',
                border: '1px solid #1f1f1f',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '12px' }}>Loading...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '12px' }}>No users found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Joined</th>
                <th style={{ padding: '8px 12px', width: '80px', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                  <td style={{ padding: '8px 12px', color: 'white', fontSize: '12px' }}>{user.name}</td>
                  <td style={{ padding: '8px 12px', color: '#737373', fontSize: '12px' }}>{user.email}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      color: getTypeColor(user.accountType),
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {user.accountType}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#525252', fontSize: '11px', textAlign: 'right' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(user)}
                      disabled={deletingId === user._id}
                      title="Delete user"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#737373',
                        cursor: deletingId === user._id ? 'wait' : 'pointer',
                        padding: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid #1f1f1f',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'none', border: 'none', color: page === 1 ? '#333' : '#525252', cursor: page === 1 ? 'default' : 'pointer' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ color: '#525252', fontSize: '11px' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'none', border: 'none', color: page === totalPages ? '#333' : '#525252', cursor: page === totalPages ? 'default' : 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '440px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: 0 }}>Add New User</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {addUserSuccess ? (
              <div style={{ background: '#052e16', border: '1px solid #166534', borderRadius: '6px', padding: '12px', color: '#4ade80', fontSize: '13px' }}>
                {addUserSuccess}
              </div>
            ) : (
              <>
                <p style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '16px' }}>
                  Send an invitation email to set up their account.
                </p>

                {addUserError && (
                  <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '6px', padding: '10px', color: '#fca5a5', fontSize: '12px', marginBottom: '12px' }}>
                    {addUserError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#737373', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>Email *</label>
                    <input
                      type="email"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      placeholder="user@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0a0a0a',
                        border: '1px solid #262626',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#737373', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>Name (optional)</label>
                    <input
                      type="text"
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                      placeholder="John Doe"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0a0a0a',
                        border: '1px solid #262626',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#737373', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>Account Type</label>
                    <select
                      value={addUserForm.accountType}
                      onChange={(e) => setAddUserForm({ ...addUserForm, accountType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0a0a0a',
                        border: '1px solid #262626',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      {ACCOUNT_TYPES.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#737373', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {addUserForm.accountType === 'owner' ? 'Assign to Existing Barn (or create new)' : 'Assign to Barn'}
                    </label>
                    <select
                      value={addUserForm.barnId}
                      onChange={(e) => setAddUserForm({ ...addUserForm, barnId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0a0a0a',
                        border: '1px solid #262626',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      {addUserForm.accountType === 'owner' ? (
                        <option value="">Create new barn</option>
                      ) : (
                        <option value="">Select a barn...</option>
                      )}
                      {barns.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                    {addUserForm.accountType === 'owner' && !addUserForm.barnId && (
                      <p style={{ color: '#525252', fontSize: '11px', margin: '4px 0 0' }}>
                        A new barn and free subscription will be created. The user must purchase a plan after logging in.
                      </p>
                    )}
                  </div>

                  {addUserForm.accountType === 'owner' && !addUserForm.barnId && (
                    <div>
                      <label style={{ display: 'block', color: '#737373', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase' }}>Barn Name (optional)</label>
                      <input
                        type="text"
                        value={addUserForm.barnName}
                        onChange={(e) => setAddUserForm({ ...addUserForm, barnName: e.target.value })}
                        placeholder={addUserForm.name ? `${addUserForm.name}'s Barn` : 'My Barn'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#0a0a0a',
                          border: '1px solid #262626',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid #404040',
                      borderRadius: '6px',
                      color: '#a3a3a3',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddUser}
                    disabled={addUserLoading || !addUserForm.email}
                    style={{
                      padding: '8px 16px',
                      background: addUserLoading || !addUserForm.email ? '#404040' : '#2563eb',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '13px',
                      cursor: addUserLoading || !addUserForm.email ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {addUserLoading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal: type "delete" to confirm */}
      {deleteConfirmUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeDeleteConfirm}
        >
          <div
            style={{
              background: '#141414',
              border: '1px solid #262626',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: 0 }}>Delete user</h3>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ color: '#a3a3a3', fontSize: '13px', marginBottom: '16px' }}>
              This will soft-delete <strong style={{ color: 'white' }}>{deleteConfirmUser.name}</strong>. They will lose access to all barns.
            </p>
            <p style={{ color: '#737373', fontSize: '12px', marginBottom: '8px' }}>
              Type <strong style={{ color: '#a3a3a3' }}>delete</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder="delete"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #404040',
                  borderRadius: '6px',
                  color: '#a3a3a3',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmInput.toLowerCase() !== CONFIRM_WORD}
                style={{
                  padding: '8px 16px',
                  background: deleteConfirmInput.toLowerCase() === CONFIRM_WORD ? '#dc2626' : '#404040',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: deleteConfirmInput.toLowerCase() === CONFIRM_WORD ? 'pointer' : 'not-allowed',
                }}
              >
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
