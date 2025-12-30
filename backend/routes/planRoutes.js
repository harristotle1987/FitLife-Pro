
const express = require('express');
const router = express.Router();
const TrainingPlan = require('../models/TrainingPlan');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

/**
 * GET /api/plans
 * Returns all active training protocols.
 */
router.get('/', async (req, res) => {
  try {
    const plans = await TrainingPlan.findAll({
      order: [['price', 'ASC']]
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('❌ [API ERROR] GET /api/plans failed:', error.message);
    res.status(500).json({ success: false, message: 'Database query failed.', error: error.message });
  }
});

/**
 * POST /api/plans
 * Admin only: Create a new protocol.
 */
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const newPlan = await TrainingPlan.create(req.body);
    res.status(201).json({ success: true, data: newPlan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
