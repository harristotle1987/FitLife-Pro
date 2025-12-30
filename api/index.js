
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes, Op } from 'sequelize';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_51Pubx8P1qC7BzO0wxjFThVG8TkyWBV6PtKUb3w8OpsYzC1w6rI9FS5xXtFqSyhS9CnUYGEHRIpU6LEkjfyQlrVkC009KGTGs8Y';

const stripe = new Stripe(STRIPE_SECRET);

// --- DATABASE CONNECTION ---
// Using the updated password confirmed by the user.
// No special characters like @ are used anymore, which prevents malformed URI errors.
const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:Colony082987Fit@db.euuqfcglulkeyxaqcpvz.supabase.co:5432/postgres";

const sequelize = new Sequelize(DB_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  logging: false, 
  dialectOptions: { 
    ssl: { 
      require: true, 
      rejectUnauthorized: false 
    },
    connectTimeout: 30000, 
  },
  pool: { 
    max: 1, // Crucial for Serverless environments like Vercel
    min: 0, 
    acquire: 30000, 
    idle: 10000 
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
}, { tableName: 'leads', underscored: true, timestamps: true });

const Profile = sequelize.define('Profile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'member' }, 
  activePlanId: { type: DataTypes.STRING, defaultValue: 'plan_starter' },
  assignedCoachName: { type: DataTypes.STRING, defaultValue: 'Coach Bolt' },
  nutritionalProtocol: { type: DataTypes.TEXT, defaultValue: 'Pending metabolic assessment.' },
  avatarUrl: { type: DataTypes.TEXT },
  bio: { type: DataTypes.TEXT }
}, { tableName: 'profiles', underscored: true, timestamps: true });

const Progress = sequelize.define('Progress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  memberId: { type: DataTypes.UUID, allowNull: false },
  coachId: { type: DataTypes.UUID, allowNull: false },
  weight: { type: DataTypes.FLOAT, allowNull: false },
  bodyFat: { type: DataTypes.FLOAT, allowNull: false },
  performanceScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'progress', underscored: true, timestamps: true });

const TrainingPlan = sequelize.define('TrainingPlan', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: DataTypes.TEXT,
  features: { type: DataTypes.JSONB, defaultValue: [] },
  durationWeeks: { type: DataTypes.INTEGER },
  recommendedFor: { type: DataTypes.JSONB, defaultValue: [] },
  stripePriceId: { type: DataTypes.STRING }
}, { tableName: 'plans', underscored: true, timestamps: true });

const Testimonial = sequelize.define('Testimonial', {
  clientName: { type: DataTypes.STRING, allowNull: false },
  clientTitle: { type: DataTypes.STRING },
  quote: { type: DataTypes.TEXT, allowNull: false },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.INTEGER, defaultValue: 5 }
}, { tableName: 'testimonials', underscored: true, timestamps: true });

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

/**
 * BOOTSTRAP ROUTE
 * Use this to initialize the database tables and the primary admin account.
 */
app.get('/api/system/bootstrap', async (req, res) => {
  try {
    console.info("Initiating system bootstrap...");
    await sequelize.authenticate();
    console.info("Database connection established.");
    
    // sync({ alter: true }) will update existing tables to match the model definition
    await sequelize.sync({ alter: true });
    console.info("Schema synchronization complete.");
    
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
      message: 'System Ready. Tables synchronized and Admin account verified.', 
      adminCreated: created 
    });
  } catch (e) { 
    console.error("BOOTSTRAP_ERROR:", e.message);
    res.status(500).json({ 
      success: false, 
      error: "Bootstrap failed. Check database credentials or network access.",
      details: e.message 
    }); 
  }
});

app.post('/api/profiles/login', async (req, res) => {
  try {
    const p = await Profile.findOne({ where: { email: req.body.email } });
    if (p && await bcrypt.compare(req.body.password, p.password)) {
      const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
      res.json({ success: true, data: p, token });
    } else res.status(401).json({ success: false, message: 'Invalid Credentials' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/profiles/signup', async (req, res) => {
  try {
    const { name, email, password, role, activePlanId } = req.body;
    const existing = await Profile.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email registered.' });

    const hash = await bcrypt.hash(password || 'FitLife2024!', 10);
    const p = await Profile.create({ name, email, password: hash, role: role || 'member', activePlanId: activePlanId || 'plan_starter' });
    const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
    res.status(201).json({ success: true, data: p, token });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/me', auth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/:id', auth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { role } = req.query;
    const p = await Profile.findAll({ where: role ? { role } : {}, attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/profiles/:id', auth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    await p.update(req.body);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/progress', auth, async (req, res) => {
  try {
    const { member_id } = req.query;
    const data = await Progress.findAll({ where: { memberId: member_id }, order: [['date', 'DESC']] });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/progress', auth, async (req, res) => {
  try {
    const log = await Progress.create(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.status(201).json({ success: true, data: l });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.get('/api/leads/all', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/leads/:id', auth, async (req, res) => {
  try {
    const l = await Lead.findByPk(req.params.id);
    if (!l) return res.status(404).json({ success: false, message: 'Not found' });
    await l.update(req.body);
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/plans', async (req, res) => {
  try {
    const p = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
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
      success_url: `${process.env.FRONTEND_URL || 'https://fit-life-pro-one.vercel.app'}/?payment=success&plan=${planId}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://fit-life-pro-one.vercel.app'}/?payment=cancel`,
    });
    res.json({ success: true, url: session.url });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
