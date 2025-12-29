// functions/dev/stripe_webhook.js
/* eslint-disable no-console */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const Stripe = require('stripe');

// Initialize Admin (idempotent)
if (!getApps().length) {
  initializeApp();
}

// Secrets
const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
// firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

/** Helper: get receipt_url from latest_charge (expanded or by fetch) */
async function getReceiptUrl({ stripe, paymentIntent, stripeAccount }) {
  try {
    const latest = paymentIntent.latest_charge;
    if (latest && typeof latest !== 'string' && latest.receipt_url) {
      return latest.receipt_url;
    }
    if (typeof latest === 'string') {
      const charge = await stripe.charges.retrieve(latest, { stripeAccount });
      return charge?.receipt_url || null;
    }
    return null;
  } catch (e) {
    console.error('[webhook] Failed to resolve receipt_url:', e);
    return null;
  }
}

/**
 * Helper: Extract payment method details (type, brand, last4) robustly.
 * Priority:
 *  1) paymentIntent.charges.data[0].payment_method_details
 *  2) Retrieve latest_charge
 *  3) Retrieve payment_method
 */
async function extractPaymentMethodDetails({ stripe, paymentIntent, stripeAccount }) {
  try {
    // 1) From charges array if present/expanded
    const pmdFromPI =
      paymentIntent?.charges?.data?.[0]?.payment_method_details || null;

    // 2) From latest_charge retrieve if needed
    let pmdFromCharge = null;
    if (!pmdFromPI && paymentIntent?.latest_charge) {
      if (typeof paymentIntent.latest_charge === 'string') {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge, {
          stripeAccount,
        });
        pmdFromCharge = charge?.payment_method_details || null;
      } else {
        pmdFromCharge = paymentIntent.latest_charge?.payment_method_details || null;
      }
    }

    const pmd = pmdFromPI || pmdFromCharge || null;

    // 3) Optionally, fetch payment_method (for brand/last4 fallback)
    let pm = null;
    if (paymentIntent?.payment_method) {
      try {
        const pmId =
          typeof paymentIntent.payment_method === 'string'
            ? paymentIntent.payment_method
            : paymentIntent.payment_method?.id;
        if (pmId) {
          pm = await stripe.paymentMethods.retrieve(pmId, { stripeAccount });
        }
      } catch (_) {}
    }

    // Decide type
    const type =
      pmd?.type ||
      pm?.type ||
      paymentIntent?.payment_method_types?.[0] ||
      null;

    // Map details by type
    let card_brand = null;
    let card_last4 = null;
    let bank_last4 = null;

    if (type === 'card') {
      card_brand =
        pmd?.card?.brand ||
        pm?.card?.brand ||
        null;
      card_last4 =
        pmd?.card?.last4 ||
        pm?.card?.last4 ||
        null;
    } else if (type === 'us_bank_account') {
      bank_last4 =
        pmd?.us_bank_account?.last4 ||
        pm?.us_bank_account?.last4 ||
        null;
      // (Optional) bank_name is available as pmd?.us_bank_account?.bank_name
    }

    return {
      payment_method_type: type || null,
      card_brand: card_brand || null,
      card_last4: card_last4 || null,
      bank_last4: bank_last4 || null,
    };
  } catch (e) {
    console.error('[webhook] Failed to extract payment method details:', e);
    return {
      payment_method_type: null,
      card_brand: null,
      card_last4: null,
      bank_last4: null,
    };
  }
}

// Helper: resolve Firestore doc ref for the invoice
// Priority 1: barnId + invoiceId from metadata
// Fallback: query collectionGroup('invoices') by payment_intent_id
async function resolveInvoiceRef(db, { barnId, invoiceId, paymentIntentId }) {
  if (barnId && invoiceId) {
    return db.collection('barns').doc(barnId).collection('invoices').doc(invoiceId);
  }

  const snapshot = await db
    .collectionGroup('invoices')
    .where('payment_intent_id', '==', paymentIntentId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0].ref;
  }

  if (invoiceId) {
    const byInvoiceId = await db
      .collectionGroup('invoices')
      .where('id', '==', invoiceId) // adjust to your schema if needed
      .limit(1)
      .get();
    if (!byInvoiceId.empty) {
      return byInvoiceId.docs[0].ref;
    }
  }

  return null;
}

