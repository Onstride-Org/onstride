import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Users, Database } from 'lucide-react';

interface Barn {
  _id: string;
  name: string;
  ownerId?: { name: string; email: string };
  horseCount?: number;
  userCount?: number;
  createdAt: string;
}

export default function AdminBarnsListPage() {
  const navigate = useNavigate();
  const [barns, setBarns] = useState<Barn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [search, page]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);

      const res = await fetch(`${apiBase}/admin/barns?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());

      setBarns(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to load barns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>Barns</h1>
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

      {/* Table */}
      <div style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '12px' }}>Loading...</div>
        ) : barns.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '12px' }}>No barns found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Barn</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Owner</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Horses</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Users</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {barns.map(barn => (
                <tr
                  key={barn._id}
                  onClick={() => navigate(`/admin/barns/${barn._id}`)}
                  style={{ borderBottom: '1px solid #1f1f1f', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '8px 12px', color: 'white', fontSize: '12px' }}>{barn.name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {barn.ownerId ? (
                      <span style={{ color: '#737373', fontSize: '12px' }}>{barn.ownerId.name}</span>
                    ) : (
                      <span style={{ color: '#333' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ color: '#737373', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Database size={11} color="#525252" />
                      {barn.horseCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{ color: '#737373', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={11} color="#525252" />
                      {barn.userCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#525252', fontSize: '11px', textAlign: 'right' }}>
                    {formatDate(barn.createdAt)}
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
    </div>
  );
}
