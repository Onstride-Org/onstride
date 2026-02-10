import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, AlertCircle, RefreshCw, ExternalLink, Mail, Plus, X, Edit3 } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string;
  slug?: string;
  fields?: any[];
  schema?: any[];
  documents?: any[];
  external_id?: string;
}

// DocuSeal Builder CDN URL
const DOCUSEAL_BUILDER_URL = 'https://cdn.docuseal.co/js/builder.js';

// Admin API helper (uses adminToken)
const adminApi = (path: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('adminToken');
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  });
};

export default function DocusealTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState('Merchant Application');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [config, setConfig] = useState<{ applicationEmail?: string } | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [builderToken, setBuilderToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const builderContainerRef = useRef<HTMLDivElement>(null);
  const builderScriptLoaded = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  // Load DocuSeal builder script
  useEffect(() => {
    if (builderScriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = DOCUSEAL_BUILDER_URL;
    script.async = true;
    script.onload = () => {
      builderScriptLoaded.current = true;
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize builder when editing a template
  useEffect(() => {
    if (!editingTemplate || !builderContainerRef.current || !builderToken) return;

    // Clear previous builder
    builderContainerRef.current.innerHTML = '';

    // Create the builder element
    const builderEl = document.createElement('docuseal-builder');
    builderEl.setAttribute('data-token', builderToken);
    builderEl.setAttribute('data-with-send-button', 'false');
    builderEl.setAttribute('data-with-upload-button', 'true');
    builderEl.setAttribute('data-with-title', 'false');
    builderEl.style.width = '100%';
    builderEl.style.height = '100%';

    builderContainerRef.current.appendChild(builderEl);
  }, [editingTemplate, builderToken]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [templatesData, configData] = await Promise.all([
        adminApi('/windcave/templates'),
        adminApi('/windcave/docuseal-config').catch(() => null),
      ]);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setConfig(configData);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('name', uploadName);
      const token = localStorage.getItem('adminToken');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/windcave/templates`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setShowUploadForm(false);
      setUploadName('Merchant Application');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to upload template');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await adminApi(`/windcave/templates/${templateId}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete template');
    }
  };

  const handleEditTemplate = async (template: Template) => {
    setError(null);
    try {
      // Fetch a JWT token for this specific template
      const { token } = await adminApi(`/windcave/templates/${template.id}/builder-token`);
      setBuilderToken(token);
      setEditingTemplate(template);
    } catch (err: any) {
      setError(err.message || 'Failed to load template editor');
      // Fall back to external editor
      window.open(`https://docuseal.co/templates/${template.id}`, '_blank');
    }
  };

  const handleCloseEditor = () => {
    setEditingTemplate(null);
    setBuilderToken(null);
    loadData(); // Refresh to get any changes
  };

  if (isLoading) {
    return (
      <div className="vendor-card">
        <div className="vendor-card-body">
          <div className="page-loading">
            <div className="spinner spinner-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen template editor
  if (editingTemplate) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Editor header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Edit3 size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Editing: {editingTemplate.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Add form fields, signature areas, and configure the template
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleCloseEditor}>
            <X size={16} />
            Close Editor
          </button>
        </div>

        {/* DocuSeal Builder Container */}
        <div
          ref={builderContainerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
          }}
        />
      </div>
    );
  }

  return (
    <div className="vendor-card">
      <div className="vendor-card-header">
        <div className="vendor-header-info">
          <h3 className="vendor-name">
            <FileText size={18} />
            Merchant Application Templates
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Manage PDF templates for Windcave merchant applications via DocuSeal
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadData}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowUploadForm(!showUploadForm)}>
            <Plus size={16} />
            Upload Template
          </button>
        </div>
      </div>

      <div className="vendor-card-body">
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {config?.applicationEmail && (
          <div className="alert alert-info mb-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <Mail size={18} />
            <span>Completed applications are sent to <strong>{config.applicationEmail}</strong></span>
          </div>
        )}

        {/* Upload form */}
        {showUploadForm && (
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Template Name</label>
              <input
                type="text"
                className="form-input"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Merchant Application"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">PDF File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="form-input"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowUploadForm(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <><span className="spinner spinner-sm"></span> Uploading...</>
                ) : (
                  <><Upload size={16} /> Upload</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Template list */}
        {templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No templates uploaded yet.</p>
            <p style={{ fontSize: '13px' }}>Upload a PDF to create a merchant application template.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {templates.map((template) => (
              <div
                key={template.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{template.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ID: {template.id} &middot; Created {new Date(template.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit3 size={14} />
                    Edit Template
                  </button>
                  <a
                    href={`https://docuseal.co/templates/${template.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    title="Open in DocuSeal"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDelete(template.id)}
                    style={{ color: 'var(--color-error)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
