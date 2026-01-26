/**
 * QuickBooks/Intuit API Service
 * Handles OAuth flow and API interactions with QuickBooks Online
 */

const OAuthClient = require('intuit-oauth');

// Initialize OAuth client
const getOAuthClient = () => {
  return new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
  });
};

// Store tokens per barn (in production, store in database)
const tokenStore = new Map();

const quickbooksService = {
  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthUrl: (barnId) => {
    const oauthClient = getOAuthClient();
    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: barnId, // Pass barnId as state for callback
    });
    return authUri;
  },

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens: async (url, barnId) => {
    const oauthClient = getOAuthClient();
    const authResponse = await oauthClient.createToken(url);
    const tokens = authResponse.getJson();

    // Store tokens with barnId
    tokenStore.set(barnId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      realmId: tokens.realmId,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      refreshExpiresAt: Date.now() + (tokens.x_refresh_token_expires_in * 1000),
    });

    return tokens;
  },

  /**
   * Get valid access token (refresh if needed)
   */
  getValidToken: async (barnId) => {
    const stored = tokenStore.get(barnId);
    if (!stored) {
      return null;
    }

    // Check if token is expired or about to expire (5 min buffer)
    if (Date.now() >= stored.expiresAt - 300000) {
      const oauthClient = getOAuthClient();
      oauthClient.setToken({
        access_token: stored.accessToken,
        refresh_token: stored.refreshToken,
        realmId: stored.realmId,
      });

      const refreshResponse = await oauthClient.refresh();
      const tokens = refreshResponse.getJson();

      tokenStore.set(barnId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId: stored.realmId,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        refreshExpiresAt: Date.now() + (tokens.x_refresh_token_expires_in * 1000),
      });

      return { accessToken: tokens.access_token, realmId: stored.realmId };
    }

    return { accessToken: stored.accessToken, realmId: stored.realmId };
  },

  /**
   * Check if barn is connected to QuickBooks
   */
  isConnected: (barnId) => {
    const stored = tokenStore.get(barnId);
    return stored && Date.now() < stored.refreshExpiresAt;
  },

  /**
   * Disconnect QuickBooks
   */
  disconnect: (barnId) => {
    tokenStore.delete(barnId);
  },

  /**
   * Make authenticated API request to QuickBooks
   */
  makeApiRequest: async (barnId, endpoint, method = 'GET', body = null) => {
    const tokenData = await quickbooksService.getValidToken(barnId);
    if (!tokenData) {
      throw new Error('Not connected to QuickBooks');
    }

    const baseUrl = process.env.QUICKBOOKS_ENVIRONMENT === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';

    const url = `${baseUrl}/v3/company/${tokenData.realmId}${endpoint}`;

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`QuickBooks API error: ${error}`);
    }

    return response.json();
  },

  /**
   * Get company info
   */
  getCompanyInfo: async (barnId) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      '/companyinfo/' + tokenStore.get(barnId)?.realmId
    );
    return response.CompanyInfo;
  },

  /**
   * Get profit and loss report
   */
  getProfitAndLoss: async (barnId, startDate, endDate) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      `/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`
    );
    return response;
  },

  /**
   * Get balance sheet report
   */
  getBalanceSheet: async (barnId, asOfDate) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      `/reports/BalanceSheet?as_of_date=${asOfDate}`
    );
    return response;
  },

  /**
   * Get accounts receivable aging report
   */
  getARAgingSummary: async (barnId) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      '/reports/AgedReceivables'
    );
    return response;
  },

  /**
   * Get accounts payable aging report
   */
  getAPAgingSummary: async (barnId) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      '/reports/AgedPayables'
    );
    return response;
  },

  /**
   * Get all customers
   */
  getCustomers: async (barnId, maxResults = 100) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      `/query?query=select * from Customer maxresults ${maxResults}`
    );
    return response.QueryResponse?.Customer || [];
  },

  /**
   * Get all invoices
   */
  getInvoices: async (barnId, maxResults = 100) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      `/query?query=select * from Invoice orderby TxnDate desc maxresults ${maxResults}`
    );
    return response.QueryResponse?.Invoice || [];
  },

  /**
   * Get all payments
   */
  getPayments: async (barnId, maxResults = 100) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      `/query?query=select * from Payment orderby TxnDate desc maxresults ${maxResults}`
    );
    return response.QueryResponse?.Payment || [];
  },

  /**
   * Get all expenses/purchases
   */
  getExpenses: async (barnId, maxResults = 100) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      `/query?query=select * from Purchase orderby TxnDate desc maxresults ${maxResults}`
    );
    return response.QueryResponse?.Purchase || [];
  },

  /**
   * Get all bills
   */
  getBills: async (barnId, maxResults = 100) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      `/query?query=select * from Bill orderby TxnDate desc maxresults ${maxResults}`
    );
    return response.QueryResponse?.Bill || [];
  },

  /**
   * Get accounts
   */
  getAccounts: async (barnId) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      '/query?query=select * from Account'
    );
    return response.QueryResponse?.Account || [];
  },

  /**
   * Create invoice in QuickBooks
   */
  createInvoice: async (barnId, invoiceData) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      '/invoice',
      'POST',
      invoiceData
    );
    return response.Invoice;
  },

  /**
   * Create customer in QuickBooks
   */
  createCustomer: async (barnId, customerData) => {
    const response = await quickbooksService.makeApiRequest(
      barnId,
      '/customer',
      'POST',
      customerData
    );
    return response.Customer;
  },

  /**
   * Get dashboard summary data
   */
  getDashboardSummary: async (barnId) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const formatDate = (d) => d.toISOString().split('T')[0];

    try {
      const [
        invoices,
        payments,
        expenses,
        profitLossMonth,
        profitLossYear,
        arAging,
      ] = await Promise.all([
        quickbooksService.getInvoices(barnId, 50),
        quickbooksService.getPayments(barnId, 50),
        quickbooksService.getExpenses(barnId, 50),
        quickbooksService.getProfitAndLoss(barnId, formatDate(startOfMonth), formatDate(today)),
        quickbooksService.getProfitAndLoss(barnId, formatDate(startOfYear), formatDate(today)),
        quickbooksService.getARAgingSummary(barnId),
      ]);

      // Calculate metrics
      const totalReceivables = invoices
        .filter(inv => inv.Balance > 0)
        .reduce((sum, inv) => sum + parseFloat(inv.Balance || 0), 0);

      const monthlyRevenue = payments
        .filter(p => new Date(p.TxnDate) >= startOfMonth)
        .reduce((sum, p) => sum + parseFloat(p.TotalAmt || 0), 0);

      const monthlyExpenses = expenses
        .filter(e => new Date(e.TxnDate) >= startOfMonth)
        .reduce((sum, e) => sum + parseFloat(e.TotalAmt || 0), 0);

      const pendingInvoices = invoices.filter(inv => inv.Balance > 0).length;
      const overdueInvoices = invoices.filter(inv =>
        inv.Balance > 0 && new Date(inv.DueDate) < today
      ).length;

      return {
        totalReceivables,
        monthlyRevenue,
        monthlyExpenses,
        netIncome: monthlyRevenue - monthlyExpenses,
        pendingInvoices,
        overdueInvoices,
        recentInvoices: invoices.slice(0, 10),
        recentPayments: payments.slice(0, 10),
        recentExpenses: expenses.slice(0, 10),
        profitLossMonth,
        profitLossYear,
        arAging,
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      throw error;
    }
  },
};

module.exports = quickbooksService;
