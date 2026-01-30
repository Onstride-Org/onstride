import { useState, useEffect } from 'react';
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
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 600, margin: 0 }}>Barns</h1>
        <p style={{ color: '#737373', marginTop: '4px' }}>All registered barns on the platform</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
        <Search size={18} color="#737373" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by barn name..."
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

      {/* Table */}
      <div style={{
        background: '#141414',
        border: '1px solid #262626',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#737373' }}>Loading...</div>
        ) : barns.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#737373' }}>No barns found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #262626' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#737373', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Barn</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#737373', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Owner</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', color: '#737373', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Horses</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', color: '#737373', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Users</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#737373', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {barns.map(barn => (
                <tr key={barn._id} style={{ borderBottom: '1px solid #262626' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ color: 'white', fontWeight: 500 }}>{barn.name}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {barn.ownerId ? (
                      <>
                        <div style={{ color: '#a3a3a3', fontSize: '14px' }}>{barn.ownerId.name}</div>
                        <div style={{ color: '#525252', fontSize: '12px' }}>{barn.ownerId.email}</div>
                      </>
                    ) : (
                      <span style={{ color: '#525252' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ color: '#a3a3a3', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Database size={14} color="#737373" />
                      {barn.horseCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ color: '#a3a3a3', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#737373" />
                      {barn.userCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#737373', fontSize: '13px' }}>
                    {formatDate(barn.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
              style={{ background: 'none', border: 'none', color: page === 1 ? '#525252' : '#a3a3a3', cursor: page === 1 ? 'default' : 'pointer' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ color: '#737373', fontSize: '13px' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'none', border: 'none', color: page === totalPages ? '#525252' : '#a3a3a3', cursor: page === totalPages ? 'default' : 'pointer' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
