const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const MerchantApplication = require('../src/models/MerchantApplication');
const { encrypt } = require('../src/utils/encryption');

async function populateTestApplication() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'achain123@gmail.com' });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    console.log('Found user:', user.name, '- ID:', user._id);

    const barnId = user.barnId;
    if (!barnId) {
      console.error('User has no barnId');
      process.exit(1);
    }
    console.log('Barn ID:', barnId);

    let application = await MerchantApplication.findOne({ barnId });
    if (!application) {
      console.log('Creating new application...');
      application = new MerchantApplication({
        barnId,
        userId: user._id,
        status: 'draft'
      });
    }
    console.log('Application ID:', application._id, 'Status:', application.status);

    // Populate all test data
    application.merchantInfo = {
      legalName: 'Sunny Meadows Equestrian LLC',
      tradingName: 'Sunny Meadows Stables',
      businessType: 'llc',
      locationAddress: {
        street: '1234 Horse Trail Lane',
        city: 'Wellington',
        state: 'FL',
        zipCode: '33414'
      },
      postalAddress: {
        street: '1234 Horse Trail Lane',
        city: 'Wellington',
        state: 'FL',
        zipCode: '33414'
      },
      postalSameAsLocation: true,
      email: 'billing@sunnymeadowsstables.com',
      phone: '(561) 555-0123',
      website: 'https://sunnymeadowsstables.com',
      einTinEncrypted: encrypt('123456789')
    };

    application.businessDescription = {
      description: 'Full-service equestrian facility offering horse boarding, training, riding lessons, and competition preparation services.',
      natureOfBusiness: 'arts_recreation',
      legalActionByRegulator: false,
      finedByCardNetwork: false
    };

    application.transactionDetails = {
      averageTicket: 750,
      highTicket: 5000,
      monthlyCardVolume: 25000,
      hasFutureDatedEvents: true
    };

    application.cardAcceptanceMethods = {
      swipeContactlessInserted: 0,
      mailOrderTelephoneOrder: 0,
      ecommerce: 100,
      subscriptionRecurring: 0,
      posSystem: 'OnStride'
    };

    application.additionalQuestionnaire = {
      businessConsumersPercent: 5,
      individualCustomersPercent: 95,
      ownsProductInventory: false,
      productStoredAtLocation: true,
      whoEntersCardInfo: 'consumer',
      whoShipsProduct: 'na',
      daysUntilShipAfterAuth: 0
    };

    application.controllingPerson = {
      firstName: 'Adam',
      lastName: 'Chain',
      title: 'Owner',
      percentOwnership: 100,
      homePhone: '(561) 555-0199',
      email: 'achain123@gmail.com',
      dateOfBirth: new Date('1985-06-15'),
      ssnEncrypted: encrypt('123456789'),
      driversLicense: {
        numberEncrypted: encrypt('C123456789'),
        state: 'FL'
      },
      homeAddress: {
        street: '5678 Palm Beach Blvd',
        city: 'West Palm Beach',
        state: 'FL',
        zipCode: '33401'
      }
    };

    application.beneficialOwners = [];

    application.bankAccount = {
      accountType: 'checking',
      bankName: 'Chase Bank',
      routingNumberEncrypted: encrypt('021000021'),
      accountNumberEncrypted: encrypt('123456789012'),
      bankContactName: 'John Smith',
      bankContactPhone: '(800) 555-1234'
    };

    application.documents = {
      processingStatements: [],
      proofOfAddress: '/uploads/merchant-docs/test-proof-of-address.pdf',
      incorporationCert: '/uploads/merchant-docs/test-incorporation.pdf',
      voidedCheck: '/uploads/merchant-docs/test-voided-check.pdf',
      ownerIds: ['/uploads/merchant-docs/test-owner-id.pdf']
    };

    application.signatures = {
      merchantSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ3AAAAABHNCSVQICAgIfAhkiAAAAF96VFh0UmF3IHByb2ZpbGUgdHlwZSBBUFAxAABo3uNKT0ktTtYtSC1KTi7WLShKLS5RCM8vyklRBABNhga5DYaLfQAAAIppVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+Ss1HNAAAAGZJREFUeJztwTEBAAAAwqD1T20MH6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABuBsW4AAFqr1ckAAAAAElFTkSuQmCC',
      merchantPrintedName: 'Adam Chain',
      merchantSignatureDate: new Date(),
      merchantSignatureIp: '127.0.0.1',
      termsAccepted: true,
      termsAcceptedDate: new Date()
    };

    application.currentStep = 8;
    application.completedSteps = [1, 2, 3, 4, 5, 6, 7, 8];

    application.addAuditLog('test_data_populated', user._id, 'Test data populated via script', '127.0.0.1');

    await application.save();

    console.log('\n✅ Application populated successfully!');
    
    // Verify
    const verify = await MerchantApplication.findById(application._id)
      .select('+bankAccount.routingNumberEncrypted +bankAccount.accountNumberEncrypted +merchantInfo.einTinEncrypted');
    
    console.log('\nVerification:');
    console.log('- Legal Name:', verify.merchantInfo?.legalName);
    console.log('- Business Type:', verify.merchantInfo?.businessType);
    console.log('- Bank Name:', verify.bankAccount?.bankName);
    console.log('- Has Routing #:', !!verify.bankAccount?.routingNumberEncrypted);
    console.log('- Has Account #:', !!verify.bankAccount?.accountNumberEncrypted);
    console.log('- Has EIN:', !!verify.merchantInfo?.einTinEncrypted);
    console.log('- Has Signature:', !!verify.signatures?.merchantSignature);
    console.log('- Terms Accepted:', verify.signatures?.termsAccepted);
    console.log('- isComplete():', verify.isComplete());
    
    console.log('\n🎉 You can now submit the application!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

populateTestApplication();
