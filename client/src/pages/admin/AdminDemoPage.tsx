import { useState, useEffect } from 'react';
import {
  Mail, Phone, Building2, Users, Clock,
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
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
          Demo Requests
        </h1>
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

      {/* Status Filter Tabs - Compact */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button
          onClick={() => { setFilterStatus(''); setPage(1); }}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            border: 'none',
            background: filterStatus === '' ? '#252525' : 'transparent',
            color: filterStatus === '' ? 'white' : '#525252',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          All ({stats.total || 0})
        </button>
        {statusOptions.map(s => (
          <button
            key={s.value}
            onClick={() => { setFilterStatus(s.value); setPage(1); }}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              background: filterStatus === s.value ? '#252525' : 'transparent',
              color: filterStatus === s.value ? s.color : '#525252',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            {s.label} ({stats[s.value] || 0})
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Table */}
        <div style={{
          flex: 1,
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {isLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '12px' }}>Loading...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '12px' }}>No requests found</div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Name</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Email</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Barn</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr
                      key={req._id}
                      onClick={() => setSelected(req)}
                      style={{
                        borderBottom: '1px solid #1f1f1f',
                        cursor: 'pointer',
                        background: selected?._id === req._id ? '#1a1a1a' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: 'white', fontSize: '12px' }}>{req.name}</td>
                      <td style={{ padding: '8px 12px', color: '#737373', fontSize: '12px' }}>{req.email}</td>
                      <td style={{ padding: '8px 12px', color: '#525252', fontSize: '12px' }}>{req.barnName || '—'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          color: getStatusColor(req.status),
                          fontSize: '11px',
                          fontWeight: 500,
                          textTransform: 'capitalize'
                        }}>
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#525252', fontSize: '11px', textAlign: 'right' }}>
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === 1 ? '#333' : '#525252',
                  cursor: page === 1 ? 'default' : 'pointer'
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ color: '#525252', fontSize: '11px' }}>{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  background: 'none',
                  border: 'none',
                  color: page === totalPages ? '#333' : '#525252',
                  cursor: page === totalPages ? 'default' : 'pointer'
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel - Compact */}
        {selected && (
          <div style={{
            width: '300px',
            background: '#141414',
            border: '1px solid #1f1f1f',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '10px 12px',
              borderBottom: '1px solid #1f1f1f',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#a3a3a3', margin: 0, fontSize: '12px', fontWeight: 500 }}>Details</span>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{selected.name}</div>
                <a href={`mailto:${selected.email}`} style={{ color: '#3b82f6', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginBottom: '2px' }}>
                  <Mail size={11} /> {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} style={{ color: '#3b82f6', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    <Phone size={11} /> {selected.phone}
                  </a>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {selected.barnName && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Barn</div>
                    <div style={{ color: '#a3a3a3', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={11} /> {selected.barnName}
                    </div>
                  </div>
                )}
                {selected.discipline && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Discipline</div>
                    <div style={{ color: '#a3a3a3', fontSize: '11px' }}>{selected.discipline}</div>
                  </div>
                )}
                {selected.horseCount && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Horses</div>
                    <div style={{ color: '#a3a3a3', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={11} /> {selected.horseCount}
                    </div>
                  </div>
                )}
                {selected.selectedDate && (
                  <div>
                    <div style={{ color: '#525252', fontSize: '9px', textTransform: 'uppercase', marginBottom: '2px' }}>Requested</div>
                    <div style={{ color: '#a3a3a3', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {selected.selectedDate}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#525252', fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
                <select
                  value={selected.status}
                  onChange={(e) => updateRequest(selected._id, { status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#0a0a0a',
                    border: '1px solid #1f1f1f',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                >
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ color: '#525252', fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
                <textarea
                  value={selected.notes || ''}
                  onChange={(e) => updateRequest(selected._id, { notes: e.target.value })}
                  placeholder="Add notes..."
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#0a0a0a',
                    border: '1px solid #1f1f1f',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '11px',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '60px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderTop: '1px solid #1f1f1f', display: 'flex', gap: '8px' }}>
              <a
                href={`mailto:${selected.email}?subject=Your OnStride Demo Request`}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: '#3b82f6',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                Email
              </a>
              <button
                onClick={() => deleteRequest(selected._id)}
                style={{
                  padding: '6px 10px',
                  background: 'transparent',
                  border: '1px solid #dc2626',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '11px',
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
