import { useState, useEffect } from 'react';
import { DocusealForm } from '@docuseal/react';
import { windcaveApi } from '../../services/api';
import { X, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DocusealApplicationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DocusealApplicationForm({ onClose, onSuccess }: DocusealApplicationFormProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    startApplication();
  }, []);

  const startApplication = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await windcaveApi.startApplication();
      setSlug(data.slug);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load application form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsComplete(true);
    try {
      await windcaveApi.completeApplication();
    } catch (err) {
      console.error('Failed to mark application as complete:', err);
    }
    setTimeout(() => {
      onSuccess();
    }, 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '900px', width: '95vw', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            <FileText size={20} />
            Merchant Application
          </h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflow: 'auto', padding: 0 }}>
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
              <Loader2 size={32} className="spinner-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading application form...</p>
            </div>
          )}

          {error && (
            <div style={{ padding: '40px 20px' }}>
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <div>
                  <strong>Unable to load application</strong>
                  <p>{error}</p>
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button className="btn btn-outline" onClick={startApplication}>Try Again</button>
              </div>
            </div>
          )}

          {isComplete && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
              <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
              <h3>Application Submitted!</h3>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
                Your merchant application has been submitted to Windcave for review.
                You'll receive an email once it has been processed.
              </p>
            </div>
          )}

          {slug && !isComplete && !isLoading && !error && (
            <DocusealForm
              src={`https://docuseal.co/d/${slug}`}
              onComplete={handleComplete}
              withTitle={false}
              withSendCopyButton={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
