import { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Home, FileText, CheckSquare, Calendar, UserCheck, Users, Settings, Menu, X, LogOut } from 'lucide-react';
import { HorseIcon } from '../components/icons/HorseIcon';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, barns, currentBarnId, currentBarnRole, switchBarn, logout } = useAuthStore();
  const navigate = useNavigate();

  const currentBarn = barns.find(b => b.id === currentBarnId);

  // Check if user is staff (not a boarder/client)
  const isStaff = useMemo(() => {
    if (!currentBarnRole) return false;
    return !['boarder'].includes(currentBarnRole.role);
  }, [currentBarnRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Base nav items for all users
  const allNavItems = [
    { path: '/dashboard', icon: 'home', label: 'Dashboard', staffOnly: false },
    { path: '/horses', icon: 'horse', label: 'Horses', staffOnly: false },
    { path: '/invoices', icon: 'invoice', label: 'Invoices', staffOnly: false },
    { path: '/tasks', icon: 'tasks', label: 'Tasks', staffOnly: false },
    { path: '/lessons', icon: 'calendar', label: 'Lessons', staffOnly: false },
    { path: '/vendors', icon: 'vendor', label: 'Vendors', staffOnly: true },
    { path: '/users', icon: 'users', label: 'Users', staffOnly: true },
    { path: '/settings', icon: 'settings', label: 'Settings', staffOnly: false },
  ];

  // Filter nav items based on role
  const navItems = allNavItems.filter(item => !item.staffOnly || isStaff);

  const getIcon = (icon: string) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    switch (icon) {
      case 'home':
        return <Home {...iconProps} />;
      case 'horse':
        return <HorseIcon {...iconProps} />;
      case 'invoice':
        return <FileText {...iconProps} />;
      case 'tasks':
        return <CheckSquare {...iconProps} />;
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'vendor':
        return <UserCheck {...iconProps} />;
      case 'users':
        return <Users {...iconProps} />;
      case 'settings':
        return <Settings {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile header */}
      <header className="app-header">
        <button
          className="btn btn-ghost sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </button>
        <div className="header-brand">
          <span className="header-title">OnStride</span>
        </div>
        <div className="header-user">
          <span className="user-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/gl-logo.png" alt="OnStride" className="logo-img" />
            <span>OnStride</span>
          </div>
          <button
            className="btn btn-ghost sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barn selector */}
        {barns.length > 1 && (
          <div className="barn-selector">
            <select
              value={currentBarnId || ''}
              onChange={(e) => switchBarn(e.target.value)}
              className="form-select"
            >
              {barns.map((barn) => (
                <option key={barn.id} value={barn.id}>
                  {barn.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {barns.length === 1 && (
          <div className="barn-selector">
            <div className="current-barn">{currentBarn?.name}</div>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{getIcon(item.icon)}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </span>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.accountType}</span>
            </div>
          </div>
          <button className="btn btn-ghost logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
