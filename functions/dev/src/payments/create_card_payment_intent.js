// functions/dev/index.js
/* eslint-disable no-console */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const Stripe = require('stripe');

// firebase functions:secrets:set STRIPE_SECRET
const STRIPE_SECRET = defineSecret('STRIPE_SECRET');

// Helpers
const toCents = (usd) => Math.round(Number(usd) * 100);
// commissionPct now comes as FRACTION (0.005 = 0.5%)
const fracToAmount = (totalCents, fraction) =>
  Math.round(totalCents * Number(fraction));

/**
 * Callable: createCardPaymentIntent
 */
module.exports = onCall(
  { region: 'us-central1', secrets: [STRIPE_SECRET] },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Unauthenticated');
      }
      const uid = request.auth.uid;

      const {
        connectedAccountId,
        commissionPct, // fraction (e.g., 0.005 = 0.5%)
        amountCents,   // NEW: amount in cents (required)
        // amountUsd,  // (optional legacy) uncomment to allow fallback while migrating
        invoiceId,
        barnId,
      } = request.data || {};

      if (!connectedAccountId) {
        throw new HttpsError('invalid-argument', 'connectedAccountId is required');
      }

      const pctNum = Number(commissionPct);
      if (
        commissionPct === undefined ||
        commissionPct === null ||
        Number.isNaN(pctNum) ||
        pctNum < 0 ||
        pctNum > 1
      ) {
        throw new HttpsError(
          'invalid-argument',
          'commissionPct (fraction) must be between 0 and 1'
        );
      }

      // Validate amountCents (and optional legacy fallback)
      let totalCents = Number(amountCents);
      if (!Number.isInteger(totalCents) || totalCents <= 0) {
        // // Legacy fallback (optional):
        // const legacyUsd = Number(amountUsd);
        // if (!Number.isNaN(legacyUsd) && legacyUsd > 0) {
        //   totalCents = toCents(legacyUsd);
        // } else {
        throw new HttpsError(
          'invalid-argument',
          'amountCents must be a positive integer (cents)'
        );
        // }
      }

      if (!invoiceId || !barnId) {
        throw new HttpsError(
          'invalid-argument',
          'invoiceId and barnId are required'
        );
      }

      const db = getFirestore();

      const invoiceRef = db.doc(`barns/${barnId}/invoices/${invoiceId}`);
      const invoiceSnap = await invoiceRef.get();
      if (!invoiceSnap.exists) {
        throw new HttpsError('not-found', 'Invoice not found');
      }
      const inv = invoiceSnap.data();

      if (inv.status !== 'pending' && inv.status !== 'failed') {
        throw new HttpsError(
          'failed-precondition',
          'Only pending or failed invoices can be paid'
        );
      }

      // Use fraction directly
      const feeCents = fracToAmount(totalCents, pctNum);

      const secret = STRIPE_SECRET.value();
      if (!secret) {
        throw new HttpsError('failed-precondition', 'Missing STRIPE_SECRET');
      }

      const stripe = new Stripe(secret, {
        apiVersion: '2024-06-20',
        httpClient: Stripe.createNodeHttpClient(),
      });

      const custDocRef = db
        .doc(`users/${uid}`)
        .collection('connected_customers')
        .doc(connectedAccountId);

      const custSnap = await custDocRef.get();
      let connectedCustomerId = custSnap.exists ? custSnap.data()?.customer_id : null;

      if (!connectedCustomerId) {
        const email = inv?.boarder_email || undefined;
        const name = inv?.boarder_name || undefined;

        const customer = await stripe.customers.create(
          {
            email,
            name,
            metadata: { firebaseUid: uid, connectedAccountId },
          },
          { stripeAccount: connectedAccountId }
        );

        connectedCustomerId = customer.id;
        await custDocRef.set(
          {
            customer_id: connectedCustomerId,
            updated_at: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      const ephKey = await stripe.ephemeralKeys.create(
        { customer: connectedCustomerId },
        { apiVersion: '2024-06-20', stripeAccount: connectedAccountId }
      );

      const currency = (inv.currency || 'usd').toLowerCase();
      const description = `${inv.boarder_name || ''} - ${inv.horse_name || ''} - ${
        inv.id || ''
      }`.trim();
      const receiptEmail = inv?.boarder_email || undefined;

      // Keep metadata KEYS the same; value shown as percentage text
      const metadata = {
        invoiceId,
        horseName: inv.horse_name || '',
        boarderName: inv.boarder_name || '',
        applicationFeePct: `${(pctNum * 100).toFixed(2)}%`,
        // snake_case mirrors (recommended)
        invoice_id: invoiceId,
        barn_id: barnId,
        horse_name: inv.horse_name || '',
        boarder_name: inv.boarder_name || '',
        application_fee_pct: `${(pctNum * 100).toFixed(2)}%`,
      };

      const idempotencyKey = `direct_pi_${uid}_${invoiceId}_${totalCents}_${currency}_${connectedAccountId}_${pctNum}`;

      const pi = await stripe.paymentIntents.create(
        {
          amount: totalCents,
          currency,
          customer: connectedCustomerId,
          automatic_payment_methods: { enabled: true },
          setup_future_usage: 'off_session',
          description,
          metadata,
          application_fee_amount: feeCents,
          receipt_email: receiptEmail,
        },
        {
          stripeAccount: connectedAccountId,
        }
      );

      await invoiceRef.update({
        status: 'processing',
        payment_intent_id: pi.id,
        connected_account_id: connectedAccountId,
        updated_at: FieldValue.serverTimestamp(),
      });

      return {
        paymentIntentClientSecret: pi.client_secret,
        customerId: connectedCustomerId,
        ephemeralKeySecret: ephKey.secret,
      };
    } catch (err) {
      console.error('createCardPaymentIntent error:', err);
      const type = err?.type || '';
      const message = err?.message || 'Internal error';

      if (type === 'StripeInvalidRequestError') {
        throw new HttpsError('invalid-argument', message);
      }
      if (type === 'StripeAuthenticationError') {
        throw new HttpsError('failed-precondition', message);
      }
      if (type === 'StripePermissionError') {
        throw new HttpsError('permission-denied', message);
      }

      throw err instanceof HttpsError
        ? err
        : new HttpsError('internal', message);
    }
  }
);