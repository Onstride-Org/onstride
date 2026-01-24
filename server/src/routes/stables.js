const express = require('express');
const router = express.Router();
const Stable = require('../models/Stable');
const Horse = require('../models/Horse');
const { authenticate, hasRole, loadBarnContext } = require('../middleware/auth');

// Get stable for current barn
router.get('/', authenticate, loadBarnContext, async (req, res) => {
  try {
    const stable = await Stable.findOne({ barn: req.barnId })
      .populate({
        path: 'stalls.horse',
        select: 'name breed gender age photoUrl ownerId',
        populate: {
          path: 'ownerId',
          select: 'name',
        },
      });

    if (!stable) {
      return res.json({ stable: null, isConfigured: false });
    }

    res.json({ stable, isConfigured: stable.isConfigured });
  } catch (error) {
    console.error('Get stable error:', error);
    res.status(500).json({ error: 'Failed to fetch stable' });
  }
});

// Create/configure stable
router.post('/configure', authenticate, loadBarnContext, hasRole('owner', 'manager'), async (req, res) => {
  try {
    const { name, layout, totalStalls, stallsPerRow } = req.body;

    // Check if stable already exists
    let stable = await Stable.findOne({ barn: req.barnId });

    if (stable) {
      // Update existing stable
      stable.name = name || stable.name;
      stable.layout = layout;
      stable.totalStalls = totalStalls;
      stable.stallsPerRow = stallsPerRow || 4;
      stable.generateStalls();
      stable.isConfigured = true;
    } else {
      // Create new stable
      stable = new Stable({
        barn: req.barnId,
        name: name || 'Main Stable',
        layout,
        totalStalls,
        stallsPerRow: stallsPerRow || 4,
        createdBy: req.user._id,
        isConfigured: true,
      });
      stable.generateStalls();
    }

    await stable.save();

    res.json({ stable, message: 'Stable configured successfully' });
  } catch (error) {
    console.error('Configure stable error:', error);
    res.status(500).json({ error: 'Failed to configure stable' });
  }
});

// Assign horse to stall
router.post('/stalls/:stallId/assign', authenticate, loadBarnContext, hasRole('owner', 'manager'), async (req, res) => {
  try {
    const { stallId } = req.params;
    const { horseId } = req.body;

    console.log('Assign horse request:', { stallId, horseId, barnId: req.barnId });

    const stable = await Stable.findOne({ barn: req.barnId });

    if (!stable) {
      console.log('Stable not found for barn:', req.barnId);
      return res.status(404).json({ error: 'Stable not found' });
    }

    // Find the stall
    const stall = stable.stalls.find((s) => s.stallId === stallId);
    if (!stall) {
      console.log('Stall not found:', stallId, 'Available stalls:', stable.stalls.map(s => s.stallId));
      return res.status(404).json({ error: 'Stall not found' });
    }

    // Verify horse exists and belongs to this barn
    if (horseId) {
      const horse = await Horse.findOne({ _id: horseId, barnId: req.barnId });
      if (!horse) {
        console.log('Horse not found:', horseId);
        return res.status(404).json({ error: 'Horse not found' });
      }

      // Check if horse is already assigned to another stall
      const existingStall = stable.stalls.find(
        (s) => s.horse && s.horse.toString() === horseId && s.stallId !== stallId
      );
      if (existingStall) {
        // Remove from existing stall
        existingStall.horse = null;
        existingStall.status = 'available';
      }
    }

    // Assign horse to stall
    stall.horse = horseId || null;
    stall.status = horseId ? 'occupied' : 'available';

    await stable.save();

    // Return populated stable
    await stable.populate({
      path: 'stalls.horse',
      select: 'name breed gender age photoUrl ownerId',
      populate: {
        path: 'ownerId',
        select: 'name',
      },
    });

    res.json({ stable, message: horseId ? 'Horse assigned to stall' : 'Stall cleared' });
  } catch (error) {
    console.error('Assign horse error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to assign horse to stall', details: error.message });
  }
});

// Remove horse from stall
router.delete('/stalls/:stallId/horse', authenticate, loadBarnContext, hasRole('owner', 'manager'), async (req, res) => {
  try {
    const { stallId } = req.params;

    const stable = await Stable.findOne({ barn: req.barnId });

    if (!stable) {
      return res.status(404).json({ error: 'Stable not found' });
    }

    const stall = stable.stalls.find((s) => s.stallId === stallId);
    if (!stall) {
      return res.status(404).json({ error: 'Stall not found' });
    }

    stall.horse = null;
    stall.status = 'available';

    await stable.save();

    res.json({ stable, message: 'Horse removed from stall' });
  } catch (error) {
    console.error('Remove horse error:', error);
    res.status(500).json({ error: 'Failed to remove horse from stall' });
  }
});

// Update stall status (maintenance, reserved, etc.)
router.patch('/stalls/:stallId', authenticate, loadBarnContext, hasRole('owner', 'manager'), async (req, res) => {
  try {
    const { stallId } = req.params;
    const { status, notes } = req.body;

    const stable = await Stable.findOne({ barn: req.barnId });

    if (!stable) {
      return res.status(404).json({ error: 'Stable not found' });
    }

    const stall = stable.stalls.find((s) => s.stallId === stallId);
    if (!stall) {
      return res.status(404).json({ error: 'Stall not found' });
    }

    if (status) stall.status = status;
    if (notes !== undefined) stall.notes = notes;

    await stable.save();

    res.json({ stable, message: 'Stall updated' });
  } catch (error) {
    console.error('Update stall error:', error);
    res.status(500).json({ error: 'Failed to update stall' });
  }
});

// Reset stable (remove all assignments)
router.post('/reset', authenticate, loadBarnContext, hasRole('owner'), async (req, res) => {
  try {
    const stable = await Stable.findOne({ barn: req.barnId });

    if (!stable) {
      return res.status(404).json({ error: 'Stable not found' });
    }

    // Clear all horse assignments
    stable.stalls.forEach((stall) => {
      stall.horse = null;
      stall.status = 'available';
      stall.notes = '';
    });

    await stable.save();

    res.json({ stable, message: 'Stable reset successfully' });
  } catch (error) {
    console.error('Reset stable error:', error);
    res.status(500).json({ error: 'Failed to reset stable' });
  }
});

// Delete stable configuration
router.delete('/', authenticate, loadBarnContext, hasRole('owner'), async (req, res) => {
  try {
    await Stable.findOneAndDelete({ barn: req.barnId });
    res.json({ message: 'Stable deleted successfully' });
  } catch (error) {
    console.error('Delete stable error:', error);
    res.status(500).json({ error: 'Failed to delete stable' });
  }
});

module.exports = router;
