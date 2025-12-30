
const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// GET progress (Auth required)
router.get('/', auth, async (req, res) => {
  try {
    const { member_id } = req.query;
    // Allow members to see only their own, or allow admins/coaches
    if (req.user.role === 'member' && req.user.id !== member_id) {
       return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const logs = await Progress.findAll({
      where: { member_id },
      order: [['date', 'DESC']]
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST progress (Auth + Admin/Coach required)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const log = await Progress.create({
      ...req.body,
      coach_id: req.user.id // Force coach ID from token
    });
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
