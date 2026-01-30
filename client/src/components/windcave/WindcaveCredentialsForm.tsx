import { useState } from 'react';
import { windcaveApi } from '../../services/api';
import { X, CheckCircle, AlertCircle, Key, RefreshCw } from 'lucide-react';

interface WindcaveCredentialsFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function WindcaveCredentialsForm({
  onClose,
  onSuccess,
}: WindcaveCredentialsFormProps) {
  const [merchantId, setMerchantId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await windcaveApi.saveCredentials(merchantId, apiKey, apiSecret);
      // Automatically test connection after saving
      setIsTesting(true);
      const result = await windcaveApi.testConnection();
      setTestResult(result);

      if (result.success) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setIsLoading(false);
      setIsTesting(false);
    }
  };

  const handleTestConnection = async () => {
    setError('');
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await windcaveApi.testConnection();
      setTestResult(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Key size={20} />
            Enter Windcave Credentials
          </h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <p className="text-secondary mb-4">
              Enter the credentials you received from Windcave in your approval email.
              These will be securely stored and used to process payments.
            </p>

            {error && (
              <div className="alert alert-error mb-4">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {testResult && (
              <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'} mb-4`}>
                {testResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Merchant ID *</label>
              <input
                type="text"
                className="form-input"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="Your Windcave Merchant ID"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">API Key *</label>
              <input
                type="text"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Windcave API Key"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">API Secret *</label>
              <input
                type="password"
                className="form-input"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Your Windcave API Secret"
                required
              />
              <p className="form-hint">This will be encrypted and stored securely</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            {merchantId && apiKey && apiSecret && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleTestConnection}
                disabled={isTesting || isLoading}
              >
                <RefreshCw size={18} className={isTesting ? 'spin' : ''} />
                Test Connection
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || isTesting}
            >
              {isLoading ? 'Saving...' : 'Save & Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
