import { useState, useEffect } from 'react';
import { tasksApi } from '../../services/api';
import { Task, TaskStatus } from '../../types';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { Plus, CheckSquare, Calendar, User, Trash2, X, Check } from 'lucide-react';
import { HorseIcon } from '../../components/icons/HorseIcon';

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
        <div className="filter-tabs">
          {(['all', 'notStarted', 'completed', 'overdue'] as const).map((status) => (
            <button
              key={status}
              className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(status);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              {status === 'notStarted' ? 'Not Started' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
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
  const [sendReminder, setSendReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await tasksApi.create({
        name,
        description: description || undefined,
        dueDate,
        sendReminder,
        horseIds: [],
        assigneeIds: [],
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sendReminder}
                  onChange={(e) => setSendReminder(e.target.checked)}
                />
                <span>Send reminder notification</span>
              </label>
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
