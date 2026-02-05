import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Building2, Users, Database, DollarSign,
  ChevronLeft, Mail, Phone, MapPin, Save
} from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('');
  const [subscriptionSaving, setSubscriptionSaving] = useState(false);

  useEffect(() => {
    loadBarnDetail();
  }, [id]);

  const loadBarnDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiBase}/admin/barns/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setData(response.data);
      const sub = response.data?.subscription;
      setSubscriptionTier(sub?.tier ?? 'free');
    } catch (err: any) {
      console.error('Failed to load barn detail:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load barn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubscription = async () => {
    if (!id) return;
    try {
      setSubscriptionSaving(true);
      const token = localStorage.getItem('adminToken');
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
      <div style={{ padding: '40px', textAlign: 'center', color: '#737373' }}>
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '20px 24px' }}>
        <Link to="/admin/barns" style={{ color: '#737373', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
          <ChevronLeft size={16} />
          Back to Barns
        </Link>
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px', padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>Barn not found</h3>
          <p style={{ color: '#737373', margin: 0 }}>{error || 'Unable to load barn details'}</p>
        </div>
      </div>
    );
  }

  const { barn, horses, users, subscription, recentInvoices, stats } = data;

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Back link */}
      <Link to="/admin/barns" style={{ color: '#737373', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px', fontSize: '12px' }}>
        <ChevronLeft size={14} />
        Back to Barns
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: 48, height: 48, background: '#1f1f1f', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={24} color="#737373" />
        </div>
        <div>
          <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>{barn.name}</h1>
          <p style={{ color: '#525252', fontSize: '12px', margin: '2px 0 0 0' }}>
            Created {format(new Date(barn.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Horses', value: stats.horseCount },
          { label: 'Users', value: stats.userCount },
          { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}` },
          { label: 'Platform Fees', value: `$${stats.platformFeesCollected.toFixed(2)}` },
        ].map((stat) => (
          <div key={stat.label} style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px', padding: '12px' }}>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 600 }}>{stat.value}</div>
            <div style={{ color: '#525252', fontSize: '11px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Barn Info + Subscription */}
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f' }}>
            <h3 style={{ color: 'white', fontSize: '13px', fontWeight: 500, margin: 0 }}>Barn Information</h3>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'grid', gap: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#525252' }}>Owner: </span>
                <span style={{ color: 'white' }}>{barn.ownerId?.name || 'Unknown'}</span>
              </div>
              {barn.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={12} color="#525252" />
                  <span style={{ color: '#a3a3a3' }}>{barn.email}</span>
                </div>
              )}
              {barn.phoneNumber && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={12} color="#525252" />
                  <span style={{ color: '#a3a3a3' }}>{barn.phoneNumber}</span>
                </div>
              )}
              {barn.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={12} color="#525252" />
                  <span style={{ color: '#a3a3a3' }}>
                    {barn.address}{barn.city && `, ${barn.city}`}{barn.state && `, ${barn.state}`}{barn.zipCode && ` ${barn.zipCode}`}
                  </span>
                </div>
              )}
            </div>

            {/* Subscription Override */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1f1f1f' }}>
              <h4 style={{ color: 'white', fontSize: '12px', fontWeight: 500, margin: '0 0 8px 0' }}>Subscription Override</h4>
              {subscription && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 500,
                  background: subscription.status === 'active' ? '#052e16' : '#422006',
                  color: subscription.status === 'active' ? '#4ade80' : '#fbbf24',
                  marginBottom: '8px'
                }}>
                  {subscription.status}
                </span>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={subscriptionTier}
                  onChange={(e) => setSubscriptionTier(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #1f1f1f',
                    background: '#0a0a0a',
                    color: 'white',
                    fontSize: '12px',
                    outline: 'none',
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#2563eb',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: subscriptionSaving ? 'not-allowed' : 'pointer',
                    opacity: subscriptionSaving ? 0.6 : 1,
                  }}
                >
                  <Save size={12} />
                  {subscriptionSaving ? 'Saving...' : 'Set Plan'}
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#525252', marginTop: '8px', margin: '8px 0 0 0' }}>
                Manually set plan for testing without payment.
              </p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} color="#737373" />
            <h3 style={{ color: 'white', fontSize: '13px', fontWeight: 500, margin: 0 }}>Users ({users.length})</h3>
          </div>
          <div style={{ padding: '8px' }}>
            {users.length === 0 ? (
              <p style={{ color: '#525252', fontSize: '12px', textAlign: 'center', padding: '16px' }}>No users in this barn</p>
            ) : (
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {users.slice(0, 10).map((roleData: any) => (
                  <div key={roleData._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '4px' }}>
                    <div style={{ width: 28, height: 28, background: '#1f1f1f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#737373', fontSize: '11px', fontWeight: 500 }}>
                      {roleData.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roleData.user?.name || 'Unknown'}</div>
                      <div style={{ color: '#525252', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roleData.user?.email}</div>
                    </div>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      background: roleData.role === 'owner' ? '#1e3a5f' : '#1f1f1f',
                      color: roleData.role === 'owner' ? '#60a5fa' : '#737373',
                    }}>
                      {roleData.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Horses */}
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} color="#737373" />
            <h3 style={{ color: 'white', fontSize: '13px', fontWeight: 500, margin: 0 }}>Horses ({horses.length})</h3>
          </div>
          <div style={{ padding: '8px' }}>
            {horses.length === 0 ? (
              <p style={{ color: '#525252', fontSize: '12px', textAlign: 'center', padding: '16px' }}>No horses in this barn</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500 }}>Name</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500 }}>Breed</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {horses.slice(0, 8).map((horse: any) => (
                    <tr key={horse._id}>
                      <td style={{ padding: '6px 8px', color: 'white' }}>{horse.name}</td>
                      <td style={{ padding: '6px 8px', color: '#737373' }}>{horse.breed?.label || '-'}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          background: horse.status === 'active' ? '#052e16' : '#1f1f1f',
                          color: horse.status === 'active' ? '#4ade80' : '#737373',
                        }}>
                          {horse.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={14} color="#737373" />
            <h3 style={{ color: 'white', fontSize: '13px', fontWeight: 500, margin: 0 }}>Recent Invoices ({recentInvoices.length})</h3>
          </div>
          <div style={{ padding: '8px' }}>
            {recentInvoices.length === 0 ? (
              <p style={{ color: '#525252', fontSize: '12px', textAlign: 'center', padding: '16px' }}>No invoices found</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500 }}>Amount</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice: any) => (
                    <tr key={invoice._id}>
                      <td style={{ padding: '6px 8px', color: '#737373' }}>{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</td>
                      <td style={{ padding: '6px 8px', color: 'white' }}>${invoice.subtotal?.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          background: invoice.status === 'paid' ? '#052e16' : invoice.status === 'pending' ? '#422006' : '#1f1f1f',
                          color: invoice.status === 'paid' ? '#4ade80' : invoice.status === 'pending' ? '#fbbf24' : '#737373',
                        }}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
