import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { horsesApi, rideLogsApi } from '../../services/api';
import { Horse, RideLog, RideType } from '../../types';
import { format } from 'date-fns';

type Tab = 'overview' | 'rideLogs' | 'documents' | 'genetics';

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
      setRideLogs(response.data || []);
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
          className={`tab ${activeTab === 'genetics' ? 'active' : ''}`}
          onClick={() => setActiveTab('genetics')}
        >
          Genetics
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
        {activeTab === 'genetics' && (
          <GeneticsTab horse={horse} />
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
  return (
    <div className="documents-tab">
      <div className="tab-header">
        <h3>Documents</h3>
        <button className="btn btn-primary">Upload Document</button>
      </div>

      {(!horse.documents || horse.documents.length === 0) ? (
        <div className="empty-state">
          <p>No documents uploaded for {horse.name}</p>
        </div>
      ) : (
        <div className="document-grid">
          {horse.documents.map((doc) => (
            <div key={doc.id} className="document-card">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneticsTab({ horse }: { horse: Horse }) {
  return (
    <div className="genetics-tab">
      <div className="tab-header">
        <h3>Genetic Tests</h3>
        <button className="btn btn-primary">Add Test Result</button>
      </div>

      {(!horse.geneticTests || horse.geneticTests.length === 0) ? (
        <div className="empty-state">
          <p>No genetic tests recorded for {horse.name}</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Result</th>
                <th>Date</th>
                <th>Laboratory</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {horse.geneticTests.map((test) => (
                <tr key={test.id}>
                  <td>{test.testName}</td>
                  <td>
                    <span className="badge badge-outline">{test.result}</span>
                  </td>
                  <td>{test.testDate ? format(new Date(test.testDate), 'MMM d, yyyy') : '-'}</td>
                  <td>{test.laboratory || '-'}</td>
                  <td>{test.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const [riderName, setRiderName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      await rideLogsApi.create({
        horseId: horse.id,
        date,
        type,
        durationMinutes: parseInt(durationMinutes),
        riderName: riderName || undefined,
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
                <label className="form-label">Rider Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={riderName}
                  onChange={(e) => setRiderName(e.target.value)}
                  placeholder="Who rode?"
                />
              </div>
            </div>

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
