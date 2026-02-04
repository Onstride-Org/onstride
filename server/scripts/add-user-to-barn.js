/**
 * Add a user to your barn.
 *
 * Usage: node scripts/add-user-to-barn.js
 *
 * Config: Edit OWNER_EMAIL (your email) and USER_TO_ADD (email to add to your barn).
 * Optional: USER_ROLE (default: boarder), USER_PASSWORD (only used if user is created).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Barn = require('../src/models/Barn');
const UserBarnRole = require('../src/models/UserBarnRole');

const OWNER_EMAIL = 'hello@recordedmail.com';
const USER_TO_ADD = 'user@test.com';
const USER_ROLE = 'boarder'; // owner | admin | manager | groomer | boarder | trainer | vendor
const USER_PASSWORD = 'test1234'; // only used if user@test.com does not exist yet

async function addUserToBarn() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const ownerEmail = OWNER_EMAIL.toLowerCase().trim();
    const userEmail = USER_TO_ADD.toLowerCase().trim();

    // 1. Find you (owner) by email
    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      console.error(`Owner not found: ${OWNER_EMAIL}`);
      process.exit(1);
    }
    console.log(`Found owner: ${owner.email} (${owner.name})`);

    // 2. Find your barn (where you have role 'owner')
    const ownerRole = await UserBarnRole.findOne({
      userId: owner._id,
      role: 'owner',
      status: 'active',
    }).populate('barnId');

    if (!ownerRole?.barnId) {
      console.error(`No barn found for owner ${OWNER_EMAIL}. Create a barn first.`);
      process.exit(1);
    }

    const barn = ownerRole.barnId;
    console.log(`Found barn: ${barn.name} (${barn._id})\n`);

    // 3. Find or create the user to add
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await User.create({
        email: userEmail,
        password: USER_PASSWORD,
        name: userEmail.split('@')[0],
        accountType: USER_ROLE,
        emailVerified: true,
        finishedRegistration: true,
        registrationMethod: 'email',
      });
      console.log(`Created user: ${user.email}`);
    } else {
      console.log(`Found existing user: ${user.email}`);
    }

    // 4. Add user to barn (skip if already a member)
    const existing = await UserBarnRole.findOne({
      userId: user._id,
      barnId: barn._id,
    });

    if (existing) {
      if (existing.status === 'active') {
        console.log(`User ${userEmail} is already in barn "${barn.name}" (role: ${existing.role}).`);
      } else {
        existing.status = 'active';
        existing.role = USER_ROLE;
        await existing.save();
        console.log(`Re-activated and set role to ${USER_ROLE} for ${userEmail} in barn "${barn.name}".`);
      }
    } else {
      await UserBarnRole.create({
        userId: user._id,
        barnId: barn._id,
        role: USER_ROLE,
        status: 'active',
        invitedBy: owner._id,
        barnName: barn.name,
        userName: user.name,
      });
      console.log(`Added ${userEmail} to barn "${barn.name}" with role: ${USER_ROLE}.`);
    }

    console.log('\nDone.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

addUserToBarn();
