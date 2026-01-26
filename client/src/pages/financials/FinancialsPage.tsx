import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { financialsApi, invoicesApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  Invoice,
  QBConnectionStatus,
  FinancialDashboard,
  QBInvoice,
  QBPayment,
  QBExpense,
} from '../../types';
import { format } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  PieChart,
  BarChart3,
  Wallet,
  Receipt,
  Users,
  Building2,
  ChevronRight,
  Plus,
  Calendar,
  X,
} from 'lucide-react';
import FilterTabs from '../../components/FilterTabs';

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

  // Calculate local invoice stats
  const localStats = {
    totalPending: localInvoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.subtotal, 0),
    totalPaid: localInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.subtotal, 0),
    pendingCount: localInvoices.filter((inv) => inv.status === 'pending').length,
    overdueCount: localInvoices.filter(
      (inv) => inv.status === 'pending' && new Date(inv.dueDate) < new Date()
    ).length,
  };

  if (isLoading) {
    return (
      <div className="page financials-page">
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page financials-page">
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
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'invoices', label: 'Invoices' },
            { value: 'payments', label: 'Payments' },
            { value: 'expenses', label: 'Expenses' },
            { value: 'reports', label: 'Reports' },
          ]}
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
          isStaff={isStaff}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoicesTab
          localInvoices={localInvoices}
          qbInvoices={dashboard?.recentInvoices}
          formatCurrency={formatCurrency}
          isConnected={connectionStatus?.connected}
          isStaff={isStaff}
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
  isStaff,
}: {
  connectionStatus: QBConnectionStatus | null;
  dashboard: FinancialDashboard | null;
  localStats: { totalPending: number; totalPaid: number; pendingCount: number; overdueCount: number };
  localInvoices: Invoice[];
  formatCurrency: (amount: number) => string;
  onRefresh: () => void;
  isStaff: boolean | null;
}) {
  return (
    <div className="financials-overview">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {formatCurrency(dashboard?.totalReceivables || localStats.totalPending)}
            </span>
            <span className="stat-label">Outstanding Receivables</span>
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {formatCurrency(dashboard?.monthlyRevenue || localStats.totalPaid)}
            </span>
            <span className="stat-label">Revenue This Month</span>
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {formatCurrency(dashboard?.monthlyExpenses || 0)}
            </span>
            <span className="stat-label">Expenses This Month</span>
          </div>
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">
            <PieChart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">
              {formatCurrency(dashboard?.netIncome || (localStats.totalPaid - 0))}
            </span>
            <span className="stat-label">Net Income</span>
          </div>
        </div>
      </div>

      {/* Invoice Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-header">
            <FileText size={20} />
            <h3>Pending Invoices</h3>
          </div>
          <div className="summary-value">{dashboard?.pendingInvoices || localStats.pendingCount}</div>
          <div className="summary-footer">
            <Link to="/app/financials?tab=invoices" className="summary-link">
              View all <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="summary-card summary-card-warning">
          <div className="summary-header">
            <AlertCircle size={20} />
            <h3>Overdue Invoices</h3>
          </div>
          <div className="summary-value">{dashboard?.overdueInvoices || localStats.overdueCount}</div>
          <div className="summary-footer">
            <span className="summary-hint">Requires attention</span>
          </div>
        </div>

        <div className="summary-card summary-card-success">
          <div className="summary-header">
            <CheckCircle size={20} />
            <h3>Paid This Month</h3>
          </div>
          <div className="summary-value">
            {localInvoices.filter(
              (inv) =>
                inv.status === 'paid' &&
                inv.paidAt &&
                new Date(inv.paidAt).getMonth() === new Date().getMonth()
            ).length}
          </div>
          <div className="summary-footer">
            <span className="summary-hint">Invoices collected</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {isStaff && (
        <div className="quick-actions">
          <h3 className="section-title">Quick Actions</h3>
          <div className="actions-grid">
            <Link to="/app/financials?tab=invoices&action=create" className="action-card">
              <div className="action-icon">
                <Plus size={24} />
              </div>
              <span>Create Invoice</span>
            </Link>
            <Link to="/app/settings/billing-templates" className="action-card">
              <div className="action-icon">
                <FileText size={24} />
              </div>
              <span>Billing Templates</span>
            </Link>
            <button className="action-card" onClick={onRefresh}>
              <div className="action-icon">
                <RefreshCw size={24} />
              </div>
              <span>Refresh Data</span>
            </button>
            <Link to="/app/financials?tab=reports" className="action-card">
              <div className="action-icon">
                <BarChart3 size={24} />
              </div>
              <span>View Reports</span>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <div className="section-header">
          <h3 className="section-title">Recent Invoices</h3>
          <Link to="/app/financials?tab=invoices" className="btn btn-ghost btn-sm">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="transactions-list">
          {localInvoices.slice(0, 5).map((invoice) => (
            <Link
              key={invoice.id}
              to={`/app/invoices/${invoice.id}`}
              className="transaction-item"
            >
              <div className="transaction-icon">
                <Receipt size={18} />
              </div>
              <div className="transaction-details">
                <span className="transaction-name">{invoice.boarder?.name || 'Unknown'}</span>
                <span className="transaction-meta">
                  {invoice.horse?.name && `${invoice.horse.name} • `}
                  Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="transaction-amount">
                <span className="amount">{formatCurrency(invoice.subtotal)}</span>
                <span className={`badge badge-${getStatusBadge(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </Link>
          ))}
          {localInvoices.length === 0 && (
            <div className="empty-transactions">
              <FileText size={32} />
              <p>No invoices yet</p>
            </div>
          )}
        </div>
      </div>

      {/* QuickBooks Connection Card */}
      {!connectionStatus?.connected && isStaff && (
        <div className="qb-connect-card">
          <div className="qb-connect-content">
            <div className="qb-logo">
              <Building2 size={32} />
            </div>
            <div className="qb-info">
              <h3>Connect QuickBooks</h3>
              <p>
                Sync your financial data with QuickBooks Online for advanced reporting,
                automatic reconciliation, and seamless accounting integration.
              </p>
            </div>
          </div>
          <div className="qb-features">
            <div className="qb-feature">
              <CheckCircle size={16} />
              <span>Real-time sync</span>
            </div>
            <div className="qb-feature">
              <CheckCircle size={16} />
              <span>P&L Reports</span>
            </div>
            <div className="qb-feature">
              <CheckCircle size={16} />
              <span>AR/AP Aging</span>
            </div>
            <div className="qb-feature">
              <CheckCircle size={16} />
              <span>Invoice sync</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Invoices Tab Component
function InvoicesTab({
  localInvoices,
  qbInvoices,
  formatCurrency,
  isConnected,
  isStaff,
}: {
  localInvoices: Invoice[];
  qbInvoices?: QBInvoice[];
  formatCurrency: (amount: number) => string;
  isConnected?: boolean;
  isStaff: boolean | null;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices =
    statusFilter === 'all'
      ? localInvoices
      : localInvoices.filter((inv) => inv.status === statusFilter);

  return (
    <div className="financials-invoices">
      <div className="invoices-header">
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
          <Link to="/app/invoices" className="btn btn-primary">
            <Plus size={18} />
            Create Invoice
          </Link>
        )}
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
  if (!isConnected) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <LinkIcon size={64} strokeWidth={1.5} />
        </div>
        <h3>Connect QuickBooks</h3>
        <p>Connect QuickBooks to view payment history and transaction details</p>
      </div>
    );
  }

  return (
    <div className="financials-payments">
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
          <div className="empty-transactions">
            <CreditCard size={32} />
            <p>No recent payments</p>
          </div>
        )}
      </div>
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
    <div className="financials-expenses">
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
          <div className="empty-transactions">
            <Receipt size={32} />
            <p>No recent expenses</p>
          </div>
        )}
      </div>
    </div>
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
      <div className="reports-grid">
        <div className="report-card">
          <div className="report-header">
            <TrendingUp size={24} />
            <h3>Profit & Loss (MTD)</h3>
          </div>
          <div className="report-content">
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
        </div>

        <div className="report-card">
          <div className="report-header">
            <Users size={24} />
            <h3>Accounts Receivable</h3>
          </div>
          <div className="report-content">
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
        </div>

        <div className="report-card report-card-wide">
          <div className="report-header">
            <Clock size={24} />
            <h3>AR Aging Summary</h3>
          </div>
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
