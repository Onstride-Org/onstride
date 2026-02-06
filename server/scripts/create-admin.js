/**
 * Script to create initial admin user
 *
 * Run with: node scripts/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const ADMIN_EMAIL = 'admin@onstrideapp.com';
const ADMIN_PASSWORD = 'Galadmin0118';
const ADMIN_NAME = 'Gal';

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if user already exists
    let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (user) {
      // Update existing user to admin
      user.accountType = 'admin';
      user.password = ADMIN_PASSWORD;
      user.permissions = ['userManagement', 'horseManagement', 'barnManagement', 'generateInvoices'];
      user.emailVerified = true;
      user.finishedRegistration = true;
      await user.save();
      console.log(`Updated existing user ${ADMIN_EMAIL} to admin`);
    } else {
      // Create new admin user
      user = await User.create({
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
        accountType: 'admin',
        permissions: ['userManagement', 'horseManagement', 'barnManagement', 'generateInvoices'],
        emailVerified: true,
        finishedRegistration: true,
        registrationMethod: 'email'
      });
      console.log(`Created new admin user: ${ADMIN_EMAIL}`);
    }

    console.log('\n✓ Admin user ready!');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Access: /admin`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createAdmin();
