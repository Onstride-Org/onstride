import { useState, useEffect } from 'react';
import { tasksApi, usersApi, horsesApi } from '../../services/api';
import { Task, TaskStatus, User as UserType, Horse } from '../../types';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { Plus, CheckSquare, Calendar, User, Trash2, X, Check, Bell } from 'lucide-react';
import { HorseIcon } from '../../components/icons/HorseIcon';
import FilterTabs from '../../components/FilterTabs';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await tasksApi.getAll(params);
      setTasks(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [pagination.page, statusFilter]);

  const handleToggleStatus = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'notStarted' : 'completed';
    try {
      await tasksApi.updateStatus(task.id, newStatus);
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getStatusBadge = (status: TaskStatus, dueDate: string) => {
    if (status === 'completed') return 'success';
    if (isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate))) return 'error';
    if (isToday(parseISO(dueDate))) return 'warning';
    return 'neutral';
  };

  return (
    <div className="page tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{pagination.total} tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="page-filters">
        <FilterTabs
          options={[
            { value: 'all', label: 'All' },
            { value: 'notStarted', label: 'Not Started' },
            { value: 'completed', label: 'Completed' },
            { value: 'overdue', label: 'Overdue' },
          ]}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value as TaskStatus | 'all');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          label="Filter by status"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckSquare size={64} strokeWidth={1.5} />
          </div>
          <h3>No tasks found</h3>
          <p>
            {statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create a task to get started'}
          </p>
        </div>
      ) : (
        <div className="task-list-container">
          {tasks.map((task) => (
            <div key={task.id} className={`task-card ${task.status}`}>
              <button
                className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                onClick={() => handleToggleStatus(task)}
              >
                {task.status === 'completed' && (
                  <Check size={16} strokeWidth={3} />
                )}
              </button>

              <div className="task-content">
                <div className="task-header">
                  <h3 className={`task-name ${task.status === 'completed' ? 'completed' : ''}`}>
                    {task.name}
                  </h3>
                  <span className={`badge badge-${getStatusBadge(task.status, task.dueDate)}`}>
                    {task.status === 'completed' ? 'Completed' :
                     isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) ? 'Overdue' :
                     isToday(parseISO(task.dueDate)) ? 'Due Today' : 'Upcoming'}
                  </span>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  <span className="task-due">
                    <Calendar size={14} />
                    {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                  </span>

                  {task.horses.length > 0 && (
                    <span className="task-horses">
                      <HorseIcon size={14} />
                      {task.horses.map(h => h.name).join(', ')}
                    </span>
                  )}

                  {task.assignees.length > 0 && (
                    <span className="task-assignees">
                      <User size={14} />
                      {task.assignees.map(a => a.name).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm btn-danger"
                onClick={() => handleDelete(task.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

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
        </div>
      )}

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadTasks();
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
