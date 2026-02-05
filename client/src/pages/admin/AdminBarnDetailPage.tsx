import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Building2, Users, Database, DollarSign,
  ChevronLeft, Mail, Phone, MapPin, Calendar, Save
} from 'lucide-react';
import { formatPhoneNumber } from '../../utils/formatters';

const SUBSCRIPTION_TIERS = ['free', 'starter', 'business', 'business_pro', 'founders', 'enterprise'];

interface BarnDetail {
  barn: any;
  horses: any[];
  users: any[];
  subscription: any;
  recentInvoices: any[];
  stats: {
    horseCount: number;
    userCount: number;
    totalRevenue: number;
    platformFeesCollected: number;
  };
}

export default function AdminBarnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BarnDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('');
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);

  useEffect(() => {
    loadBarnDetail();
  }, [id]);

  const loadBarnDetail = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiBase}/admin/barns/${id}`, { headers });
      setData(response.data);
      const sub = response.data?.subscription;
      setSubscriptionTier(sub?.tier ?? 'free');
    } catch (error) {
      console.error('Failed to load barn detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubscription = async () => {
    if (!id) return;
    try {
      setSubscriptionSaving(true);
      const token = localStorage.getItem('adminToken') || getTokens().accessToken;
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.put(`${apiBase}/admin/barns/${id}/subscription`, { tier: subscriptionTier }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await loadBarnDetail();
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setSubscriptionSaving(false);
    }
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
          <h3>Barn not found</h3>
          <Link to="/admin/barns" className="btn btn-primary">Back to Barns</Link>
        </div>
      </div>
    );
  }

  const { barn, horses, users, subscription, recentInvoices, stats } = data;

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
              <div className="barn-avatar" style={{ width: 56, height: 56 }}>
                <Building2 size={28} />
              </div>
              <div>
                <h1 className="detail-title">{barn.name}</h1>
                <p className="detail-subtitle">
                  Created {format(new Date(barn.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="detail-stats">
        <div className="detail-stat">
          <div className="detail-stat-value">{stats.horseCount}</div>
          <div className="detail-stat-label">Horses</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-value">{stats.userCount}</div>
          <div className="detail-stat-label">Users</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-value">${stats.totalRevenue.toFixed(2)}</div>
          <div className="detail-stat-label">Total Revenue</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-value">${stats.platformFeesCollected.toFixed(2)}</div>
          <div className="detail-stat-label">Platform Fees</div>
        </div>
      </div>

      <div className="admin-detail-grid">
        {/* Barn Info */}
        <div className="card">
          <div className="card-header">
            <h3>Barn Information</h3>
          </div>
          <div className="card-body">
            <dl className="detail-list">
              <dt>Owner</dt>
              <dd>
                {barn.ownerId ? (
                  <Link to={`/admin/users/${barn.ownerId._id}`} className="link">
                    {barn.ownerId.name}
                  </Link>
                ) : 'Unknown'}
              </dd>

              {barn.email && (
                <>
                  <dt><Mail size={14} /> Email</dt>
                  <dd>{barn.email}</dd>
                </>
              )}

              {barn.phoneNumber && (
                <>
                  <dt><Phone size={14} /> Phone</dt>
                  <dd>{formatPhoneNumber(barn.phoneNumber)}</dd>
                </>
              )}

              {barn.address && (
                <>
                  <dt><MapPin size={14} /> Address</dt>
                  <dd>
                    {barn.address}
                    {barn.city && `, ${barn.city}`}
                    {barn.state && `, ${barn.state}`}
                    {barn.zipCode && ` ${barn.zipCode}`}
                  </dd>
                </>
              )}

              <dt><Calendar size={14} /> Created</dt>
              <dd>{format(new Date(barn.createdAt), 'MMM d, yyyy h:mm a')}</dd>
            </dl>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Subscription (admin override)</h4>
              {subscription && (
                <span className={`badge badge-${subscription.status === 'active' ? 'success' : 'warning'}`} style={{ marginRight: '0.5rem' }}>
                  {subscription.status}
                </span>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                <select
                  value={subscriptionTier}
                  onChange={(e) => setSubscriptionTier(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-neutral-50)',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                  }}
                >
                  {SUBSCRIPTION_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveSubscription}
                  disabled={subscriptionSaving}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={14} />
                  {subscriptionSaving ? 'Saving...' : 'Set plan'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                Manually set plan for testing without payment.
              </p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="card">
          <div className="card-header">
            <h3><Users size={18} /> Users ({users.length})</h3>
          </div>
          <div className="card-body">
            {users.length === 0 ? (
              <p className="text-muted">No users in this barn</p>
            ) : (
              <ul className="activity-list">
                {users.slice(0, 10).map((roleData: any) => (
                  <li key={roleData._id} className="activity-item clickable">
                    <Link to={`/admin/users/${roleData.user?._id}`} className="activity-link">
                      <span className="user-avatar">
                        {roleData.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                      <div className="activity-info">
                        <span className="activity-title">{roleData.user?.name || 'Unknown'}</span>
                        <span className="activity-meta">{roleData.user?.email}</span>
                      </div>
                      <span className={`badge badge-${roleData.role === 'owner' ? 'brand' : 'neutral'}`}>
                        {roleData.role}
                      </span>
                    </Link>
                  </li>
                ))}
                {users.length > 10 && (
                  <li className="text-muted text-center" style={{ padding: '0.5rem' }}>
                    +{users.length - 10} more users
                  </li>
                )}
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
              <p className="text-muted">No horses in this barn</p>
            ) : (
              <div className="table-container">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Breed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horses.slice(0, 10).map((horse: any) => (
                      <tr key={horse._id}>
                        <td>{horse.name}</td>
                        <td>{horse.breed?.label || '-'}</td>
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
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice: any) => (
                      <tr key={invoice._id}>
                        <td>{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</td>
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
