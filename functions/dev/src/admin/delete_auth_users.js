// functions/dev/index.js

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');

module.exports = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    // 1. Validate auth
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be authenticated to call this function.'
      );
    }

    // 2. Validate admin claim
    const isAdmin = request.auth.token?.admin === true;
    if (!isAdmin) {
      throw new HttpsError(
        'permission-denied',
        'Only administrators can delete users.'
      );
    }

    // 3. Read input
    const { uids } = request.data || {};

    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      throw new HttpsError(
        'invalid-argument',
        '"uids" must be a non-empty array of strings.'
      );
    }

    // Ensure all values are strings
    for (const uid of uids) {
      if (typeof uid !== 'string') {
        throw new HttpsError(
          'invalid-argument',
          'Every UID must be a string.'
        );
      }
    }

    const auth = getAuth();

    try {
      // deleteUsers supports up to 1000 at once
      const result = await auth.deleteUsers(uids);

      return {
        success: true,
        message: `Requested deletion for ${uids.length} users.`,
        successCount: result.successCount,
        failureCount: result.failureCount,
        failures: result.errors ?? [],
      };
    } catch (error) {
      console.error('Error deleting users:', error);
      throw new HttpsError(
        'internal',
        'Failed to delete users from Auth.',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);