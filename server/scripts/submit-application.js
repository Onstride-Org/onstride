/**
 * Submit the merchant application for a barn.
 * 
 * Usage: node scripts/submit-application.js [email]
 * Default email: achain123@gmail.com
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Load all models
require('../src/models/index');
const MerchantApplication = require('../src/models/MerchantApplication');
const User = require('../src/models/User');
const Barn = require('../src/models/Barn');

const email = process.argv[2] || 'achain123@gmail.com';

async function submitApplication() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }
    console.log(`User: ${user.name} <${user.email}>`);

    const barnId = user.barnId;
    if (!barnId) {
      console.error('User has no barnId');
      process.exit(1);
    }

    const barn = await Barn.findById(barnId);
    console.log(`Barn: ${barn?.name || barnId}`);

    const application = await MerchantApplication.findOne({ barnId })
      .select('+bankAccount.routingNumberEncrypted +bankAccount.accountNumberEncrypted +merchantInfo.einTinEncrypted');

    if (!application) {
      console.error('No merchant application found for this barn');
      process.exit(1);
    }

    console.log(`Application: ${application._id}`);
    console.log(`Current Status: ${application.status}`);
    console.log(`isComplete(): ${application.isComplete()}`);
    console.log();

    // Validate
    if (!application.isComplete()) {
      const missing = [];
      if (!application.merchantInfo?.legalName) missing.push('Legal Business Name');
      if (!application.merchantInfo?.businessType) missing.push('Business Type');
      if (!application.merchantInfo?.locationAddress?.street) missing.push('Business Street Address');
      if (!application.merchantInfo?.locationAddress?.city) missing.push('Business City');
      if (!application.merchantInfo?.locationAddress?.state) missing.push('Business State');
      if (!application.merchantInfo?.locationAddress?.zipCode) missing.push('Business ZIP Code');
      if (!application.controllingPerson?.firstName) missing.push('Controlling Person First Name');
      if (!application.controllingPerson?.lastName) missing.push('Controlling Person Last Name');
      if (!application.bankAccount?.bankName) missing.push('Bank Name');
      if (!application.bankAccount?.routingNumberEncrypted) missing.push('Bank Routing Number');
      if (!application.bankAccount?.accountNumberEncrypted) missing.push('Bank Account Number');
      if (!application.signatures?.merchantSignature) missing.push('Merchant Signature');
      if (!application.signatures?.termsAccepted) missing.push('Terms & Conditions Acceptance');
      console.error('❌ Application is incomplete. Missing:', missing.join(', '));
      process.exit(1);
    }

    if (!application.validateCardAcceptanceMethods()) {
      console.error('❌ Card acceptance methods must total 100%');
      process.exit(1);
    }

    if (!application.validateCustomerPercentages()) {
      console.error('❌ Customer percentages must total 100%');
      process.exit(1);
    }

    if (application.status === 'submitted') {
      console.log('⚠️  Application is already submitted.');
      console.log(`   Submitted At: ${application.submittedAt?.toISOString()}`);
      console.log('   No action needed.');
      process.exit(0);
    }

    if (application.status !== 'draft' && application.status !== 'requires_info') {
      console.error(`❌ Cannot submit application in status: ${application.status}`);
      process.exit(1);
    }

    // Submit
    application.status = 'submitted';
    application.submittedAt = new Date();
    application.currentStep = 8;
    application.completedSteps = [1, 2, 3, 4, 5, 6, 7, 8];
    application.addAuditLog('submitted', user._id, 'Application submitted for review via script', '127.0.0.1');
    await application.save();

    console.log('─'.repeat(50));
    console.log('✅ Application submitted successfully!');
    console.log('─'.repeat(50));
    console.log();
    console.log(`  Application ID:  ${application._id}`);
    console.log(`  Barn:            ${barn?.name || barnId}`);
    console.log(`  Legal Name:      ${application.merchantInfo?.legalName}`);
    console.log(`  Business Type:   ${application.merchantInfo?.businessType}`);
    console.log(`  Status:          ${application.status}`);
    console.log(`  Submitted At:    ${application.submittedAt.toISOString()}`);
    console.log(`  Address:         ${application.merchantInfo?.locationAddress?.street}, ${application.merchantInfo?.locationAddress?.city}, ${application.merchantInfo?.locationAddress?.state} ${application.merchantInfo?.locationAddress?.zipCode}`);
    console.log(`  Contact Email:   ${application.merchantInfo?.email}`);
    console.log(`  Contact Phone:   ${application.merchantInfo?.phone}`);
    console.log();
    console.log('  The application is now pending review.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

submitApplication();
