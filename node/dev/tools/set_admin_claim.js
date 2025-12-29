// tools/set_admin_claim.js
// Run with: node tools/set_admin_claim.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../service_accounts/service_account_key.json');

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
});

async function setAdmin(uid) {
  try {
    await getAuth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Admin claim assigned to user: ${uid}`);
  } catch (error) {
    console.error('❌ Error assigning admin claim:', error);
  }
}

async function removeAdmin(uid) {
  try {
    await getAuth().setCustomUserClaims(uid, {}); // clears all custom claims
    console.log(`✅ Admin claim removed from user: ${uid}`);
  } catch (error) {
    console.error('❌ Error removing admin claim:', error);
  }
}

// Change these UIDs to your real ones
const adminsToAdd = [
  'IEQ9XBwumBe1GmOqHXzZ7P51SlH3',
  'InAWgH5ASAg4gBtAJOvQNqUZRi32',
];

const adminsToRemove = [
  // 'UID_3',
];

(async () => {
  for (const uid of adminsToAdd) {
    await setAdmin(uid);
  }

  for (const uid of adminsToRemove) {
    await removeAdmin(uid);
  }

  process.exit(0);
})();