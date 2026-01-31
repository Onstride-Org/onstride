const express = require('express');
const DemoRequest = require('../models/DemoRequest');
const DemoAvailability = require('../models/DemoAvailability');
const { sendDemoConfirmationEmail, sendDemoAdminNotification } = require('../services/email');
const { createDemoEvent, isConfigured: isCalendarConfigured } = require('../services/googleCalendar');

const router = express.Router();

// Public endpoint - get available slots for demo booking
router.get('/availability', async (req, res, next) => {
  try {
    let availability = await DemoAvailability.find({ isEnabled: true }).sort({ dayOfWeek: 1 });

    // If no availability settings exist, return defaults
    if (availability.length === 0) {
      const defaultTimeSlots = [
        { time: '9:00 AM', isAvailable: true },
        { time: '10:00 AM', isAvailable: true },
        { time: '11:00 AM', isAvailable: true },
        { time: '1:00 PM', isAvailable: true },
        { time: '2:00 PM', isAvailable: true },
        { time: '3:00 PM', isAvailable: true },
        { time: '4:00 PM', isAvailable: true }
      ];

      // Return Monday-Friday defaults
      availability = [
        { dayOfWeek: 1, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 2, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 3, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 4, isEnabled: true, timeSlots: defaultTimeSlots },
        { dayOfWeek: 5, isEnabled: true, timeSlots: defaultTimeSlots }
      ];
    }

    // Return only enabled days with available time slots
    const result = availability.map(day => ({
      dayOfWeek: day.dayOfWeek,
      timeSlots: day.timeSlots.filter(slot => slot.isAvailable).map(slot => slot.time)
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Public endpoint - no authentication required
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      barnName,
      discipline,
      horseCount,
      isDecisionMaker,
      selectedDate,
      selectedTime
    } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const demoRequest = new DemoRequest({
      name,
      email,
      phone,
      barnName,
      discipline,
      horseCount,
      isDecisionMaker,
      selectedDate,
      selectedTime,
      status: 'new'
    });

    await demoRequest.save();

    // Send confirmation email to user (don't fail the request if email fails)
    try {
      await sendDemoConfirmationEmail({
        to: email,
        name,
        selectedDate,
        selectedTime,
        barnName
      });
      console.log('Demo confirmation email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send demo confirmation email:', emailError.message);
    }

    // Send notification email to admin
    try {
      await sendDemoAdminNotification({
        name,
        email,
        phone,
        barnName,
        discipline,
        horseCount,
        selectedDate,
        selectedTime
      });
      console.log('Demo admin notification sent');
    } catch (emailError) {
      console.error('Failed to send demo admin notification:', emailError.message);
    }

    // Create Google Calendar event with Meet link
    let calendarEvent = null;
    if (isCalendarConfigured()) {
      try {
        calendarEvent = await createDemoEvent({
          name,
          email,
          phone,
          barnName,
          discipline,
          horseCount,
          selectedDate,
          selectedTime
        });
        if (calendarEvent) {
          console.log('Calendar event created:', calendarEvent.eventId);
          console.log('Meet link:', calendarEvent.meetLink);

          // Update the demo request with calendar info
          demoRequest.calendarEventId = calendarEvent.eventId;
          demoRequest.meetLink = calendarEvent.meetLink;
          await demoRequest.save();
        }
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Demo request submitted successfully',
      id: demoRequest._id,
      meetLink: calendarEvent?.meetLink || null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
