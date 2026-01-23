import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { horsesApi, rideLogsApi, usersApi } from '../../services/api';
import { Horse, RideLog, RideType, HealthRecord, HealthRecordType, Task, Lesson } from '../../types';
import { format } from 'date-fns';
import { Camera, X, Calendar, CheckSquare } from 'lucide-react';

type Tab = 'overview' | 'schedule' | 'rideLogs' | 'documents' | 'health';

export default function HorseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [rideLogs, setRideLogs] = useState<RideLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRideModal, setShowAddRideModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploadingPhoto(true);
    try {
      const result = await horsesApi.uploadPhoto(id, file);
      setHorse(prev => prev ? { ...prev, photoUrl: result.photoUrl } : null);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!id || !horse?.photoUrl) return;
    if (!confirm('Remove this photo?')) return;

    try {
      await horsesApi.deletePhoto(id);
      setHorse(prev => prev ? { ...prev, photoUrl: undefined } : null);
    } catch (error) {
      console.error('Failed to delete photo:', error);
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
          <div className="horse-photo-container">
            {horse.photoUrl ? (
              <>
                <img src={horse.photoUrl} alt={horse.name} className="horse-photo" />
                <button
                  className="horse-photo-delete"
                  onClick={handleDeletePhoto}
                  title="Remove photo"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <div className="detail-avatar horse-avatar-placeholder">
                {horse.name.charAt(0).toUpperCase()}
              </div>
            )}
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoUpload}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
            <button
              className="horse-photo-upload"
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploadingPhoto}
              title={horse.photoUrl ? 'Change photo' : 'Add photo'}
            >
              {isUploadingPhoto ? (
                <div className="spinner spinner-sm"></div>
              ) : (
                <Camera size={16} />
              )}
            </button>
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
      <div className="tabs horse-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <span className="tab-label-short">Schedule</span>
          <span className="tab-label-full">Tasks & Lessons</span>
        </button>
        <button
          className={`tab ${activeTab === 'rideLogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('rideLogs')}
        >
          <span className="tab-label-short">Rides</span>
          <span className="tab-label-full">Ride Logs</span>
        </button>
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <span className="tab-label-short">Docs</span>
          <span className="tab-label-full">Documents</span>
        </button>
        <button
          className={`tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <span className="tab-label-short">Health</span>
          <span className="tab-label-full">Health Info</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab horse={horse} rideLogs={rideLogs} />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab horse={horse} />
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
    <div className="horse-overview">
      {/* Ride Stats */}
      <section className="horse-section">
        <h3 className="horse-section-title">Ride Statistics</h3>
        <div className="horse-stats-grid">
          <div className="horse-stat-item">
            <span className="horse-stat-value">{stats?.totalRides || 0}</span>
            <span className="horse-stat-label">Total Rides</span>
          </div>
          <div className="horse-stat-item">
            <span className="horse-stat-value">{stats?.totalMinutes || 0}</span>
            <span className="horse-stat-label">Total Minutes</span>
          </div>
          <div className="horse-stat-item">
            <span className="horse-stat-value">{stats?.ridesThisMonth || 0}</span>
            <span className="horse-stat-label">This Month</span>
          </div>
          <div className="horse-stat-item">
            <span className="horse-stat-value">{stats?.ridesThisWeek || 0}</span>
            <span className="horse-stat-label">This Week</span>
          </div>
        </div>
      </section>

      {/* Horse Details */}
      <section className="horse-section">
        <h3 className="horse-section-title">Details</h3>
        <div className="horse-details-card">
          {horse.registeredName && (
            <div className="horse-detail-row">
              <span className="horse-detail-label">Registered Name</span>
              <span className="horse-detail-value">{horse.registeredName}</span>
            </div>
          )}
          {horse.birthday && (
            <div className="horse-detail-row">
              <span className="horse-detail-label">Birthday</span>
              <span className="horse-detail-value">{format(new Date(horse.birthday), 'MMMM d, yyyy')}</span>
            </div>
          )}
          {horse.sexStatus && (
            <div className="horse-detail-row">
              <span className="horse-detail-label">Sex/Status</span>
              <span className="horse-detail-value">{horse.sexStatus.label}</span>
            </div>
          )}
          {horse.boarder && (
            <div className="horse-detail-row">
              <span className="horse-detail-label">Owner</span>
              <span className="horse-detail-value">{horse.boarder.name}</span>
            </div>
          )}
          {horse.usefNumber && (
            <div className="horse-detail-row">
              <span className="horse-detail-label">USEF Number</span>
              <span className="horse-detail-value">{horse.usefNumber}</span>
            </div>
          )}
          {horse.feiNumber && (
            <div className="horse-detail-row">
              <span className="horse-detail-label">FEI Number</span>
              <span className="horse-detail-value">{horse.feiNumber}</span>
            </div>
          )}
          {horse.strideNumber && (
            <div className="horse-detail-row">
              <span className="horse-detail-label">Stride Number</span>
              <span className="horse-detail-value">{horse.strideNumber}</span>
            </div>
          )}
          {!horse.registeredName && !horse.birthday && !horse.sexStatus && !horse.boarder && !horse.usefNumber && !horse.feiNumber && !horse.strideNumber && (
            <p className="horse-empty-text">No details added yet. Click "Edit" to add information.</p>
          )}
        </div>
      </section>

      {/* Notes */}
      <section className="horse-section">
        <h3 className="horse-section-title">Notes</h3>
        <div className="horse-notes-card">
          {horse.notes ? (
            <p className="horse-notes-text">{horse.notes}</p>
          ) : (
            <p className="horse-empty-text">No notes added. Click "Edit" to add notes about this horse.</p>
          )}
        </div>
      </section>

      {/* Breeding Info */}
      {(horse.sireName || horse.damName || horse.isStud || horse.isBroodmare) && (
        <section className="horse-section">
          <h3 className="horse-section-title">Breeding Information</h3>
          <div className="horse-details-card">
            {horse.sireName && (
              <div className="horse-detail-row">
                <span className="horse-detail-label">Sire</span>
                <span className="horse-detail-value">{horse.sireName}</span>
              </div>
            )}
            {horse.damName && (
              <div className="horse-detail-row">
                <span className="horse-detail-label">Dam</span>
                <span className="horse-detail-value">{horse.damName}</span>
              </div>
            )}
            {horse.isStud && (
              <div className="horse-detail-row">
                <span className="horse-detail-label">Status</span>
                <span className="horse-detail-value">Active Stud</span>
              </div>
            )}
            {horse.isBroodmare && (
              <div className="horse-detail-row">
                <span className="horse-detail-label">Status</span>
                <span className="horse-detail-value">Broodmare</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Rides */}
      <section className="horse-section">
        <h3 className="horse-section-title">Recent Rides</h3>
        {rideLogs.length === 0 ? (
          <div className="horse-empty-card">
            <p className="horse-empty-text">No ride logs yet</p>
          </div>
        ) : (
          <div className="horse-rides-list">
            {rideLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="horse-ride-item">
                <div className="horse-ride-date">
                  <span className="horse-ride-day">{format(new Date(log.date), 'd')}</span>
                  <span className="horse-ride-month">{format(new Date(log.date), 'MMM')}</span>
                </div>
                <div className="horse-ride-content">
                  <span className="horse-ride-type">{log.type}</span>
                  <span className="horse-ride-rider">
                    {log.rider?.name || log.riderName || 'Unknown rider'}
                  </span>
                </div>
                <span className="horse-ride-duration">{log.durationMinutes} min</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ScheduleTab({ horse }: { horse: Horse }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const [tasksRes, lessonsRes] = await Promise.all([
          horsesApi.getTasks(horse.id),
          horsesApi.getLessons(horse.id),
        ]);
        setTasks(tasksRes.tasks || []);
        setLessons(lessonsRes.lessons || []);
      } catch (error) {
        console.error('Failed to load schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, [horse.id]);

  if (isLoading) {
    return (
      <div className="schedule-tab">
        <div className="loading">Loading schedule...</div>
      </div>
    );
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'overdue':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  };

  const getLessonStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'approved':
        return 'badge-info';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div className="schedule-tab">
      {/* Tasks Section */}
      <section className="schedule-section">
        <div className="schedule-section-header">
          <h3><CheckSquare size={18} /> Tasks ({tasks.length})</h3>
          <Link to="/calendar" className="btn btn-outline btn-sm">
            View Calendar
          </Link>
        </div>
        {tasks.length === 0 ? (
          <div className="empty-state-small">
            <p>No tasks assigned to {horse.name}</p>
          </div>
        ) : (
          <div className="schedule-list">
            {tasks.map((task) => (
              <div key={task.id} className="schedule-item">
                <div className="schedule-item-date">
                  <span className="schedule-day">{format(new Date(task.dueDate), 'd')}</span>
                  <span className="schedule-month">{format(new Date(task.dueDate), 'MMM')}</span>
                </div>
                <div className="schedule-item-content">
                  <span className="schedule-item-name">{task.name}</span>
                  {task.description && (
                    <span className="schedule-item-desc">{task.description}</span>
                  )}
                  {task.assignees && task.assignees.length > 0 && (
                    <span className="schedule-item-meta">
                      Assigned to: {task.assignees.map(a => a.name).join(', ')}
                    </span>
                  )}
                </div>
                <span className={`badge ${getTaskStatusBadge(task.status)}`}>
                  {task.status === 'notStarted' ? 'pending' : task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lessons Section */}
      <section className="schedule-section">
        <div className="schedule-section-header">
          <h3><Calendar size={18} /> Lessons ({lessons.length})</h3>
        </div>
        {lessons.length === 0 ? (
          <div className="empty-state-small">
            <p>No lessons scheduled for {horse.name}</p>
          </div>
        ) : (
          <div className="schedule-list">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="schedule-item">
                <div className="schedule-item-date">
                  <span className="schedule-day">{format(new Date(lesson.scheduledDate), 'd')}</span>
                  <span className="schedule-month">{format(new Date(lesson.scheduledDate), 'MMM')}</span>
                </div>
                <div className="schedule-item-content">
                  <span className="schedule-item-name">
                    {lesson.type} Lesson
                  </span>
                  <span className="schedule-item-time">
                    {format(new Date(lesson.scheduledDate), 'h:mm a')}
                    {lesson.durationMinutes && ` • ${lesson.durationMinutes} min`}
                  </span>
                  {lesson.client && (
                    <span className="schedule-item-meta">
                      Client: {lesson.client.name}
                    </span>
                  )}
                  {lesson.trainer && (
                    <span className="schedule-item-meta">
                      Trainer: {lesson.trainer.name}
                    </span>
                  )}
                </div>
                <span className={`badge ${getLessonStatusBadge(lesson.status)}`}>
                  {lesson.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
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
  const [birthday, setBirthday] = useState(
    horse.birthday ? new Date(horse.birthday).toISOString().split('T')[0] : ''
  );
  const [color, setColor] = useState(horse.color || '');
  const [status, setStatus] = useState(horse.status);
  const [notes, setNotes] = useState(horse.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate age from birthday
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(birthday);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await horsesApi.update(horse.id, {
        name,
        breed: breed ? { value: breed.toLowerCase().replace(/\s+/g, '_'), label: breed } : undefined,
        birthday: birthday ? new Date(birthday).toISOString() : undefined,
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
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                {age !== null && age >= 0 && (
                  <p className="form-hint">Age: {age} year{age !== 1 ? 's' : ''} old</p>
                )}
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
