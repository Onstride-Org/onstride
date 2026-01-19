/**
 * Email Service using SendGrid
 *
 * Handles all transactional emails for the application
 */

const sgMail = require('@sendgrid/mail');

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'admin@onstrideapp.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'placeholder') {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Check if email service is configured
 */
const isConfigured = () => {
  return !!(SENDGRID_API_KEY && SENDGRID_API_KEY !== 'placeholder');
};

/**
 * Send an email using SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!isConfigured()) {
    console.warn('SendGrid not configured. Email not sent to:', to);
    console.log('Email content:', { subject, text });
    return { success: false, reason: 'not_configured' };
  }

  try {
    await sgMail.send({
      to,
      from: {
        email: EMAIL_FROM,
        name: 'OnStride'
      },
      subject,
      text,
      html,
    });
    console.log('Email sent successfully to:', to);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error.message);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
    throw error;
  }
};

/**
 * Send invitation email to join a barn
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.barnName - Name of the barn
 * @param {string} options.inviterName - Name of person who sent invite
 * @param {string} options.role - Role being invited to
 * @param {string} options.token - Invitation token
 */
const sendInvitationEmail = async ({ to, barnName, inviterName, role, token }) => {
  const inviteUrl = `${CLIENT_URL}/invite/${token}`;

  const subject = `You've been invited to join ${barnName} on OnStride`;

  const text = `
Hello,

${inviterName} has invited you to join ${barnName} as a ${role} on OnStride.

OnStride is a modern barn management platform that helps equestrian facilities manage horses, riders, and operations.

Click the link below to accept your invitation and create your account:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The OnStride Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${barnName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">You're Invited!</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          <strong>${inviterName}</strong> has invited you to join <strong>${barnName}</strong> as a <strong>${role}</strong> on OnStride.
        </p>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          OnStride is a modern barn management platform that helps equestrian facilities manage horses, riders, and operations.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 30px auto;">
          <tr>
            <td style="background-color: #2563eb; border-radius: 6px;">
              <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                Accept Invitation
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
          This invitation will expire in 7 days.
        </p>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} OnStride. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
};

/**
 * Send password reset email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - User's name
 * @param {string} options.token - Reset token
 */
const sendPasswordResetEmail = async ({ to, name, token }) => {
  const resetUrl = `${CLIENT_URL}/reset-password/${token}`;

  const subject = 'Reset your OnStride password';

  const text = `
Hello ${name || 'there'},

We received a request to reset your password for your OnStride account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The OnStride Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">Reset Your Password</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hello ${name || 'there'},
        </p>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          We received a request to reset your password for your OnStride account. Click the button below to choose a new password.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 30px auto;">
          <tr>
            <td style="background-color: #2563eb; border-radius: 6px;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
          This link will expire in 1 hour.
        </p>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} OnStride. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
};

/**
 * Send welcome email to new user
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - User's name
 * @param {string} options.barnName - Name of their barn
 */
const sendWelcomeEmail = async ({ to, name, barnName }) => {
  const dashboardUrl = `${CLIENT_URL}/dashboard`;

  const subject = `Welcome to OnStride, ${name}!`;

  const text = `
Hi ${name},

Welcome to OnStride! Your account has been created successfully.

${barnName ? `Your barn "${barnName}" is all set up and ready to go.` : ''}

Get started by visiting your dashboard:
${dashboardUrl}

With OnStride, you can:
- Manage your horses and their health records
- Schedule lessons and track ride logs
- Invite staff and boarders to collaborate
- Generate invoices and track payments

If you have any questions, feel free to reach out to our support team.

Happy riding!
The OnStride Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OnStride</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 20px 0;">Welcome to OnStride!</h1>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hi ${name},
        </p>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Your account has been created successfully. ${barnName ? `Your barn <strong>"${barnName}"</strong> is all set up and ready to go.` : ''}
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 30px auto;">
          <tr>
            <td style="background-color: #2563eb; border-radius: 6px;">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                Go to Dashboard
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
          With OnStride, you can:
        </p>
        <ul style="color: #4a4a4a; font-size: 14px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
          <li>Manage your horses and their health records</li>
          <li>Schedule lessons and track ride logs</li>
          <li>Invite staff and boarders to collaborate</li>
          <li>Generate invoices and track payments</li>
        </ul>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Happy riding!<br>The OnStride Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} OnStride. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail({ to, subject, text, html });
};

module.exports = {
  isConfigured,
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
