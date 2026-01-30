const express = require('express');
const DemoRequest = require('../models/DemoRequest');

const router = express.Router();

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

    res.status(201).json({
      success: true,
      message: 'Demo request submitted successfully',
      id: demoRequest._id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
