import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Building2,
  LogOut, Menu, X, BarChart3, Clock
} from 'lucide-react';

interface AdminUser {
  email: string;
  name: string;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    if (!token || !userData) {
      navigate('/admin/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      navigate('/admin/login');
    }
  }, [navigate]);

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

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/demo-requests', icon: Calendar, label: 'Demo Requests' },
    { to: '/admin/availability', icon: Clock, label: 'Availability' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/barns', icon: Building2, label: 'Barns' },
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
        <nav style={{ flex: 1, padding: '8px' }}>
          {navItems.map((item) => (
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
              {item.label}
            </NavLink>
          ))}
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
