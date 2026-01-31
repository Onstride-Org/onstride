import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Building2, TrendingUp, ArrowRight } from 'lucide-react';

interface Stats {
  totalDemoRequests: number;
  newDemoRequests: number;
  totalUsers: number;
  totalBarns: number;
}

interface DemoRequest {
  _id: string;
  name: string;
  email: string;
  barnName?: string;
  status: string;
  createdAt: string;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentRequests, setRecentRequests] = useState<DemoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [statsRes, demoRes] = await Promise.all([
        fetch(`${apiBase}/admin/stats`, { headers }).then(r => r.json()).catch(() => ({})),
        fetch(`${apiBase}/admin/demo-requests?limit=5`, { headers }).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      setStats({
        totalDemoRequests: demoRes.pagination?.total || 0,
        newDemoRequests: demoRes.data?.filter((d: DemoRequest) => d.status === 'new').length || 0,
        totalUsers: statsRes.totalUsers || 0,
        totalBarns: statsRes.totalBarns || 0
      });
      setRecentRequests(demoRes.data || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: '#eab308',
      contacted: '#3b82f6',
      scheduled: '#8b5cf6',
      completed: '#22c55e',
      cancelled: '#737373'
    };
    return colors[status] || '#737373';
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: '#737373'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
          Dashboard
        </h1>
      </div>

      {/* Stats Row - Compact */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '140px'
        }}>
          <Calendar size={16} color="#eab308" />
          <div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>
              {stats?.totalDemoRequests || 0}
            </div>
            <div style={{ color: '#525252', fontSize: '11px' }}>Demos</div>
          </div>
          {stats?.newDemoRequests ? (
            <span style={{
              background: '#eab30820',
              color: '#eab308',
              padding: '2px 6px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: 500
            }}>
              {stats.newDemoRequests} new
            </span>
          ) : null}
        </div>

        <div style={{
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '120px'
        }}>
          <Users size={16} color="#3b82f6" />
          <div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>
              {stats?.totalUsers || 0}
            </div>
            <div style={{ color: '#525252', fontSize: '11px' }}>Users</div>
          </div>
        </div>

        <div style={{
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '120px'
        }}>
          <Building2 size={16} color="#22c55e" />
          <div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>
              {stats?.totalBarns || 0}
            </div>
            <div style={{ color: '#525252', fontSize: '11px' }}>Barns</div>
          </div>
        </div>

        <div style={{
          background: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '120px'
        }}>
          <TrendingUp size={16} color="#8b5cf6" />
          <div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 600, lineHeight: 1 }}>
              --
            </div>
            <div style={{ color: '#525252', fontSize: '11px' }}>MRR</div>
          </div>
        </div>
      </div>

      {/* Recent Demo Requests - Table Style */}
      <div style={{
        background: '#141414',
        border: '1px solid #1f1f1f',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: '#a3a3a3', fontSize: '12px', fontWeight: 500 }}>
            Recent Demo Requests
          </span>
          <Link
            to="/admin/demo-requests"
            style={{
              color: '#525252',
              fontSize: '11px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#525252', fontSize: '12px' }}>
            No demo requests yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '8px 16px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '8px 16px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Barn</th>
                <th style={{ padding: '8px 16px', textAlign: 'left', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '8px 16px', textAlign: 'right', color: '#525252', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr key={request._id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                  <td style={{ padding: '8px 16px', color: 'white', fontSize: '12px' }}>{request.name}</td>
                  <td style={{ padding: '8px 16px', color: '#737373', fontSize: '12px' }}>{request.email}</td>
                  <td style={{ padding: '8px 16px', color: '#525252', fontSize: '12px' }}>{request.barnName || '—'}</td>
                  <td style={{ padding: '8px 16px' }}>
                    <span style={{
                      color: getStatusColor(request.status),
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {request.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 16px', color: '#525252', fontSize: '11px', textAlign: 'right' }}>
                    {formatDate(request.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
