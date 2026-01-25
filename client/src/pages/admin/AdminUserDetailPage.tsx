import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';
import { getTokens, getCurrentBarn } from '../../services/api';
import { format } from 'date-fns';
import {
  Building2, Database, DollarSign, ChevronLeft,
  Mail, Phone, Calendar, Shield, CheckCircle, XCircle
} from 'lucide-react';
import { formatPhoneNumber } from '../../utils/formatters';

interface UserDetail {
  user: any;
  barnRoles: any[];
  horses: any[];
  recentInvoices: any[];
  stats: {
    barnCount: number;
    horseCount: number;
    totalSpent: number;
  };
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();
  const [data, setData] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  if (currentUser?.accountType !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  useEffect(() => {
    loadUserDetail();
  }, [id]);

  const loadUserDetail = async () => {
    try {
      setIsLoading(true);
      const { accessToken } = getTokens();
      const barnId = getCurrentBarn();
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      if (barnId) headers['X-Barn-Id'] = barnId;

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiBase}/admin/users/${id}`, { headers });
      setData(response.data);
    } catch (error) {
      console.error('Failed to load user detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      owner: 'brand',
      admin: 'error',
      manager: 'success',
      trainer: 'info',
      boarder: 'warning',
      groomer: 'neutral',
      vendor: 'neutral',
    };
    return styles[role] || 'neutral';
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>User not found</h3>
          <Link to="/admin/users" className="btn btn-primary">Back to Users</Link>
        </div>
      </div>
    );
  }

  const { user, barnRoles, horses, recentInvoices, stats } = data;

  return (
    <div className="page admin-detail-page">
      {/* Header */}
      <div className="detail-header">
        <Link to="/admin" className="back-link">
          <ChevronLeft size={20} />
          Back to Admin
        </Link>

        <div className="detail-header-content">
          <div className="detail-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="user-avatar" style={{ width: 56, height: 56, fontSize: '1.5rem' }}>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
              <div>
                <h1 className="detail-title">{user.name}</h1>
                <p className="detail-subtitle">
                  <span className={`badge badge-${getRoleBadgeStyle(user.accountType)}`}>
                    {user.accountType}
                  </span>
                  <span style={{ marginLeft: '0.5rem' }}>
                    Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="detail-stats">
        <div className="detail-stat">
          <div className="detail-stat-value">{stats.barnCount}</div>
          <div className="detail-stat-label">Barns</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-value">{stats.horseCount}</div>
          <div className="detail-stat-label">Horses</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-value">${stats.totalSpent.toFixed(2)}</div>
          <div className="detail-stat-label">Total Spent</div>
        </div>
      </div>

      <div className="admin-detail-grid">
        {/* User Info */}
        <div className="card">
          <div className="card-header">
            <h3>User Information</h3>
          </div>
          <div className="card-body">
            <dl className="detail-list">
              <dt><Mail size={14} /> Email</dt>
              <dd>
                {user.email}
                {user.emailVerified ? (
                  <CheckCircle size={14} style={{ marginLeft: '0.5rem', color: 'var(--color-success-500)' }} />
                ) : (
                  <XCircle size={14} style={{ marginLeft: '0.5rem', color: 'var(--color-error-500)' }} />
                )}
              </dd>

              {user.phoneNumber && (
                <>
                  <dt><Phone size={14} /> Phone</dt>
                  <dd>{formatPhoneNumber(user.phoneNumber)}</dd>
                </>
              )}

              <dt><Shield size={14} /> 2FA</dt>
              <dd>
                {user.twoFactorEnabled ? (
                  <span className="badge badge-success">Enabled</span>
                ) : (
                  <span className="badge badge-neutral">Disabled</span>
                )}
              </dd>

              <dt><Calendar size={14} /> Created</dt>
              <dd>{format(new Date(user.createdAt), 'MMM d, yyyy h:mm a')}</dd>

              {user.lastLogin && (
                <>
                  <dt><Calendar size={14} /> Last Login</dt>
                  <dd>{format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')}</dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Barn Memberships */}
        <div className="card">
          <div className="card-header">
            <h3><Building2 size={18} /> Barn Memberships ({barnRoles.length})</h3>
          </div>
          <div className="card-body">
            {barnRoles.length === 0 ? (
              <p className="text-muted">Not a member of any barns</p>
            ) : (
              <ul className="activity-list">
                {barnRoles.map((role: any, index: number) => (
                  <li key={index} className="activity-item clickable">
                    <Link to={`/admin/barns/${role.barn?._id}`} className="activity-link">
                      <span className="barn-avatar">
                        <Building2 size={20} />
                      </span>
                      <div className="activity-info">
                        <span className="activity-title">{role.barn?.name || 'Unknown Barn'}</span>
                        <span className="activity-meta">
                          Joined {format(new Date(role.joinedAt), 'MMM d, yyyy')}
                          {role.isPrimary && ' • Primary'}
                        </span>
                      </div>
                      <span className={`badge badge-${getRoleBadgeStyle(role.role)}`}>
                        {role.role}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Horses */}
        <div className="card">
          <div className="card-header">
            <h3><Database size={18} /> Horses ({horses.length})</h3>
          </div>
          <div className="card-body">
            {horses.length === 0 ? (
              <p className="text-muted">No horses associated with this user</p>
            ) : (
              <div className="table-container">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Barn</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horses.slice(0, 10).map((horse: any) => (
                      <tr key={horse._id}>
                        <td>{horse.name}</td>
                        <td>
                          {horse.barnId ? (
                            <Link to={`/admin/barns/${horse.barnId._id}`} className="link">
                              {horse.barnId.name}
                            </Link>
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`badge badge-${horse.status === 'active' ? 'success' : 'neutral'}`}>
                            {horse.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {horses.length > 10 && (
                  <p className="text-muted text-center" style={{ padding: '0.5rem' }}>
                    +{horses.length - 10} more horses
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <h3><DollarSign size={18} /> Recent Invoices ({recentInvoices.length})</h3>
          </div>
          <div className="card-body">
            {recentInvoices.length === 0 ? (
              <p className="text-muted">No invoices found</p>
            ) : (
              <div className="table-container">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Barn</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice: any) => (
                      <tr key={invoice._id}>
                        <td>{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</td>
                        <td>
                          {invoice.barnId ? (
                            <Link to={`/admin/barns/${invoice.barnId._id}`} className="link">
                              {invoice.barnId.name}
                            </Link>
                          ) : '-'}
                        </td>
                        <td>${invoice.subtotal.toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'neutral'}`}>
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
