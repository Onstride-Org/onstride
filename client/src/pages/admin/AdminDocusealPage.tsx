import { DocusealTemplateManager } from '../../components/windcave';

export default function AdminDocusealPage() {
  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 600, margin: 0 }}>
          Merchant Applications
        </h1>
        <p style={{ color: '#525252', fontSize: '13px', margin: '4px 0 0' }}>
          Manage DocuSeal PDF templates for Windcave merchant onboarding
        </p>
      </div>
      <DocusealTemplateManager />
    </div>
  );
}
