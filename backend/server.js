
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// --- 1. DATABASE CONFIGURATION (SUPABASE) ---
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:Colony082987%40@db.wyvgrmedubzooqmrorxb.supabase.co:5432/postgres";
const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 }
});

// --- 2. DATA MODELS ---
const Lead = sequelize.define('Lead', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: DataTypes.STRING,
  goal: DataTypes.TEXT,
  source: { type: DataTypes.STRING, defaultValue: 'Contact_Form' },
  status: { type: DataTypes.STRING, defaultValue: 'New' }
});

const Profile = sequelize.define('Profile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'member' },
  activePlanId: { type: DataTypes.STRING, defaultValue: 'plan_starter' },
  avatar_url: DataTypes.TEXT,
  stripe_customer_id: DataTypes.STRING,
  bio: { type: DataTypes.TEXT, defaultValue: 'Optimizing biological performance.' },
  assignedCoachName: { type: DataTypes.STRING, defaultValue: 'Coach Bolt' }
});

const Progress = sequelize.define('Progress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  member_id: { type: DataTypes.UUID, allowNull: false },
  coach_id: { type: DataTypes.UUID, allowNull: false },
  weight: { type: DataTypes.FLOAT, allowNull: false },
  body_fat: { type: DataTypes.FLOAT, allowNull: false },
  performance_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const TrainingPlan = sequelize.define('TrainingPlan', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  durationWeeks: DataTypes.INTEGER,
  features: DataTypes.JSONB
});

// --- 3. MIDDLEWARE ---
const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51Pubx8P1qC7BzO0wxjFThVG8TkyWBV6PtKUb3w8OpsYzC1w6rI9FS5xXtFqSyhS9CnUYGEHRIpU6LEkjfyQlrVkC009KGTGs8Y');

const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Identity required' });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'Session expired' });
  }
};

const adminAuth = (req, res, next) => {
  const allowed = ['admin', 'super_admin', 'nutritionist'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff access level required' });
  }
  next();
};

// --- 4. EXPRESS APP & ROUTES ---
const app = express();
app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/profiles/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await Profile.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in Vault' });

    const hash = await bcrypt.hash(password, 10);
    const p = await Profile.create({ name, email, password: hash, role: role || 'member' });
    
    const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
    res.status(201).json({ success: true, data: p, token });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

app.post('/api/profiles/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const p = await Profile.findOne({ where: { email } });
    if (p && await bcrypt.compare(password, p.password)) {
      const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
      res.json({ success: true, data: p, token });
    } else {
      res.status(401).json({ success: false, message: 'Security credentials rejected' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/profiles/me', auth, async (req, res) => {
  const p = await Profile.findByPk(req.user.id);
  res.json({ success: true, data: p });
});

app.get('/api/profiles/financial-health', auth, adminAuth, async (req, res) => {
  const members = await Profile.findAll({ where: { role: 'member' } });
  res.json({ success: true, data: members.map(p => ({
    profile_id: p.id, athlete_name: p.name, email: p.email, status: 'active', monthly_rate: 199, next_billing: new Date().toISOString()
  })) });
});

app.get('/api/profiles', auth, adminAuth, async (req, res) => {
  const p = await Profile.findAll({ where: { role: req.query.role || 'member' }, order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: p });
});

// Leads
app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.status(201).json({ success: true, data: l });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.get('/api/leads/all', auth, adminAuth, async (req, res) => {
  const leads = await Lead.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: leads });
});

app.patch('/api/leads/:id', auth, adminAuth, async (req, res) => {
  const l = await Lead.findByPk(req.params.id);
  if (l) { await l.update(req.body); res.json({ success: true }); }
  else res.status(404).json({ success: false });
});

// Training Plans
app.get('/api/plans', async (req, res) => {
  const plans = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
  res.json({ success: true, data: plans });
});

// Progress
app.get('/api/progress', auth, async (req, res) => {
  const logs = await Progress.findAll({ 
    where: { member_id: req.query.member_id }, 
    order: [['date', 'DESC']] 
  });
  res.json({ success: true, data: logs });
});

app.post('/api/progress', auth, adminAuth, async (req, res) => {
  try {
    const log = await Progress.create({ ...req.body, coach_id: req.user.id });
    res.status(201).json({ success: true, data: log });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Stripe Checkout
app.post('/api/stripe/create-checkout', auth, async (req, res) => {
  try {
    const { planId, email } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: planId.toUpperCase() + ' PROTOCOL' },
          unit_amount: 19900,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?payment=success&plan=${planId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?payment=cancel`,
    });
    res.json({ success: true, url: session.url });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// --- 5. INITIALIZATION ---
const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    const count = await TrainingPlan.count();
    if (count === 0) {
      await TrainingPlan.bulkCreate([
        { id: 'plan_starter', name: 'Starter Protocol', description: 'Foundation for new athletes.', price: 49.00, durationWeeks: 4, features: ['Dashboard Access', 'Community Support'] },
        { id: 'plan_performance', name: 'Pro Performance', description: 'Advanced splits.', price: 199.00, durationWeeks: 12, features: ['Custom Splits', 'Direct Messaging'] },
        { id: 'plan_executive', name: 'Elite Executive', description: 'Lifestyle optimization.', price: 499.00, durationWeeks: 16, features: ['24/7 Support', 'Bio-feedback'] },
        { id: 'plan_pinnacle', name: 'The Pinnacle', description: 'Bespoke human engineering.', price: 1000.00, durationWeeks: 24, features: ['Private Access', 'The Recovery Kit'] }
      ]);
    }

    app.listen(5000, () => console.log('🚀 FITLIFE VAULT BACKEND ACTIVE ON PORT 5000'));
  } catch (e) {
    console.error('❌ CRITICAL ENGINE FAILURE:', e);
  }
};
start();
