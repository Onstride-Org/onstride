import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { tasksApi, lessonsApi, usersApi, horsesApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Task, Lesson, User as UserType, Horse, LessonType, TaskStatus, RecurrenceType } from '../../types';
import { X, Calendar as CalendarIcon, CheckSquare, Clock, ChevronLeft, ChevronRight, Check, Bell, MapPin, Repeat } from 'lucide-react';
import { HorseIcon } from '../../components/icons/HorseIcon';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Set up date-fns localizer for react-big-calendar
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'lesson';
  resource: Task | Lesson;
  status?: string;
}

export default function CalendarPage() {
  const { currentBarnRole } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const isStaff = currentBarnRole && !['boarder'].includes(currentBarnRole.role);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);

      const [tasksRes, lessonsRes] = await Promise.all([
        tasksApi.getAll({ limit: 500 }),
        lessonsApi.getAll({ limit: 500 })
      ]);

      const tasks: Task[] = tasksRes.tasks || [];
      const lessons: Lesson[] = lessonsRes.lessons || [];

      // Convert tasks to calendar events
      const taskEvents: CalendarEvent[] = tasks.map((task) => {
        const dueDate = new Date(task.dueDate);
        return {
          id: `task-${task.id}`,
          title: task.name,
          start: dueDate,
          end: new Date(dueDate.getTime() + 60 * 60 * 1000), // 1 hour duration for display
          type: 'task' as const,
          resource: task,
          status: task.status,
        };
      });

      // Convert lessons to calendar events
      const lessonEvents: CalendarEvent[] = lessons.map((lesson) => {
        const startDate = new Date(lesson.scheduledDate);
        const endDate = new Date(startDate.getTime() + (lesson.durationMinutes || 60) * 60 * 1000);
        return {
          id: `lesson-${lesson.id}`,
          title: `${lesson.client?.name || 'Lesson'} - ${lesson.type}`,
          start: startDate,
          end: endDate,
          type: 'lesson' as const,
          resource: lesson,
          status: lesson.status,
        };
      });

      setEvents([...taskEvents, ...lessonEvents]);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Default blue
    let borderColor = '#2563eb';

    if (event.type === 'task') {
      if (event.status === 'completed') {
        backgroundColor = '#10b981';
        borderColor = '#059669';
      } else if (event.status === 'overdue') {
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
      } else {
        backgroundColor = '#f59e0b';
        borderColor = '#d97706';
      }
    } else if (event.type === 'lesson') {
      const lessonStatus = event.status;
      if (lessonStatus === 'approved') {
        backgroundColor = '#3b82f6';
        borderColor = '#2563eb';
      } else if (lessonStatus === 'requested') {
        backgroundColor = '#8b5cf6';
        borderColor = '#7c3aed';
      } else if (lessonStatus === 'completed') {
        backgroundColor = '#10b981';
        borderColor = '#059669';
      } else if (lessonStatus === 'cancelled' || lessonStatus === 'rejected') {
        backgroundColor = '#6b7280';
        borderColor = '#4b5563';
      }
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView, view }: any) => (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <button className="btn btn-ghost" onClick={() => onNavigate('PREV')}>
          <ChevronLeft size={20} />
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => onNavigate('TODAY')}>
          Today
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('NEXT')}>
          <ChevronRight size={20} />
        </button>
        <span className="toolbar-label">{label}</span>
      </div>
      <div className="toolbar-right">
        <div className="btn-group">
          <button
            className={`btn btn-sm ${view === Views.MONTH ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onView(Views.MONTH)}
          >
            Month
          </button>
          <button
            className={`btn btn-sm ${view === Views.WEEK ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onView(Views.WEEK)}
          >
            Week
          </button>
          <button
            className={`btn btn-sm ${view === Views.DAY ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onView(Views.DAY)}
          >
            Day
          </button>
          <button
            className={`btn btn-sm ${view === Views.AGENDA ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onView(Views.AGENDA)}
          >
            Agenda
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page calendar-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Tasks & Lessons</p>
        </div>
        {isStaff && (
          <div className="page-header-actions">
            <button className="btn btn-outline" onClick={() => setShowAddTaskModal(true)}>
              <CheckSquare size={18} />
              Add Task
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddLessonModal(true)}>
              <CalendarIcon size={18} />
              Schedule Lesson
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
          <span>Task (Pending)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
          <span>Task (Overdue)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
          <span>Lesson (Approved)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></span>
          <span>Lesson (Requested)</span>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : (
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
            onView={handleViewChange}
            view={view}
            date={currentDate}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
            }}
            popup
            selectable
          />
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={loadEvents}
          isStaff={!!isStaff}
        />
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <AddTaskModal
          onClose={() => setShowAddTaskModal(false)}
          onSuccess={() => {
            setShowAddTaskModal(false);
            loadEvents();
          }}
        />
      )}

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <AddLessonModal
          onClose={() => setShowAddLessonModal(false)}
          onSuccess={() => {
            setShowAddLessonModal(false);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

// Event Detail Modal
function EventDetailModal({
  event,
  onClose,
  onUpdate,
  isStaff,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
  isStaff: boolean;
}) {
  const isTask = event.type === 'task';
  const task = isTask ? (event.resource as Task) : null;
  const lesson = !isTask ? (event.resource as Lesson) : null;

  const handleToggleTaskStatus = async () => {
    if (!task) return;
    const newStatus: TaskStatus = task.status === 'completed' ? 'notStarted' : 'completed';
    try {
      await tasksApi.updateStatus(task.id, newStatus);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!task || !confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(task.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleApproveLesson = async () => {
    if (!lesson) return;
    try {
      await lessonsApi.approve(lesson.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to approve lesson:', error);
    }
  };

  const handleCancelLesson = async () => {
    if (!lesson || !confirm('Cancel this lesson?')) return;
    try {
      await lessonsApi.cancel(lesson.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to cancel lesson:', error);
    }
  };

  const getStatusBadge = () => {
    if (isTask && task) {
      if (task.status === 'completed') return 'success';
      if (task.status === 'overdue') return 'error';
      return 'warning';
    }
    if (lesson) {
      const badges: Record<string, string> = {
        requested: 'warning',
        approved: 'success',
        rejected: 'error',
        cancelled: 'neutral',
        completed: 'neutral',
      };
      return badges[lesson.status] || 'neutral';
    }
    return 'neutral';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isTask ? <CheckSquare size={20} /> : <CalendarIcon size={20} />}
            {isTask ? 'Task Details' : 'Lesson Details'}
          </h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="event-detail-header">
            <h3 className="event-detail-title">{event.title}</h3>
            <span className={`badge badge-${getStatusBadge()}`}>
              {isTask ? task?.status : lesson?.status}
            </span>
          </div>

          <div className="event-detail-info">
            <div className="info-row">
              <Clock size={16} />
              <span>
                {format(event.start, 'EEEE, MMMM d, yyyy')} at {format(event.start, 'h:mm a')}
              </span>
            </div>

            {isTask && task && (
              <>
                {task.description && (
                  <p className="event-description">{task.description}</p>
                )}
                {task.horses && task.horses.length > 0 && (
                  <div className="info-row">
                    <HorseIcon size={16} />
                    <span>{task.horses.map((h) => h.name).join(', ')}</span>
                  </div>
                )}
                {task.assignees && task.assignees.length > 0 && (
                  <div className="info-row">
                    <span className="text-muted">Assigned to:</span>
                    <span>{task.assignees.map((a) => a.name).join(', ')}</span>
                  </div>
                )}
              </>
            )}

            {!isTask && lesson && (
              <>
                <div className="info-row">
                  <span className="text-muted">Client:</span>
                  <span>{lesson.client?.name || 'Unknown'}</span>
                </div>
                <div className="info-row">
                  <span className="text-muted">Trainer:</span>
                  <span>{lesson.trainer?.name || 'Unknown'}</span>
                </div>
                <div className="info-row">
                  <Clock size={16} />
                  <span>{lesson.durationMinutes} minutes</span>
                </div>
                {lesson.horse && (
                  <div className="info-row">
                    <HorseIcon size={16} />
                    <span>{lesson.horse.name}</span>
                  </div>
                )}
                {lesson.location && (
                  <div className="info-row">
                    <MapPin size={16} />
                    <span>{lesson.location}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="text-muted">Price:</span>
                  <span>${lesson.price}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {isStaff && (
          <div className="modal-footer">
            {isTask && task && (
              <>
                <button
                  className={`btn ${task.status === 'completed' ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleToggleTaskStatus}
                >
                  <Check size={18} />
                  {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button className="btn btn-outline btn-danger" onClick={handleDeleteTask}>
                  Delete
                </button>
              </>
            )}
            {!isTask && lesson && (
              <>
                {lesson.status === 'requested' && (
                  <button className="btn btn-primary" onClick={handleApproveLesson}>
                    Approve
                  </button>
                )}
                {(lesson.status === 'requested' || lesson.status === 'approved') && (
                  <button className="btn btn-outline btn-danger" onClick={handleCancelLesson}>
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Add Task Modal (copied from TasksPage)
function AddTaskModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('12:00');
  const [sendReminder, setSendReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState('60');
  const [selectedAssignees, setSelectedAssignees] = useState<{id: string, name: string, accountType: string}[]>([]);
  const [selectedHorses, setSelectedHorses] = useState<{id: string, name: string}[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, horsesRes] = await Promise.all([
          usersApi.getAll({ limit: 100 }),
          horsesApi.getAll({ limit: 100 })
        ]);
        setUsers(usersRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (err) {
        console.error('Failed to load users/horses:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const dueDateTimeISO = new Date(`${dueDate}T${dueTime}`).toISOString();
      await tasksApi.create({
        name,
        description: description || undefined,
        dueDate: dueDateTimeISO,
        sendReminder,
        reminderMinutesBefore: parseInt(reminderMinutes),
        horses: selectedHorses,
        assignees: selectedAssignees,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAssignee = (user: UserType) => {
    const exists = selectedAssignees.find(a => a.id === user.id);
    if (exists) {
      setSelectedAssignees(selectedAssignees.filter(a => a.id !== user.id));
    } else {
      setSelectedAssignees([...selectedAssignees, { id: user.id, name: user.name, accountType: user.accountType }]);
    }
  };

  const toggleHorse = (horse: Horse) => {
    const exists = selectedHorses.find(h => h.id === horse.id);
    if (exists) {
      setSelectedHorses(selectedHorses.filter(h => h.id !== horse.id));
    } else {
      setSelectedHorses([...selectedHorses, { id: horse.id, name: horse.name }]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Task</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
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
              <label className="form-label">Task Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add more details..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign to Users</label>
              {isLoadingData ? (
                <div className="spinner spinner-sm"></div>
              ) : (
                <div className="checkbox-grid">
                  {users.map(user => (
                    <label key={user.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedAssignees.some(a => a.id === user.id)}
                        onChange={() => toggleAssignee(user)}
                      />
                      <span>{user.name} ({user.accountType})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Assign to Horses</label>
              {isLoadingData ? (
                <div className="spinner spinner-sm"></div>
              ) : (
                <div className="checkbox-grid">
                  {horses.map(horse => (
                    <label key={horse.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedHorses.some(h => h.id === horse.id)}
                        onChange={() => toggleHorse(horse)}
                      />
                      <span>{horse.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sendReminder}
                  onChange={(e) => setSendReminder(e.target.checked)}
                />
                <span><Bell size={16} /> Send reminder notification</span>
              </label>
              {sendReminder && (
                <div className="form-group mt-2">
                  <label className="form-label">Remind before</label>
                  <select
                    className="form-select"
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(e.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="1440">1 day</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Lesson Modal (copied from LessonsPage)
function AddLessonModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [horseId, setHorseId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<LessonType>('privateSingle');
  const [location, setLocation] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [recurrenceCount, setRecurrenceCount] = useState('12');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, horsesRes] = await Promise.all([
          usersApi.getAll({ limit: 100 }),
          horsesApi.getAll({ limit: 100 })
        ]);
        setUsers(usersRes.data || []);
        setHorses(horsesRes.data || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const trainers = users.filter(u =>
    u.accountType === 'trainer' || u.accountType === 'owner' || u.accountType === 'manager'
  );
  const clients = users.filter(u =>
    u.accountType === 'boarder' || u.accountType === 'owner'
  );

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

    if (!clientId) {
      setError('Please select a client');
      return;
    }
    if (!trainerId) {
      setError('Please select a trainer');
      return;
    }

    setIsLoading(true);

    try {
      const selectedHorse = horses.find(h => h.id === horseId);
      await lessonsApi.create({
        clientId,
        trainerId,
        horseId: horseId || undefined,
        horseName: selectedHorse?.name,
        scheduledDate: new Date(scheduledDate).toISOString(),
        durationMinutes: parseInt(durationMinutes),
        price: parseFloat(price) || 0,
        type,
        location: location || undefined,
        recurrenceType,
        recurrenceDays: recurrenceType === 'custom' ? recurrenceDays : undefined,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : undefined,
        recurrenceCount: parseInt(recurrenceCount) || undefined,
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
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Schedule Lesson</h2>
          <button className="btn btn-ghost modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            {isLoadingData ? (
              <div className="page-loading">
                <div className="spinner spinner-lg"></div>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-select"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      required
                    >
                      <option value="">Select a client...</option>
                      {clients.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.accountType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Trainer *</label>
                    <select
                      className="form-select"
                      value={trainerId}
                      onChange={(e) => setTrainerId(e.target.value)}
                      required
                    >
                      <option value="">Select a trainer...</option>
                      {trainers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.accountType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Horse</label>
                  <select
                    className="form-select"
                    value={horseId}
                    onChange={(e) => setHorseId(e.target.value)}
                  >
                    <option value="">Select a horse (optional)...</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>
                        {horse.name} {horse.breed?.label ? `(${horse.breed.label})` : ''}
                      </option>
                    ))}
                  </select>
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
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-input"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
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

                {/* Recurring Lessons Section */}
                <div className="form-section">
                  <h4 className="form-section-title">
                    <Repeat size={16} />
                    Recurring Lesson
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Repeat</label>
                    <select
                      className="form-select"
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                    >
                      <option value="none">Does not repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom (specific days)</option>
                    </select>
                  </div>

                  {recurrenceType === 'custom' && (
                    <div className="form-group">
                      <label className="form-label">Repeat on days</label>
                      <div className="checkbox-grid day-selector">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                          <label key={day} className="checkbox-label day-checkbox">
                            <input
                              type="checkbox"
                              checked={recurrenceDays.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRecurrenceDays([...recurrenceDays, idx].sort());
                                } else {
                                  setRecurrenceDays(recurrenceDays.filter(d => d !== idx));
                                }
                              }}
                            />
                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {recurrenceType !== 'none' && (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">End after (lessons)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={recurrenceCount}
                            onChange={(e) => setRecurrenceCount(e.target.value)}
                            min="1"
                            max="52"
                            placeholder="12"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Or end by date</label>
                          <input
                            type="date"
                            className="form-input"
                            value={recurrenceEndDate}
                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="form-hint">
                        {recurrenceType === 'daily' && 'Lesson will repeat every day.'}
                        {recurrenceType === 'weekly' && 'Lesson will repeat every week on the same day.'}
                        {recurrenceType === 'biweekly' && 'Lesson will repeat every 2 weeks on the same day.'}
                        {recurrenceType === 'monthly' && 'Lesson will repeat monthly on the same day.'}
                        {recurrenceType === 'custom' && recurrenceDays.length > 0 &&
                          `Lesson will repeat on: ${recurrenceDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`
                        }
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || isLoadingData}>
              {isLoading ? 'Creating...' : 'Schedule Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
