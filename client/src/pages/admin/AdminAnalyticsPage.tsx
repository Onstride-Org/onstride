import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, Building2, Calendar,
  DollarSign, Activity, ChevronDown, Search, ArrowUpRight,
  BarChart3, PieChart, Database
} from 'lucide-react';

interface TimeSeriesData {
  date: string;
  users: number;
  barns: number;
  demoRequests: number;
  horses: number;
}

interface TopBarn {
  _id: string;
  name: string;
  horseCount: number;
  userCount: number;
  revenue: number;
}

interface DemoConversion {
  total: number;
  converted: number;
  rate: number;
}

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalBarns: number;
    totalHorses: number;
    totalDemoRequests: number;
    userGrowth: number;
    barnGrowth: number;
    horseGrowth: number;
    demoGrowth: number;
  };
  timeSeries: TimeSeriesData[];
  topBarns: TopBarn[];
  demoConversion: DemoConversion;
  usersByType: { type: string; count: number }[];
  demosByStatus: { status: string; count: number }[];
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedChart, setSelectedChart] = useState<'users' | 'barns' | 'demos' | 'horses'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetail, setShowDetail] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const res = await fetch(`${apiBase}/admin/analytics?range=${timeRange}`, {
        headers: getHeaders()
      }).then(r => r.json());

      setData(res);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <span style={{
        color: isPositive ? '#22c55e' : '#ef4444',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px'
      }}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isPositive ? '+' : ''}{growth.toFixed(1)}%
      </span>
    );
  };

  // Simple bar chart component
  const BarChart = ({ data, dataKey, color }: { data: TimeSeriesData[], dataKey: keyof TimeSeriesData, color: string }) => {
    const values = data.map(d => Number(d[dataKey]));
    const max = Math.max(...values, 1);

    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px', padding: '20px 0' }}>
        {data.map((d, i) => {
          const height = (Number(d[dataKey]) / max) * 160;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '40px',
                  height: `${height}px`,
                  background: `linear-gradient(180deg, ${color}, ${color}80)`,
                  borderRadius: '4px 4px 0 0',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s'
                }}
                title={`${d.date}: ${d[dataKey]}`}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              />
              <span style={{ color: '#525252', fontSize: '10px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Donut chart component
  const DonutChart = ({ data, colors }: { data: { label: string; value: number }[], colors: string[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
    let cumulative = 0;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {data.map((d, i) => {
            const percentage = (d.value / total) * 100;
            const startAngle = (cumulative / 100) * 360;
            cumulative += percentage;
            const endAngle = (cumulative / 100) * 360;

            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);

            const x1 = 60 + 50 * Math.cos(startRad);
            const y1 = 60 + 50 * Math.sin(startRad);
            const x2 = 60 + 50 * Math.cos(endRad);
            const y2 = 60 + 50 * Math.sin(endRad);

            const largeArc = percentage > 50 ? 1 : 0;

            return (
              <path
                key={i}
                d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[i % colors.length]}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              />
            );
          })}
          <circle cx="60" cy="60" r="30" fill="#141414" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colors[i % colors.length] }} />
              <span style={{ color: '#a3a3a3', fontSize: '13px' }}>{d.label}</span>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#737373' }}>
        Loading analytics...
      </div>
    );
  }

  const chartColors = {
    users: '#3b82f6',
    barns: '#22c55e',
    demos: '#eab308',
    horses: '#8b5cf6'
  };

  const filteredBarns = data?.topBarns.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 600, margin: 0 }}>
            Analytics
          </h1>
          <p style={{ color: '#737373', marginTop: '4px' }}>
            Platform activity and trends
          </p>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['7d', '30d', '90d', '1y'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: timeRange === range ? '1px solid #3b82f6' : '1px solid #262626',
                background: timeRange === range ? '#3b82f620' : 'transparent',
                color: timeRange === range ? '#3b82f6' : '#a3a3a3',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { key: 'users', label: 'Total Users', value: data?.overview.totalUsers || 0, growth: data?.overview.userGrowth || 0, icon: Users, color: '#3b82f6' },
          { key: 'barns', label: 'Total Barns', value: data?.overview.totalBarns || 0, growth: data?.overview.barnGrowth || 0, icon: Building2, color: '#22c55e' },
          { key: 'horses', label: 'Total Horses', value: data?.overview.totalHorses || 0, growth: data?.overview.horseGrowth || 0, icon: Database, color: '#8b5cf6' },
          { key: 'demos', label: 'Demo Requests', value: data?.overview.totalDemoRequests || 0, growth: data?.overview.demoGrowth || 0, icon: Calendar, color: '#eab308' }
        ].map(stat => (
          <div
            key={stat.key}
            onClick={() => setSelectedChart(stat.key as any)}
            style={{
              background: '#141414',
              border: selectedChart === stat.key ? `1px solid ${stat.color}` : '1px solid #262626',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <stat.icon size={20} color={stat.color} />
              {formatGrowth(stat.growth)}
            </div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: 600, marginBottom: '4px' }}>
              {formatNumber(stat.value)}
            </div>
            <div style={{ color: '#737373', fontSize: '14px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div style={{
        background: '#141414',
        border: '1px solid #262626',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 600, margin: 0 }}>
            {selectedChart === 'users' ? 'User Growth' :
             selectedChart === 'barns' ? 'Barn Growth' :
             selectedChart === 'horses' ? 'Horse Growth' : 'Demo Requests'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['users', 'barns', 'demos', 'horses'] as const).map(key => (
              <button
                key={key}
                onClick={() => setSelectedChart(key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: selectedChart === key ? chartColors[key] + '30' : 'transparent',
                  color: selectedChart === key ? chartColors[key] : '#737373',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {data?.timeSeries && data.timeSeries.length > 0 ? (
          <BarChart
            data={data.timeSeries}
            dataKey={selectedChart === 'demos' ? 'demoRequests' : selectedChart}
            color={chartColors[selectedChart]}
          />
        ) : (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#525252' }}>
            No data available for this time range
          </div>
        )}
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        {/* Demo Conversion */}
        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>
            Demo Conversion Rate
          </h3>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ color: '#22c55e', fontSize: '48px', fontWeight: 600 }}>
              {(data?.demoConversion.rate || 0).toFixed(1)}%
            </div>
            <div style={{ color: '#737373', fontSize: '13px' }}>
              {data?.demoConversion.converted || 0} of {data?.demoConversion.total || 0} converted
            </div>
          </div>
          <div style={{
            height: '8px',
            background: '#262626',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${data?.demoConversion.rate || 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        {/* Users by Type */}
        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>
            Users by Type
          </h3>
          <DonutChart
            data={(data?.usersByType || []).map(u => ({ label: u.type, value: u.count }))}
            colors={['#3b82f6', '#22c55e', '#eab308', '#8b5cf6', '#ef4444']}
          />
        </div>

        {/* Demos by Status */}
        <div style={{
          background: '#141414',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 600, marginBottom: '20px' }}>
            Demos by Status
          </h3>
          <DonutChart
            data={(data?.demosByStatus || []).map(d => ({ label: d.status, value: d.count }))}
            colors={['#eab308', '#3b82f6', '#8b5cf6', '#22c55e', '#737373']}
          />
        </div>
      </div>

      {/* Top Barns Table */}
      <div style={{
        background: '#141414',
        border: '1px solid #262626',
        borderRadius: '12px',
        marginTop: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #262626',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: 600, margin: 0 }}>
            Top Barns
          </h3>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#737373" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search barns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                background: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
                width: '200px'
              }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #262626' }}>
              <th style={{ padding: '12px 24px', textAlign: 'left', color: '#525252', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>Barn</th>
              <th style={{ padding: '12px 24px', textAlign: 'center', color: '#525252', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>Horses</th>
              <th style={{ padding: '12px 24px', textAlign: 'center', color: '#525252', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>Users</th>
              <th style={{ padding: '12px 24px', textAlign: 'right', color: '#525252', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {filteredBarns.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#525252' }}>
                  No barns found
                </td>
              </tr>
            ) : (
              filteredBarns.map((barn, i) => (
                <tr
                  key={barn._id}
                  onClick={() => setShowDetail(showDetail === barn._id ? null : barn._id)}
                  style={{
                    borderBottom: '1px solid #262626',
                    cursor: 'pointer',
                    background: showDetail === barn._id ? '#1a1a1a' : 'transparent'
                  }}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        color: '#525252',
                        fontSize: '12px',
                        width: '20px'
                      }}>
                        #{i + 1}
                      </span>
                      <span style={{ color: 'white', fontWeight: 500 }}>{barn.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <span style={{
                      color: '#a3a3a3',
                      background: '#262626',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '13px'
                    }}>
                      {barn.horseCount}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <span style={{
                      color: '#a3a3a3',
                      background: '#262626',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '13px'
                    }}>
                      {barn.userCount}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <span style={{ color: '#22c55e', fontWeight: 500 }}>
                      ${barn.revenue.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
