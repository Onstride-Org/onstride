import { Link } from 'react-router-dom';

export default function SettingsPage() {

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          path: '/settings/profile',
          icon: 'user',
          title: 'Profile',
          description: 'Update your personal information and password',
        },
      ],
    },
    {
      title: 'Barn',
      items: [
        {
          path: '/settings/barn',
          icon: 'barn',
          title: 'Barn Settings',
          description: 'Configure barn name, stall layout, and other settings',
        },
        {
          path: '/settings/branding',
          icon: 'palette',
          title: 'Branding',
          description: 'Customize colors, logo, and appearance',
        },
      ],
    },
    {
      title: 'Billing',
      items: [
        {
          path: '/settings/subscription',
          icon: 'credit-card',
          title: 'Subscription',
          description: 'Manage your plan and billing information',
        },
      ],
    },
  ];

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'user':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'barn':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
          </svg>
        );
      case 'palette':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="13.5" cy="6.5" r=".5" />
            <circle cx="17.5" cy="10.5" r=".5" />
            <circle cx="8.5" cy="7.5" r=".5" />
            <circle cx="6.5" cy="12.5" r=".5" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
          </svg>
        );
      case 'credit-card':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and barn settings</p>
        </div>
      </div>

      <div className="settings-content">
        {settingsGroups.map((group) => (
          <div key={group.title} className="settings-group">
            <h2 className="settings-group-title">{group.title}</h2>
            <div className="settings-items">
              {group.items.map((item) => (
                <Link key={item.path} to={item.path} className="settings-item">
                  <div className="settings-item-icon">{getIcon(item.icon)}</div>
                  <div className="settings-item-content">
                    <h3 className="settings-item-title">{item.title}</h3>
                    <p className="settings-item-description">{item.description}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
