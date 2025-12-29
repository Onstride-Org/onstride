const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');

// Hard-coded list of super admins allowed to manage roles
const SUPER_ADMIN_UIDS = [
  'SUPER_ADMIN_UID_1',
];

exports.setAdminClaim = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be authenticated to call this function.'
      );
    }

    // Only allow super admins to manage admin claims
    if (!SUPER_ADMIN_UIDS.includes(request.auth.uid)) {
      throw new HttpsError(
        'permission-denied',
        'Only super admins can manage admin claims.'
      );
    }

    const { uid, isAdmin } = request.data || {};

    if (!uid || typeof uid !== 'string') {
      throw new HttpsError('invalid-argument', 'Missing or invalid "uid"');
    }

    if (typeof isAdmin !== 'boolean') {
      throw new HttpsError(
        'invalid-argument',
        '"isAdmin" must be a boolean (true/false)'
      );
    }

    try {
      const claims = isAdmin ? { admin: true } : {};
      await getAuth().setCustomUserClaims(uid, claims);

      return {
        success: true,
        message: `User ${uid} is now admin = ${isAdmin}`,
      };
    } catch (error) {
      console.error(error);
      throw new HttpsError('internal', 'Failed to update admin claim');
    }
  }
);