import { useState, useEffect } from 'react';
import { lessonsApi } from '../../services/api';
import { Lesson, LessonStatus, LessonType } from '../../types';
import { format, parseISO } from 'date-fns';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LessonStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadLessons = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await lessonsApi.getAll(params);
      setLessons(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to load lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [pagination.page, statusFilter]);

  const getStatusBadge = (status: LessonStatus) => {
    const styles: Record<LessonStatus, string> = {
      requested: 'warning',
      approved: 'success',
      rejected: 'error',
      countered: 'info',
      cancelled: 'neutral',
      completed: 'neutral',
    };
    return styles[status] || 'neutral';
  };

  const getLessonTypeLabel = (type: LessonType) => {
    const labels: Record<LessonType, string> = {
      privateSingle: 'Private',
      privatePackage: 'Package',
      groupLesson: 'Group',
      training: 'Training',
      assessment: 'Assessment',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const handleApprove = async (lessonId: string) => {
    try {
      await lessonsApi.approve(lessonId);
      loadLessons();
    } catch (error) {
      console.error('Failed to approve lesson:', error);
    }
  };

  const handleReject = async (lessonId: string) => {
    if (!confirm('Reject this lesson request?')) return;
    try {
      await lessonsApi.reject(lessonId, 'Unavailable');
      loadLessons();
    } catch (error) {
      console.error('Failed to reject lesson:', error);
    }
  };

  const handleCancel = async (lessonId: string) => {
    if (!confirm('Cancel this lesson?')) return;
    try {
      await lessonsApi.cancel(lessonId);
      loadLessons();
    } catch (error) {
      console.error('Failed to cancel lesson:', error);
    }
  };

  return (
    <div className="page lessons-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lessons</h1>
          <p className="page-subtitle">{pagination.total} lessons scheduled</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Schedule Lesson
        </button>
      </div>

      {/* Filters */}
      <div className="page-filters">
        <div className="filter-tabs">
          {(['all', 'requested', 'approved', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3>No lessons found</h3>
          <p>
            {statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Schedule your first lesson'}
          </p>
        </div>
      ) : (
        <>
          <div className="lesson-grid">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-card-header">
                  <div className="lesson-datetime">
                    <span className="lesson-date">
                      {format(parseISO(lesson.scheduledDate), 'EEE, MMM d')}
                    </span>
                    <span className="lesson-time">
                      {format(parseISO(lesson.scheduledDate), 'h:mm a')}
                    </span>
                  </div>
                  <span className={`badge badge-${getStatusBadge(lesson.status)}`}>
                    {lesson.status}
                  </span>
                </div>

                <div className="lesson-card-body">
                  <div className="lesson-participants">
                    <div className="participant">
                      <span className="participant-label">Client</span>
                      <span className="participant-name">{lesson.client?.name || 'Unknown'}</span>
                    </div>
                    <div className="participant">
                      <span className="participant-label">Trainer</span>
                      <span className="participant-name">{lesson.trainer?.name || 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="lesson-details">
                    <span className="lesson-type">{getLessonTypeLabel(lesson.type)}</span>
                    <span className="lesson-duration">{lesson.durationMinutes} min</span>
                    <span className="lesson-price">${lesson.price}</span>
                  </div>

                  {lesson.horse && (
                    <div className="lesson-horse">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M22 9s-2-2-4-2c-1 0-2 1-3 2l-2 2-4-1-5 5v5h4l2-3 4-1 3 4h3v-4l2-4z" />
                      </svg>
                      {lesson.horse.name}
                    </div>
                  )}

                  {lesson.location && (
                    <div className="lesson-location">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {lesson.location}
                    </div>
                  )}
                </div>

                <div className="lesson-card-actions">
                  {lesson.status === 'requested' && (
                    <>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleApprove(lesson.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleReject(lesson.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {lesson.status === 'approved' && (
                    <button
                      className="btn btn-sm btn-outline btn-danger"
                      onClick={() => handleCancel(lesson.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddLessonModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadLessons();
          }}
        />
      )}
    </div>
  );
}

function AddLessonModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<LessonType>('privateSingle');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const lessonTypes: { value: LessonType; label: string }[] = [
    { value: 'privateSingle', label: 'Private (Single)' },
    { value: 'privatePackage', label: 'Private (Package)' },
    { value: 'groupLesson', label: 'Group Lesson' },
    { value: 'training', label: 'Training' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await lessonsApi.create({
        clientId,
        trainerId,
        scheduledDate: new Date(scheduledDate).toISOString(),
        durationMinutes: parseInt(durationMinutes),
        price: parseFloat(price),
        type,
        location: location || undefined,
        recurrenceType: 'none',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create lesson');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Schedule Lesson</h2>
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
                <label className="form-label">Client ID *</label>
                <input
                  type="text"
                  className="form-input"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Client ID"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trainer ID *</label>
                <input
                  type="text"
                  className="form-input"
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  placeholder="Trainer ID"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date & Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration *</label>
                <select
                  className="form-select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Lesson Type *</label>
                <select
                  className="form-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as LessonType)}
                >
                  {lessonTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  className="form-input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Indoor Arena"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Schedule Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
