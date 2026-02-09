import { useState, useEffect } from 'react';
import { tasksApi, lessonsApi, usersApi, horsesApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Task, TaskStatus, Lesson, LessonStatus, User as UserType, Horse } from '../../types';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { Plus, CheckSquare, Calendar, User, Trash2, X, Check, Bell, BookOpen } from 'lucide-react';
import { HorseIcon } from '../../components/icons/HorseIcon';
import FilterTabs from '../../components/FilterTabs';

// Combined item type for tasks and lessons
type TodoItem = {
  id: string;
  type: 'task' | 'lesson';
  name: string;
  description?: string;
  date: string;
  status: 'pending' | 'completed';
  originalStatus: string;
  horses: { id: string; name: string }[];
  assignees: { id: string; name: string }[];
  approvalStatus?: Task['approvalStatus'];
  lessonData?: Lesson;
  taskData?: Task;
};

type FilterStatus = 'all' | 'pending' | 'completed';

export default function TasksPage() {
  const { currentBarnRole, user } = useAuthStore();
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'task' | 'lesson'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Check if user is staff
  const isStaff = currentBarnRole && !['boarder'].includes(currentBarnRole.role);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Fetch tasks and lessons in parallel
      const [tasksRes, lessonsRes] = await Promise.all([
        tasksApi.getAll({ limit: 100 }),
        lessonsApi.getAll({ limit: 100 }),
      ]);

      const tasks = tasksRes.tasks || [];
      const lessons = lessonsRes.lessons || [];

      // Transform tasks to TodoItem
      const taskItems: TodoItem[] = tasks.map((task: Task) => ({
        id: task.id,
        type: 'task' as const,
        name: task.name,
        description: task.description,
        date: task.dueDate,
        status: task.status === 'completed' ? 'completed' : 'pending',
        originalStatus: task.status,
        horses: task.horses || [],
        assignees: task.assignees || [],
        approvalStatus: task.approvalStatus,
        taskData: task,
      }));

      // Transform pending lessons to TodoItem (only requested/approved lessons that aren't completed)
      const pendingLessonStatuses: LessonStatus[] = ['requested', 'approved', 'countered'];
      const lessonItems: TodoItem[] = lessons
        .filter((lesson: Lesson) => {
          // Show lessons where user is trainer or client
          const isTrainer = lesson.trainerId === user?.id;
          const isClient = lesson.clientId === user?.id;
          const isPending = pendingLessonStatuses.includes(lesson.status);
          const isCompleted = lesson.status === 'completed';
          return (isTrainer || isClient || isStaff) && (isPending || isCompleted);
        })
        .map((lesson: Lesson) => ({
          id: lesson.id,
          type: 'lesson' as const,
          name: `Lesson: ${lesson.type.replace(/([A-Z])/g, ' $1').trim()}`,
          description: lesson.notes,
          date: lesson.scheduledDate,
          status: lesson.status === 'completed' ? 'completed' : 'pending',
          originalStatus: lesson.status,
          horses: lesson.horse ? [{ id: lesson.horseId || '', name: lesson.horse.name }] : [],
          assignees: [
            ...(lesson.trainer ? [{ id: lesson.trainerId, name: lesson.trainer.name }] : []),
            ...(lesson.client ? [{ id: lesson.clientId, name: lesson.client.name }] : []),
          ],
          lessonData: lesson,
        }));

      // Combine and sort by date
      let combined = [...taskItems, ...lessonItems];
      combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Apply filters
      if (statusFilter !== 'all') {
        combined = combined.filter(item => item.status === statusFilter);
      }
      if (typeFilter !== 'all') {
        combined = combined.filter(item => item.type === typeFilter);
      }

      setTodoItems(combined);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  const handleToggleTaskStatus = async (item: TodoItem) => {
    if (item.type !== 'task' || !item.taskData) return;

    const task = item.taskData;
    if (task.approvalStatus && task.approvalStatus !== 'approved') {
      alert('This task must be approved before updating its status.');
      return;
    }
    const newStatus: TaskStatus = task.status === 'completed' ? 'notStarted' : 'completed';
    try {
      await tasksApi.updateStatus(task.id, newStatus);
      loadData();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleCompleteLesson = async (item: TodoItem) => {
    if (item.type !== 'lesson' || !item.lessonData) return;
    try {
      await lessonsApi.complete(item.lessonData.id);
      loadData();
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  };

  const handleCancelLesson = async (item: TodoItem) => {
    if (item.type !== 'lesson' || !item.lessonData) return;
    if (!confirm('Cancel this lesson?')) return;
    try {
      await lessonsApi.cancel(item.lessonData.id);
      loadData();
    } catch (error) {
      console.error('Failed to cancel lesson:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      loadData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? This action cannot be undone.')) return;
    try {
      await lessonsApi.delete(lessonId);
      loadData();
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    }
  };

  const getStatusBadge = (item: TodoItem) => {
    if (item.type === 'task' && item.approvalStatus && item.approvalStatus !== 'approved') return 'info';
    if (item.status === 'completed') return 'success';
    if (isPast(parseISO(item.date)) && !isToday(parseISO(item.date))) return 'error';
    if (isToday(parseISO(item.date))) return 'warning';
    return 'neutral';
  };

  const getStatusLabel = (item: TodoItem) => {
    if (item.type === 'task') {
      if (item.approvalStatus && item.approvalStatus !== 'approved') {
        if (item.approvalStatus === 'pending') return 'Pending Approval';
        if (item.approvalStatus === 'denied') return 'Denied';
        return 'Reschedule Requested';
      }
    }
    if (item.type === 'lesson') {
      if (item.originalStatus === 'requested') return 'Requested';
      if (item.originalStatus === 'countered') return 'Counter Offered';
    }
    if (item.status === 'completed') return 'Completed';
    if (isPast(parseISO(item.date)) && !isToday(parseISO(item.date))) return 'Overdue';
    if (isToday(parseISO(item.date))) return 'Due Today';
    return 'Upcoming';
  };

  const handleApprovalAction = async (item: TodoItem, action: 'approve' | 'deny' | 'reschedule') => {
    if (item.type !== 'task' || !item.taskData) return;
    try {
      let payload: any = { action };
      if (action === 'reschedule') {
        const proposedDate = prompt('Propose a new date/time (e.g. 2026-02-03 14:00):');
        if (!proposedDate) return;
        payload.proposedDate = new Date(proposedDate).toISOString();
      } else if (action === 'deny') {
        const reason = prompt('Reason for denying this task?');
        if (reason) payload.reason = reason;
      }
      await tasksApi.updateApproval(item.taskData.id, payload);
      loadData();
    } catch (error) {
      console.error('Failed to update task approval:', error);
    }
  };

  const handleLessonAction = async (item: TodoItem, action: 'approve' | 'reject') => {
    if (item.type !== 'lesson' || !item.lessonData) return;
    try {
      if (action === 'approve') {
        await lessonsApi.approve(item.lessonData.id);
      } else {
        const reason = prompt('Reason for rejecting this lesson?');
        await lessonsApi.reject(item.lessonData.id, reason || undefined);
      }
      loadData();
    } catch (error) {
      console.error('Failed to update lesson:', error);
    }
  };

  const pendingCount = todoItems.filter(i => i.status === 'pending').length;
  const completedCount = todoItems.filter(i => i.status === 'completed').length;

  return (
    <div className="page tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isStaff ? 'To-Do' : 'My To-Do'}</h1>
          <p className="page-subtitle">
            {todoItems.length} item{todoItems.length !== 1 ? 's' : ''}
            {statusFilter === 'all' && ` (${pendingCount} pending, ${completedCount} completed)`}
          </p>
        </div>
        {isStaff && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Add Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="page-filters" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <FilterTabs
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
          ]}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as FilterStatus)}
          label="Filter by status"
        />
        <FilterTabs
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'task', label: 'Tasks' },
            { value: 'lesson', label: 'Lessons' },
          ]}
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as 'all' | 'task' | 'lesson')}
          label="Filter by type"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : todoItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckSquare size={64} strokeWidth={1.5} />
          </div>
          <h3>No items found</h3>
          <p>
            {statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create a task or schedule a lesson to get started'}
          </p>
        </div>
      ) : (
        <div className="task-list-container">
          {todoItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className={`task-card ${item.status}`}>
              {item.type === 'task' ? (
                <button
                  className={`task-checkbox ${item.status === 'completed' ? 'checked' : ''}`}
                  onClick={() => handleToggleTaskStatus(item)}
                >
                  {item.status === 'completed' && (
                    <Check size={16} strokeWidth={3} />
                  )}
                </button>
              ) : (
                <div className={`task-type-icon ${item.status === 'completed' ? 'completed' : ''}`}>
                  <BookOpen size={18} />
                </div>
              )}

              <div className="task-content">
                <div className="task-header">
                  <h3 className={`task-name ${item.status === 'completed' ? 'completed' : ''}`}>
                    {item.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge badge-${item.type === 'lesson' ? 'primary' : 'neutral'}`} style={{ fontSize: '0.7rem' }}>
                      {item.type === 'lesson' ? 'Lesson' : 'Task'}
                    </span>
                    <span className={`badge badge-${getStatusBadge(item)}`}>
                      {getStatusLabel(item)}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="task-description">{item.description}</p>
                )}

                <div className="task-meta">
                  <span className="task-due">
                    <Calendar size={14} />
                    {format(parseISO(item.date), 'MMM d, yyyy h:mm a')}
                  </span>

                  {item.horses.length > 0 && (
                    <span className="task-horses">
                      <HorseIcon size={14} />
                      {item.horses.map(h => h.name).join(', ')}
                    </span>
                  )}

                  {item.assignees.length > 0 && (
                    <span className="task-assignees">
                      <User size={14} />
                      {item.assignees.map(a => a.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="task-actions">
                {/* Task approval actions */}
                {item.type === 'task' && item.approvalStatus === 'pending' &&
                  item.taskData?.assignees.some(a => a.id === (user?.id || '')) && (
                    <div className="btn-group">
                      <button className="btn btn-outline btn-sm" onClick={() => handleApprovalAction(item, 'approve')}>
                        Approve
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleApprovalAction(item, 'reschedule')}>
                        Reschedule
                      </button>
                      <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleApprovalAction(item, 'deny')}>
                        Deny
                      </button>
                    </div>
                  )}

                {/* Lesson approval actions (for trainers on requested lessons) */}
                {item.type === 'lesson' && item.originalStatus === 'requested' && isStaff && (
                  <div className="btn-group">
                    <button className="btn btn-outline btn-sm" onClick={() => handleLessonAction(item, 'approve')}>
                      Approve
                    </button>
                    <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleLessonAction(item, 'reject')}>
                      Reject
                    </button>
                  </div>
                )}

                {/* Lesson complete/cancel actions */}
                {item.type === 'lesson' && item.originalStatus === 'approved' && item.status !== 'completed' && (
                  <div className="btn-group">
                    <button className="btn btn-outline btn-sm" onClick={() => handleCompleteLesson(item)}>
                      Complete
                    </button>
                    <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleCancelLesson(item)}>
                      Cancel
                    </button>
                  </div>
                )}

                {/* Delete actions */}
                {isStaff && item.type === 'task' && (
                  <button
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => handleDeleteTask(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {isStaff && item.type === 'lesson' && (
                  <button
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => handleDeleteLesson(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

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
      // Combine date and time for the due date
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
              {selectedAssignees.length > 0 && (
                <p className="form-hint">{selectedAssignees.length} user(s) selected</p>
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
              {selectedHorses.length > 0 && (
                <p className="form-hint">{selectedHorses.length} horse(s) selected</p>
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
