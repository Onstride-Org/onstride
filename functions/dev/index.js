const { initializeApp } = require('firebase-admin/app');

initializeApp();

//--------------------------------------------------------------------------------------
// ADMIN FUNCTIONS
//--------------------------------------------------------------------------------------
exports.deleteAuthUsers = require("./src/admin/delete_auth_users");
//--------------------------------------------------------------------------------------
// PAYMENTS FUNCTIONS
//--------------------------------------------------------------------------------------
exports.createCardPaymentIntent = require("./src/payments/create_card_payment_intent");
exports.createAchPaymentIntent = require("./src/payments/create_ach_payment_intent");
exports.createCardPaymentIntent = require("./src/payments/create_card_payment_intent");
exports.createPaymentIntent = require("./src/payments/create_payment_intent");
exports.getReceiptUrl = require("./src/payments/get_receipt_url");
exports.stripeWebhook = require("./src/payments/stripe_webhook");
//--------------------------------------------------------------------------------------
// NOTIFICATIONS FUNCTIONS
//--------------------------------------------------------------------------------------
exports.sendTaskReminders = require("./src/notifications/send_task_reminders");
//--------------------------------------------------------------------------------------
// EMAIL FUNCTIONS
//--------------------------------------------------------------------------------------
exports.sendWelcomeEmail = require("./src/emails/send_welcome_email");
