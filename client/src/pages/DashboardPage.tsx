import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { horsesApi, tasksApi, lessonsApi, invoicesApi, usersApi } from '../services/api';
import { Horse, Task, Lesson, Invoice, User } from '../types';
import {
  Plus, Calendar, CheckSquare, ChevronLeft, ChevronRight,
  DollarSign, Clock, FileText, Users, Sun, Sunrise, Sunset
} from 'lucide-react';
import { isToday, parseISO, format, addDays, subDays, startOfDay, isSameDay } from 'date-fns';

export default function DashboardPage() {
  const { user, currentBarnId, currentBarnRole } = useAuthStore();
  const [stats, setStats] = useState({
    horses: 0,
    tasks: 0,
    lessons: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
  });
  const [recentHorses, setRecentHorses] = useState<Horse[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [staffFilter, setStaffFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Day calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isStaff = currentBarnRole && !['boarder'].includes(currentBarnRole.role);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentBarnId) return;

      try {
        const [horsesRes, tasksRes, lessonsRes, invoicesRes, usersRes] = await Promise.all([
          horsesApi.getAll({ limit: 5 }),
          tasksApi.getAll({ limit: 100 }),
          lessonsApi.getAll({ limit: 100 }),
          invoicesApi.getAll({ limit: 100 }),
          usersApi.getAll(),
        ]);

        setRecentHorses(horsesRes.data || []);
        setAllTasks(tasksRes.tasks || []);
        setAllLessons(lessonsRes.data || lessonsRes.lessons || []);
        setStaff(usersRes.data || []);

        // Get recent pending/processing invoices
        const allInvoices: Invoice[] = invoicesRes.data || [];
        const pendingInvoices = allInvoices
          .filter((inv) => ['pending', 'processing'].includes(inv.status))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentInvoices(pendingInvoices);

        // Calculate monthly revenue from paid invoices this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = allInvoices
          .filter((inv) => {
            if (inv.status !== 'paid' || !inv.paidAt) return false;
            const paidDate = new Date(inv.paidAt);
            return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
          })
          .reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
        const pendingInvoiceCount = allInvoices.filter((inv) => inv.status === 'pending').length;

        // Today's data for stats
        const todayTasks = (tasksRes.tasks || []).filter((t: Task) => {
          const dueDate = parseISO(t.dueDate);
          return isToday(dueDate) && t.status !== 'completed';
        });
        const todayLessons = (lessonsRes.data || lessonsRes.lessons || []).filter((lesson: Lesson) => {
          const lessonDate = parseISO(lesson.scheduledDate);
          return isToday(lessonDate) && ['approved', 'requested'].includes(lesson.status);
        });

        setStats({
          horses: horsesRes.pagination?.total || 0,
          tasks: todayTasks.length,
          lessons: todayLessons.length,
          pendingInvoices: pendingInvoiceCount,
          totalRevenue: monthlyRevenue,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentBarnId]);

  // Filter events for selected date
  const selectedDateEvents = useMemo(() => {
    const dateStart = startOfDay(selectedDate);

    const dayTasks = allTasks.filter((task) => {
      const taskDate = parseISO(task.dueDate);
      return isSameDay(taskDate, dateStart);
    });

    const dayLessons = allLessons.filter((lesson) => {
      const lessonDate = parseISO(lesson.scheduledDate);
      return isSameDay(lessonDate, dateStart) && !['cancelled', 'rejected'].includes(lesson.status);
    });

    // Combine and sort by time
    const combined = [
      ...dayTasks.map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.name,
        time: new Date(task.dueDate),
        status: task.status,
        resource: task,
      })),
      ...dayLessons.map(lesson => ({
        id: lesson.id,
        type: 'lesson' as const,
        title: `${lesson.client?.name || 'Client'} - ${lesson.type}`,
        time: new Date(lesson.scheduledDate),
        status: lesson.status,
        resource: lesson,
        horse: lesson.horse?.name,
        duration: lesson.durationMinutes,
      })),
    ].sort((a, b) => a.time.getTime() - b.time.getTime());

    return combined;
  }, [allTasks, allLessons, selectedDate]);

  // Group events by time of day
  const groupedEvents = useMemo(() => {
    const morning = selectedDateEvents.filter(e => e.time.getHours() < 12);
    const afternoon = selectedDateEvents.filter(e => e.time.getHours() >= 12 && e.time.getHours() < 17);
    const evening = selectedDateEvents.filter(e => e.time.getHours() >= 17);
    return { morning, afternoon, evening };
  }, [selectedDateEvents]);

  const filteredStaff = staff.filter(member => {
    if (staffFilter === 'all') return true;
    return member.accountType === staffFilter;
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page vendors-page dashboard-page">
      {/* Page header - same as Vendors (title + subtitle) */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats bar - vendor-search-bar style card */}
      <div className="dashboard-stats-bar">
        <div className="dashboard-stats-row">
          <Link to="/app/horses" className="dashboard-stat-link">
            <span className="dashboard-stat-value">{stats.horses}</span>
            <span className="dashboard-stat-label">Horses</span>
          </Link>
          <Link to="/app/calendar" className="dashboard-stat-link">
            <span className="dashboard-stat-value">{stats.tasks}</span>
            <span className="dashboard-stat-label">Tasks Today</span>
          </Link>
          <Link to="/app/calendar" className="dashboard-stat-link">
            <span className="dashboard-stat-value">{stats.lessons}</span>
            <span className="dashboard-stat-label">Lessons Today</span>
          </Link>
          {isStaff && (
            <>
              <Link to="/app/invoices" className="dashboard-stat-link">
                <span className="dashboard-stat-value">{stats.pendingInvoices}</span>
                <span className="dashboard-stat-label">Pending Invoices</span>
              </Link>
              <div className="dashboard-stat-link dashboard-stat-highlight">
                <span className="dashboard-stat-value">{formatCurrency(stats.totalRevenue)}</span>
                <span className="dashboard-stat-label">This Month</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick actions - vendor-search-bar style card with action buttons */}
      {isStaff && (
        <div className="dashboard-actions-bar">
          <div className="dashboard-actions-row">
            <Link to="/app/calendar" className="btn btn-primary btn-sm">
              <CheckSquare size={18} />
              Add Task
            </Link>
            <Link to="/app/calendar" className="btn btn-outline btn-sm">
              <Calendar size={18} />
              Schedule Lesson
            </Link>
            <Link to="/app/invoices" className="btn btn-outline btn-sm">
              <FileText size={18} />
              Create Invoice
            </Link>
            <Link to="/app/horses" className="btn btn-outline btn-sm">
              <Plus size={18} />
              Add Horse
            </Link>
          </div>
        </div>
      )}

      {/* Main content - vendor-card style sections */}
      <div className="dashboard-main-grid">
        <div className="dashboard-column dashboard-column-primary">
          {/* Today / Calendar - vendor-card style */}
          <section className="vendor-card dashboard-day-calendar">
            <div className="vendor-card-header">
              <div className="day-calendar-nav">
                <button className="btn btn-icon btn-ghost btn-sm" onClick={goToPreviousDay}>
                  <ChevronLeft size={20} />
                </button>
                <div className="day-calendar-date">
                  <span className="day-calendar-day">{format(selectedDate, 'EEEE')}</span>
                  <span className="day-calendar-full">{format(selectedDate, 'MMMM d, yyyy')}</span>
                </div>
                <button className="btn btn-icon btn-ghost btn-sm" onClick={goToNextDay}>
                  <ChevronRight size={20} />
                </button>
              </div>
              {!isToday(selectedDate) && (
                <button className="btn btn-outline btn-sm" onClick={goToToday}>
                  Today
                </button>
              )}
            </div>

            <div className="vendor-card-body day-calendar-content">
              {selectedDateEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Calendar size={64} strokeWidth={1.5} />
                  </div>
                  <h3>No events scheduled</h3>
                  <p>Nothing on the calendar for this day</p>
                  {isStaff && (
                    <Link to="/app/calendar" className="btn btn-primary">
                      Add Event
                    </Link>
                  )}
                </div>
              ) : (
                <div className="day-calendar-timeline">
                  {groupedEvents.morning.length > 0 && (
                    <div className="timeline-section">
                      <div className="timeline-section-header">
                        <Sunrise size={14} />
                        <span>Morning</span>
                      </div>
                      {groupedEvents.morning.map(event => (
                        <DayCalendarEvent key={`${event.type}-${event.id}`} event={event} />
                      ))}
                    </div>
                  )}
                  {groupedEvents.afternoon.length > 0 && (
                    <div className="timeline-section">
                      <div className="timeline-section-header">
                        <Sun size={14} />
                        <span>Afternoon</span>
                      </div>
                      {groupedEvents.afternoon.map(event => (
                        <DayCalendarEvent key={`${event.type}-${event.id}`} event={event} />
                      ))}
                    </div>
                  )}
                  {groupedEvents.evening.length > 0 && (
                    <div className="timeline-section">
                      <div className="timeline-section-header">
                        <Sunset size={14} />
                        <span>Evening</span>
                      </div>
                      {groupedEvents.evening.map(event => (
                        <DayCalendarEvent key={`${event.type}-${event.id}`} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="vendor-card-actions dashboard-card-footer-simple">
              <Link to="/app/calendar" className="link text-secondary text-sm">
                View full calendar
              </Link>
            </div>
          </section>

          {/* Recent Invoices - vendor-card style */}
          {isStaff && (
            <section className="vendor-card">
              <div className="vendor-card-header">
                <div className="vendor-header-info">
                  <h3 className="vendor-name">
                    <FileText size={18} style={{ marginRight: 'var(--spacing-2)' }} />
                    Recent Invoices
                  </h3>
                </div>
                <Link to="/app/invoices" className="link text-secondary text-sm">
                  View all
                </Link>
              </div>
              <div className="vendor-card-body">
                {recentInvoices.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <DollarSign size={64} strokeWidth={1.5} />
                    </div>
                    <h3>No pending invoices</h3>
                    <p>Invoices awaiting payment will appear here</p>
                  </div>
                ) : (
                  <div className="dashboard-invoices">
                    {recentInvoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        to="/app/invoices"
                        className="dashboard-invoice-item"
                      >
                        <div className="dashboard-invoice-info">
                          <span className="dashboard-invoice-client">
                            {invoice.boarder?.name || 'Unknown Client'}
                          </span>
                          <span className="dashboard-invoice-details">
                            {invoice.horse?.name && `${invoice.horse.name} • `}
                            Due {format(parseISO(invoice.dueDate), 'MMM d')}
                          </span>
                        </div>
                        <div className="dashboard-invoice-right">
                          <span className="dashboard-invoice-amount">
                            ${invoice.subtotal.toFixed(2)}
                          </span>
                          <span className={`badge badge-${invoice.status === 'pending' ? 'warning' : 'info'}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {recentInvoices.length > 0 && (
                <div className="vendor-card-actions">
                  <div className="dashboard-invoice-summary">
                    <span>Total Pending:</span>
                    <strong>
                      ${recentInvoices.reduce((sum, inv) => sum + inv.subtotal, 0).toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right column - My Horses (vendor grid) + Team (vendor-card) */}
        <div className="dashboard-column dashboard-column-secondary">
          {/* My Horses - vendor grid of horse cards */}
          {recentHorses.length > 0 ? (
            <div className="dashboard-section-block">
              <div className="dashboard-section-header-row">
                <h3 className="saved-vendor-group-title">My Horses</h3>
                <Link to="/app/horses" className="btn btn-icon btn-ghost btn-sm">
                  <Plus size={20} />
                </Link>
              </div>
              <div className="vendor-grid">
                {recentHorses.map((horse) => (
                  <Link key={horse.id} to={`/app/horses/${horse.id}`} className="vendor-card saved" title={`View ${horse.name}`}>
                    <div className="vendor-card-header">
                      <div className="vendor-avatar">
                        {horse.photoUrl ? (
                          <img src={horse.photoUrl} alt={horse.name} />
                        ) : (
                          horse.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="vendor-header-info">
                        <h3 className="vendor-name">{horse.name}</h3>
                      </div>
                    </div>
                    <div className="vendor-card-actions">
                      <span className="link text-sm">View horse</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Team - vendor-card style */}
          {staff.length > 0 && isStaff && (
            <section className="vendor-card">
              <div className="vendor-card-header">
                <div className="vendor-header-info">
                  <h3 className="vendor-name">
                    <Users size={18} />
                    Team
                  </h3>
                </div>
                <Link to="/app/users" className="btn btn-icon btn-ghost btn-sm">
                  <Plus size={20} />
                </Link>
              </div>
              <div className="vendor-card-body">
                <div className="dashboard-filter-tabs">
                  <button
                    className={`filter-tab ${staffFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStaffFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`filter-tab ${staffFilter === 'manager' ? 'active' : ''}`}
                    onClick={() => setStaffFilter('manager')}
                  >
                    Manager
                  </button>
                  <button
                    className={`filter-tab ${staffFilter === 'trainer' ? 'active' : ''}`}
                    onClick={() => setStaffFilter('trainer')}
                  >
                    Trainer
                  </button>
                  <button
                    className={`filter-tab ${staffFilter === 'groomer' ? 'active' : ''}`}
                    onClick={() => setStaffFilter('groomer')}
                  >
                    Groom
                  </button>
                </div>
                <div className="dashboard-staff-list">
                  {filteredStaff.slice(0, 4).map((member) => (
                    <div key={member.id} className="dashboard-staff-item">
                      <div className="dashboard-staff-avatar">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="dashboard-staff-info">
                        <div className="dashboard-staff-name">{member.name}</div>
                        <div className="dashboard-staff-role">{member.accountType}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="vendor-card-actions">
                <Link to="/app/users" className="link text-sm">View all team</Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Day Calendar Event Component
function DayCalendarEvent({ event }: { event: any }) {
  const isCompleted = event.status === 'completed';
  const isOverdue = event.type === 'task' && event.status !== 'completed' && event.time < new Date();

  return (
    <div className={`day-event ${event.type} ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="day-event-time">
        {format(event.time, 'h:mm a')}
      </div>
      <div className="day-event-content">
        <div className="day-event-indicator" />
        <div className="day-event-details">
          <span className="day-event-title">{event.title}</span>
          {event.horse && (
            <span className="day-event-meta">{event.horse}</span>
          )}
          {event.duration && (
            <span className="day-event-meta">
              <Clock size={12} /> {event.duration} min
            </span>
          )}
        </div>
        <span className={`badge badge-sm badge-${getStatusBadge(event.status, event.type)}`}>
          {formatStatus(event.status)}
        </span>
      </div>
    </div>
  );
}

function getStatusBadge(status: string, type: string): string {
  if (type === 'task') {
    if (status === 'completed') return 'success';
    if (status === 'overdue') return 'error';
    return 'warning';
  }
  const badges: Record<string, string> = {
    requested: 'info',
    approved: 'success',
    rejected: 'error',
    cancelled: 'neutral',
    completed: 'success',
  };
  return badges[status] || 'neutral';
}

function formatStatus(status: string): string {
  if (status === 'notStarted') return 'pending';
  return status;
}
