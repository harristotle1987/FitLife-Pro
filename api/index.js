
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// --- 1. CONFIG & DB ---
const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_51Pubx8P1qC7BzO0wxjFThVG8TkyWBV6PtKUb3w8OpsYzC1w6rI9FS5xXtFqSyhS9CnUYGEHRIpU6LEkjfyQlrVkC009KGTGs8Y';
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:Colony082987%40@db.wyvgrmedubzooqmrorxb.supabase.co:5432/postgres";

const stripe = new Stripe(STRIPE_SECRET);

// Global sequelize instance to persist across serverless warm starts
let sequelize;

if (!sequelize) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false, 
    dialectOptions: { 
      ssl: { 
        require: true, 
        rejectUnauthorized: false 
      } 
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// --- 2. MODELS ---
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

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Identity required' });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) { res.status(401).json({ success: false, message: 'Invalid Session' }); }
};

const adminAuth = (req, res, next) => {
  if (!['admin', 'super_admin', 'nutritionist'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Staff Clearance Required' });
  }
  next();
};

// --- 4. ROUTES ---

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'active', database: 'connected', node: process.version });
  } catch (e) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: e.message });
  }
});

app.get('/api/system/bootstrap', async (req, res) => {
  try {
    console.log("Starting System Bootstrap...");
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    const hash = await bcrypt.hash('AdminPassword123!', 10);
    const [admin, created] = await Profile.findOrCreate({
      where: { email: 'admin@fitlife.pro' },
      defaults: { 
        name: 'Super Admin', 
        password: hash, 
        role: 'super_admin' 
      }
    });
    
    res.json({ 
      success: true, 
      message: created ? 'Admin created and database synced' : 'Admin already exists, database synced', 
      email: 'admin@fitlife.pro' 
    });
  } catch (e) { 
    console.error("Bootstrap Error:", e);
    res.status(500).json({ success: false, message: 'Bootstrap failed', error: e.message }); 
  }
});

app.post('/api/profiles/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const p = await Profile.create({ name, email, password: hash, role: role || 'member' });
    const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
    res.status(201).json({ success: true, data: p, token });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.post('/api/profiles/login', async (req, res) => {
  try {
    const p = await Profile.findOne({ where: { email: req.body.email } });
    if (p && await bcrypt.compare(req.body.password, p.password)) {
      const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
      res.json({ success: true, data: p, token });
    } else { res.status(401).json({ success: false, message: 'Invalid Credentials' }); }
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/me', auth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.user.id);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/financial-health', auth, adminAuth, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ success: false });
  try {
    const members = await Profile.findAll({ where: { role: 'member' } });
    const records = members.map(m => ({
      profile_id: m.id, athlete_name: m.name, email: m.email,
      status: 'active', next_billing: new Date().toISOString(), monthly_rate: 199
    }));
    res.json({ success: true, data: records });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles', auth, adminAuth, async (req, res) => {
  try {
    const p = await Profile.findAll({ where: { role: req.query.role || 'member' } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.status(201).json({ success: true, data: l });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.get('/api/leads/all', auth, adminAuth, async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/leads/:id', auth, adminAuth, async (req, res) => {
  try {
    const l = await Lead.findByPk(req.params.id);
    if (l) { await l.update(req.body); res.json({ success: true }); }
    else res.status(404).json({ success: false });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/progress', auth, async (req, res) => {
  try {
    const logs = await Progress.findAll({ where: { member_id: req.query.member_id }, order: [['date', 'DESC']] });
    res.json({ success: true, data: logs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/progress', auth, adminAuth, async (req, res) => {
  try {
    const log = await Progress.create({ ...req.body, coach_id: req.user.id });
    res.status(201).json({ success: true, data: log });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.get('/api/plans', async (req, res) => {
  res.json({ success: true, data: [] }); 
});

app.post('/api/stripe/create-checkout', auth, async (req, res) => {
  try {
    const { planId } = req.body;
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
      success_url: `${req.headers.origin}/?payment=success`,
      cancel_url: `${req.headers.origin}/?payment=cancel`,
    });
    res.json({ success: true, url: session.url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
