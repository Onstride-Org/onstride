import { useEffect, useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Building2,
  LogOut, Menu, X, BarChart3, Clock, FileText
} from 'lucide-react';
import axios from 'axios';

interface AdminUser {
  email: string;
  name: string;
}

interface SidebarCounts {
  newDemoRequests: number;
  openTasks: number;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<SidebarCounts>({ newDemoRequests: 0, openTasks: 0 });

  const loadCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const headers = { Authorization: `Bearer ${token}` };

      const [demoRes, tasksRes] = await Promise.all([
        axios.get(`${apiBase}/admin/demo-requests/stats`, { headers }).catch(() => ({ data: null })),
        axios.get(`${apiBase}/admin/tasks/stats`, { headers }).catch(() => ({ data: null })),
      ]);

      setCounts({
        newDemoRequests: demoRes.data?.new || 0,
        openTasks: tasksRes.data?.open || 0,
      });
    } catch (error) {
      console.error('Failed to load sidebar counts:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    if (!token || !userData) {
      navigate('/admin/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      loadCounts();
      // Refresh counts every 60 seconds
      const interval = setInterval(loadCounts, 60000);
      return () => clearInterval(interval);
    } catch {
      navigate('/admin/login');
    }
  }, [navigate, loadCounts]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #262626',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  const mainNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', count: 0 },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', count: 0 },
    { to: '/admin/users', icon: Users, label: 'Users', count: 0 },
    { to: '/admin/barns', icon: Building2, label: 'Barns', count: 0 },
    { to: '/admin/docuseal', icon: FileText, label: 'Applications', count: 0 },
  ];

  const demoNavItems = [
    { to: '/admin/demo-requests', icon: Calendar, label: 'Requests', count: counts.newDemoRequests },
    { to: '/admin/availability', icon: Clock, label: 'Availability', count: 0 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex' }}>
      {/* Mobile Header */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: '#141414',
        borderBottom: '1px solid #262626',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 100
      }} className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/gl-logo.png" alt="OnStride" style={{ width: '24px', height: '24px', filter: 'brightness(0) invert(1)' }} />
          <span style={{ color: 'white', fontWeight: 600 }}>Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside style={{
        width: '200px',
        background: '#111',
        borderRight: '1px solid #1f1f1f',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 99
      }} className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <img
            src="/gl-logo.png"
            alt="OnStride"
            style={{
              width: '24px',
              height: '24px',
              filter: 'brightness(0) invert(1)'
            }}
          />
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>OnStride</div>
            <div style={{ color: '#525252', fontSize: '11px' }}>Admin</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column' }}>
          {/* Main nav items */}
          <div>
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  color: isActive ? 'white' : '#6b6b6b',
                  background: isActive ? '#1a1a1a' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 400,
                  marginBottom: '2px',
                  transition: 'all 0.1s ease'
                })}
              >
                <item.icon size={15} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count > 0 && (
                  <span style={{
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {item.count}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Demo scheduling section */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1f1f1f' }}>
            <div style={{
              padding: '4px 12px 8px',
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              color: '#3b82f6',
              letterSpacing: '0.5px'
            }}>
              Demo Scheduling
            </div>
            {demoNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  color: isActive ? 'white' : '#6b6b6b',
                  background: isActive ? '#1a1a1a' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 400,
                  marginBottom: '2px',
                  transition: 'all 0.1s ease'
                })}
              >
                <item.icon size={15} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.count > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {item.count}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User & Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid #1f1f1f' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              background: 'transparent',
              border: '1px solid #252525',
              borderRadius: '4px',
              color: '#6b6b6b',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.1s ease'
            }}
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '200px',
        minHeight: '100vh'
      }} className="admin-main">
        <Outlet />
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 98,
            display: 'none'
          }}
          className="admin-overlay"
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .admin-mobile-header { display: flex !important; }
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform 0.2s ease;
          }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main {
            margin-left: 0 !important;
            padding-top: 60px;
          }
          .admin-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
