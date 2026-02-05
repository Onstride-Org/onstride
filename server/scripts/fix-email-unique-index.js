/**
 * Migration script to fix indexes on the users collection
 *
 * This script:
 * 1. Drops the old unique index on email (which blocks re-registration after deletion)
 * 2. Drops any stale unique index on organizationId (removed from schema but index persists)
 * 3. Creates a new partial unique index that only enforces uniqueness for non-deleted users
 *
 * Run with: node scripts/fix-email-unique-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get current indexes
    const indexes = await usersCollection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(idx => {
      const partial = idx.partialFilterExpression ? ` (partial: ${JSON.stringify(idx.partialFilterExpression)})` : '';
      const unique = idx.unique ? ' [UNIQUE]' : '';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${unique}${partial}`);
    });

    // ========== Fix 1: Drop stale organizationId index ==========
    const orgIdIndex = indexes.find(idx =>
      idx.key &&
      idx.key.organizationId !== undefined &&
      idx.name !== '_id_'
    );

    if (orgIdIndex) {
      console.log(`\nDropping stale organizationId index: ${orgIdIndex.name}`);
      await usersCollection.dropIndex(orgIdIndex.name);
      console.log('✓ organizationId index dropped');
    } else {
      console.log('\n✓ No stale organizationId index found');
    }

    // ========== Fix 2: Fix email unique index ==========
    // Re-fetch indexes after potential drop
    const currentIndexes = await usersCollection.indexes();

    // Check for old email unique index (the simple one without partial filter)
    const oldEmailIndex = currentIndexes.find(idx =>
      idx.key &&
      idx.key.email === 1 &&
      Object.keys(idx.key).length === 1 &&
      idx.unique === true &&
      !idx.partialFilterExpression
    );

    if (oldEmailIndex) {
      console.log(`\nDropping old unique email index: ${oldEmailIndex.name}`);
      await usersCollection.dropIndex(oldEmailIndex.name);
      console.log('✓ Old email index dropped');
    } else {
      console.log('✓ Old unique email index not found (may have already been removed)');
    }

    // Check if new partial index already exists
    const newIndex = currentIndexes.find(idx =>
      idx.key &&
      idx.key.email === 1 &&
      idx.unique === true &&
      idx.partialFilterExpression &&
      idx.partialFilterExpression.deletedAt === null
    );

    if (newIndex) {
      console.log('✓ Partial unique email index already exists');
    } else {
      console.log('\nCreating new partial unique email index...');
      await usersCollection.createIndex(
        { email: 1 },
        {
          unique: true,
          partialFilterExpression: { deletedAt: null },
          name: 'email_unique_active_users'
        }
      );
      console.log('✓ New partial unique email index created');
    }

    // ========== Drop any other stale unique indexes on removed fields ==========
    const refreshedIndexes = await usersCollection.indexes();
    const knownFields = new Set([
      '_id', 'email', 'deletedAt', 'barnId',
      'createdAt', 'updatedAt', 'verificationToken',
      'emailVerificationToken', 'passwordResetToken'
    ]);

    for (const idx of refreshedIndexes) {
      if (idx.name === '_id_') continue;
      const fields = Object.keys(idx.key);
      const hasUnknownField = fields.some(f => !knownFields.has(f));
      if (hasUnknownField && idx.unique) {
        console.log(`\nWARNING: Found unique index on unknown field(s): ${idx.name} -> ${JSON.stringify(idx.key)}`);
        console.log('  Consider dropping this index if the field no longer exists in the schema.');
      }
    }

    // Verify final indexes
    const finalIndexes = await usersCollection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      const partial = idx.partialFilterExpression ? ` (partial: ${JSON.stringify(idx.partialFilterExpression)})` : '';
      const unique = idx.unique ? ' [UNIQUE]' : '';
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${unique}${partial}`);
    });

    console.log('\n✓ Migration complete!');
    console.log('  Users can now re-register with emails from deleted accounts.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixIndexes();
