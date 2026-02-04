import { useState, useMemo, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { subscriptionsApi } from '../services/api';
import { Home, FileText, CheckSquare, Calendar, UserCheck, Users, Settings, Menu, X, LogOut, Warehouse, DollarSign, Building2, ChevronDown, AlertCircle } from 'lucide-react';
import { HorseIcon } from '../components/icons/HorseIcon';
import OnboardingStepsModal from '../components/OnboardingStepsModal';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, barns, currentBarnId, currentBarnRole, switchBarn, logout, showSubscriptionTutorial, setShowSubscriptionTutorial } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'trial' | 'active' | 'past_due' | null>(null);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(true);

  const isSubscriptionPage = location.pathname === '/app/settings/subscription';

  useEffect(() => {
    if (!currentBarnId) {
      setSubscriptionStatus(null);
      return;
    }
    let cancelled = false;
    subscriptionsApi.getCurrent()
      .then((res: { subscription?: { tier?: string; status?: string }; plan?: unknown }) => {
        if (cancelled || !res?.subscription) return;
        const sub = res.subscription;
        const tier = sub.tier || 'free';
        const status = (sub.status || '').toLowerCase();
        if (tier === 'free') {
          setSubscriptionStatus('free');
        } else if (status === 'trialing') {
          setSubscriptionStatus('trial');
        } else if (status === 'pastdue' || status === 'past_due') {
          setSubscriptionStatus('past_due');
        } else if (status === 'active') {
          setSubscriptionStatus('active');
        } else {
          setSubscriptionStatus('active');
        }
      })
      .catch(() => setSubscriptionStatus('free'));
    return () => { cancelled = true; };
  }, [currentBarnId]);

  const currentBarn = barns.find(b => b.id === currentBarnId);

  // Check if user is staff (not a boarder/client)
  const isStaff = useMemo(() => {
    if (!currentBarnRole) return false;
    return !['boarder'].includes(currentBarnRole.role);
  }, [currentBarnRole]);

  const isGroomer = useMemo(() => {
    return currentBarnRole?.role === 'groomer';
  }, [currentBarnRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Base nav items for all users
  const allNavItems = [
    { path: '/app/dashboard', icon: 'home', label: 'Dashboard', staffOnly: false, groomerAllowed: false },
    { path: '/app/horses', icon: 'horse', label: 'Horses', staffOnly: false, groomerAllowed: true },
    { path: '/app/tasks', icon: 'tasks', label: 'Tasks', staffOnly: false, groomerAllowed: true },
    { path: '/app/calendar', icon: 'calendar', label: 'Calendar', staffOnly: false, groomerAllowed: true },
    { path: '/app/financials', icon: 'financials', label: 'Financials', staffOnly: false, groomerAllowed: false },
    // { path: '/app/stable', icon: 'stable', label: 'Stable', staffOnly: true }, // Hidden until feature is complete
    { path: '/app/vendors', icon: 'vendor', label: 'Vendors', staffOnly: true, groomerAllowed: false },
    { path: '/app/users', icon: 'users', label: 'Users', staffOnly: true, groomerAllowed: false },
    { path: '/app/settings', icon: 'settings', label: 'Settings', staffOnly: false, groomerAllowed: false },
  ];

  // Filter nav items based on role
  const navItems = allNavItems.filter(item => {
    if (isGroomer) {
      return item.groomerAllowed;
    }
    return !item.staffOnly || isStaff;
  });

  const getIcon = (icon: string) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    switch (icon) {
      case 'home':
        return <Home {...iconProps} />;
      case 'horse':
        return <HorseIcon {...iconProps} />;
      case 'invoice':
        return <FileText {...iconProps} />;
      case 'financials':
        return <DollarSign {...iconProps} />;
      case 'tasks':
        return <CheckSquare {...iconProps} />;
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'stable':
        return <Warehouse {...iconProps} />;
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
        <div className="barn-selector">
          <span className="barn-selector-label">
            <Building2 size={14} />
            Barn
          </span>
          {barns.length > 1 ? (
            <div className="barn-selector-dropdown">
              <select
                value={currentBarnId || ''}
                onChange={(e) => switchBarn(e.target.value)}
                className="barn-select"
                aria-label="Switch barn"
              >
                {barns.map((barn) => (
                  <option key={barn.id} value={barn.id}>
                    {barn.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="barn-select-chevron" aria-hidden />
            </div>
          ) : (
            <div className="current-barn" title={currentBarn?.name}>
              <span className="current-barn-name">{currentBarn?.name}</span>
            </div>
          )}
        </div>

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
        {/* Subscription / payment modal with blurred backdrop (hidden on subscription page) */}
        {(subscriptionStatus === 'free' || subscriptionStatus === 'past_due') && showSubscriptionAlert && !isSubscriptionPage && (
          <div className="subscription-alert-overlay">
            <div className={`subscription-alert-modal ${subscriptionStatus === 'past_due' ? 'past-due' : ''}`}>
              <div className="subscription-alert-content">
                <AlertCircle size={22} />
                <span>
                  {subscriptionStatus === 'past_due'
                    ? 'Your payment is past due. Please update your payment method to continue using all features.'
                    : 'Subscribe to unlock OnStride.'}
                </span>
                <Link to="/app/settings/subscription" className="subscription-alert-link">
                  {subscriptionStatus === 'past_due' ? 'Update Payment' : 'View Plans'}
                </Link>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>

      {/* Tutorial after subscription confirmed - shows on every screen until user exits/skips */}
      {showSubscriptionTutorial && (
        <OnboardingStepsModal
          isOpen={true}
          onClose={() => setShowSubscriptionTutorial(false)}
        />
      )}
    </div>
  );
}
