
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

// --- DATABASE CONFIGURATION ---
const DB_PASSWORD = "Colony082987Fit";
const FALLBACK_REF = "euuqfcglulkeyxaqcpvz";

/**
 * RESOLVES ENOTFOUND DNS ERRORS
 * This function builds a connection string compatible with Supavisor (Port 6543).
 * It prioritizes environment variables provided by Vercel/Supabase integrations.
 */
function getSanitizedConnectionString() {
  // If Vercel/Supabase integration is used, this is provided automatically
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;

  // Fallback logic for manual configuration
  let ref = FALLBACK_REF;
  const user = `postgres.${ref}`;
  // Use Port 6543 for IPv4 compatibility and connection pooling (Supavisor)
  const host = `db.${ref}.supabase.co`; 
  const port = 6543; 
  const db = "postgres";
  const params = "sslmode=require&supavisor_session=true";

  return `postgresql://${user}:${DB_PASSWORD}@${host}:${port}/${db}?${params}`;
}

const sequelize = new Sequelize(getSanitizedConnectionString(), {
  dialect: 'postgres',
  dialectModule: pg,
  logging: (msg) => console.log(`[DB] ${msg}`),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    // Crucial for Vercel: shorter timeout so the function doesn't hang indefinitely
    connectTimeout: 10000,
  },
  // Serverless pooling: don't hold many connections open
  pool: {
    max: 2,
    min: 0,
    acquire: 15000,
    idle: 5000
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
  stripePriceId: { type: DataTypes.STRING }
}, { tableName: 'plans', underscored: true, timestamps: true });

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

app.get('/api/system/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      success: true, 
      status: 'operational', 
      database: 'connected', 
      diagnostic: {
        host: sequelize.config.host,
        port: sequelize.config.port,
        username_used: sequelize.config.username
      }
    });
  } catch (e) {
    console.error("Health Check Failure:", e);
    res.status(503).json({ 
      success: false, 
      status: 'degraded', 
      error: e.message, 
      diagnostic: {
        attempted_host: sequelize.config.host,
        attempted_port: sequelize.config.port,
        attempted_user: sequelize.config.username
      },
      hint: "Supabase host ENOTFOUND usually means you need to use Port 6543 (Transaction Pooler). Ensure your DATABASE_URL environment variable is set in Vercel."
    });
  }
});

app.get('/api/system/bootstrap', async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    const hash = await bcrypt.hash('AdminPassword123!', 10);
    await Profile.findOrCreate({ 
      where: { email: 'admin@fitlife.pro' }, 
      defaults: { name: 'Super Admin', password: hash, role: 'super_admin' } 
    });
    if (await TrainingPlan.count() === 0) {
      await TrainingPlan.bulkCreate([
        { id: 'plan_starter', name: 'Starter Protocol', price: 49.00, description: 'Foundational guidance.', features: ['Dashboard', 'Support'] },
        { id: 'plan_performance', name: 'Pro Performance', price: 199.00, description: 'Rapid transformation.', features: ['Custom Programming', 'Direct Messaging'] },
        { id: 'plan_executive', name: 'Elite Executive', price: 499.00, description: 'Human optimization.', features: ['24/7 Support', 'Bio-feedback'] }
      ]);
    }
    res.json({ success: true, message: 'Vault Core Synced.' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Leads
app.get('/api/leads/all', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/leads/:id', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const l = await Lead.findByPk(req.params.id);
    if (!l) return res.status(404).json({ success: false, message: 'Lead not found' });
    await l.update(req.body);
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Profiles
app.get('/api/profiles/me', auth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/profiles/:id', auth, checkRole(['super_admin', 'admin', 'nutritionist']), async (req, res) => {
  try {
    const p = await Profile.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    await p.update(req.body);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles', auth, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { where: { role } } : {};
    const data = await Profile.findAll({ ...filter, attributes: { exclude: ['password'] } });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Plans
app.get('/api/plans', async (req, res) => {
  try {
    const p = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Checkout
app.post('/api/checkout/create-session', async (req, res) => {
  try {
    const { planId, customerEmail } = req.body;
    const plan = await TrainingPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: Math.round(plan.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      customer_email: customerEmail || undefined,
    });

    res.json({ success: true, url: session.url });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Auth
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
    const hash = await bcrypt.hash(req.body.password || 'FitLife2024!', 10);
    const p = await Profile.create({ ...req.body, password: hash });
    const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
    res.status(201).json({ success: true, data: p, token });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
