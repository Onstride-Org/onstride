/**
 * Test Windcave Merchant Application
 *
 * Tests:
 * 1. MongoDB connection & merchant application lookup
 * 2. Global Windcave credentials (env vars)
 * 3. Per-barn Windcave credentials (from MerchantApplication)
 * 4. Create a test payment session via Windcave API
 * 5. Query the session status
 * 6. Fee calculation sanity check
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Load all models so populate() works
require('../src/models/index');
const MerchantApplication = require('../src/models/MerchantApplication');
const windcaveService = require('../src/services/windcave');
const { encrypt, decrypt } = require('../src/utils/encryption');

const DIVIDER = '─'.repeat(60);

function log(label, value) {
  console.log(`  ${label.padEnd(30)} ${value}`);
}

function header(title) {
  console.log(`\n${DIVIDER}`);
  console.log(`  ${title}`);
  console.log(DIVIDER);
}

async function testWindcaveMerchant() {
  let exitCode = 0;

  try {
    // ── 1. Connect to MongoDB ──────────────────────────────────
    header('1. MongoDB Connection');
    await mongoose.connect(process.env.MONGODB_URI);
    log('Status:', '✅ Connected');
    log('Database:', mongoose.connection.db.databaseName);

    // ── 2. Check Global Windcave Credentials ───────────────────
    header('2. Global Windcave Credentials (env)');
    const apiUrl = process.env.WINDCAVE_API_URL || '(not set)';
    const apiUser = process.env.WINDCAVE_API_USER || '(not set)';
    const apiKey = process.env.WINDCAVE_API_KEY ? '****' + process.env.WINDCAVE_API_KEY.slice(-8) : '(not set)';
    log('WINDCAVE_API_URL:', apiUrl);
    log('WINDCAVE_API_USER:', apiUser);
    log('WINDCAVE_API_KEY:', apiKey);
    log('isConfigured():', windcaveService.isConfigured() ? '✅ Yes' : '❌ No');

    // ── 3. Look up Merchant Applications ───────────────────────
    header('3. Merchant Applications in DB');
    const applications = await MerchantApplication.find({})
      .select('+windcaveCredentials.apiKeyEncrypted +windcaveCredentials.apiSecretEncrypted')
      .populate('barnId', 'name')
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 });

    if (applications.length === 0) {
      log('Applications found:', '0 — No merchant applications exist');
    } else {
      log('Applications found:', applications.length.toString());
      console.log();

      for (const app of applications) {
        console.log(`  📋 Application: ${app._id}`);
        log('  Barn:', app.barnId?.name || app.barnId || '(unknown)');
        log('  User:', `${app.userId?.name || '?'} <${app.userId?.email || '?'}>`);
        log('  Status:', app.status);
        log('  Created:', app.createdAt?.toISOString() || '?');
        log('  isComplete():', app.isComplete() ? '✅ Yes' : '❌ No');

        if (app.windcaveCredentials?.merchantId) {
          log('  Merchant ID:', app.windcaveCredentials.merchantId);
          log('  Has API Key:', app.windcaveCredentials.apiKeyEncrypted ? '✅ Yes' : '❌ No');
          log('  Has API Secret:', app.windcaveCredentials.apiSecretEncrypted ? '✅ Yes' : '❌ No');
          log('  isActive:', app.windcaveCredentials.isActive ? '✅ Yes' : '❌ No');

          if (app.windcaveCredentials.testResult) {
            log('  Last Test:', app.windcaveCredentials.testResult.success ? '✅ Passed' : '❌ Failed');
            log('  Test Message:', app.windcaveCredentials.testResult.message || '(none)');
            log('  Tested At:', app.windcaveCredentials.testResult.testedAt?.toISOString() || '?');
          }
        } else {
          log('  Windcave Credentials:', '(none configured)');
        }
        console.log();
      }
    }

    // ── 4. Test Global Credentials - Create Session ────────────
    header('4. Test Windcave API - Create Payment Session');

    if (!windcaveService.isConfigured()) {
      console.log('  ⚠️  Skipping — Global credentials not configured');
    } else {
      try {
        const testRef = `TEST-${Date.now()}`;
        console.log(`  Creating test session (merchantReference: ${testRef})...`);

        const testBillingAddress = {
          street: '1234 Horse Trail Lane',
          city: 'Wellington',
          state: 'FL',
          zipCode: '33414',
          country: 'US',
        };

        const session = await windcaveService.createPaymentSession({
          invoiceId: 'test-invoice-001',
          amount: 1.00,
          currency: 'USD',
          merchantReference: testRef,
          customerEmail: 'test@example.com',
          customerName: 'Test Customer',
          returnUrl: 'https://example.com/return',
          callbackUrl: 'https://example.com/callback',
          billingAddress: testBillingAddress,
        });

        log('Billing Address:', `${testBillingAddress.street}, ${testBillingAddress.city}, ${testBillingAddress.state} ${testBillingAddress.zipCode}`);

        log('Result:', '✅ Session created');
        log('Session ID:', session.sessionId);
        log('State:', session.state);
        log('Redirect URL:', session.redirectUrl ? session.redirectUrl.substring(0, 60) + '...' : '(none)');
        log('Expires At:', session.expiresAt || '(unknown)');

        // ── 5. Query the session ─────────────────────────────────
        header('5. Query Session Status');
        try {
          const status = await windcaveService.getSession(session.sessionId);
          log('Session ID:', status.sessionId);
          log('State:', status.state);
          log('Amount:', `$${status.amount} ${status.currency}`);
          log('Merchant Ref:', status.merchantReference);
          log('Transaction:', status.transaction ? JSON.stringify(status.transaction) : '(none yet — expected for new session)');
          log('Result:', '✅ Session queried successfully');
        } catch (err) {
          log('Result:', '❌ Failed to query session');
          log('Error:', err.message);
          exitCode = 1;
        }
      } catch (err) {
        log('Result:', '❌ Failed to create session');
        log('Error:', err.message);
        exitCode = 1;
      }
    }

    // ── 6. Test Per-Barn Credentials (if any) ──────────────────
    header('6. Test Per-Barn Credentials');
    const activeApps = applications.filter(
      a => a.windcaveCredentials?.apiKeyEncrypted && a.windcaveCredentials?.apiSecretEncrypted
    );

    if (activeApps.length === 0) {
      console.log('  ⚠️  No applications with Windcave credentials found. Skipping.');
    } else {
      for (const app of activeApps) {
        const barnName = app.barnId?.name || app.barnId;
        console.log(`\n  Testing credentials for barn: ${barnName}`);

        try {
          const creds = app.getWindcaveCredentials();
          log('  Merchant ID:', creds.merchantId);
          log('  API Key:', '****' + creds.apiKey?.slice(-6));

          const testRef = `BARN-TEST-${Date.now()}`;
          const session = await windcaveService.createPaymentSession({
            invoiceId: 'barn-test-001',
            amount: 1.00,
            currency: 'USD',
            merchantReference: testRef,
            customerEmail: 'barntest@example.com',
            customerName: 'Barn Test',
            returnUrl: 'https://example.com/return',
            callbackUrl: 'https://example.com/callback',
            credentials: {
              apiKey: creds.apiKey,
              apiSecret: creds.apiSecret,
            },
            billingAddress: {
              street: '1234 Horse Trail Lane',
              city: 'Wellington',
              state: 'FL',
              zipCode: '33414',
              country: 'US',
            },
          });

          log('  Result:', '✅ Session created with barn credentials');
          log('  Session ID:', session.sessionId);
        } catch (err) {
          log('  Result:', '❌ Failed with barn credentials');
          log('  Error:', err.message);
          exitCode = 1;
        }
      }
    }

    // ── 7. Submit a Test Application (full lifecycle) ─────────
    header('7. Submit Test Application (full lifecycle)');
    const testBarnId = new mongoose.Types.ObjectId();
    const testUserId = new mongoose.Types.ObjectId();
    let testApp = null;

    try {
      // 7a. Create a complete application
      console.log('  7a. Creating test application...');
      testApp = new MerchantApplication({
        barnId: testBarnId,
        userId: testUserId,
        status: 'draft',
        currentStep: 1,
        completedSteps: [],

        merchantInfo: {
          legalName: 'Test Equestrian Center LLC',
          tradingName: 'Test Stables',
          businessType: 'llc',
          locationAddress: {
            street: '100 Test Horse Lane',
            city: 'Wellington',
            state: 'FL',
            zipCode: '33414'
          },
          postalAddress: {
            street: '100 Test Horse Lane',
            city: 'Wellington',
            state: 'FL',
            zipCode: '33414'
          },
          postalSameAsLocation: true,
          email: 'test@teststables.com',
          phone: '(555) 000-1234',
          website: 'https://teststables.example.com',
          einTinEncrypted: encrypt('987654321')
        },

        businessDescription: {
          description: 'Full-service equestrian facility for automated testing.',
          natureOfBusiness: 'arts_recreation',
          legalActionByRegulator: false,
          finedByCardNetwork: false
        },

        transactionDetails: {
          averageTicket: 600,
          highTicket: 4000,
          monthlyCardVolume: 20000,
          hasFutureDatedEvents: true
        },

        cardAcceptanceMethods: {
          swipeContactlessInserted: 0,
          mailOrderTelephoneOrder: 0,
          ecommerce: 100,
          subscriptionRecurring: 0,
          posSystem: 'OnStride'
        },

        additionalQuestionnaire: {
          businessConsumersPercent: 10,
          individualCustomersPercent: 90,
          ownsProductInventory: false,
          productStoredAtLocation: true,
          whoEntersCardInfo: 'consumer',
          whoShipsProduct: 'na',
          daysUntilShipAfterAuth: 0
        },

        controllingPerson: {
          firstName: 'Test',
          lastName: 'Owner',
          title: 'Owner',
          percentOwnership: 100,
          homePhone: '(555) 000-5678',
          email: 'testowner@teststables.com',
          dateOfBirth: new Date('1990-01-15'),
          ssnEncrypted: encrypt('111223333'),
          driversLicense: {
            numberEncrypted: encrypt('T000111222'),
            state: 'FL'
          },
          homeAddress: {
            street: '200 Test Blvd',
            city: 'West Palm Beach',
            state: 'FL',
            zipCode: '33401'
          }
        },

        beneficialOwners: [],

        bankAccount: {
          accountType: 'checking',
          bankName: 'Test Bank',
          routingNumberEncrypted: encrypt('021000021'),
          accountNumberEncrypted: encrypt('000111222333'),
          bankContactName: 'Test Banker',
          bankContactPhone: '(555) 000-9999'
        },

        documents: {
          processingStatements: [],
          proofOfAddress: '/uploads/merchant-docs/test-proof.pdf',
          incorporationCert: '/uploads/merchant-docs/test-cert.pdf',
          voidedCheck: '/uploads/merchant-docs/test-check.pdf',
          ownerIds: ['/uploads/merchant-docs/test-id.pdf']
        },

        signatures: {
          merchantSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          merchantPrintedName: 'Test Owner',
          merchantSignatureDate: new Date(),
          merchantSignatureIp: '127.0.0.1',
          termsAccepted: true,
          termsAcceptedDate: new Date()
        }
      });

      testApp.addAuditLog('created', testUserId, 'Test application created by script', '127.0.0.1');
      await testApp.save();
      log('Application ID:', testApp._id.toString());
      log('Barn ID (test):', testBarnId.toString());
      log('Status:', testApp.status);
      log('Result:', '✅ Application created');

      // 7b. Validate completeness
      console.log('\n  7b. Validating application completeness...');

      // Re-fetch with encrypted fields to validate isComplete()
      const fetched = await MerchantApplication.findById(testApp._id)
        .select('+bankAccount.routingNumberEncrypted +bankAccount.accountNumberEncrypted +merchantInfo.einTinEncrypted');

      const complete = fetched.isComplete();
      const cardMethodsValid = fetched.validateCardAcceptanceMethods();
      const custPctValid = fetched.validateCustomerPercentages();

      log('isComplete():', complete ? '✅ Yes' : '❌ No');
      log('Card methods = 100%:', cardMethodsValid ? '✅ Yes' : '❌ No');
      log('Customer pct = 100%:', custPctValid ? '✅ Yes' : '❌ No');

      // Detail check
      const checks = {
        'Legal Name': !!fetched.merchantInfo?.legalName,
        'Business Type': !!fetched.merchantInfo?.businessType,
        'Location Address': !!(fetched.merchantInfo?.locationAddress?.street &&
                               fetched.merchantInfo?.locationAddress?.city &&
                               fetched.merchantInfo?.locationAddress?.state &&
                               fetched.merchantInfo?.locationAddress?.zipCode),
        'Controlling Person': !!(fetched.controllingPerson?.firstName && fetched.controllingPerson?.lastName),
        'Bank Account': !!(fetched.bankAccount?.bankName &&
                           fetched.bankAccount?.routingNumberEncrypted &&
                           fetched.bankAccount?.accountNumberEncrypted),
        'Signature': !!fetched.signatures?.merchantSignature,
        'Terms Accepted': fetched.signatures?.termsAccepted === true,
      };

      for (const [field, ok] of Object.entries(checks)) {
        log(`  ${field}:`, ok ? '✅' : '❌ MISSING');
      }

      if (!complete || !cardMethodsValid || !custPctValid) {
        console.log('\n  ❌ Application failed validation — cannot submit');
        exitCode = 1;
      } else {
        // 7c. Submit the application
        console.log('\n  7c. Submitting application...');
        fetched.status = 'submitted';
        fetched.submittedAt = new Date();
        fetched.addAuditLog('submitted', testUserId, 'Submitted via test script', '127.0.0.1');
        await fetched.save();

        log('Status:', fetched.status);
        log('Submitted At:', fetched.submittedAt.toISOString());
        log('Result:', '✅ Application submitted');

        // 7d. Verify by re-fetching
        console.log('\n  7d. Verifying submission...');
        const verified = await MerchantApplication.findById(testApp._id);
        log('Status:', verified.status);
        log('Submitted At:', verified.submittedAt?.toISOString() || '(missing)');
        log('Audit Log Count:', verified.auditLog.length.toString());

        const submitLog = verified.auditLog.find(l => l.action === 'submitted');
        log('Submit Audit Entry:', submitLog ? `✅ "${submitLog.details}"` : '❌ Not found');

        if (verified.status === 'submitted' && verified.submittedAt && submitLog) {
          log('Result:', '✅ Submission verified');
        } else {
          log('Result:', '❌ Verification failed');
          exitCode = 1;
        }

        // 7e. Test status transitions (simulate admin review flow)
        console.log('\n  7e. Testing admin status transitions...');

        // under_review
        verified.status = 'under_review';
        verified.addAuditLog('status_changed_to_under_review', testUserId, 'Admin reviewing', '127.0.0.1');
        await verified.save();
        log('→ under_review:', verified.status === 'under_review' ? '✅' : '❌');

        // requires_info
        verified.status = 'requires_info';
        verified.additionalInfoRequested = 'Please provide updated bank statement.';
        verified.addAuditLog('status_changed_to_requires_info', testUserId, 'Needs more info', '127.0.0.1');
        await verified.save();
        log('→ requires_info:', verified.status === 'requires_info' ? '✅' : '❌');

        // back to submitted
        verified.status = 'submitted';
        verified.submittedAt = new Date();
        verified.addAuditLog('resubmitted', testUserId, 'Resubmitted after providing info', '127.0.0.1');
        await verified.save();
        log('→ resubmitted:', verified.status === 'submitted' ? '✅' : '❌');

        // approved
        verified.status = 'approved';
        verified.approvedAt = new Date();
        verified.addAuditLog('status_changed_to_approved', testUserId, 'Application approved', '127.0.0.1');
        await verified.save();
        log('→ approved:', verified.status === 'approved' ? '✅' : '❌');
        log('Approved At:', verified.approvedAt.toISOString());
        log('Total Audit Entries:', verified.auditLog.length.toString());
        log('Result:', '✅ Status transitions verified');
      }
    } catch (err) {
      console.error(`\n  ❌ Test application error: ${err.message}`);
      if (err.stack) console.error('  ' + err.stack.split('\n').slice(1, 3).join('\n  '));
      exitCode = 1;
    } finally {
      // 7f. Cleanup - remove test application
      if (testApp) {
        console.log('\n  7f. Cleaning up test application...');
        await MerchantApplication.deleteOne({ _id: testApp._id });
        const gone = await MerchantApplication.findById(testApp._id);
        log('Cleanup:', gone ? '❌ Still exists' : '✅ Deleted');
      }
    }

    // ── 8. Fee Calculation Test ────────────────────────────────
    header('8. Fee Calculation Sanity Check');
    const testAmounts = [100, 500, 1250.50, 5000];
    const methods = ['credit', 'debit'];

    for (const method of methods) {
      console.log(`\n  Method: ${method}`);
      for (const amount of testAmounts) {
        const fees = windcaveService.calculateFees(amount, method);
        console.log(
          `    $${amount.toFixed(2).padStart(10)} → ` +
          `processing: $${fees.processingFee.toFixed(2).padStart(7)} | ` +
          `platform: $${fees.platformFee.toFixed(2).padStart(7)} | ` +
          `total: $${fees.total.toFixed(2).padStart(10)}`
        );
      }
    }
    log('\nResult:', '✅ Fee calculations completed');

    // ── Summary ────────────────────────────────────────────────
    header('Summary');
    log('MongoDB:', '✅ Connected');
    log('Global Credentials:', windcaveService.isConfigured() ? '✅ Configured' : '❌ Not configured');
    log('Existing Applications:', applications.length.toString());
    log('Apps w/ Credentials:', activeApps.length.toString());
    log('Test Submit Lifecycle:', exitCode === 0 ? '✅ Passed' : '❌ Failed');

    if (exitCode === 0) {
      console.log('\n  🎉 All tests passed!\n');
    } else {
      console.log('\n  ⚠️  Some tests failed. See details above.\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit(exitCode);
  }
}

testWindcaveMerchant();
