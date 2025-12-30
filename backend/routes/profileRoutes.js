const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
};

// Signup - Create new member
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(`[AUTH] Signup attempt: ${email}`);
    
    const existing = await Profile.findOne({ where: { email } });
    if (existing) {
      console.warn(`[AUTH] Signup rejected: ${email} already exists.`);
      return res.status(409).json({ success: false, message: 'Email already registered in the Vault.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const profile = await Profile.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: 'member'
    });

    const token = generateToken(profile);
    const { password: _, ...safeData } = profile.toJSON();
    
    console.log(`[AUTH] Signup success: ${email} (ID: ${profile.id})`);
    res.status(201).json({ success: true, data: safeData, token });
  } catch (error) {
    console.error('❌ [AUTH ERROR] Signup failed:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Critical system error during profile initialization.',
      error: error.message 
    });
  }
});

// Login - Existing member
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const profile = await Profile.findOne({ where: { email } });
    if (!profile) return res.status(401).json({ success: false, message: 'Identity not found in Vault.' });

    const isMatch = await bcrypt.compare(password, profile.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Security credentials rejected.' });

    const token = generateToken(profile);
    const { password: _, ...safeData } = profile.toJSON();
    res.json({ success: true, data: safeData, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Vault authentication server error.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Session verification failed.' });
  }
});

router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const profiles = await Profile.findAll({ 
      where: { role: 'member' },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Matrix query failed.' });
  }
});

router.get('/financial-health', auth, adminAuth, async (req, res) => {
  try {
    const members = await Profile.findAll({ where: { role: 'member' } });
    const records = members.map(m => ({
      profile_id: m.id,
      athlete_name: m.name,
      email: m.email,
      status: 'active',
      next_billing: new Date().toISOString(),
      monthly_rate: 199
    }));
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;