/**
 * Resolve boarder userId from invoice data:
 * - Uses invoice.boarder_id (primary) or invoice.boarderId (fallback)
 */
function resolveBoarderUserId(invoiceData) {
  const id = invoiceData?.boarder_id ?? invoiceData?.boarderId ?? null;
  return (typeof id === 'string' && id.trim()) ? id : null;
}

/**
 * Load a single FCM token from the boarder's profile.
 * Priority: accounts/{uid}.fcm_token -> users/{uid}.fcm_token
 */
async function loadFcmToken(db, userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const token = userDoc.get('fcm_token');
      if (typeof token === 'string' && token.trim()) return token.trim();
    }
  } catch (_) {}

  return null;
}

/**
 * Send push notification to boarder (single token).
 * type: 'invoice_payment_succeeded' | 'invoice_requires_action' | 'invoice_payment_failed'
 */
async function notifyBoarder({
  db,
  messaging,
  invoiceRef,
  invoiceData,
  type,
  amountCents,
  currency,
  receiptUrl,
  errorMessage,
  nextActionType,
}) {
  try {
    const boarderUserId = resolveBoarderUserId(invoiceData);
    if (!boarderUserId) {
      console.warn('[webhook] boarder_id not found in invoice, skipping push.');
      return;
    }

    const token = await loadFcmToken(db, boarderUserId);
    if (!token) {
      console.warn(`[webhook] No fcm_token for user ${boarderUserId}, skipping push.`);
      return;
    }

    const barnId = invoiceRef.parent.parent?.id || '';
    const invoiceId = invoiceRef.id;
    const amount = typeof amountCents === 'number'
      ? (Number(amountCents) / 100).toFixed(2)
      : null;
    const cur = (currency || 'usd').toLowerCase();

    /** Compose message per type */
    let title = 'Payment update';
    let body = 'There is an update regarding your payment.';
    const data = {
      type,
      barn_id: barnId,
      invoice_id: invoiceId,
      currency: cur,
      deeplink: `app://invoices/${invoiceId}`, // adjust to your scheme
    };

    if (amount) data.amount = String(amount);
    if (receiptUrl) data.receipt_url = receiptUrl;

    switch (type) {
      case 'invoice_payment_succeeded':
        title = 'Payment received';
        body = `Your payment of ${cur.toUpperCase()} $${amount} was successful.`;
        break;

      case 'invoice_requires_action':
        title = 'Action required to complete your payment';
        // nextActionType example values: 'use_stripe_sdk', 'verify_with_microdeposits', etc.
        body = nextActionType === 'verify_with_microdeposits'
          ? 'Please verify the microdeposits to complete your ACH payment.'
          : 'Please complete the additional authentication to finish your payment.';
        if (nextActionType) data.next_action = nextActionType;
        break;

      case 'invoice_payment_failed':
        title = 'Payment failed';
        body = errorMessage
          ? `Your payment failed: ${errorMessage}`
          : 'Your payment could not be completed.';
        if (errorMessage) data.error = String(errorMessage);
        break;

      default:
        break;
    }

    const message = {
      token,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: { aps: { sound: 'default', contentAvailable: false } },
      },
    };

    const resp = await messaging.send(message);
    console.log(`[webhook] Push sent to boarder=${boarderUserId}. messageId=${resp}`);
  } catch (e) {
    console.error('[webhook] Error sending push to boarder:', e);
  }
}

