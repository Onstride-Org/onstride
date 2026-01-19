import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { horsesApi, rideLogsApi, usersApi } from '../../services/api';
import { Horse, RideLog, RideType, HealthRecord, HealthRecordType } from '../../types';
import { format } from 'date-fns';

type Tab = 'overview' | 'rideLogs' | 'documents' | 'health';

export default function HorseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [rideLogs, setRideLogs] = useState<RideLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRideModal, setShowAddRideModal] = useState(false);

  const loadHorse = async () => {
    if (!id) return;
    try {
      const response = await horsesApi.getById(id);
      setHorse(response);
    } catch (error) {
      console.error('Failed to load horse:', error);
      navigate('/horses');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRideLogs = async () => {
    if (!id) return;
    try {
      const response = await rideLogsApi.getByHorse(id);
      setRideLogs(response.rideLogs || []);
    } catch (error) {
      console.error('Failed to load ride logs:', error);
    }
  };

  useEffect(() => {
    loadHorse();
    loadRideLogs();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !horse) return;
    if (!confirm(`Are you sure you want to delete ${horse.name}?`)) return;

    try {
      await horsesApi.delete(id);
      navigate('/horses');
    } catch (error) {
      console.error('Failed to delete horse:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!horse) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Horse not found</h3>
          <Link to="/horses" className="btn btn-primary">Back to Horses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page horse-detail-page">
      {/* Header */}
      <div className="detail-header">
        <Link to="/horses" className="back-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Back to Horses
        </Link>

        <div className="detail-header-content">
          <div className="detail-avatar">
            {horse.name.charAt(0).toUpperCase()}
          </div>
          <div className="detail-info">
            <h1 className="detail-title">{horse.name}</h1>
            <p className="detail-subtitle">
              {horse.breed?.label || 'Unknown breed'}
              {horse.age && ` • ${horse.age} years old`}
              {horse.color && ` • ${horse.color}`}
            </p>
            <span className={`badge badge-${horse.status === 'active' ? 'success' : 'neutral'}`}>
              {horse.status}
            </span>
          </div>
          <div className="detail-actions">
            <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>
              Edit
            </button>
            <button className="btn btn-ghost btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'rideLogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('rideLogs')}
        >
          Ride Logs
        </button>
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button
          className={`tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          Health Info
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab horse={horse} rideLogs={rideLogs} />
        )}
        {activeTab === 'rideLogs' && (
          <RideLogsTab
            horse={horse}
            rideLogs={rideLogs}
            onAddRide={() => setShowAddRideModal(true)}
            onRefresh={loadRideLogs}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab horse={horse} />
        )}
        {activeTab === 'health' && (
          <HealthInfoTab horse={horse} onRefresh={loadHorse} />
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditHorseModal
          horse={horse}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadHorse();
          }}
        />
      )}

      {/* Add Ride Log Modal */}
      {showAddRideModal && (
        <AddRideLogModal
          horse={horse}
          onClose={() => setShowAddRideModal(false)}
          onSuccess={() => {
            setShowAddRideModal(false);
            loadRideLogs();
            loadHorse();
          }}
        />
      )}
    </div>
  );
}

function OverviewTab({ horse, rideLogs }: { horse: Horse; rideLogs: RideLog[] }) {
  const stats = horse.rideStats;

  return (
    <div className="overview-tab">
      {/* Ride Stats */}
      <div className="card">
        <h3 className="card-title">Ride Statistics</h3>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">{stats?.totalRides || 0}</span>
            <span className="stat-label">Total Rides</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats?.totalMinutes || 0}</span>
            <span className="stat-label">Total Minutes</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats?.ridesThisMonth || 0}</span>
            <span className="stat-label">This Month</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats?.ridesThisWeek || 0}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
      </div>

      {/* Horse Details */}
      <div className="card">
        <h3 className="card-title">Details</h3>
        <dl className="detail-list">
          {horse.registeredName && (
            <>
              <dt>Registered Name</dt>
              <dd>{horse.registeredName}</dd>
            </>
          )}
          {horse.birthday && (
            <>
              <dt>Birthday</dt>
              <dd>{format(new Date(horse.birthday), 'MMMM d, yyyy')}</dd>
            </>
          )}
          {horse.sexStatus && (
            <>
              <dt>Sex/Status</dt>
              <dd>{horse.sexStatus.label}</dd>
            </>
          )}
          {horse.boarder && (
            <>
              <dt>Owner</dt>
              <dd>{horse.boarder.name}</dd>
            </>
          )}
          {horse.usefNumber && (
            <>
              <dt>USEF Number</dt>
              <dd>{horse.usefNumber}</dd>
            </>
          )}
          {horse.feiNumber && (
            <>
              <dt>FEI Number</dt>
              <dd>{horse.feiNumber}</dd>
            </>
          )}
          {horse.strideNumber && (
            <>
              <dt>Stride Number</dt>
              <dd>{horse.strideNumber}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Notes */}
      <div className="card">
        <h3 className="card-title">Notes</h3>
        {horse.notes ? (
          <p className="horse-notes" style={{ whiteSpace: 'pre-wrap' }}>{horse.notes}</p>
        ) : (
          <p className="text-muted">No notes added. Click "Edit" to add notes about this horse.</p>
        )}
      </div>

      {/* Breeding Info */}
      {(horse.sireName || horse.damName || horse.isStud || horse.isBroodmare) && (
        <div className="card">
          <h3 className="card-title">Breeding Information</h3>
          <dl className="detail-list">
            {horse.sireName && (
              <>
                <dt>Sire</dt>
                <dd>{horse.sireName}</dd>
              </>
            )}
            {horse.damName && (
              <>
                <dt>Dam</dt>
                <dd>{horse.damName}</dd>
              </>
            )}
            {horse.isStud && (
              <>
                <dt>Status</dt>
                <dd>Active Stud</dd>
              </>
            )}
            {horse.isBroodmare && (
              <>
                <dt>Status</dt>
                <dd>Broodmare</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Recent Rides */}
      <div className="card">
        <h3 className="card-title">Recent Rides</h3>
        {rideLogs.length === 0 ? (
          <p className="text-muted">No ride logs yet</p>
        ) : (
          <ul className="ride-log-list">
            {rideLogs.slice(0, 5).map((log) => (
              <li key={log.id} className="ride-log-item">
                <div className="ride-log-date">
                  {format(new Date(log.date), 'MMM d')}
                </div>
                <div className="ride-log-info">
                  <span className="ride-log-type">{log.type}</span>
                  <span className="ride-log-rider">
                    {log.rider?.name || log.riderName || 'Unknown rider'}
                  </span>
                </div>
                <span className="ride-log-duration">{log.durationMinutes} min</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RideLogsTab({
  horse,
  rideLogs,
  onAddRide,
  onRefresh,
}: {
  horse: Horse;
  rideLogs: RideLog[];
  onAddRide: () => void;
  onRefresh: () => void;
}) {
  const handleDelete = async (logId: string) => {
    if (!confirm('Delete this ride log?')) return;
    try {
      await rideLogsApi.delete(logId);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete ride log:', error);
    }
  };

  return (
    <div className="ride-logs-tab">
      <div className="tab-header">
        <h3>Ride History</h3>
        <button className="btn btn-primary" onClick={onAddRide}>
          Add Ride
        </button>
      </div>

      {rideLogs.length === 0 ? (
        <div className="empty-state">
          <p>No ride logs recorded for {horse.name}</p>
          <button className="btn btn-primary" onClick={onAddRide}>
            Add First Ride
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Rider</th>
                <th>Duration</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rideLogs.map((log) => (
                <tr key={log.id}>
                  <td>{format(new Date(log.date), 'MMM d, yyyy')}</td>
                  <td>
                    <span className="badge badge-outline">{log.type}</span>
                  </td>
                  <td>{log.rider?.name || log.riderName || '-'}</td>
                  <td>{log.durationMinutes} min</td>
                  <td className="text-truncate">{log.notes || '-'}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm btn-danger"
                      onClick={() => handleDelete(log.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ horse }: { horse: Horse }) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documents, setDocuments] = useState(horse.documents || []);

  const handleUploadSuccess = (newDoc: any) => {
    setDocuments([...documents, newDoc]);
    setShowUploadModal(false);
  };

  return (
    <div className="documents-tab">
      <div className="tab-header">
        <h3>Documents</h3>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          Upload Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <p>No documents uploaded for {horse.name}</p>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map((doc) => (
            <a
              key={doc.id || doc._id}
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="document-card"
            >
              <div className="document-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <div className="document-info">
                <span className="document-name">{doc.name}</span>
                <span className="document-type">{doc.type}</span>
                {doc.expirationDate && (
                  <span className="document-expiry">
                    Expires: {format(new Date(doc.expirationDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadDocumentModal
          horseId={horse.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

function UploadDocumentModal({
  horseId,
  onClose,
  onSuccess,
}: {
  horseId: string;
  onClose: () => void;
  onSuccess: (doc: any) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('other');
  const [docName, setDocName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const documentTypes = [
    { value: 'coggins', label: 'Coggins' },
    { value: 'healthCertificate', label: 'Health Certificate' },
    { value: 'registration', label: 'Registration Papers' },
    { value: 'vaccination', label: 'Vaccination Records' },
    { value: 'importExport', label: 'Import/Export Documents' },
    { value: 'brandInspection', label: 'Brand Inspection' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await horsesApi.uploadDocument(horseId, file, {
        type: docType,
        name: docName || file.name,
        expirationDate: expirationDate || undefined,
      });
      onSuccess(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Upload Document</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">File *</label>
              <input
                type="file"
                className="form-input"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="form-hint">Accepted: PDF, Word documents, Images (max 20MB)</p>
            </div>

            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select
                className="form-select"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Document Name</label>
              <input
                type="text"
                className="form-input"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Optional - defaults to filename"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiration Date</label>
              <input
                type="date"
                className="form-input"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
              <p className="form-hint">Optional - for documents that expire (like Coggins)</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !file}>
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HealthInfoTab({ horse, onRefresh }: { horse: Horse; onRefresh: () => void }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHealthRecords = async () => {
    try {
      const response = await horsesApi.getHealthRecords(horse.id);
      setHealthRecords(response.healthRecords || []);
    } catch (error) {
      console.error('Failed to load health records:', error);
      // Fallback to existing data from horse object
      const combined = [
        ...(horse.healthRecords || []),
        ...(horse.geneticTests || []).map((t) => ({
          ...t,
          type: 'geneticTest' as HealthRecordType,
          title: t.testName,
          value: t.result,
          date: t.testDate,
        })),
      ];
      setHealthRecords(combined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthRecords();
  }, [horse.id]);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadHealthRecords();
    onRefresh();
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Delete this health record?')) return;
    try {
      await horsesApi.deleteHealthRecord(horse.id, recordId);
      loadHealthRecords();
    } catch (error) {
      console.error('Failed to delete health record:', error);
    }
  };

  const getRecordTypeLabel = (type: HealthRecordType) => {
    const labels: Record<HealthRecordType, string> = {
      temperature: 'Temperature',
      weight: 'Weight',
      vaccination: 'Vaccination',
      deworming: 'Deworming',
      dental: 'Dental',
      farrier: 'Farrier',
      veterinary: 'Vet Visit',
      medication: 'Medication',
      injury: 'Injury',
      geneticTest: 'Genetic Test',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getRecordTypeBadgeClass = (type: HealthRecordType) => {
    const classes: Record<HealthRecordType, string> = {
      temperature: 'badge-warning',
      weight: 'badge-info',
      vaccination: 'badge-success',
      deworming: 'badge-success',
      dental: 'badge-primary',
      farrier: 'badge-primary',
      veterinary: 'badge-warning',
      medication: 'badge-error',
      injury: 'badge-error',
      geneticTest: 'badge-neutral',
      other: 'badge-outline',
    };
    return classes[type] || 'badge-outline';
  };

  if (isLoading) {
    return (
      <div className="health-info-tab">
        <div className="loading">Loading health records...</div>
      </div>
    );
  }

  return (
    <div className="health-info-tab">
      <div className="tab-header">
        <h3>Health Records</h3>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          Add Record
        </button>
      </div>

      {healthRecords.length === 0 ? (
        <div className="empty-state">
          <p>No health records for {horse.name}</p>
          <p className="text-muted">Track temperatures, vaccinations, vet visits, and more</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add First Record
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title/Details</th>
                <th>Value/Result</th>
                <th>Date</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {healthRecords.map((record) => (
                <tr key={record.id || record._id}>
                  <td>
                    <span className={`badge ${getRecordTypeBadgeClass(record.type)}`}>
                      {getRecordTypeLabel(record.type)}
                    </span>
                  </td>
                  <td>{record.title || record.testName || '-'}</td>
                  <td>{record.value || record.result || '-'}</td>
                  <td>
                    {(record.date || record.testDate)
                      ? format(new Date(record.date || record.testDate!), 'MMM d, yyyy')
                      : '-'}
                  </td>
                  <td className="text-truncate">{record.notes || '-'}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm btn-danger"
                      onClick={() => handleDelete(record.id || record._id!)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddHealthRecordModal
          horseId={horse.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}

function AddHealthRecordModal({
  horseId,
  onClose,
  onSuccess,
}: {
  horseId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [recordType, setRecordType] = useState<HealthRecordType>('other');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [laboratory, setLaboratory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const healthRecordTypes: { value: HealthRecordType; label: string; placeholder?: string }[] = [
    { value: 'temperature', label: 'Temperature', placeholder: 'e.g., 101.5°F' },
    { value: 'weight', label: 'Weight', placeholder: 'e.g., 1100 lbs' },
    { value: 'vaccination', label: 'Vaccination', placeholder: 'e.g., Administered' },
    { value: 'deworming', label: 'Deworming', placeholder: 'e.g., Quest Plus' },
    { value: 'dental', label: 'Dental', placeholder: 'e.g., Floated' },
    { value: 'farrier', label: 'Farrier', placeholder: 'e.g., Trimmed, New shoes' },
    { value: 'veterinary', label: 'Vet Visit', placeholder: 'e.g., Annual exam' },
    { value: 'medication', label: 'Medication', placeholder: 'e.g., Bute 1g' },
    { value: 'injury', label: 'Injury', placeholder: 'e.g., Minor cut' },
    { value: 'geneticTest', label: 'Genetic Test', placeholder: 'e.g., N/N, Carrier' },
    { value: 'other', label: 'Other', placeholder: '' },
  ];

  const commonGeneticTests = [
    'GBED (Glycogen Branching Enzyme Deficiency)',
    'HERDA (Hereditary Equine Regional Dermal Asthenia)',
    'HYPP (Hyperkalemic Periodic Paralysis)',
    'IMM (Immune-Mediated Myositis)',
    'LWOS (Lethal White Overo Syndrome)',
    'MH (Malignant Hyperthermia)',
    'MYHM (Myosin Heavy Chain Myopathy)',
    'PSSM1 (Polysaccharide Storage Myopathy Type 1)',
    'PSSM2 (Polysaccharide Storage Myopathy Type 2)',
    'Color Testing',
    'Parentage Verification',
  ];

  const commonVaccinations = [
    'Rabies',
    'Eastern/Western Encephalomyelitis',
    'Tetanus',
    'West Nile Virus',
    'Influenza',
    'Rhinopneumonitis (EHV)',
    'Strangles',
    'Potomac Horse Fever',
    'Botulism',
  ];

  const getPlaceholder = () => {
    const type = healthRecordTypes.find((t) => t.value === recordType);
    return type?.placeholder || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data: any = {
        type: recordType,
        title: title || undefined,
        value: value || undefined,
        date: date ? new Date(date).toISOString() : undefined,
        notes: notes || undefined,
      };

      // For genetic tests, include legacy fields for backward compatibility
      if (recordType === 'geneticTest') {
        data.testName = title;
        data.result = value;
        data.testDate = date ? new Date(date).toISOString() : undefined;
        data.laboratory = laboratory || undefined;
      }

      await horsesApi.addHealthRecord(horseId, data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add health record');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Health Record</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Record Type *</label>
              <select
                className="form-select"
                value={recordType}
                onChange={(e) => {
                  setRecordType(e.target.value as HealthRecordType);
                  setTitle('');
                  setValue('');
                }}
                required
              >
                {healthRecordTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {recordType === 'geneticTest' ? 'Test Name' :
                 recordType === 'vaccination' ? 'Vaccine Name' :
                 recordType === 'medication' ? 'Medication Name' : 'Title/Description'}
              </label>
              {recordType === 'geneticTest' ? (
                <select
                  className="form-select"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                >
                  <option value="">Select a test...</option>
                  {commonGeneticTests.map((test) => (
                    <option key={test} value={test}>
                      {test}
                    </option>
                  ))}
                  <option value="__custom">Other (custom)</option>
                </select>
              ) : recordType === 'vaccination' ? (
                <select
                  className="form-select"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                >
                  <option value="">Select a vaccine...</option>
                  {commonVaccinations.map((vax) => (
                    <option key={vax} value={vax}>
                      {vax}
                    </option>
                  ))}
                  <option value="__custom">Other (custom)</option>
                </select>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={recordType === 'temperature' ? 'Morning check' :
                              recordType === 'weight' ? 'Monthly weigh-in' : 'Enter title...'}
                />
              )}
              {(title === '__custom') && (
                <input
                  type="text"
                  className="form-input mt-2"
                  placeholder="Enter custom name..."
                  onChange={(e) => setTitle(e.target.value)}
                />
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  {recordType === 'geneticTest' ? 'Result' : 'Value/Reading'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={getPlaceholder()}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {recordType === 'geneticTest' && (
              <div className="form-group">
                <label className="form-label">Laboratory</label>
                <input
                  type="text"
                  className="form-input"
                  value={laboratory}
                  onChange={(e) => setLaboratory(e.target.value)}
                  placeholder="e.g., UC Davis, Animal Genetics"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditHorseModal({
  horse,
  onClose,
  onSuccess,
}: {
  horse: Horse;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(horse.name);
  const [breed, setBreed] = useState(horse.breed?.label || '');
  const [age, setAge] = useState(horse.age?.toString() || '');
  const [color, setColor] = useState(horse.color || '');
  const [status, setStatus] = useState(horse.status);
  const [notes, setNotes] = useState(horse.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await horsesApi.update(horse.id, {
        name,
        breed: breed ? { value: breed.toLowerCase().replace(/\s+/g, '_'), label: breed } : undefined,
        age: age ? parseInt(age) : undefined,
        color: color || undefined,
        status,
        notes: notes || '',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update horse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Horse</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Breed</label>
                <input
                  type="text"
                  className="form-input"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="0"
                  max="50"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Color</label>
                <input
                  type="text"
                  className="form-input"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about this horse (e.g., special care instructions, dietary needs, training notes...)"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddRideLogModal({
  horse,
  onClose,
  onSuccess,
}: {
  horse: Horse;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<RideType>('training');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [riderSelection, setRiderSelection] = useState('');
  const [customRiderName, setCustomRiderName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [barnUsers, setBarnUsers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await usersApi.getAll({ limit: 100 });
        setBarnUsers(response.data || []);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    loadUsers();
  }, []);

  const rideTypes: { value: RideType; label: string }[] = [
    { value: 'lesson', label: 'Lesson' },
    { value: 'training', label: 'Training' },
    { value: 'trail', label: 'Trail Ride' },
    { value: 'lunging', label: 'Lunging' },
    { value: 'groundwork', label: 'Groundwork' },
    { value: 'competition', label: 'Competition' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Determine rider name - use custom if "custom" selected, otherwise use selected user's name
    let finalRiderName = '';
    if (riderSelection === 'custom') {
      finalRiderName = customRiderName;
    } else if (riderSelection) {
      const selectedUser = barnUsers.find(u => u.id === riderSelection);
      finalRiderName = selectedUser?.name || '';
    }

    try {
      await rideLogsApi.create({
        horseId: horse.id,
        date,
        type,
        durationMinutes: parseInt(durationMinutes),
        riderId: riderSelection && riderSelection !== 'custom' ? riderSelection : undefined,
        riderName: finalRiderName || undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add ride log');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Ride Log</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as RideType)}
                  required
                >
                  {rideTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (minutes) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  min="1"
                  max="480"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rider</label>
                <select
                  className="form-select"
                  value={riderSelection}
                  onChange={(e) => setRiderSelection(e.target.value)}
                >
                  <option value="">Select a rider...</option>
                  {barnUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                  <option value="custom">-- Enter custom name --</option>
                </select>
              </div>
            </div>

            {riderSelection === 'custom' && (
              <div className="form-group">
                <label className="form-label">Custom Rider Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={customRiderName}
                  onChange={(e) => setCustomRiderName(e.target.value)}
                  placeholder="Enter rider name"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any notes about this ride..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Ride'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
