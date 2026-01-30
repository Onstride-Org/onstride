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
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 600, margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: '#737373', marginTop: '4px' }}>
          Welcome to the OnStride admin portal
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <Calendar size={20} color="#eab308" />
            {stats?.newDemoRequests ? (
              <span style={{
                background: '#eab30820',
                color: '#eab308',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {stats.newDemoRequests} new
              </span>
            ) : null}
          </div>
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 600 }}>
            {stats?.totalDemoRequests || 0}
          </div>
          <div style={{ color: '#737373', fontSize: '14px' }}>Demo Requests</div>
        </div>

        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <Users size={20} color="#3b82f6" style={{ marginBottom: '12px' }} />
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 600 }}>
            {stats?.totalUsers || 0}
          </div>
          <div style={{ color: '#737373', fontSize: '14px' }}>Total Users</div>
        </div>

        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <Building2 size={20} color="#22c55e" style={{ marginBottom: '12px' }} />
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 600 }}>
            {stats?.totalBarns || 0}
          </div>
          <div style={{ color: '#737373', fontSize: '14px' }}>Total Barns</div>
        </div>

        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <TrendingUp size={20} color="#8b5cf6" style={{ marginBottom: '12px' }} />
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 600 }}>
            --
          </div>
          <div style={{ color: '#737373', fontSize: '14px' }}>MRR</div>
        </div>
      </div>

      {/* Recent Demo Requests */}
      <div style={{
        background: '#141414',
        border: '1px solid #262626',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #262626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: 0 }}>
            Recent Demo Requests
          </h2>
          <Link
            to="/admin/demo-requests"
            style={{
              color: '#3b82f6',
              fontSize: '14px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#737373' }}>
            No demo requests yet
          </div>
        ) : (
          <div>
            {recentRequests.map((request) => (
              <div
                key={request._id}
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #262626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ color: 'white', fontWeight: 500 }}>{request.name}</div>
                  <div style={{ color: '#737373', fontSize: '13px' }}>
                    {request.email}
                    {request.barnName && ` • ${request.barnName}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{
                    color: getStatusColor(request.status),
                    fontSize: '13px',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}>
                    {request.status}
                  </span>
                  <span style={{ color: '#525252', fontSize: '13px' }}>
                    {formatDate(request.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
