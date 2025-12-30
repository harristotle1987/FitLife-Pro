
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_51Pubx8P1qC7BzO0wxjFThVG8TkyWBV6PtKUb3w8OpsYzC1w6rI9FS5xXtFqSyhS9CnUYGEHRIpU6LEkjfyQlrVkC009KGTGs8Y';

// Explicitly define credentials to avoid URL encoding/parsing issues
// Note: Colony082987%40 decoded is Colony082987@
const dbConfig = {
  host: "db.wyvgrmedubzooqmrorxb.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Colony082987@", 
};

const stripe = new Stripe(STRIPE_SECRET);

// Optimized Sequelize for Vercel/Serverless
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'postgres',
  logging: false, 
  dialectOptions: { 
    ssl: { require: true, rejectUnauthorized: false },
    connectTimeout: 20000, // Increase to 20s
    keepAlive: true
  },
  pool: { 
    max: 1, 
    min: 0, 
    acquire: 20000, 
    idle: 5000,
    evict: 5000 
  }
});

// --- MODELS ---
const Lead = sequelize.define('Lead', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  goal: { type: DataTypes.TEXT },
  source: { type: DataTypes.STRING, defaultValue: 'Contact_Form' },
  status: { type: DataTypes.STRING, defaultValue: 'New' }
}, { tableName: 'Leads' });

const Profile = sequelize.define('Profile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'member' }, 
  activePlanId: { type: DataTypes.STRING, defaultValue: 'plan_starter' },
  assignedCoachName: { type: DataTypes.STRING, defaultValue: 'Coach Bolt' },
  nutritionalProtocol: { type: DataTypes.TEXT, defaultValue: 'Pending metabolic assessment.' },
  avatar_url: { type: DataTypes.TEXT },
  bio: { type: DataTypes.TEXT }
}, { tableName: 'Profiles' });

const Progress = sequelize.define('Progress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  member_id: { type: DataTypes.UUID, allowNull: false },
  coach_id: { type: DataTypes.UUID, allowNull: false },
  weight: { type: DataTypes.FLOAT, allowNull: false },
  body_fat: { type: DataTypes.FLOAT, allowNull: false },
  performance_score: { type: DataTypes.INTEGER, defaultValue: 0 },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'Progress' });

const TrainingPlan = sequelize.define('TrainingPlan', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: DataTypes.TEXT,
  features: { type: DataTypes.JSONB, defaultValue: [] },
  durationWeeks: { type: DataTypes.INTEGER }
}, { tableName: 'TrainingPlans' });

const Testimonial = sequelize.define('Testimonial', {
  clientName: { type: DataTypes.STRING, allowNull: false },
  clientTitle: { type: DataTypes.STRING },
  quote: { type: DataTypes.TEXT, allowNull: false },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.INTEGER, defaultValue: 5 }
}, { tableName: 'Testimonials' });

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch (e) { res.status(401).json({ success: false, message: 'Invalid Session' }); }
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Denied' });
  next();
};

// --- ROUTES ---

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, status: 'online', database: 'connected' });
  } catch (e) {
    res.status(500).json({ success: false, status: 'error', message: e.message });
  }
});

app.get('/api/system/bootstrap', async (req, res) => {
  console.info('[BOOTSTRAP] Manual trigger initiated.');
  try {
    await sequelize.authenticate();
    // Use alter:false for faster performance during first-time setup
    await sequelize.sync({ alter: false });
    
    const hash = await bcrypt.hash('AdminPassword123!', 10);
    await Profile.findOrCreate({ 
      where: { email: 'admin@fitlife.pro' }, 
      defaults: { name: 'Super Admin', password: hash, role: 'super_admin' } 
    });
    
    await Profile.findOrCreate({ 
      where: { email: 'nutrition@fitlife.pro' }, 
      defaults: { name: 'Elena Nutritionist', password: hash, role: 'nutritionist' } 
    });
    
    res.json({ success: true, message: 'System initialized. Database ready.' });
  } catch (e) { 
    res.status(500).json({ success: false, message: `Bootstrap failed: ${e.message}` }); 
  }
});

app.post('/api/profiles/login', async (req, res) => {
  try {
    const p = await Profile.findOne({ where: { email: req.body.email } });
    if (p && await bcrypt.compare(req.body.password, p.password)) {
      const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
      res.json({ success: true, data: p, token });
    } else res.status(401).json({ success: false, message: 'Invalid Credentials' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/profiles/me', auth, async (req, res) => {
  const p = await Profile.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
  res.json({ success: true, data: p });
});

app.patch('/api/profiles/:id', auth, checkRole(['super_admin', 'admin', 'nutritionist']), async (req, res) => {
  try {
    const p = await Profile.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Athlete not found' });
    await p.update(req.body);
    res.json({ success: true, data: p });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.status(201).json({ success: true, data: l });
  } catch (e) { 
    // If table doesn't exist, tell the user to bootstrap
    if (e.message.includes('relation "Leads" does not exist')) {
        return res.status(503).json({ success: false, message: 'Database tables missing. Please run /api/system/bootstrap first.' });
    }
    res.status(400).json({ success: false, message: e.message }); 
  }
});

app.get('/api/leads/all', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/progress', auth, checkRole(['super_admin', 'admin', 'nutritionist']), async (req, res) => {
  try {
    const log = await Progress.create({ ...req.body, coach_id: req.user.id });
    res.status(201).json({ success: true, data: log });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/progress', auth, async (req, res) => {
  try {
    const logs = await Progress.findAll({ where: { member_id: req.query.member_id }, order: [['date', 'DESC']] });
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/plans', async (req, res) => {
  try {
    const p = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ success: true, data: p });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/testimonials/featured', async (req, res) => {
  try {
    const t = await Testimonial.findAll({ where: { isFeatured: true } });
    res.json({ success: true, data: t });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
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
          unit_amount: planId.includes('starter') ? 4900 : planId.includes('performance') ? 19900 : 49900,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?payment=success&plan=${planId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?payment=cancel`,
    });
    res.json({ success: true, url: session.url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GLOBAL ERROR HANDLER - ENSURES JSON RESPONSE
app.use((err, req, res, next) => {
  console.error('[UNHANDLED EXCEPTION]:', err);
  res.status(500).json({
    success: false,
    message: 'A critical server error occurred.',
    error: err.message
  });
});

export default app;
