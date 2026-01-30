import { useState, useEffect } from 'react';
import {
  Calendar, Mail, Phone, Building2, Users, Clock,
  X, Search, ChevronLeft, ChevronRight
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
  status: string;
  notes?: string;
  createdAt: string;
}

const statusOptions = [
  { value: 'new', label: 'New', color: '#eab308' },
  { value: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { value: 'scheduled', label: 'Scheduled', color: '#8b5cf6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#737373' }
];

export default function AdminDemoPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [selected, setSelected] = useState<DemoRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, [search, filterStatus, page]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '15');
      if (filterStatus) params.append('status', filterStatus);
      if (search) params.append('search', search);

      const [requestsRes, statsRes] = await Promise.all([
        fetch(`${apiBase}/admin/demo-requests?${params}`, { headers: getHeaders() }).then(r => r.json()),
        fetch(`${apiBase}/admin/demo-requests/stats`, { headers: getHeaders() }).then(r => r.json())
      ]);

      setRequests(requestsRes.data || []);
      setTotalPages(requestsRes.pagination?.pages || 1);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequest = async (id: string, updates: Partial<DemoRequest>) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await fetch(`${apiBase}/admin/demo-requests/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });

      setRequests(prev => prev.map(r => r._id === id ? { ...r, ...updates } : r));
      if (selected?._id === id) {
        setSelected(prev => prev ? { ...prev, ...updates } : null);
      }

      // Refresh stats
      const apiBase2 = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const statsRes = await fetch(`${apiBase2}/admin/demo-requests/stats`, { headers: getHeaders() }).then(r => r.json());
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this request?')) return;
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await fetch(`${apiBase}/admin/demo-requests/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      setRequests(prev => prev.filter(r => r._id !== id));
      if (selected?._id === id) setSelected(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  const getStatusColor = (status: string) => statusOptions.find(s => s.value === status)?.color || '#737373';

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 600, margin: 0 }}>
          Demo Requests
        </h1>
        <p style={{ color: '#737373', marginTop: '4px' }}>
          Manage demo booking requests from the landing page
        </p>
      </div>

      {/* Stats Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setFilterStatus(''); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: filterStatus === '' ? '1px solid #3b82f6' : '1px solid #262626',
            background: filterStatus === '' ? '#3b82f620' : 'transparent',
            color: filterStatus === '' ? '#3b82f6' : '#a3a3a3',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          All ({stats.total || 0})
        </button>
        {statusOptions.map(s => (
          <button
            key={s.value}
            onClick={() => { setFilterStatus(s.value); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filterStatus === s.value ? `1px solid ${s.color}` : '1px solid #262626',
              background: filterStatus === s.value ? `${s.color}20` : 'transparent',
              color: filterStatus === s.value ? s.color : '#a3a3a3',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {s.label} ({stats[s.value] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
        <Search size={18} color="#737373" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by name, email, or barn..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            width: '100%',
            padding: '12px 12px 12px 44px',
            background: '#141414',
            border: '1px solid #262626',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* List */}
        <div style={{
          flex: 1,
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#737373' }}>Loading...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#737373' }}>No requests found</div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {requests.map(req => (
                <div
                  key={req._id}
                  onClick={() => setSelected(req)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #262626',
                    cursor: 'pointer',
                    background: selected?._id === req._id ? '#1f1f1f' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ color: 'white', fontWeight: 500 }}>{req.name}</span>
                    <span style={{
                      color: getStatusColor(req.status),
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {req.status}
                    </span>
                  </div>
                  <div style={{ color: '#737373', fontSize: '13px' }}>{req.email}</div>
                  <div style={{ color: '#525252', fontSize: '12px', marginTop: '4px' }}>
                    {req.barnName && `${req.barnName} • `}{formatDate(req.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #262626',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === 1 ? '#525252' : '#a3a3a3',
                  cursor: page === 1 ? 'default' : 'pointer'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ color: '#737373', fontSize: '13px' }}>{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === totalPages ? '#525252' : '#a3a3a3',
                  cursor: page === totalPages ? 'default' : 'pointer'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{
            width: '380px',
            background: '#141414',
            border: '1px solid #262626',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #262626',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Details</h3>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'white', fontSize: '18px', margin: '0 0 8px' }}>{selected.name}</h4>
                <a href={`mailto:${selected.email}`} style={{ color: '#3b82f6', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', marginBottom: '4px' }}>
                  <Mail size={14} /> {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} style={{ color: '#3b82f6', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                    <Phone size={14} /> {selected.phone}
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {selected.barnName && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Barn</div>
                    <div style={{ color: '#a3a3a3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} /> {selected.barnName}
                    </div>
                  </div>
                )}
                {selected.discipline && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Discipline</div>
                    <div style={{ color: '#a3a3a3', fontSize: '14px' }}>{selected.discipline}</div>
                  </div>
                )}
                {selected.horseCount && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Horses</div>
                    <div style={{ color: '#a3a3a3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} /> {selected.horseCount}
                    </div>
                  </div>
                )}
                {selected.selectedDate && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Requested Time</div>
                    <div style={{ color: '#a3a3a3', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {selected.selectedDate} at {selected.selectedTime}
                    </div>
                  </div>
                )}
                {selected.isDecisionMaker && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Decision Maker</div>
                    <div style={{ color: '#a3a3a3', fontSize: '14px' }}>{selected.isDecisionMaker === 'yes' ? 'Yes' : 'No'}</div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#525252', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Status</div>
                <select
                  value={selected.status}
                  onChange={(e) => updateRequest(selected._id, { status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#525252', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
                <textarea
                  value={selected.notes || ''}
                  onChange={(e) => updateRequest(selected._id, { notes: e.target.value })}
                  placeholder="Add notes..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #262626', display: 'flex', gap: '12px' }}>
              <a
                href={`mailto:${selected.email}?subject=Your OnStride Demo Request`}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#3b82f6',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                Send Email
              </a>
              <button
                onClick={() => deleteRequest(selected._id)}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
