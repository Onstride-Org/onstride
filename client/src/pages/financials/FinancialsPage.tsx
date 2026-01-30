import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { financialsApi, invoicesApi, usersApi, horsesApi, billingApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  Invoice,
  QBConnectionStatus,
  FinancialDashboard,
  QBInvoice,
  QBPayment,
  QBExpense,
  User,
  Horse,
  BillingTemplate,
  ChargeType,
} from '../../types';
import { format } from 'date-fns';
import {
  TrendingUp,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  BarChart3,
  Receipt,
  Users,
  ChevronRight,
  Plus,
  Calendar,
  X,
} from 'lucide-react';
import FilterTabs from '../../components/FilterTabs';
import {
  WindcaveStatusCard,
  WindcaveApplicationWizard,
  WindcaveCredentialsForm,
} from '../../components/windcave';

type TabType = 'overview' | 'invoices' | 'payments' | 'expenses' | 'reports';

export default function FinancialsPage() {
  const { currentBarnRole } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<QBConnectionStatus | null>(null);
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectSuccess, setShowConnectSuccess] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isStaff = currentBarnRole && !['boarder'].includes(currentBarnRole.role);

  // Check for connection success from callback
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setShowConnectSuccess(true);
      setTimeout(() => setShowConnectSuccess(false), 5000);
    }
  }, [searchParams]);

  // Load connection status and data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Always load local invoices
      const invoicesRes = await invoicesApi.getAll({ limit: 50 });
      setLocalInvoices(invoicesRes.data || []);

      // Check QuickBooks connection
      const status = await financialsApi.getConnectionStatus();
      setConnectionStatus(status);

      // If connected, load QuickBooks dashboard
      if (status.connected) {
        try {
          const dashboardData = await financialsApi.getDashboard();
          setDashboard(dashboardData);
        } catch (err) {
          console.error('Failed to load QB dashboard:', err);
        }
      }
    } catch (error) {
      console.error('Failed to load financials data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { authUrl } = await financialsApi.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect QuickBooks?')) return;
    try {
      await financialsApi.disconnect();
      setConnectionStatus({ connected: false });
      setDashboard(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate local invoice stats (include 'processing' in pending counts)
  const localStats = {
    totalPending: localInvoices
      .filter((inv) => inv.status === 'pending' || inv.status === 'processing')
      .reduce((sum, inv) => sum + inv.subtotal, 0),
    totalPaid: localInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.subtotal, 0),
    pendingCount: localInvoices.filter((inv) => inv.status === 'pending' || inv.status === 'processing').length,
    overdueCount: localInvoices.filter(
      (inv) => (inv.status === 'pending' || inv.status === 'processing') && new Date(inv.dueDate) < new Date()
    ).length,
  };

  if (isLoading) {
    return (
      <div className="page vendors-page financials-page">
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page vendors-page financials-page">
      {/* Success Banner */}
      {showConnectSuccess && (
        <div className="alert alert-success mb-4">
          <CheckCircle size={20} />
          <span>Successfully connected to QuickBooks!</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowConnectSuccess(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financials</h1>
          <p className="page-subtitle">
            {connectionStatus?.connected
              ? `Connected to ${connectionStatus.companyInfo?.CompanyName || 'QuickBooks'}`
              : 'Manage billing, invoices, and financial reports'}
          </p>
        </div>
        {isStaff && (
          <div className="header-actions">
            {connectionStatus?.connected ? (
              <button className="btn btn-outline" onClick={handleDisconnect}>
                <Unlink size={18} />
                Disconnect QuickBooks
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                <LinkIcon size={18} />
                {isConnecting ? 'Connecting...' : 'Connect QuickBooks'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="page-filters">
        <FilterTabs
          options={
            isStaff
              ? [
                  { value: 'overview', label: 'Overview' },
                  { value: 'invoices', label: 'Invoices' },
                  { value: 'payments', label: 'Payments' },
                  { value: 'expenses', label: 'Expenses' },
                  { value: 'reports', label: 'Reports' },
                ]
              : [
                  { value: 'overview', label: 'My Summary' },
                  { value: 'invoices', label: 'My Invoices' },
                ]
          }
          value={activeTab}
          onChange={(value) => setActiveTab(value as TabType)}
          label="Financial sections"
        />
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <OverviewTab
          connectionStatus={connectionStatus}
          dashboard={dashboard}
          localStats={localStats}
          localInvoices={localInvoices}
          formatCurrency={formatCurrency}
          onRefresh={loadData}
          onConnect={handleConnect}
          isConnecting={isConnecting}
          isStaff={isStaff}
          onCreateInvoice={() => setShowCreateModal(true)}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesTab
          localInvoices={localInvoices}
          qbInvoices={dashboard?.recentInvoices}
          formatCurrency={formatCurrency}
          isConnected={connectionStatus?.connected}
          isStaff={isStaff}
          onCreateInvoice={() => setShowCreateModal(true)}
        />
      )}

      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsTab
          payments={dashboard?.recentPayments}
          formatCurrency={formatCurrency}
          isConnected={connectionStatus?.connected}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesTab
          expenses={dashboard?.recentExpenses}
          formatCurrency={formatCurrency}
          isConnected={connectionStatus?.connected}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsTab
          dashboard={dashboard}
          formatCurrency={formatCurrency}
          isConnected={connectionStatus?.connected}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  connectionStatus,
  dashboard,
  localStats,
  localInvoices,
  formatCurrency,
  onRefresh,
  onConnect,
  isConnecting,
  isStaff,
  onCreateInvoice,
}: {
  connectionStatus: QBConnectionStatus | null;
  dashboard: FinancialDashboard | null;
  localStats: { totalPending: number; totalPaid: number; pendingCount: number; overdueCount: number };
  localInvoices: Invoice[];
  formatCurrency: (amount: number) => string;
  onRefresh: () => void;
  onConnect?: () => void;
  isConnecting?: boolean;
  isStaff: boolean | null;
  onCreateInvoice: () => void;
}) {
  // For boarders, show their personal financial summary
  if (!isStaff) {
    return (
      <div className="financials-overview">
        <div className="dashboard-stats-bar">
          <div className="dashboard-stats-row">
            <div className="dashboard-stat-link">
              <span className="dashboard-stat-value">{formatCurrency(localStats.totalPending)}</span>
              <span className="dashboard-stat-label">Amount Due</span>
            </div>
            <div className="dashboard-stat-link dashboard-stat-highlight">
              <span className="dashboard-stat-value">{formatCurrency(localStats.totalPaid)}</span>
              <span className="dashboard-stat-label">Paid This Year</span>
            </div>
            <div className="dashboard-stat-link">
              <span className="dashboard-stat-value">{localStats.pendingCount}</span>
              <span className="dashboard-stat-label">Pending Invoices</span>
            </div>
            <div className="dashboard-stat-link dashboard-stat-warning">
              <span className="dashboard-stat-value">{localStats.overdueCount}</span>
              <span className="dashboard-stat-label">Overdue</span>
            </div>
          </div>
        </div>

        <section className="vendor-card">
          <div className="vendor-card-header">
            <div className="vendor-header-info">
              <h3 className="vendor-name">
                <FileText size={18} />
                My Invoices
              </h3>
            </div>
            <Link to="/app/financials?tab=invoices" className="link text-secondary text-sm">View all</Link>
          </div>
          <div className="vendor-card-body">
            {localInvoices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FileText size={64} strokeWidth={1.5} />
                </div>
                <h3>No invoices yet</h3>
                <p>Your invoices will appear here</p>
              </div>
            ) : (
              <div className="transactions-list">
                {localInvoices.slice(0, 10).map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/app/invoices/${invoice.id}`}
                    className="transaction-item"
                  >
                    <div className="transaction-icon">
                      <Receipt size={18} />
                    </div>
                    <div className="transaction-details">
                      <span className="transaction-name">Invoice #{invoice.id.slice(-6)}</span>
                      <span className="transaction-meta">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'No due date'}
                      </span>
                    </div>
                    <div className="transaction-amount">
                      <span className="amount">{formatCurrency(invoice.subtotal)}</span>
                      <span className={`badge badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'neutral'}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {localInvoices.length > 0 && (
            <div className="vendor-card-actions">
              <Link to="/app/financials?tab=invoices" className="link text-sm">View all invoices</Link>
            </div>
          )}
        </section>
      </div>
    );
  }

  // Calculate additional stats
  const overdueAmount = localInvoices
    .filter((inv) => (inv.status === 'pending' || inv.status === 'processing') && new Date(inv.dueDate) < new Date())
    .reduce((sum, inv) => sum + inv.subtotal, 0);
  const notDueYetAmount = localInvoices
    .filter((inv) => (inv.status === 'pending' || inv.status === 'processing') && new Date(inv.dueDate) >= new Date())
    .reduce((sum, inv) => sum + inv.subtotal, 0);
  const paidLast30Days = localInvoices
    .filter((inv) => inv.status === 'paid' && inv.paidAt && new Date(inv.paidAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, inv) => sum + inv.subtotal, 0);

  // Not connected state - show connect prompt
  if (!connectionStatus?.connected) {
    return (
      <div className="financials-overview">
        {/* Local Invoice Stats */}
        <div className="fin-dashboard-grid">
          <div className="fin-card fin-card-invoices">
            <div className="fin-card-header">
              <h3>Invoices</h3>
              <span className="fin-card-subtitle">{formatCurrency(localStats.totalPending)} UNPAID</span>
            </div>
            <div className="fin-card-body">
              <div className="fin-invoice-stats">
                <div className="fin-invoice-row">
                  <div className="fin-invoice-stat">
                    <span className="fin-stat-value fin-stat-warning">{formatCurrency(overdueAmount)}</span>
                    <span className="fin-stat-label">OVERDUE</span>
                  </div>
                  <div className="fin-invoice-stat">
                    <span className="fin-stat-value">{formatCurrency(notDueYetAmount)}</span>
                    <span className="fin-stat-label">NOT DUE YET</span>
                  </div>
                </div>
                <div className="fin-invoice-bar">
                  <div
                    className="fin-bar-segment fin-bar-overdue"
                    style={{ width: `${localStats.totalPending > 0 ? (overdueAmount / localStats.totalPending) * 100 : 0}%` }}
                  ></div>
                  <div
                    className="fin-bar-segment fin-bar-pending"
                    style={{ width: `${localStats.totalPending > 0 ? (notDueYetAmount / localStats.totalPending) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="fin-invoice-stats fin-invoice-stats-paid">
                <div className="fin-card-subtitle">{formatCurrency(paidLast30Days)} PAID <span className="fin-period">LAST 30 DAYS</span></div>
              </div>
            </div>
            <div className="fin-card-footer">
              <button className="btn btn-sm btn-primary" onClick={onCreateInvoice}>
                <Plus size={16} />
                Create Invoice
              </button>
            </div>
          </div>

          <div className="fin-card fin-card-connect">
            <div className="fin-card-header">
              <h3>Connect QuickBooks</h3>
            </div>
            <div className="fin-card-body">
              <p className="fin-connect-text">
                Connect to QuickBooks for advanced financial reporting, expense tracking, and profit &amp; loss statements.
              </p>
              <div className="fin-connect-features">
                <div className="fin-feature"><CheckCircle size={14} /> Real-time sync</div>
                <div className="fin-feature"><CheckCircle size={14} /> P&amp;L Reports</div>
                <div className="fin-feature"><CheckCircle size={14} /> Expense tracking</div>
                <div className="fin-feature"><CheckCircle size={14} /> AR/AP Aging</div>
              </div>
            </div>
            <div className="fin-card-footer">
              {onConnect && (
                <button className="btn btn-primary" onClick={onConnect} disabled={isConnecting}>
                  <LinkIcon size={18} />
                  {isConnecting ? 'Connecting...' : 'Connect QuickBooks'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="fin-card fin-card-full">
          <div className="fin-card-header">
            <h3>Recent Invoices</h3>
            <Link to="/app/financials?tab=invoices" className="fin-card-link">View all</Link>
          </div>
          <div className="fin-card-body">
            {localInvoices.length === 0 ? (
              <div className="empty-state empty-state-sm">
                <FileText size={32} strokeWidth={1.5} />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="fin-transactions">
                {localInvoices.slice(0, 5).map((invoice) => (
                  <Link key={invoice.id} to={`/app/invoices/${invoice.id}`} className="fin-transaction">
                    <div className="fin-transaction-info">
                      <span className="fin-transaction-name">{invoice.boarder?.name || 'Unknown'}</span>
                      <span className="fin-transaction-meta">
                        {invoice.horse?.name && `${invoice.horse.name} • `}
                        Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="fin-transaction-right">
                      <span className="fin-transaction-amount">{formatCurrency(invoice.subtotal)}</span>
                      <span className={`badge badge-${getStatusBadge(invoice.status)}`}>{invoice.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connected state - full dashboard
  return (
    <div className="financials-overview">
      {/* Main Dashboard Grid */}
      <div className="fin-dashboard-grid">
        {/* Invoices Card */}
        <div className="fin-card fin-card-invoices">
          <div className="fin-card-header">
            <h3>Invoices</h3>
            <span className="fin-card-subtitle">{formatCurrency(dashboard?.totalReceivables || localStats.totalPending)} UNPAID</span>
          </div>
          <div className="fin-card-body">
            <div className="fin-invoice-stats">
              <div className="fin-invoice-row">
                <div className="fin-invoice-stat">
                  <span className="fin-stat-value fin-stat-warning">{formatCurrency(overdueAmount)}</span>
                  <span className="fin-stat-label">OVERDUE</span>
                </div>
                <div className="fin-invoice-stat">
                  <span className="fin-stat-value">{formatCurrency(notDueYetAmount)}</span>
                  <span className="fin-stat-label">NOT DUE YET</span>
                </div>
              </div>
              <div className="fin-invoice-bar">
                <div
                  className="fin-bar-segment fin-bar-overdue"
                  style={{ width: `${localStats.totalPending > 0 ? (overdueAmount / localStats.totalPending) * 100 : 0}%` }}
                ></div>
                <div
                  className="fin-bar-segment fin-bar-pending"
                  style={{ width: `${localStats.totalPending > 0 ? (notDueYetAmount / localStats.totalPending) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="fin-invoice-stats fin-invoice-stats-paid">
              <div className="fin-card-subtitle">{formatCurrency(paidLast30Days)} PAID <span className="fin-period">LAST 30 DAYS</span></div>
            </div>
          </div>
          <div className="fin-card-footer">
            <button className="btn btn-sm btn-primary" onClick={onCreateInvoice}>
              <Plus size={16} />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="fin-card fin-card-expenses">
          <div className="fin-card-header">
            <h3>Expenses</h3>
            <span className="fin-card-period">This Month</span>
          </div>
          <div className="fin-card-body">
            <div className="fin-big-number">{formatCurrency(dashboard?.monthlyExpenses || 0)}</div>
            <div className="fin-expense-breakdown">
              {dashboard?.recentExpenses && dashboard.recentExpenses.length > 0 ? (
                <div className="fin-expense-categories">
                  {/* Group expenses by category and show top 4 */}
                  {(() => {
                    const categories: Record<string, number> = {};
                    dashboard.recentExpenses.forEach((exp) => {
                      const cat = exp.AccountRef?.name || 'Other';
                      categories[cat] = (categories[cat] || 0) + (exp.TotalAmt || 0);
                    });
                    const sorted = Object.entries(categories)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4);
                    const colors = ['#00a5b5', '#6b5b95', '#88b04b', '#f7cac9'];
                    return sorted.map(([cat, amount], i) => (
                      <div key={cat} className="fin-expense-category">
                        <span className="fin-category-dot" style={{ backgroundColor: colors[i] }}></span>
                        <span className="fin-category-amount">{formatCurrency(amount)}</span>
                        <span className="fin-category-name">{cat}</span>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-secondary text-sm">No expenses this month</p>
              )}
            </div>
          </div>
        </div>

        {/* Profit & Loss Card */}
        <div className="fin-card fin-card-pnl">
          <div className="fin-card-header">
            <h3>Profit and Loss</h3>
            <span className="fin-card-period">This Month</span>
          </div>
          <div className="fin-card-body">
            <div className="fin-pnl-amount">
              <span className={`fin-big-number ${(dashboard?.netIncome || 0) >= 0 ? 'fin-positive' : 'fin-negative'}`}>
                {formatCurrency(dashboard?.netIncome || 0)}
              </span>
              <span className="fin-pnl-label">NET INCOME</span>
            </div>
            <div className="fin-pnl-breakdown">
              <div className="fin-pnl-row">
                <div className="fin-pnl-bar-container">
                  <span className="fin-pnl-value">{formatCurrency(dashboard?.monthlyRevenue || 0)}</span>
                  <span className="fin-pnl-label-sm">INCOME</span>
                </div>
                <div className="fin-pnl-bar fin-pnl-bar-income" style={{
                  width: `${Math.min(100, ((dashboard?.monthlyRevenue || 0) / Math.max(dashboard?.monthlyRevenue || 1, dashboard?.monthlyExpenses || 1)) * 100)}%`
                }}></div>
              </div>
              <div className="fin-pnl-row">
                <div className="fin-pnl-bar-container">
                  <span className="fin-pnl-value">{formatCurrency(dashboard?.monthlyExpenses || 0)}</span>
                  <span className="fin-pnl-label-sm">EXPENSES</span>
                </div>
                <div className="fin-pnl-bar fin-pnl-bar-expense" style={{
                  width: `${Math.min(100, ((dashboard?.monthlyExpenses || 0) / Math.max(dashboard?.monthlyRevenue || 1, dashboard?.monthlyExpenses || 1)) * 100)}%`
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales/Revenue Card */}
        <div className="fin-card fin-card-sales">
          <div className="fin-card-header">
            <h3>Revenue</h3>
            <span className="fin-card-period">This Month</span>
          </div>
          <div className="fin-card-body">
            <div className="fin-big-number fin-positive">{formatCurrency(dashboard?.monthlyRevenue || 0)}</div>
            <div className="fin-sales-summary">
              <div className="fin-sales-stat">
                <span className="fin-sales-count">{dashboard?.recentPayments?.length || 0}</span>
                <span className="fin-sales-label">Payments Received</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Recent Activity */}
      <div className="fin-dashboard-row">
        {/* Recent Invoices */}
        <div className="fin-card">
          <div className="fin-card-header">
            <h3>Recent Invoices</h3>
            <Link to="/app/financials?tab=invoices" className="fin-card-link">View all</Link>
          </div>
          <div className="fin-card-body">
            {localInvoices.length === 0 ? (
              <div className="empty-state empty-state-sm">
                <FileText size={32} strokeWidth={1.5} />
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="fin-transactions">
                {localInvoices.slice(0, 5).map((invoice) => (
                  <Link key={invoice.id} to={`/app/invoices/${invoice.id}`} className="fin-transaction">
                    <div className="fin-transaction-info">
                      <span className="fin-transaction-name">{invoice.boarder?.name || 'Unknown'}</span>
                      <span className="fin-transaction-meta">
                        Due {format(new Date(invoice.dueDate), 'MMM d')}
                      </span>
                    </div>
                    <div className="fin-transaction-right">
                      <span className="fin-transaction-amount">{formatCurrency(invoice.subtotal)}</span>
                      <span className={`badge badge-sm badge-${getStatusBadge(invoice.status)}`}>{invoice.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="fin-card">
          <div className="fin-card-header">
            <h3>Recent Payments</h3>
            <Link to="/app/financials?tab=payments" className="fin-card-link">View all</Link>
          </div>
          <div className="fin-card-body">
            {!dashboard?.recentPayments || dashboard.recentPayments.length === 0 ? (
              <div className="empty-state empty-state-sm">
                <CreditCard size={32} strokeWidth={1.5} />
                <p>No recent payments</p>
              </div>
            ) : (
              <div className="fin-transactions">
                {dashboard.recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.Id} className="fin-transaction">
                    <div className="fin-transaction-info">
                      <span className="fin-transaction-name">{payment.CustomerRef?.name || 'Customer'}</span>
                      <span className="fin-transaction-meta">{format(new Date(payment.TxnDate), 'MMM d')}</span>
                    </div>
                    <div className="fin-transaction-right">
                      <span className="fin-transaction-amount fin-positive">+{formatCurrency(payment.TotalAmt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="fin-card">
          <div className="fin-card-header">
            <h3>Recent Expenses</h3>
            <Link to="/app/financials?tab=expenses" className="fin-card-link">View all</Link>
          </div>
          <div className="fin-card-body">
            {!dashboard?.recentExpenses || dashboard.recentExpenses.length === 0 ? (
              <div className="empty-state empty-state-sm">
                <Receipt size={32} strokeWidth={1.5} />
                <p>No recent expenses</p>
              </div>
            ) : (
              <div className="fin-transactions">
                {dashboard.recentExpenses.slice(0, 5).map((expense) => (
                  <div key={expense.Id} className="fin-transaction">
                    <div className="fin-transaction-info">
                      <span className="fin-transaction-name">{expense.EntityRef?.name || expense.AccountRef?.name || 'Expense'}</span>
                      <span className="fin-transaction-meta">{format(new Date(expense.TxnDate), 'MMM d')}</span>
                    </div>
                    <div className="fin-transaction-right">
                      <span className="fin-transaction-amount fin-negative">-{formatCurrency(expense.TotalAmt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fin-actions-bar">
        <button className="btn btn-outline btn-sm" onClick={onRefresh}>
          <RefreshCw size={16} />
          Refresh Data
        </button>
        <Link to="/app/financials?tab=reports" className="btn btn-outline btn-sm">
          <BarChart3 size={16} />
          View Reports
        </Link>
        <Link to="/app/settings/billing-templates" className="btn btn-outline btn-sm">
          <FileText size={16} />
          Billing Templates
        </Link>
      </div>
    </div>
  );
}

// Invoices Tab Component
function InvoicesTab({
  localInvoices,
  qbInvoices: _qbInvoices,
  formatCurrency,
  isConnected: _isConnected,
  isStaff,
  onCreateInvoice,
}: {
  localInvoices: Invoice[];
  qbInvoices?: QBInvoice[];
  formatCurrency: (amount: number) => string;
  isConnected?: boolean;
  isStaff: boolean | null;
  onCreateInvoice: () => void;
}) {
  // Note: qbInvoices and isConnected reserved for future QuickBooks invoice display
  void _qbInvoices;
  void _isConnected;
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices =
    statusFilter === 'all'
      ? localInvoices
      : localInvoices.filter((inv) => inv.status === statusFilter);

  return (
    <div className="financials-invoices">
      <div className="dashboard-stats-bar invoices-toolbar">
        <div className="dashboard-stats-row" style={{ flexWrap: 'wrap', gap: 'var(--spacing-3)' }}>
          <FilterTabs
            options={[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'failed', label: 'Failed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            label="Filter by status"
          />
          {isStaff && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onCreateInvoice}>
              <Plus size={18} />
              Create Invoice
            </button>
          )}
        </div>
      </div>

      <div className="invoice-cards">
        {filteredInvoices.map((invoice) => (
          <Link key={invoice.id} to={`/app/invoices/${invoice.id}`} className="invoice-card">
            <div className="invoice-card-main">
              <div className="invoice-card-info">
                <div className="invoice-card-header">
                  <span className="invoice-card-name">{invoice.boarder?.name || 'Unknown'}</span>
                  <span className={`badge badge-${getStatusBadge(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
                {invoice.horse?.name && (
                  <span className="invoice-card-horse">{invoice.horse.name}</span>
                )}
                <div className="invoice-card-meta">
                  <span className="invoice-card-date">
                    <Calendar size={14} />
                    Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className="invoice-card-amount">
                <span className="amount">{formatCurrency(invoice.subtotal)}</span>
                <ChevronRight size={20} className="chevron" />
              </div>
            </div>
          </Link>
        ))}
        {filteredInvoices.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <FileText size={64} strokeWidth={1.5} />
            </div>
            <h3>No invoices found</h3>
            <p>
              {statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first invoice to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Payments Tab Component
function PaymentsTab({
  payments,
  formatCurrency,
  isConnected,
}: {
  payments?: QBPayment[];
  formatCurrency: (amount: number) => string;
  isConnected?: boolean;
}) {
  const [showWizard, setShowWizard] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleStartApplication = () => {
    setShowWizard(true);
  };

  const handleContinueApplication = () => {
    setShowWizard(true);
  };

  const handleEnterCredentials = () => {
    setShowCredentials(true);
  };

  const handleViewApplication = () => {
    setShowWizard(true);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleCredentialsClose = () => {
    setShowCredentials(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="financials-payments">
      {/* Windcave Payment Processing Status */}
      <WindcaveStatusCard
        key={refreshKey}
        onStartApplication={handleStartApplication}
        onContinueApplication={handleContinueApplication}
        onEnterCredentials={handleEnterCredentials}
        onViewApplication={handleViewApplication}
      />

      {/* QuickBooks Payments History (if connected) */}
      {isConnected && (
        <section className="vendor-card mt-4">
          <div className="vendor-card-header">
            <div className="vendor-header-info">
              <h3 className="vendor-name">
                <CreditCard size={18} />
                Recent Payments (QuickBooks)
              </h3>
            </div>
          </div>
          <div className="vendor-card-body">
            <div className="transactions-list">
            {payments?.map((payment) => (
              <div key={payment.Id} className="transaction-item">
                <div className="transaction-icon transaction-icon-success">
                  <CreditCard size={18} />
                </div>
                <div className="transaction-details">
                  <span className="transaction-name">{payment.CustomerRef?.name || 'Customer'}</span>
                  <span className="transaction-meta">
                    {format(new Date(payment.TxnDate), 'MMM d, yyyy')}
                    {payment.PaymentMethodRef?.name && ` • ${payment.PaymentMethodRef.name}`}
                  </span>
                </div>
                <div className="transaction-amount">
                  <span className="amount amount-positive">+{formatCurrency(payment.TotalAmt)}</span>
                </div>
              </div>
            ))}
            {(!payments || payments.length === 0) && (
              <div className="empty-state">
                <div className="empty-icon">
                  <CreditCard size={64} strokeWidth={1.5} />
                </div>
                <h3>No recent payments</h3>
                <p>Payments will appear here when synced from QuickBooks</p>
              </div>
            )}
            </div>
          </div>
        </section>
      )}

      {/* Modals */}
      {showWizard && (
        <WindcaveApplicationWizard
          onClose={handleWizardClose}
          onSuccess={handleWizardClose}
        />
      )}

      {showCredentials && (
        <WindcaveCredentialsForm
          onClose={handleCredentialsClose}
          onSuccess={handleCredentialsClose}
        />
      )}
    </div>
  );
}

// Expenses Tab Component
function ExpensesTab({
  expenses,
  formatCurrency,
  isConnected,
}: {
  expenses?: QBExpense[];
  formatCurrency: (amount: number) => string;
  isConnected?: boolean;
}) {
  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <LinkIcon size={64} strokeWidth={1.5} />
        </div>
        <h3>Connect QuickBooks</h3>
        <p>Connect QuickBooks to track expenses and purchases</p>
      </div>
    );
  }

  return (
    <section className="vendor-card">
      <div className="vendor-card-header">
        <div className="vendor-header-info">
          <h3 className="vendor-name">
            <Receipt size={18} />
            Recent Expenses
          </h3>
        </div>
      </div>
      <div className="vendor-card-body">
        <div className="transactions-list">
        {expenses?.map((expense) => (
          <div key={expense.Id} className="transaction-item">
            <div className="transaction-icon transaction-icon-warning">
              <Receipt size={18} />
            </div>
            <div className="transaction-details">
              <span className="transaction-name">
                {expense.EntityRef?.name || expense.AccountRef?.name || 'Expense'}
              </span>
              <span className="transaction-meta">
                {format(new Date(expense.TxnDate), 'MMM d, yyyy')}
                {expense.PaymentType && ` • ${expense.PaymentType}`}
              </span>
            </div>
            <div className="transaction-amount">
              <span className="amount amount-negative">-{formatCurrency(expense.TotalAmt)}</span>
            </div>
          </div>
        ))}
        {(!expenses || expenses.length === 0) && (
          <div className="empty-state">
            <div className="empty-icon">
              <Receipt size={64} strokeWidth={1.5} />
            </div>
            <h3>No recent expenses</h3>
            <p>Expenses will appear here when synced from QuickBooks</p>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

// Reports Tab Component
function ReportsTab({
  dashboard,
  formatCurrency,
  isConnected,
}: {
  dashboard: FinancialDashboard | null;
  formatCurrency: (amount: number) => string;
  isConnected?: boolean;
}) {
  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <BarChart3 size={64} strokeWidth={1.5} />
        </div>
        <h3>Connect QuickBooks for Reports</h3>
        <p>
          Connect QuickBooks to access Profit & Loss, Balance Sheet, and AR/AP Aging reports
        </p>
      </div>
    );
  }

  return (
    <div className="financials-reports">
      <div className="vendor-grid">
        <section className="vendor-card saved">
          <div className="vendor-card-header">
            <div className="vendor-header-info">
              <h3 className="vendor-name">
                <TrendingUp size={18} />
                Profit & Loss (MTD)
              </h3>
            </div>
          </div>
          <div className="vendor-card-body report-content">
            <div className="report-row">
              <span>Revenue</span>
              <span className="amount-positive">
                {formatCurrency(dashboard?.monthlyRevenue || 0)}
              </span>
            </div>
            <div className="report-row">
              <span>Expenses</span>
              <span className="amount-negative">
                {formatCurrency(dashboard?.monthlyExpenses || 0)}
              </span>
            </div>
            <div className="report-row report-row-total">
              <span>Net Income</span>
              <span className={dashboard?.netIncome && dashboard.netIncome >= 0 ? 'amount-positive' : 'amount-negative'}>
                {formatCurrency(dashboard?.netIncome || 0)}
              </span>
            </div>
          </div>
        </section>

        <section className="vendor-card saved">
          <div className="vendor-card-header">
            <div className="vendor-header-info">
              <h3 className="vendor-name">
                <Users size={18} />
                Accounts Receivable
              </h3>
            </div>
          </div>
          <div className="vendor-card-body report-content">
            <div className="report-row">
              <span>Outstanding</span>
              <span>{formatCurrency(dashboard?.totalReceivables || 0)}</span>
            </div>
            <div className="report-row">
              <span>Pending Invoices</span>
              <span>{dashboard?.pendingInvoices || 0}</span>
            </div>
            <div className="report-row">
              <span>Overdue</span>
              <span className="amount-negative">{dashboard?.overdueInvoices || 0}</span>
            </div>
          </div>
        </section>

        <section className="vendor-card saved report-card-wide">
          <div className="vendor-card-header">
            <div className="vendor-header-info">
              <h3 className="vendor-name">
                <Clock size={18} />
                AR Aging Summary
              </h3>
            </div>
          </div>
          <div className="vendor-card-body">
          <div className="aging-grid">
            <div className="aging-item">
              <span className="aging-label">Current</span>
              <span className="aging-value">-</span>
            </div>
            <div className="aging-item">
              <span className="aging-label">1-30 Days</span>
              <span className="aging-value">-</span>
            </div>
            <div className="aging-item">
              <span className="aging-label">31-60 Days</span>
              <span className="aging-value">-</span>
            </div>
            <div className="aging-item">
              <span className="aging-label">61-90 Days</span>
              <span className="aging-value">-</span>
            </div>
            <div className="aging-item aging-item-warning">
              <span className="aging-label">90+ Days</span>
              <span className="aging-value">-</span>
            </div>
          </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Helper function
function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'warning',
    processing: 'info',
    paid: 'success',
    failed: 'error',
    cancelled: 'neutral',
    refunded: 'neutral',
  };
  return styles[status] || 'neutral';
}

// Create Invoice Modal Component
function CreateInvoiceModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user: currentUser } = useAuthStore();
  const [boarderId, setBoarderId] = useState('');
  const [horseId, setHorseId] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [charges, setCharges] = useState<Array<{ description: string; amount: string; quantity: string; type: ChargeType }>>([{ description: '', amount: '', quantity: '1', type: 'board' }]);
  const [users, setUsers] = useState<User[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [templates, setTemplates] = useState<BillingTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Filter out current user from billable users (can't bill yourself)
  const billableUsers = users.filter(user => user.id !== currentUser?.id);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, horsesRes, templatesRes] = await Promise.all([
          usersApi.getAll({ limit: 100 }),
          horsesApi.getAll({ limit: 100 }),
          billingApi.getTemplates()
        ]);
        setUsers(usersRes.data || []);
        setHorses(horsesRes.data || []);
        setTemplates(templatesRes || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find(t => (t.id || t._id) === templateId);
    if (template) {
      setCharges(template.charges.map(c => ({
        type: c.type,
        description: c.description,
        amount: c.amount.toFixed(2),
        quantity: c.quantity.toString(),
      })));
    }
  };

  const addCharge = () => {
    setCharges([...charges, { description: '', amount: '', quantity: '1', type: 'board' as ChargeType }]);
  };

  const removeCharge = (index: number) => {
    setCharges(charges.filter((_, i) => i !== index));
  };

  const updateCharge = (index: number, field: string, value: string) => {
    const updated = [...charges];
    (updated[index] as any)[field] = value;
    setCharges(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!boarderId) {
      setError('Please select a user');
      return;
    }

    setIsLoading(true);

    try {
      await invoicesApi.create({
        boarderId,
        horseId: horseId || undefined,
        dueDate,
        charges: charges.map((c) => ({
          description: c.description,
          amount: parseFloat(c.amount),
          quantity: parseInt(c.quantity),
          type: c.type,
        })),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Invoice</h2>
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
                    <label className="form-label">Bill To *</label>
                    <select
                      className="form-select"
                      value={boarderId}
                      onChange={(e) => setBoarderId(e.target.value)}
                      required
                    >
                      <option value="">Select a user...</option>
                      {billableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.accountType}) - {user.email}
                        </option>
                      ))}
                    </select>
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
                </div>

                <div className="form-group">
                  <label className="form-label">Related Horse (Optional)</label>
                  <select
                    className="form-select"
                    value={horseId}
                    onChange={(e) => setHorseId(e.target.value)}
                  >
                    <option value="">No specific horse</option>
                    {horses.map(horse => (
                      <option key={horse.id} value={horse.id}>
                        {horse.name} {horse.breed?.label ? `(${horse.breed.label})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {templates.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Load from Template (Optional)</label>
                    <select
                      className="form-select"
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                    >
                      <option value="">-- Select a template to auto-fill charges --</option>
                      {templates.map(template => (
                        <option key={template.id || template._id} value={template.id || template._id}>
                          {template.name} - ${template.charges.reduce((sum, c) => sum + c.amount * c.quantity, 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <p className="form-hint">Select a template to pre-fill charges below</p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Charges</label>
                  {charges.map((charge, index) => (
                    <div key={index} className="charge-row">
                      <select
                        className="form-select charge-type"
                        value={charge.type}
                        onChange={(e) => updateCharge(index, 'type', e.target.value)}
                      >
                        <option value="board">Board</option>
                        <option value="lesson">Lesson</option>
                        <option value="training">Training</option>
                        <option value="farrier">Farrier</option>
                        <option value="vet">Vet</option>
                        <option value="feed">Feed</option>
                        <option value="supplies">Supplies</option>
                        <option value="service">Service</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="charge-amount-wrapper">
                        <span className="charge-amount-prefix">$</span>
                        <input
                          type="text"
                          className="form-input charge-amount"
                          value={charge.amount}
                          onChange={(e) => {
                            // Allow only numbers and decimal
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            // Ensure only one decimal point
                            const parts = val.split('.');
                            const formatted = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
                            updateCharge(index, 'amount', formatted);
                          }}
                          onBlur={(e) => {
                            // Format to 2 decimal places on blur
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              updateCharge(index, 'amount', val.toFixed(2));
                            }
                          }}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        className="form-input charge-description"
                        value={charge.description}
                        onChange={(e) => updateCharge(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                      />
                      <input
                        type="number"
                        className="form-input charge-quantity"
                        value={charge.quantity}
                        onChange={(e) => updateCharge(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        min="1"
                        required
                      />
                      {charges.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-danger"
                          onClick={() => removeCharge(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline btn-sm" onClick={addCharge}>
                    Add Charge
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || isLoadingData}>
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
