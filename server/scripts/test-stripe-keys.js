/**
 * Test Stripe API keys
 * Usage: node scripts/test-stripe-keys.js
 */

require('dotenv').config();
const Stripe = require('stripe');

async function testStripeKeys() {
  console.log('=== Stripe Key Test ===\n');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  console.log('Secret Key:', secretKey ? `${secretKey.slice(0, 12)}...${secretKey.slice(-4)}` : 'NOT SET');
  console.log('Publishable Key:', publishableKey ? `${publishableKey.slice(0, 12)}...${publishableKey.slice(-4)}` : 'NOT SET');
  console.log('Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET');
  console.log('');

  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY is not set');
    process.exit(1);
  }

  if (!secretKey.startsWith('sk_')) {
    console.error('❌ STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
    console.error('   Current value starts with:', secretKey.slice(0, 10));
    process.exit(1);
  }

  if (!publishableKey) {
    console.error('❌ STRIPE_PUBLISHABLE_KEY is not set');
    process.exit(1);
  }

  if (!publishableKey.startsWith('pk_')) {
    console.error('❌ STRIPE_PUBLISHABLE_KEY should start with pk_test_ or pk_live_');
    console.error('   Current value starts with:', publishableKey.slice(0, 10));
    process.exit(1);
  }

  console.log('✅ Key formats look correct\n');
  console.log('Testing API connection...\n');

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

    // Try to list customers (limited to 1) as a simple API test
    const customers = await stripe.customers.list({ limit: 1 });

    console.log('✅ Stripe API connection successful!');
    console.log(`   Account has ${customers.data.length > 0 ? 'at least 1' : '0'} customers`);

    // Get account info
    const account = await stripe.accounts.retrieve();
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Account email: ${account.email || 'N/A'}`);

  } catch (error) {
    console.error('❌ Stripe API test failed:', error.message);

    if (error.message.includes('Invalid API Key')) {
      console.error('\n   The secret key is invalid. Please check:');
      console.error('   1. Copy the full key from Stripe Dashboard');
      console.error('   2. Make sure there are no extra spaces or line breaks');
      console.error('   3. Verify you\'re using the correct environment (live vs test)');
    }

    process.exit(1);
  }
}

testStripeKeys();
