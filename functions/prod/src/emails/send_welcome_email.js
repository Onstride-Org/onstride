const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getApps, initializeApp } = require('firebase-admin/app');

if (getApps().length === 0) initializeApp();

/**
 * Cloud Function triggered when a new user document is created.
 * Sends a welcome email to the user and updates the document with send status.
 *
 * Email sending is configured to use environment variables:
 * - SENDGRID_API_KEY: API key for SendGrid
 * - WELCOME_EMAIL_FROM: From email address
 *
 * For now, this function logs the welcome email intent and updates the user
 * document. Actual email sending can be enabled by uncommenting the SendGrid
 * integration below.
 */
module.exports = onDocumentCreated(
  {
    document: 'users/{userId}',
    region: 'us-central1',
  },
  async (event) => {
    const db = getFirestore();
    const snapshot = event.data;

    if (!snapshot) {
      console.log('[welcome-email] No data in document');
      return null;
    }

    const userData = snapshot.data();
    const userId = event.params.userId;

    // Skip if already sent or user has no email
    if (userData.welcome_email_sent === true) {
      console.log(`[welcome-email] Already sent for user ${userId}`);
      return null;
    }

    if (!userData.email) {
      console.log(`[welcome-email] No email for user ${userId}`);
      return null;
    }

    const userEmail = userData.email;
    const userName = userData.name || 'there';
    const accountType = userData.account_type || 'user';

    console.log(`[welcome-email] Sending welcome email to ${userEmail} (${userId})`);

    try {
      // Prepare welcome email content
      const subject = 'Welcome to OnStride!';
      const htmlContent = generateWelcomeEmailHtml(userName, accountType);
      const textContent = generateWelcomeEmailText(userName, accountType);

      // TODO: Uncomment to enable actual email sending via SendGrid
      // Requires: npm install @sendgrid/mail
      // And setting SENDGRID_API_KEY in Firebase environment config
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: userEmail,
        from: process.env.WELCOME_EMAIL_FROM || 'noreply@onstride.app',
        subject: subject,
        text: textContent,
        html: htmlContent,
      };

      await sgMail.send(msg);
      */

      // For now, just log that we would send the email
      console.log(`[welcome-email] Would send email to ${userEmail}:`);
      console.log(`[welcome-email] Subject: ${subject}`);
      console.log(`[welcome-email] Email prepared successfully`);

      // Update user document to mark email as sent
      await db.collection('users').doc(userId).update({
        welcome_email_sent: true,
        welcome_email_sent_at: FieldValue.serverTimestamp(),
      });

      console.log(`[welcome-email] Successfully marked email as sent for user ${userId}`);
      return null;

    } catch (error) {
      console.error(`[welcome-email] Error sending email to ${userEmail}:`, error);

      // Update user document with error info
      await db.collection('users').doc(userId).update({
        welcome_email_error: String(error?.message || error),
        welcome_email_error_at: FieldValue.serverTimestamp(),
      });

      return null;
    }
  }
);

/**
 * Generate HTML content for welcome email
 */
function generateWelcomeEmailHtml(userName, accountType) {
  const roleSpecificContent = getRoleSpecificContent(accountType);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OnStride</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 10px 0; padding-left: 25px; position: relative; }
    .feature-list li:before { content: "✓"; position: absolute; left: 0; color: #1a365d; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to OnStride!</h1>
    </div>
    <div class="content">
      <h2>Hi ${userName}!</h2>
      <p>We're thrilled to have you join the OnStride community. Your account has been successfully created and you're ready to get started.</p>

      ${roleSpecificContent}

      <h3>Getting Started</h3>
      <ul class="feature-list">
        <li>Download the OnStride app on iOS or Android</li>
        <li>Log in with your email and password</li>
        <li>Explore your dashboard and set up your profile</li>
        <li>Connect with your barn or clients</li>
      </ul>

      <p>If you have any questions, don't hesitate to reach out to our support team.</p>

      <p>Happy riding!</p>
      <p><strong>The OnStride Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} OnStride. All rights reserved.</p>
      <p>You're receiving this email because you created an OnStride account.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text content for welcome email
 */
function generateWelcomeEmailText(userName, accountType) {
  const roleSpecificContent = getRoleSpecificContentText(accountType);

  return `
Welcome to OnStride!

Hi ${userName}!

We're thrilled to have you join the OnStride community. Your account has been successfully created and you're ready to get started.

${roleSpecificContent}

GETTING STARTED:
• Download the OnStride app on iOS or Android
• Log in with your email and password
• Explore your dashboard and set up your profile
• Connect with your barn or clients

If you have any questions, don't hesitate to reach out to our support team.

Happy riding!
The OnStride Team

---
© ${new Date().getFullYear()} OnStride. All rights reserved.
You're receiving this email because you created an OnStride account.
  `.trim();
}

/**
 * Get role-specific content for HTML email
 */
function getRoleSpecificContent(accountType) {
  switch (accountType) {
    case 'owner':
      return `
        <h3>As a Barn Owner, you can:</h3>
        <ul class="feature-list">
          <li>Manage your horses and stalls</li>
          <li>Create and assign tasks to your team</li>
          <li>Track lessons and schedules</li>
          <li>Generate invoices for your clients</li>
          <li>Invite team members and boarders</li>
        </ul>
      `;
    case 'manager':
      return `
        <h3>As a Manager, you can:</h3>
        <ul class="feature-list">
          <li>Help manage horses and daily operations</li>
          <li>Create and complete tasks</li>
          <li>Coordinate with the barn owner and team</li>
        </ul>
      `;
    case 'groomer':
      return `
        <h3>As a Team Member, you can:</h3>
        <ul class="feature-list">
          <li>View your assigned tasks and schedules</li>
          <li>Log completed work</li>
          <li>Access horse information</li>
        </ul>
      `;
    case 'boarder':
      return `
        <h3>As a Boarder, you can:</h3>
        <ul class="feature-list">
          <li>View your horses and their information</li>
          <li>See upcoming lessons and tasks</li>
          <li>Track and pay invoices</li>
          <li>Stay connected with your barn</li>
        </ul>
      `;
    default:
      return `
        <h3>With OnStride, you can:</h3>
        <ul class="feature-list">
          <li>Manage horses and barn operations</li>
          <li>Track tasks and schedules</li>
          <li>Stay organized and connected</li>
        </ul>
      `;
  }
}

/**
 * Get role-specific content for plain text email
 */
function getRoleSpecificContentText(accountType) {
  switch (accountType) {
    case 'owner':
      return `
AS A BARN OWNER, YOU CAN:
• Manage your horses and stalls
• Create and assign tasks to your team
• Track lessons and schedules
• Generate invoices for your clients
• Invite team members and boarders
      `.trim();
    case 'manager':
      return `
AS A MANAGER, YOU CAN:
• Help manage horses and daily operations
• Create and complete tasks
• Coordinate with the barn owner and team
      `.trim();
    case 'groomer':
      return `
AS A TEAM MEMBER, YOU CAN:
• View your assigned tasks and schedules
• Log completed work
• Access horse information
      `.trim();
    case 'boarder':
      return `
AS A BOARDER, YOU CAN:
• View your horses and their information
• See upcoming lessons and tasks
• Track and pay invoices
• Stay connected with your barn
      `.trim();
    default:
      return `
WITH ONSTRIDE, YOU CAN:
• Manage horses and barn operations
• Track tasks and schedules
• Stay organized and connected
      `.trim();
  }
}
