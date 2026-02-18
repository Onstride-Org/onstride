/**
 * Stripe Connect Routes
 *
 * Handles merchant onboarding for Stripe Connect
 * Replaces the Windcave credential management flow
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const MerchantApplication = require('../models/MerchantApplication');
const Barn = require('../models/Barn');
const User = require('../models/User');
const stripe = require('../services/stripe');
const { authenticate, loadBarnContext, requireBarn, hasPermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(loadBarnContext);

/**
 * GET /api/stripe-connect/status
 * Get the Stripe Connect status for the current barn
 */
router.get('/status', requireBarn, async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.json({
        connected: false,
        message: 'Stripe account not connected',
      });
    }

    // Fetch fresh status from Stripe
    try {
      const account = await stripe.retrieveAccount(merchantApp.stripeConnect.accountId);

      // Update local cache
      merchantApp.stripeConnect.chargesEnabled = account.chargesEnabled;
      merchantApp.stripeConnect.payoutsEnabled = account.payoutsEnabled;
      merchantApp.stripeConnect.detailsSubmitted = account.detailsSubmitted;
      await merchantApp.save();

      return res.json({
        connected: true,
        accountId: account.accountId,
        chargesEnabled: account.chargesEnabled,
        payoutsEnabled: account.payoutsEnabled,
        detailsSubmitted: account.detailsSubmitted,
        requiresAction: account.requiresAction,
        requirements: account.requirements,
      });
    } catch (stripeError) {
      // Account may have been deleted from Stripe
      console.error('Stripe account retrieval error:', stripeError.message);
      return res.json({
        connected: true,
        accountId: merchantApp.stripeConnect.accountId,
        error: 'Unable to verify account status',
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe-connect/account/start
 * Start the Stripe Connect onboarding process
 * Creates a new connected account and returns an onboarding link
 */
router.post('/account/start', [
  requireBarn,
  hasPermission('manageSettings'),
], async (req, res, next) => {
  try {
    // Get barn and user details
    const barn = await Barn.findById(req.barnId);
    const user = await User.findById(req.userId);

    if (!barn) {
      return res.status(404).json({ error: 'Barn not found' });
    }

    // Check if merchant application exists
    let merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    // If already has a Stripe account, return error
    if (merchantApp?.stripeConnect?.accountId) {
      // Check if account still exists and is usable
      try {
        const account = await stripe.retrieveAccount(merchantApp.stripeConnect.accountId);
        if (account.chargesEnabled) {
          return res.status(400).json({
            error: 'Stripe account already connected and active',
            accountId: account.accountId,
          });
        }
        // Account exists but not fully onboarded - generate new link
      } catch {
        // Account doesn't exist anymore - clear it and create new
        merchantApp.stripeConnect = undefined;
        await merchantApp.save();
      }
    }

    // Create new connected account
    const account = await stripe.createConnectAccount({
      email: user.email,
      barnName: barn.name,
      barnId: req.barnId.toString(),
    });

    // Create or update merchant application
    if (!merchantApp) {
      merchantApp = new MerchantApplication({
        barnId: req.barnId,
        userId: req.userId,
        status: 'draft',
      });
    }

    merchantApp.stripeConnect = {
      accountId: account.accountId,
      chargesEnabled: account.chargesEnabled,
      payoutsEnabled: account.payoutsEnabled,
      detailsSubmitted: account.detailsSubmitted,
      createdAt: new Date(),
    };

    merchantApp.addAuditLog('stripe_account_created', req.userId, `Created Stripe account ${account.accountId}`, req.ip);
    await merchantApp.save();

    // Generate onboarding link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accountLink = await stripe.createAccountLink(
      account.accountId,
      `${baseUrl}/app/settings/payments?refresh=true`,
      `${baseUrl}/app/settings/payments?success=true`
    );

    res.json({
      accountId: account.accountId,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe-connect/account/link
 * Generate a new onboarding link for an existing account
 * Used if the previous link expired or user needs to complete onboarding
 */
router.post('/account/link', [
  requireBarn,
  hasPermission('manageSettings'),
], async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.status(404).json({
        error: 'No Stripe account found. Please start the onboarding process.',
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accountLink = await stripe.createAccountLink(
      merchantApp.stripeConnect.accountId,
      `${baseUrl}/app/settings/payments?refresh=true`,
      `${baseUrl}/app/settings/payments?success=true`
    );

    res.json({
      accountId: merchantApp.stripeConnect.accountId,
      onboardingUrl: accountLink.url,
      expiresAt: accountLink.expiresAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe-connect/account/dashboard
 * Generate a link to the connected account's Stripe dashboard
 */
router.get('/account/dashboard', [
  requireBarn,
  hasPermission('manageSettings'),
], async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.status(404).json({
        error: 'No Stripe account found',
      });
    }

    // Check if account has completed onboarding
    const account = await stripe.retrieveAccount(merchantApp.stripeConnect.accountId);

    if (!account.detailsSubmitted) {
      return res.status(400).json({
        error: 'Please complete Stripe onboarding first',
        requiresOnboarding: true,
      });
    }

    const loginLink = await stripe.createLoginLink(merchantApp.stripeConnect.accountId);

    res.json({
      dashboardUrl: loginLink.url,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/stripe-connect/account
 * Disconnect Stripe account (does not delete from Stripe, just removes link)
 * The barn can reconnect later
 */
router.delete('/account', [
  requireBarn,
  hasPermission('manageSettings'),
], async (req, res, next) => {
  try {
    const merchantApp = await MerchantApplication.findOne({ barnId: req.barnId });

    if (!merchantApp?.stripeConnect?.accountId) {
      return res.status(404).json({
        error: 'No Stripe account found',
      });
    }

    const accountId = merchantApp.stripeConnect.accountId;

    // Clear Stripe connection but keep record for audit
    merchantApp.stripeConnect = {
      disconnectedAt: new Date(),
      previousAccountId: accountId,
    };

    merchantApp.addAuditLog('stripe_account_disconnected', req.userId, `Disconnected Stripe account ${accountId}`, req.ip);
    await merchantApp.save();

    res.json({
      message: 'Stripe account disconnected',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stripe-connect/config
 * Get Stripe publishable key for client-side initialization
 * This is public information, but we keep it behind auth for structure
 */
router.get('/config', async (req, res) => {
  const configured = await stripe.isConfigured();
  if (!configured) {
    return res.status(503).json({
      error: 'Stripe is not configured',
    });
  }

  const publishableKey = await stripe.getPublishableKey();
  res.json({ publishableKey });
});

module.exports = router;
