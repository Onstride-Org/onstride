/**
 * Firebase Function to automatically assign a unique Stride Number
 * to newly created horses.
 *
 * Stride Number format: STR-YYYY-NNNNN
 * - STR: Fixed prefix
 * - YYYY: Year of creation
 * - NNNNN: 5-digit sequential number (per year)
 *
 * Example: STR-2025-00001
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

/**
 * Generates the next Stride number for the current year.
 * Uses a counter document to ensure uniqueness across concurrent writes.
 */
async function generateStrideNumber() {
  const year = new Date().getFullYear();
  const counterRef = db.collection('system').doc('stride_counter');

  // Use a transaction to safely increment the counter
  return db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    let currentYear = year;
    let nextNumber = 1;

    if (counterDoc.exists) {
      const data = counterDoc.data();
      if (data.year === year) {
        // Same year, increment the counter
        nextNumber = (data.lastNumber || 0) + 1;
      } else {
        // New year, reset counter
        nextNumber = 1;
      }
      currentYear = year;
    }

    // Update the counter
    transaction.set(counterRef, {
      year: currentYear,
      lastNumber: nextNumber,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Format the Stride number
    const paddedNumber = String(nextNumber).padStart(5, '0');
    return `STR-${currentYear}-${paddedNumber}`;
  });
}

/**
 * Triggered when a new horse document is created.
 * Assigns a unique Stride number if one doesn't already exist.
 */
exports.assignStrideNumber = onDocumentCreated(
  {
    document: 'horses/{horseId}',
    region: 'us-central1',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data in horse document');
      return null;
    }

    const horseData = snapshot.data();
    const horseId = event.params.horseId;

    // Skip if the horse already has a Stride number
    if (horseData.stride_number) {
      console.log(`Horse ${horseId} already has Stride number: ${horseData.stride_number}`);
      return null;
    }

    try {
      const strideNumber = await generateStrideNumber();

      // Update the horse document with the new Stride number
      await snapshot.ref.update({
        stride_number: strideNumber,
        stride_number_assigned_at: FieldValue.serverTimestamp(),
      });

      console.log(`Assigned Stride number ${strideNumber} to horse ${horseId}`);
      return { success: true, strideNumber };
    } catch (error) {
      console.error(`Error assigning Stride number to horse ${horseId}:`, error);
      throw error;
    }
  }
);

module.exports = exports.assignStrideNumber;
