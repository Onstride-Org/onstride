/**
 * QuickBooks API Routes
 * Handles OAuth flow and financial data endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticate, loadBarnContext, requireBarn } = require('../middleware/auth');
const quickbooksService = require('../services/quickbooks');

/**
 * @route GET /api/quickbooks/auth-url
 * @desc Get QuickBooks OAuth authorization URL
 * @access Private (Staff only)
 */
router.get('/auth-url', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;
    const authUrl = quickbooksService.getAuthUrl(barnId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * @route GET /api/quickbooks/callback
 * @desc OAuth callback handler
 * @access Public (redirected from Intuit)
 */
router.get('/callback', async (req, res) => {
  try {
    const barnId = req.query.state;
    const url = req.url;

    await quickbooksService.exchangeCodeForTokens(url, barnId);

    // Redirect to frontend financials page with success
    res.redirect(`${process.env.CLIENT_URL}/app/financials?connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/app/financials?error=connection_failed`);
  }
});

/**
 * @route GET /api/quickbooks/status
 * @desc Check QuickBooks connection status
 * @access Private
 */
router.get('/status', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;
    const isConnected = quickbooksService.isConnected(barnId);

    let companyInfo = null;
    if (isConnected) {
      try {
        companyInfo = await quickbooksService.getCompanyInfo(barnId);
      } catch (e) {
        // Token might be invalid
        quickbooksService.disconnect(barnId);
        return res.json({ connected: false, companyInfo: null });
      }
    }

    res.json({ connected: isConnected, companyInfo });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

/**
 * @route POST /api/quickbooks/disconnect
 * @desc Disconnect QuickBooks
 * @access Private (Staff only)
 */
router.post('/disconnect', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;
    quickbooksService.disconnect(barnId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * @route GET /api/quickbooks/dashboard
 * @desc Get financial dashboard summary
 * @access Private
 */
router.get('/dashboard', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const summary = await quickbooksService.getDashboardSummary(barnId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * @route GET /api/quickbooks/profit-loss
 * @desc Get profit and loss report
 * @access Private
 */
router.get('/profit-loss', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;
    const { startDate, endDate } = req.query;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const report = await quickbooksService.getProfitAndLoss(barnId, startDate, endDate);
    res.json(report);
  } catch (error) {
    console.error('Error fetching P&L:', error);
    res.status(500).json({ error: 'Failed to fetch profit and loss report' });
  }
});

/**
 * @route GET /api/quickbooks/balance-sheet
 * @desc Get balance sheet report
 * @access Private
 */
router.get('/balance-sheet', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;
    const { asOfDate } = req.query;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const report = await quickbooksService.getBalanceSheet(barnId, asOfDate || new Date().toISOString().split('T')[0]);
    res.json(report);
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    res.status(500).json({ error: 'Failed to fetch balance sheet' });
  }
});

/**
 * @route GET /api/quickbooks/invoices
 * @desc Get all invoices from QuickBooks
 * @access Private
 */
router.get('/invoices', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const invoices = await quickbooksService.getInvoices(barnId);
    res.json({ data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * @route GET /api/quickbooks/payments
 * @desc Get all payments from QuickBooks
 * @access Private
 */
router.get('/payments', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const payments = await quickbooksService.getPayments(barnId);
    res.json({ data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

/**
 * @route GET /api/quickbooks/expenses
 * @desc Get all expenses from QuickBooks
 * @access Private
 */
router.get('/expenses', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const expenses = await quickbooksService.getExpenses(barnId);
    res.json({ data: expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

/**
 * @route GET /api/quickbooks/customers
 * @desc Get all customers from QuickBooks
 * @access Private
 */
router.get('/customers', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const customers = await quickbooksService.getCustomers(barnId);
    res.json({ data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * @route GET /api/quickbooks/accounts
 * @desc Get chart of accounts from QuickBooks
 * @access Private
 */
router.get('/accounts', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const accounts = await quickbooksService.getAccounts(barnId);
    res.json({ data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

/**
 * @route GET /api/quickbooks/ar-aging
 * @desc Get accounts receivable aging report
 * @access Private
 */
router.get('/ar-aging', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const report = await quickbooksService.getARAgingSummary(barnId);
    res.json(report);
  } catch (error) {
    console.error('Error fetching AR aging:', error);
    res.status(500).json({ error: 'Failed to fetch AR aging report' });
  }
});

/**
 * @route GET /api/quickbooks/ap-aging
 * @desc Get accounts payable aging report
 * @access Private
 */
router.get('/ap-aging', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const report = await quickbooksService.getAPAgingSummary(barnId);
    res.json(report);
  } catch (error) {
    console.error('Error fetching AP aging:', error);
    res.status(500).json({ error: 'Failed to fetch AP aging report' });
  }
});

/**
 * @route POST /api/quickbooks/sync-invoice
 * @desc Sync an OnStride invoice to QuickBooks
 * @access Private (Staff only)
 */
router.post('/sync-invoice', authenticate, loadBarnContext, requireBarn, async (req, res) => {
  try {
    const barnId = req.barnId;
    const { invoiceData } = req.body;

    if (!quickbooksService.isConnected(barnId)) {
      return res.status(400).json({ error: 'QuickBooks not connected' });
    }

    const qbInvoice = await quickbooksService.createInvoice(barnId, invoiceData);
    res.json({ success: true, invoice: qbInvoice });
  } catch (error) {
    console.error('Error syncing invoice:', error);
    res.status(500).json({ error: 'Failed to sync invoice to QuickBooks' });
  }
});

module.exports = router;
