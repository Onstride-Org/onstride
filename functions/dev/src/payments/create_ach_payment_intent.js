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
// commissionPct now comes as FRACTION (e.g. 0.005 = 0.5%)
const fracToAmount = (totalCents, fraction) =>
  Math.round(totalCents * Number(fraction));

/**
 * Callable: createAchPaymentIntent (DIRECT CHARGES)
 * - Creates/reads a Customer **in the connected account**
 * - Creates an Ephemeral Key **in the connected account**
 * - Creates a PaymentIntent **in the connected account** (using stripeAccount header)
 * - Optional platform commission via application_fee_amount
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
        commissionPct,        // FRACTION in [0..1], e.g. 0.005 = 0.5%
        amountCents,          // NEW: amount in cents (required)

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
        throw new HttpsError('invalid-argument', 'commissionPct (fraction) must be between 0 and 1');
      }


      if (!Number.isInteger(amountCents) || amountCents <= 0) {
        throw new HttpsError('invalid-argument', 'amountCents must be a positive integer (cents)');
      }

      if (!invoiceId || !barnId) {
        throw new HttpsError('invalid-argument', 'invoiceId and barnId are required');
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

      const totalCents = Number(amountCents);
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

      // ACH must be USD
      const currency = (inv.currency || 'usd').toLowerCase();
      const description = `${inv.boarder_name || ''} - ${inv.horse_name || ''} - ${inv.id || ''}`.trim();
      const receiptEmail = inv?.boarder_email || undefined;

      const pctText = `${(pctNum * 100).toFixed(2)}%`;
      const metadata = {
        invoiceId, // compat
        barnId,    // compat
        horseName: inv.horse_name || '',
        boarderName: inv.boarder_name || '',
        applicationFeePct: pctText,
        // snake_case mirrors
        invoice_id: invoiceId,
        barn_id: barnId,
        horse_name: inv.horse_name || '',
        boarder_name: inv.boarder_name || '',
        application_fee_pct: pctText,
      };

      const ACH_VERIFICATION = 'instant'; // 'instant' | 'microdeposits' | 'automatic'

      const pi = await stripe.paymentIntents.create(
        {
          amount: totalCents,
          currency,
          customer: connectedCustomerId,
          payment_method_types: ['us_bank_account'],
          setup_future_usage: 'off_session',
          description,
          metadata,
          application_fee_amount: feeCents,
          receipt_email: receiptEmail,
          payment_method_options: {
            us_bank_account: {
              verification_method: ACH_VERIFICATION,
              // financial_connections: { filters: { account_subtypes: ['checking'] } },
            },
          },
        },
        { stripeAccount: connectedAccountId }
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
      console.error('createPaymentIntent (direct) error:', err);
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

      throw err instanceof HttpsError ? err : new HttpsError('internal', message);
    }
  }
);