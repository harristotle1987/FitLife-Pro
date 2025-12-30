
const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

/**
 * GET /api/testimonials/featured
 * Returns verified athlete social proof.
 */
router.get('/featured', async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({
      where: { isFeatured: true },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    console.error('❌ [API ERROR] GET /api/testimonials/featured failed:', error.message);
    res.status(500).json({ success: false, message: 'Social proof vault query failed.', error: error.message });
  }
});

/**
 * POST /api/testimonials
 * Admin only: Add a new testimonial.
 */
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
