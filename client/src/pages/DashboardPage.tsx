import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { horsesApi, tasksApi, invoicesApi, lessonsApi } from '../services/api';
import { Horse, Task, Invoice, Lesson } from '../types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, currentBarnId } = useAuthStore();
  const [stats, setStats] = useState({
    horses: 0,
    tasks: 0,
    invoices: 0,
    lessons: 0,
  });
  const [recentHorses, setRecentHorses] = useState<Horse[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentBarnId) return;

      try {
        const [horsesRes, tasksRes, invoicesRes, lessonsRes] = await Promise.all([
          horsesApi.getAll({ limit: 5 }),
          tasksApi.getToday(),
          invoicesApi.getAll({ status: 'pending', limit: 5 }),
          lessonsApi.getAll({ limit: 5, status: 'approved' }),
        ]);

        setRecentHorses(horsesRes.data || []);
        setTodayTasks(tasksRes.tasks || []);
        setPendingInvoices(invoicesRes.data || []);
        setUpcomingLessons(lessonsRes.data || []);

        setStats({
          horses: horsesRes.pagination?.total || 0,
          tasks: tasksRes.tasks?.length || 0,
          invoices: invoicesRes.pagination?.total || 0,
          lessons: lessonsRes.pagination?.total || 0,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentBarnId]);

  const statCards = [
    { label: 'Horses', value: stats.horses, icon: 'horse', path: '/horses', color: 'brand' },
    { label: 'Tasks Today', value: stats.tasks, icon: 'tasks', path: '/tasks', color: 'warning' },
    { label: 'Pending Invoices', value: stats.invoices, icon: 'invoice', path: '/invoices', color: 'error' },
    { label: 'Upcoming Lessons', value: stats.lessons, icon: 'calendar', path: '/lessons', color: 'success' },
  ];

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">Here's what's happening at your barn today</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.path} className={`stat-card stat-card-${stat.color}`}>
            <div className="stat-icon">
              {stat.icon === 'horse' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 9s-2-2-4-2c-1 0-2 1-3 2l-2 2-4-1-5 5v5h4l2-3 4-1 3 4h3v-4l2-4z" />
                </svg>
              )}
              {stat.icon === 'tasks' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              )}
              {stat.icon === 'invoice' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              )}
              {stat.icon === 'calendar' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )}
            </div>
            <div className="stat-content">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Today's Tasks */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Today's Tasks</h3>
            <Link to="/tasks" className="link">View all</Link>
          </div>
          <div className="card-content">
            {todayTasks.length === 0 ? (
              <div className="empty-state-small">
                <p>No tasks for today</p>
              </div>
            ) : (
              <ul className="task-list">
                {todayTasks.slice(0, 5).map((task) => (
                  <li key={task.id} className={`task-item ${task.status}`}>
                    <span className="task-checkbox">
                      {task.status === 'completed' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 11l3 3L22 4" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="task-name">{task.name}</span>
                    {task.horses.length > 0 && (
                      <span className="task-horses">
                        {task.horses.map(h => h.name).join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent Horses */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Horses</h3>
            <Link to="/horses" className="link">View all</Link>
          </div>
          <div className="card-content">
            {recentHorses.length === 0 ? (
              <div className="empty-state-small">
                <p>No horses yet</p>
                <Link to="/horses" className="btn btn-sm btn-primary">Add Horse</Link>
              </div>
            ) : (
              <ul className="horse-list">
                {recentHorses.map((horse) => (
                  <li key={horse.id}>
                    <Link to={`/horses/${horse.id}`} className="horse-list-item">
                      <div className="horse-avatar">
                        {horse.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="horse-info">
                        <span className="horse-name">{horse.name}</span>
                        <span className="horse-meta">
                          {horse.breed?.label || 'Unknown breed'}
                          {horse.age && ` • ${horse.age} yrs`}
                        </span>
                      </div>
                      <span className={`badge badge-${horse.status === 'active' ? 'success' : 'neutral'}`}>
                        {horse.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Pending Invoices</h3>
            <Link to="/invoices" className="link">View all</Link>
          </div>
          <div className="card-content">
            {pendingInvoices.length === 0 ? (
              <div className="empty-state-small">
                <p>No pending invoices</p>
              </div>
            ) : (
              <ul className="invoice-list">
                {pendingInvoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link to={`/invoices/${invoice.id}`} className="invoice-list-item">
                      <div className="invoice-info">
                        <span className="invoice-boarder">{invoice.boarder?.name}</span>
                        <span className="invoice-date">
                          Due {format(new Date(invoice.dueDate), 'MMM d')}
                        </span>
                      </div>
                      <span className="invoice-amount">
                        ${invoice.subtotal.toFixed(2)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Upcoming Lessons */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Lessons</h3>
            <Link to="/lessons" className="link">View all</Link>
          </div>
          <div className="card-content">
            {upcomingLessons.length === 0 ? (
              <div className="empty-state-small">
                <p>No upcoming lessons</p>
              </div>
            ) : (
              <ul className="lesson-list">
                {upcomingLessons.map((lesson) => (
                  <li key={lesson.id} className="lesson-list-item">
                    <div className="lesson-time">
                      <span className="lesson-date">
                        {format(new Date(lesson.scheduledDate), 'MMM d')}
                      </span>
                      <span className="lesson-hour">
                        {format(new Date(lesson.scheduledDate), 'h:mm a')}
                      </span>
                    </div>
                    <div className="lesson-info">
                      <span className="lesson-client">{lesson.client?.name}</span>
                      <span className="lesson-type">{lesson.type}</span>
                    </div>
                    <span className="lesson-duration">{lesson.durationMinutes}min</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
