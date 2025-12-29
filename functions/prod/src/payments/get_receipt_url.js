// functions/dev/index.js
/* eslint-disable no-console */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Stripe = require('stripe');

// Secret: set with => firebase functions:secrets:set STRIPE_SECRET
const STRIPE_SECRET = defineSecret('STRIPE_SECRET');

/**
 * Helper: pick the best succeeded charge to read receipt_url
 * @param {import('stripe').Stripe.ApiList<import('stripe').Stripe.Charge>|{data: import('stripe').Stripe.Charge[]}} charges
 * @returns {import('stripe').Stripe.Charge | undefined}
 */
const pickSucceededCharge = (charges) => {
  const list = charges?.data ?? [];
  if (!list.length) return undefined;
  const sorted = [...list].sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
  return sorted.find((c) => c.paid === true && c.status === 'succeeded') ?? sorted[0];
};

/**
 * Callable: getReceiptUrl (ALWAYS scoped to the connected account)
 *
 * Params (REQUIRED):
 *  - paymentIntentId: string (e.g., 'pi_...')
 *  - connectedAccountId: string (e.g., 'acct_...')
 *
 * Returns:
 *  - { receiptUrl: string, chargeId: string }
 */
module.exports = onCall(
  { region: 'us-central1', secrets: [STRIPE_SECRET] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Unauthenticated');
      }

      const { paymentIntentId, connectedAccountId } = request.data || {};
      const piId = String(paymentIntentId || '').trim();
      const acctId = String(connectedAccountId || '').trim();

      if (!piId || !piId.startsWith('pi_')) {
        throw new HttpsError(
          'invalid-argument',
          'A valid paymentIntentId (e.g., "pi_...") is required'
        );
      }
      if (!acctId || !acctId.startsWith('acct_')) {
        throw new HttpsError(
          'invalid-argument',
          'A valid connectedAccountId (e.g., "acct_...") is required'
        );
      }

      const secret = STRIPE_SECRET.value();
      if (!secret) {
        throw new HttpsError('failed-precondition', 'Missing STRIPE_SECRET');
      }

      const stripe = new Stripe(secret, {
        apiVersion: '2024-06-20',
        httpClient: Stripe.createNodeHttpClient(),
      });

      // ALWAYS read in the connected account scope
      const scopeOptions = { stripeAccount: acctId };

      // Retrieve the PaymentIntent from the connected account
      const pi = await stripe.paymentIntents.retrieve(
        piId,
        { expand: ['latest_charge', 'charges'] },
        scopeOptions
      );

      // 1) Try latest_charge (expanded)
      if (pi.latest_charge && typeof pi.latest_charge === 'object') {
        const latestCharge = /** @type {import('stripe').Stripe.Charge} */ (pi.latest_charge);
        if (latestCharge?.receipt_url) {
          return { receiptUrl: latestCharge.receipt_url, chargeId: latestCharge.id };
        }
      }

      // 2) Try expanded charges list
      if (pi.charges?.data?.length) {
        const chosen = pickSucceededCharge(pi.charges);
        if (chosen?.receipt_url) {
          return { receiptUrl: chosen.receipt_url, chargeId: chosen.id };
        }
      }

      // 3) Fallback: list charges by PaymentIntent
      const listed = await stripe.charges.list(
        { payment_intent: piId, limit: 10 },
        scopeOptions
      );
      const chosen = pickSucceededCharge(listed);
      if (chosen?.receipt_url) {
        return { receiptUrl: chosen.receipt_url, chargeId: chosen.id };
      }

      throw new HttpsError(
        'not-found',
        'No receipt URL found for this PaymentIntent. Ensure the payment succeeded and receipts are enabled.'
      );
    } catch (err) {
      console.error('getReceiptUrl error:', err);
      const type = err?.type || '';
      const message = err?.message || 'Internal error';

      // Common Stripe error when scope/account is wrong or resource doesn't exist
      if (type === 'StripeInvalidRequestError') {
        throw new HttpsError('invalid-argument', message);
      }
      if (type === 'StripePermissionError') {
        throw new HttpsError('permission-denied', message);
      }

      throw err instanceof HttpsError ? err : new HttpsError('internal', message);
    }
  }
);