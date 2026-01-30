import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import axios from 'axios';
import { getTokens, getCurrentBarn } from '../../services/api';
import {
  Calendar, Mail, Phone, Building2, Users, Clock,
  X, MessageSquare, Search, Filter, RefreshCw
} from 'lucide-react';

interface DemoRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  barnName?: string;
  discipline?: string;
  horseCount?: string;
  isDecisionMaker?: string;
  selectedDate?: string;
  selectedTime?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface DemoStats {
  total: number;
  new: number;
  contacted: number;
  scheduled: number;
  completed: number;
}

const statusColors: Record<string, string> = {
  new: 'warning',
  contacted: 'info',
  scheduled: 'brand',
  completed: 'success',
  cancelled: 'neutral'
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function AdminDemoRequestsPage() {
  const { user } = useAuthStore();
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Only allow super admins
  if (user?.accountType !== 'admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  useEffect(() => {
    loadData();
  }, [filterStatus, searchTerm, page]);

  const getHeaders = () => {
    const { accessToken } = getTokens();
    const barnId = getCurrentBarn();
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    if (barnId) headers['X-Barn-Id'] = barnId;
    return headers;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const headers = getHeaders();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filterStatus) params.append('status', filterStatus);
      if (searchTerm) params.append('search', searchTerm);

      const [requestsRes, statsRes] = await Promise.all([
        axios.get(`${apiBase}/admin/demo-requests?${params}`, { headers }),
        axios.get(`${apiBase}/admin/demo-requests/stats`, { headers })
      ]);

      setDemoRequests(requestsRes.data.data || []);
      setTotalPages(requestsRes.data.pagination?.pages || 1);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load demo requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const headers = getHeaders();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      await axios.put(`${apiBase}/admin/demo-requests/${id}`, { status }, { headers });

      // Update local state
      setDemoRequests(prev =>
        prev.map(req => req._id === id ? { ...req, status: status as DemoRequest['status'] } : req)
      );

      if (selectedRequest?._id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: status as DemoRequest['status'] } : null);
      }

      // Refresh stats
      const statsRes = await axios.get(`${apiBase}/admin/demo-requests/stats`, { headers });
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    try {
      const headers = getHeaders();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      await axios.put(`${apiBase}/admin/demo-requests/${id}`, { notes }, { headers });

      setDemoRequests(prev =>
        prev.map(req => req._id === id ? { ...req, notes } : req)
      );

      if (selectedRequest?._id === id) {
        setSelectedRequest(prev => prev ? { ...prev, notes } : null);
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this demo request?')) return;

    try {
      const headers = getHeaders();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      await axios.delete(`${apiBase}/admin/demo-requests/${id}`, { headers });

      setDemoRequests(prev => prev.filter(req => req._id !== id));
      if (selectedRequest?._id === id) {
        setSelectedRequest(null);
      }

      // Refresh stats
      const statsRes = await axios.get(`${apiBase}/admin/demo-requests/stats`, { headers });
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to delete request:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading && demoRequests.length === 0) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page admin-demo-requests">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Calendar size={28} />
            Demo Requests
          </h1>
          <p className="page-subtitle">Manage demo booking requests from the landing page</p>
        </div>
        <button className="btn btn-ghost" onClick={loadData}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card" onClick={() => setFilterStatus('')} style={{ cursor: 'pointer' }}>
            <div className="stat-content">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Requests</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilterStatus('new')} style={{ cursor: 'pointer' }}>
            <div className="stat-content">
              <span className="stat-value" style={{ color: 'var(--color-warning-600)' }}>{stats.new}</span>
              <span className="stat-label">New</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilterStatus('contacted')} style={{ cursor: 'pointer' }}>
            <div className="stat-content">
              <span className="stat-value" style={{ color: 'var(--color-info-600)' }}>{stats.contacted}</span>
              <span className="stat-label">Contacted</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilterStatus('scheduled')} style={{ cursor: 'pointer' }}>
            <div className="stat-content">
              <span className="stat-value" style={{ color: 'var(--color-brand-600)' }}>{stats.scheduled}</span>
              <span className="stat-label">Scheduled</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => setFilterStatus('completed')} style={{ cursor: 'pointer' }}>
            <div className="stat-content">
              <span className="stat-value" style={{ color: 'var(--color-success-600)' }}>{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or barn..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <div className="input-group" style={{ minWidth: '150px' }}>
            <Filter size={18} className="input-icon" />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="input"
              style={{ paddingLeft: '2.5rem' }}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedRequest ? '1fr 400px' : '1fr', gap: '1.5rem' }}>
        {/* Request List */}
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {demoRequests.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                No demo requests found
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Barn</th>
                    <th>Details</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {demoRequests.map((request) => (
                    <tr
                      key={request._id}
                      onClick={() => setSelectedRequest(request)}
                      style={{
                        cursor: 'pointer',
                        background: selectedRequest?._id === request._id ? 'var(--color-bg-secondary)' : undefined
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 500 }}>{request.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{request.email}</div>
                      </td>
                      <td>{request.barnName || '-'}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {request.discipline && <span>{request.discipline}</span>}
                          {request.horseCount && <span> | {request.horseCount} horses</span>}
                        </div>
                      </td>
                      <td>
                        {request.selectedDate && request.selectedTime ? (
                          <div style={{ fontSize: '13px' }}>
                            <div>{request.selectedDate}</div>
                            <div style={{ color: 'var(--color-text-secondary)' }}>{request.selectedTime}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`badge badge-${statusColors[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {formatDate(request.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', color: 'var(--color-text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedRequest && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Request Details</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRequest(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>{selectedRequest.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a href={`mailto:${selectedRequest.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-brand-600)' }}>
                    <Mail size={16} />
                    {selectedRequest.email}
                  </a>
                  {selectedRequest.phone && (
                    <a href={`tel:${selectedRequest.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-brand-600)' }}>
                      <Phone size={16} />
                      {selectedRequest.phone}
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                {selectedRequest.barnName && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Barn Name</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} />
                      {selectedRequest.barnName}
                    </div>
                  </div>
                )}
                {selectedRequest.discipline && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Discipline</label>
                    <div>{selectedRequest.discipline}</div>
                  </div>
                )}
                {selectedRequest.horseCount && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Horse Count</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} />
                      {selectedRequest.horseCount}
                    </div>
                  </div>
                )}
                {selectedRequest.isDecisionMaker && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Decision Maker</label>
                    <div>{selectedRequest.isDecisionMaker === 'yes' ? 'Yes' : 'No'}</div>
                  </div>
                )}
                {selectedRequest.selectedDate && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Requested Demo Time</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} />
                      {selectedRequest.selectedDate} at {selectedRequest.selectedTime}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Status</label>
                <select
                  value={selectedRequest.status}
                  onChange={(e) => updateStatus(selectedRequest._id, e.target.value)}
                  className="input"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                  <MessageSquare size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Notes
                </label>
                <textarea
                  value={selectedRequest.notes || ''}
                  onChange={(e) => updateNotes(selectedRequest._id, e.target.value)}
                  placeholder="Add notes about this request..."
                  className="input"
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <a
                  href={`mailto:${selectedRequest.email}?subject=Your OnStride Demo Request`}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Mail size={16} />
                  Send Email
                </a>
                <button
                  className="btn btn-ghost"
                  onClick={() => deleteRequest(selectedRequest._id)}
                  style={{ color: 'var(--color-error-600)' }}
                >
                  <X size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
