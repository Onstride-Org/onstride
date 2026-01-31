/**
 * Google Calendar Service
 *
 * Creates calendar events for demo bookings using Google Calendar API
 *
 * SETUP REQUIRED:
 * 1. Enable Google Calendar API in Google Cloud Console
 * 2. Create a calendar in Google Calendar (or use existing one)
 * 3. Share the calendar with the service account email (GCS_CLIENT_EMAIL)
 *    - Go to calendar settings → "Share with specific people"
 *    - Add the service account email with "Make changes to events" permission
 * 4. Set GOOGLE_CALENDAR_ID to the calendar ID (found in calendar settings)
 *
 * For Google Workspace with domain-wide delegation:
 * - Set GOOGLE_CALENDAR_IMPERSONATE to the email of the user to impersonate
 */

const { google } = require('googleapis');

// Configuration from environment variables
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const GCS_CLIENT_EMAIL = process.env.GCS_CLIENT_EMAIL;
const GCS_PRIVATE_KEY = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CALENDAR_IMPERSONATE = process.env.GOOGLE_CALENDAR_IMPERSONATE; // Optional: user to impersonate

let calendarClient = null;
let authClient = null;

/**
 * Initialize the Google Calendar client
 */
const initializeClient = async () => {
  if (calendarClient) return calendarClient;

  if (!GCS_CLIENT_EMAIL || !GCS_PRIVATE_KEY) {
    console.warn('Google Calendar not configured: Missing GCS_CLIENT_EMAIL or GCS_PRIVATE_KEY');
    return null;
  }

  try {
    // Create JWT auth client
    const jwtConfig = {
      email: GCS_CLIENT_EMAIL,
      key: GCS_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    };

    // If impersonating a user (for Google Workspace with domain-wide delegation)
    if (GOOGLE_CALENDAR_IMPERSONATE) {
      jwtConfig.subject = GOOGLE_CALENDAR_IMPERSONATE;
      console.log('Google Calendar: Using domain-wide delegation, impersonating:', GOOGLE_CALENDAR_IMPERSONATE);
    }

    authClient = new google.auth.JWT(jwtConfig);

    // Authorize the client
    await authClient.authorize();

    calendarClient = google.calendar({ version: 'v3', auth: authClient });
    console.log('Google Calendar client initialized successfully');
    console.log('Calendar ID:', GOOGLE_CALENDAR_ID);
    console.log('Service Account:', GCS_CLIENT_EMAIL);

    return calendarClient;
  } catch (error) {
    console.error('Failed to initialize Google Calendar client:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.error('HINT: The service account may not have access to the calendar.');
      console.error('Share your calendar with:', GCS_CLIENT_EMAIL);
    }
    return null;
  }
};

/**
 * Check if Google Calendar is configured
 */
const isConfigured = () => {
  return !!(GCS_CLIENT_EMAIL && GCS_PRIVATE_KEY);
};

/**
 * Create a calendar event for a demo booking
 * @param {Object} options
 * @param {string} options.name - Contact name
 * @param {string} options.email - Contact email
 * @param {string} options.phone - Contact phone (optional)
 * @param {string} options.barnName - Barn name (optional)
 * @param {string} options.discipline - Discipline (optional)
 * @param {string} options.horseCount - Number of horses (optional)
 * @param {string} options.selectedDate - Date in YYYY-MM-DD format
 * @param {string} options.selectedTime - Time like "9:00 AM" or "2:00 PM"
 * @returns {Promise<Object>} Created event or null if failed
 */
const createDemoEvent = async ({ name, email, phone, barnName, discipline, horseCount, selectedDate, selectedTime }) => {
  const calendar = await initializeClient();

  if (!calendar) {
    console.warn('Google Calendar not available, skipping event creation');
    return null;
  }

  try {
    // Parse the time string (e.g., "9:00 AM" or "2:00 PM")
    const parseTime = (timeStr) => {
      if (!timeStr) return { hours: 9, minutes: 0 };

      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return { hours: 9, minutes: 0 };

      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return { hours, minutes };
    };

    const { hours, minutes } = parseTime(selectedTime);

    // Create start and end times
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30); // 30-minute demo

    // Build event description
    const descriptionParts = [
      `📧 Email: ${email}`,
      phone ? `📱 Phone: ${phone}` : null,
      barnName ? `🏠 Barn: ${barnName}` : null,
      discipline ? `🐴 Discipline: ${discipline}` : null,
      horseCount ? `🔢 Horses: ${horseCount}` : null,
      '',
      '---',
      'Demo booked via OnStride landing page'
    ].filter(Boolean);

    const event = {
      summary: `OnStride Demo: ${name}${barnName ? ` - ${barnName}` : ''}`,
      description: descriptionParts.join('\n'),
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York', // Default to Eastern Time
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: email, displayName: name },
        { email: 'admin@onstrideapp.com', displayName: 'OnStride Team' }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },     // 1 hour before
          { method: 'popup', minutes: 15 },     // 15 minutes before
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `demo-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event,
      conferenceDataVersion: 1, // Required for Google Meet link
      sendUpdates: 'all', // Send email invites to attendees
    });

    console.log('Calendar event created:', response.data.id);
    console.log('Google Meet link:', response.data.hangoutLink);

    return {
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
      meetLink: response.data.hangoutLink,
    };
  } catch (error) {
    console.error('Failed to create calendar event:', error.message);
    if (error.response) {
      console.error('Calendar API error:', error.response.data);
    }
    if (error.code === 401 || error.message.includes('authentication')) {
      console.error('');
      console.error('=== GOOGLE CALENDAR SETUP REQUIRED ===');
      console.error('The service account does not have access to the calendar.');
      console.error('');
      console.error('To fix this:');
      console.error('1. Go to Google Calendar (calendar.google.com)');
      console.error('2. Find your calendar in the left sidebar');
      console.error('3. Click the three dots → Settings and sharing');
      console.error('4. Scroll to "Share with specific people"');
      console.error('5. Click "Add people" and enter:', GCS_CLIENT_EMAIL);
      console.error('6. Set permission to "Make changes to events"');
      console.error('7. Click Send');
      console.error('');
      console.error('Then set GOOGLE_CALENDAR_ID to your calendar ID');
      console.error('(Found in calendar settings under "Integrate calendar")');
      console.error('========================================');
    }
    return null;
  }
};

/**
 * Delete a calendar event
 * @param {string} eventId - The event ID to delete
 */
const deleteEvent = async (eventId) => {
  const calendar = await initializeClient();

  if (!calendar) return false;

  try {
    await calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId: eventId,
      sendUpdates: 'all',
    });
    console.log('Calendar event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('Failed to delete calendar event:', error.message);
    return false;
  }
};

module.exports = {
  isConfigured,
  createDemoEvent,
  deleteEvent,
};
