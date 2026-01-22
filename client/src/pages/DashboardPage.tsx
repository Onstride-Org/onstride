import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { horsesApi, tasksApi, invoicesApi, usersApi } from '../services/api';
import { Horse, Task, Invoice, User } from '../types';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user, currentBarnId } = useAuthStore();
  const [stats, setStats] = useState({
    horses: 0,
    tasks: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
  });
  const [recentHorses, setRecentHorses] = useState<Horse[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [staffFilter, setStaffFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentBarnId) return;

      try {
        const [horsesRes, tasksRes, invoicesRes, usersRes] = await Promise.all([
          horsesApi.getAll({ limit: 5 }),
          tasksApi.getToday(),
          invoicesApi.getAll({ status: 'pending', limit: 100 }),
          usersApi.getAll(),
        ]);

        setRecentHorses(horsesRes.data || []);
        setTodayTasks(tasksRes.tasks || []);
        setStaff(usersRes.data || []);

        // Calculate total revenue from pending invoices
        const pendingInvoices: Invoice[] = invoicesRes.data || [];
        const totalRevenue = pendingInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

        setStats({
          horses: horsesRes.pagination?.total || 0,
          tasks: tasksRes.tasks?.length || 0,
          pendingInvoices: invoicesRes.pagination?.total || 0,
          totalRevenue,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentBarnId]);

  const filteredStaff = staff.filter(member => {
    if (staffFilter === 'all') return true;
    return member.accountType === staffFilter;
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
      </div>

      {/* Stats Row */}
      <div className="dashboard-stats">
        <Link to="/horses" className="dashboard-stat">
          <span className="dashboard-stat-value">{stats.horses}</span>
          <span className="dashboard-stat-label">Horses</span>
        </Link>
        <Link to="/tasks" className="dashboard-stat">
          <span className="dashboard-stat-value">{stats.tasks}</span>
          <span className="dashboard-stat-label">Tasks Today</span>
        </Link>
        <Link to="/invoices" className="dashboard-stat">
          <span className="dashboard-stat-value">{stats.pendingInvoices}</span>
          <span className="dashboard-stat-label">Invoices</span>
        </Link>
        <div className="dashboard-stat">
          <span className="dashboard-stat-value">{formatCurrency(stats.totalRevenue)}</span>
          <span className="dashboard-stat-label">Revenue</span>
        </div>
      </div>

      {/* My Horses Section */}
      {recentHorses.length > 0 && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">My horses</h2>
            <Link to="/horses" className="btn btn-icon btn-ghost btn-sm">
              <Plus size={20} />
            </Link>
          </div>
          <div className="dashboard-horses-scroll">
            {recentHorses.map((horse) => (
              <Link key={horse.id} to={`/horses/${horse.id}`} className="dashboard-horse-card">
                <div className="dashboard-horse-avatar">
                  {horse.name.charAt(0).toUpperCase()}
                </div>
                <span className="dashboard-horse-name">{horse.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Today's Tasks Section */}
      {todayTasks.length > 0 && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Today's tasks</h2>
            <Link to="/tasks" className="link text-secondary">View all</Link>
          </div>
          <div className="dashboard-tasks">
            {todayTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="dashboard-task-item">
                <div className={`dashboard-task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}>
                  {task.status === 'completed' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </div>
                <div className="dashboard-task-content">
                  <span className={`dashboard-task-name ${task.status === 'completed' ? 'completed' : ''}`}>
                    {task.name}
                  </span>
                  {task.horses && task.horses.length > 0 && (
                    <span className="dashboard-task-horse">{task.horses[0].name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Staff Section */}
      {staff.length > 0 && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">My staff</h2>
            <Link to="/users" className="btn btn-icon btn-ghost btn-sm">
              <Plus size={20} />
            </Link>
          </div>

          {/* Staff Filter Tabs */}
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
              className={`filter-tab ${staffFilter === 'groomer' ? 'active' : ''}`}
              onClick={() => setStaffFilter('groomer')}
            >
              Groom
            </button>
          </div>

          {/* Staff Grid */}
          <div className="dashboard-staff-grid">
            {filteredStaff.slice(0, 6).map((member) => (
              <div key={member.id} className="dashboard-staff-card">
                <div className="dashboard-staff-name">{member.name}</div>
                <div className="dashboard-staff-role">{member.accountType}</div>
                {member.email && (
                  <div className="dashboard-staff-email">{member.email}</div>
                )}
                {member.phoneNumber && (
                  <div className="dashboard-staff-phone">{member.phoneNumber}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
