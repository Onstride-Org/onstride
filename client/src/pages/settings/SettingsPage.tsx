import { Link } from 'react-router-dom';
import { User, Home, Palette, CreditCard, ChevronRight, Shield, FileText } from 'lucide-react';

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
        {
          path: '/settings/security',
          icon: 'shield',
          title: 'Security',
          description: 'Manage two-factor authentication and security settings',
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
        {
          path: '/settings/billing-templates',
          icon: 'file-text',
          title: 'Billing Templates',
          description: 'Create reusable templates for recurring charges',
        },
      ],
    },
  ];

  const getIcon = (icon: string) => {
    const iconProps = { size: 24, strokeWidth: 2 };
    switch (icon) {
      case 'user':
        return <User {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'barn':
        return <Home {...iconProps} />;
      case 'palette':
        return <Palette {...iconProps} />;
      case 'credit-card':
        return <CreditCard {...iconProps} />;
      case 'file-text':
        return <FileText {...iconProps} />;
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
                  <ChevronRight size={20} />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
