import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Building2,
  LogOut, Shield, Menu, X
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
    { to: '/admin/demo-requests', icon: Calendar, label: 'Demo Requests' },
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
          <Shield size={24} color="#3b82f6" />
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
        width: '240px',
        background: '#141414',
        borderRight: '1px solid #262626',
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
          padding: '20px',
          borderBottom: '1px solid #262626',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>OnStride</div>
            <div style={{ color: '#737373', fontSize: '12px' }}>Admin Portal</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: isActive ? 'white' : '#a3a3a3',
                background: isActive ? '#262626' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 500 : 400,
                marginBottom: '4px',
                transition: 'all 0.15s ease'
              })}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #262626' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#262626',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a3a3a3',
              fontSize: '14px',
              fontWeight: 500
            }}>
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{user.name}</div>
              <div style={{
                color: '#737373',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              background: 'transparent',
              border: '1px solid #262626',
              borderRadius: '8px',
              color: '#a3a3a3',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
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