module.exports = onRequest(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const sig = req.get('stripe-signature');
    if (!sig) return res.status(400).send('Missing stripe-signature header');

    const secretKey = STRIPE_SECRET.value();
    const webhookSecret = STRIPE_WEBHOOK_SECRET.value();
    const db = getFirestore();

    let event;
    try {
      // Use rawBody for signature verification (Functions v2 provides req.rawBody)
      event = Stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Stripe Connect account that triggered the event (if any)
    const connectedAccountId = event.account || null;

    // Stripe client (platform key; pass {stripeAccount} when needed)
    const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

    try {
      switch (event.type) {
        case 'payment_intent.processing': {
          const pi = event.data.object;
          const invoiceId = pi.metadata?.invoice_id || pi.metadata?.invoiceId;
          const barnId = pi.metadata?.barn_id || pi.metadata?.barnId;
          if (!invoiceId || !barnId) return res.status(200).send('[OK-missing-metadata]');

          // NEW: extract method details
          const method = await extractPaymentMethodDetails({
            stripe,
            paymentIntent: pi,
            stripeAccount: connectedAccountId || undefined,
          });

          const invoiceRef = db.collection('barns').doc(barnId).collection('invoices').doc(invoiceId);

          await invoiceRef.set(
            {
              status: 'processing',
              stripe: {
                payment_intent_id: pi.id,
                connected_account_id: connectedAccountId,
                payment_method_type: method.payment_method_type,
                card_brand: method.card_brand,
                card_last4: method.card_last4,
                bank_last4: method.bank_last4,
              },
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log('[webhook] invoice set to processing:', invoiceRef.path);
          break;
        }

        case 'payment_intent.requires_action': {
          const pi = event.data.object;
          const invoiceId = pi.metadata?.invoiceId || pi.metadata?.invoice_id || null;
          const barnId = pi.metadata?.barnId || pi.metadata?.barn_id || null;

          // NEW: extract method details (helpful for UI hints)
          const method = await extractPaymentMethodDetails({
            stripe,
            paymentIntent: pi,
            stripeAccount: connectedAccountId || undefined,
          });

          // Attempt to locate invoice (for push + store method details)
          const invoiceRef = await resolveInvoiceRef(db, {
            barnId,
            invoiceId,
            paymentIntentId: pi.id,
          });

          if (invoiceRef) {
            try {
              await invoiceRef.set(
                {
                  stripe: {
                    payment_intent_id: pi.id,
                    connected_account_id: connectedAccountId || null,
                    payment_method_type: method.payment_method_type,
                    card_brand: method.card_brand,
                    card_last4: method.card_last4,
                    bank_last4: method.bank_last4,
                  },
                  updated_at: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );

              const invoiceSnap = await invoiceRef.get();
              const invoiceData = invoiceSnap.data() || {};
              await notifyBoarder({
                db,
                messaging: getMessaging(),
                invoiceRef,
                invoiceData,
                type: 'invoice_requires_action',
                amountCents: pi.amount ?? pi.amount_received ?? null,
                currency: pi.currency || 'usd',
                nextActionType: pi.next_action?.type || null,
              });
            } catch (e) {
              console.error('[webhook] Failed to upsert & notify on requires_action:', e);
            }
          }

          console.log('[webhook] requires_action:', {
            pi: pi.id,
            next_action: pi.next_action?.type,
          });
          break;
        }

        case 'payment_intent.succeeded': {
          const pi = event.data.object;

          const invoiceId = pi.metadata?.invoiceId || pi.metadata?.invoice_id || null;
          const barnId = pi.metadata?.barnId || pi.metadata?.barn_id || null;

          const receiptUrl = await getReceiptUrl({
            stripe,
            paymentIntent: pi,
            stripeAccount: connectedAccountId || undefined,
          });

          const method = await extractPaymentMethodDetails({
            stripe,
            paymentIntent: pi,
            stripeAccount: connectedAccountId || undefined,
          });

          const invoiceRef = await resolveInvoiceRef(db, {
            barnId,
            invoiceId,
            paymentIntentId: pi.id,
          });

          if (!invoiceRef) {
            console.error(
              '[webhook] Invoice reference not found for payment_intent_id=',
              pi.id,
              ' metadata:',
              pi.metadata
            );
            break;
          }

          await invoiceRef.set(
            {
              status: 'paid',
              stripe: {
                payment_intent_id: pi.id,
                latest_charge_id:
                  typeof pi.latest_charge === 'string'
                    ? pi.latest_charge
                    : pi.latest_charge?.id || null,
                connected_account_id: connectedAccountId || null,
                receipt_url: receiptUrl || null,
                // NEW
                payment_method_type: method.payment_method_type,
                card_brand: method.card_brand,
                card_last4: method.card_last4,
                bank_last4: method.bank_last4,
              },
              paid_at: FieldValue.serverTimestamp(),
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log(`[webhook] Invoice marked as PAID. invoice_path=${invoiceRef.path}`);

          // Notify success
          try {
            const invoiceSnap = await invoiceRef.get();
            const invoiceData = invoiceSnap.data() || {};
            await notifyBoarder({
              db,
              messaging: getMessaging(),
              invoiceRef,
              invoiceData,
              type: 'invoice_payment_succeeded',
              amountCents: pi.amount_received ?? pi.amount,
              currency: pi.currency || 'usd',
              receiptUrl,
            });
          } catch (e) {
            console.error('[webhook] Failed to notify boarder on success:', e);
          }

          break;
        }

        case 'payment_intent.payment_failed': {
          const pi = event.data.object;

          const invoiceId = pi.metadata?.invoiceId || pi.metadata?.invoice_id || null;
          const barnId = pi.metadata?.barnId || pi.metadata?.barn_id || null;

          // NEW: method details
          const method = await extractPaymentMethodDetails({
            stripe,
            paymentIntent: pi,
            stripeAccount: connectedAccountId || undefined,
          });

          const invoiceRef = await resolveInvoiceRef(db, {
            barnId,
            invoiceId,
            paymentIntentId: pi.id,
          });

          if (!invoiceRef) {
            console.error('[webhook] Invoice reference not found for failed PI:', pi.id);
            break;
          }

          const lastError = pi.last_payment_error?.message || 'Unknown error';

          await invoiceRef.set(
            {
              status: 'failed',
              stripe: {
                payment_intent_id: pi.id,
                last_error: lastError,
                connected_account_id: connectedAccountId || null,
                // NEW
                payment_method_type: method.payment_method_type,
                card_brand: method.card_brand,
                card_last4: method.card_last4,
                bank_last4: method.bank_last4,
              },
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log(`[webhook] Invoice marked as FAILED. invoice_path=${invoiceRef.path}`);

          // Notify failure
          try {
            const invoiceSnap = await invoiceRef.get();
            const invoiceData = invoiceSnap.data() || {};
            await notifyBoarder({
              db,
              messaging: getMessaging(),
              invoiceRef,
              invoiceData,
              type: 'invoice_payment_failed',
              amountCents: pi.amount ?? null,
              currency: pi.currency || 'usd',
              errorMessage: lastError,
            });
          } catch (e) {
            console.error('[webhook] Failed to notify boarder on failure:', e);
          }

          break;
        }

        case 'charge.succeeded': {
          // Optional: keep receipt_url fresh if you rely on charge events
          const charge = event.data.object;
          const invoiceId = charge.metadata?.invoiceId || charge.metadata?.invoice_id || null;
          const barnId = charge.metadata?.barnId || charge.metadata?.barn_id || null;

          const invoiceRef = await resolveInvoiceRef(db, {
            barnId,
            invoiceId,
            paymentIntentId: charge.payment_intent,
          });

          if (!invoiceRef) break;

          const pmd = charge?.payment_method_details || {};
          const type = pmd?.type || null;

          let card_brand = null;
          let card_last4 = null;
          let bank_last4 = null;

          if (type === 'card') {
            card_brand = pmd?.card?.brand || null;
            card_last4 = pmd?.card?.last4 || null;
          } else if (type === 'us_bank_account') {
            bank_last4 = pmd?.us_bank_account?.last4 || null;
          }

          await invoiceRef.set(
            {
              stripe: {
                receipt_url: charge.receipt_url || null,
                latest_charge_id: charge.id,
                connected_account_id: connectedAccountId || null,
                // NEW
                payment_method_type: type,
                card_brand,
                card_last4,
                bank_last4,
              },
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log(`[webhook] Stored receipt_url/method from charge. invoice_path=${invoiceRef.path}`);
          break;
        }

        default:
          // no-op for other event types
          break;
      }

      return res.status(200).send('[OK]');
    } catch (err) {
      console.error('Error handling Stripe webhook:', err);
      // 500 -> Stripe retries (idempotent)
      return res.status(500).send('Internal error');
    }
  }
);