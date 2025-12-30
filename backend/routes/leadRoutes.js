
const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const adminAuth = require('../middleware/adminAuth');
const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/leads - Public Lead Capture
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, goal, source } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Create Lead in Database
    const newLead = await Lead.create({
      name,
      email,
      phone,
      goal,
      source
    });

    // Send Confirmation Email via Resend
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'FitLife Coach <onboarding@resend.dev>',
          to: email,
          subject: 'FitLife Pro: Your Strategy Call Request is Confirmed!',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Hi ${name},</h2>
              <p>Thank you for reaching out! We've received your request for a strategy call regarding your goal: <strong>"${goal}"</strong>.</p>
              <p>One of our expert coaches will contact you at <strong>${phone}</strong> within 24 hours.</p>
              <br/>
              <p>Best regards,</p>
              <p><strong>The FitLife Pro Team</strong></p>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('❌ Email notification skipped:', emailError.message);
    }

    res.status(201).json({ success: true, data: newLead });

  } catch (error) {
    console.error('Error creating lead:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'This email has already requested a pass.' });
    }
    res.status(500).json({ success: false, message: 'Server error processing your request.' });
  }
});

router.get('/all', adminAuth, async (req, res) => {
  try {
    const leads = await Lead.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
