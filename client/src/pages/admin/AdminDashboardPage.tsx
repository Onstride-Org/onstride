import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import {
  Users, Building2, CreditCard, Activity,
  AlertTriangle, TrendingUp, Shield, Database
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalBarns: number;
  totalHorses: number;
  activeSubscriptions: number;
  revenueThisMonth: number;
  newUsersThisWeek: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentBarns, setRecentBarns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Only allow super admins
  if (user?.accountType !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, usersRes, barnsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: null })),
        api.get('/admin/users/recent').catch(() => ({ data: [] })),
        api.get('/admin/barns/recent').catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data || {
        totalUsers: 0,
        totalBarns: 0,
        totalHorses: 0,
        activeSubscriptions: 0,
        revenueThisMonth: 0,
        newUsersThisWeek: 0,
      });
      setRecentUsers(usersRes.data || []);
      setRecentBarns(barnsRes.data || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
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
    <div className="page admin-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Shield size={28} />
            Admin Dashboard
          </h1>
          <p className="page-subtitle">Platform-wide management and analytics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalUsers || 0}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalBarns || 0}</span>
            <span className="stat-label">Total Barns</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalHorses || 0}</span>
            <span className="stat-label">Total Horses</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.activeSubscriptions || 0}</span>
            <span className="stat-label">Active Subscriptions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">${stats?.revenueThisMonth?.toFixed(2) || '0.00'}</span>
            <span className="stat-label">Revenue This Month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.newUsersThisWeek || 0}</span>
            <span className="stat-label">New Users This Week</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="admin-nav-grid">
        <Link to="/admin/users" className="admin-nav-card">
          <Users size={32} />
          <h3>User Management</h3>
          <p>View, edit, and manage all platform users</p>
        </Link>

        <Link to="/admin/barns" className="admin-nav-card">
          <Building2 size={32} />
          <h3>Barn Management</h3>
          <p>Manage all barns and their settings</p>
        </Link>

        <Link to="/admin/subscriptions" className="admin-nav-card">
          <CreditCard size={32} />
          <h3>Subscriptions</h3>
          <p>View and manage subscriptions</p>
        </Link>

        <Link to="/admin/reports" className="admin-nav-card">
          <TrendingUp size={32} />
          <h3>Reports & Analytics</h3>
          <p>Platform usage and revenue reports</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="admin-activity-grid">
        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Users</h3>
            <Link to="/admin/users" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body">
            {recentUsers.length === 0 ? (
              <p className="text-muted">No recent users</p>
            ) : (
              <ul className="activity-list">
                {recentUsers.slice(0, 5).map((user: any) => (
                  <li key={user._id} className="activity-item">
                    <span className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <div className="activity-info">
                      <span className="activity-title">{user.name}</span>
                      <span className="activity-meta">{user.email}</span>
                    </div>
                    <span className={`badge badge-${user.accountType === 'owner' ? 'brand' : 'neutral'}`}>
                      {user.accountType}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Barns */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Barns</h3>
            <Link to="/admin/barns" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body">
            {recentBarns.length === 0 ? (
              <p className="text-muted">No recent barns</p>
            ) : (
              <ul className="activity-list">
                {recentBarns.slice(0, 5).map((barn: any) => (
                  <li key={barn._id} className="activity-item">
                    <span className="barn-avatar">
                      <Building2 size={20} />
                    </span>
                    <div className="activity-info">
                      <span className="activity-title">{barn.name}</span>
                      <span className="activity-meta">
                        Owner: {barn.ownerId?.name || 'Unknown'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="card">
        <div className="card-header">
          <h3>
            <AlertTriangle size={20} />
            System Alerts
          </h3>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <span>System is running normally. No alerts at this time.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
