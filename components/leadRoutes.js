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

    // 1. Basic Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Phone format validation (Basic length check)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
    }

    // 2. Create Lead in Database
    const newLead = await Lead.create({
      name,
      email,
      phone,
      goal,
      source
    });

    // 3. Send Confirmation Email via Resend
    try {
      if (process.env.RESEND_API_KEY) {
        const emailResponse = await resend.emails.send({
          from: 'FitLife Coach <onboarding@resend.dev>', // Update with your verified domain for production
          to: email,
          subject: 'FitLife Pro: Your Strategy Call Request is Confirmed!',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Hi ${name},</h2>
              <p>Thank you for reaching out! We've received your request for a strategy call regarding your goal: <strong>"${goal}"</strong>.</p>
              <p>One of our expert coaches will review your details and contact you at <strong>${phone}</strong> within 24 hours.</p>
              <p>Get ready to transform!</p>
              <br/>
              <p>Best regards,</p>
              <p><strong>The FitLife Pro Team</strong></p>
            </div>
          `
        });
        console.log(`📧 Confirmation email sent to ${email}. ID: ${emailResponse.id}`);
      } else {
        console.warn('⚠️ RESEND_API_KEY is missing, email skipped.');
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('❌ Failed to send confirmation email:', emailError);
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

// GET /api/leads/all - Admin Only
router.get('/all', adminAuth, async (req, res) => {
  try {
    const leads = await Lead.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;