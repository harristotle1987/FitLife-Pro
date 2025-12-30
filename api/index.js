
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

function getSanitizedConnectionString() {
  const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  
  if (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://')) {
    return envUrl;
  }

  if (envUrl.startsWith('https://')) {
    const match = envUrl.match(/https:\/\/([^.]+)\.supabase/);
    const ref = (match && match[1]) ? match[1] : FALLBACK_REF;
    return `postgresql://postgres:${DB_PASSWORD}@db.${ref}.supabase.co:5432/postgres`;
  }

  return `postgresql://postgres:${DB_PASSWORD}@db.${FALLBACK_REF}.supabase.co:5432/postgres`;
}

const connectionString = getSanitizedConnectionString();

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 60000,
  },
  pool: {
    max: 1,
    min: 0,
    acquire: 60000,
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

// --- SYSTEM & SEED ROUTES ---

app.get('/api/system/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, status: 'operational', database: 'connected' });
  } catch (e) {
    let hint = "Check if the Supabase project is 'Paused' in the Supabase Dashboard.";
    if (e.message.includes('ENOTFOUND')) {
      hint = "DNS Resolution failed. This almost always means the project is Paused or Inactive in Supabase.";
    }
    res.status(503).json({ success: false, status: 'degraded', error: e.message, hint });
  }
});

app.get('/api/system/bootstrap', async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    const hash = await bcrypt.hash('AdminPassword123!', 10);
    const [admin, created] = await Profile.findOrCreate({ 
      where: { email: 'admin@fitlife.pro' }, 
      defaults: { name: 'Super Admin', password: hash, role: 'super_admin' } 
    });

    // Seed default plans if they don't exist
    const plansCount = await TrainingPlan.count();
    if (plansCount === 0) {
      await TrainingPlan.bulkCreate([
        { id: 'plan_starter', name: 'Starter Protocol', price: 49.00, description: 'Foundational guidance.', features: ['Dashboard', 'Support'] },
        { id: 'plan_performance', name: 'Pro Performance', price: 199.00, description: 'Rapid transformation.', features: ['Custom Programming', 'Direct Messaging'] },
        { id: 'plan_executive', name: 'Elite Executive', price: 499.00, description: 'Human optimization.', features: ['24/7 Support', 'Bio-feedback'] },
        { id: 'plan_pinnacle', name: 'The Pinnacle', price: 1000.00, description: 'Bespoke lifestyle engineering.', features: ['VIP Access', 'Bloodwork Coordination'] }
      ]);
    }

    res.json({ success: true, message: 'Schema Synced and Seeded.', adminCreated: created });
  } catch (e) { 
    res.status(500).json({ success: false, error: e.message }); 
  }
});

// --- PROFILE ROUTES ---

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

app.get('/api/profiles', auth, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { where: { role } } : {};
    const profiles = await Profile.findAll({ ...filter, attributes: { exclude: ['password'] } });
    res.json({ success: true, data: profiles });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/profiles/:id', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    await Profile.update(req.body, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Profile Updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- LEAD ROUTES ---

app.post('/api/leads', async (req, res) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json({ success: true, data: lead });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/leads/all', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/leads/:id', auth, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    await Lead.update(req.body, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Lead Updated' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- PROGRESS ROUTES ---

app.get('/api/progress', auth, async (req, res) => {
  try {
    const { member_id } = req.query;
    // Members can only see their own progress unless requester is admin
    const targetId = (req.user.role === 'member') ? req.user.id : member_id;
    if (!targetId) return res.status(400).json({ success: false, message: 'Member ID required' });
    
    const logs = await Progress.findAll({ 
      where: { memberId: targetId }, 
      order: [['date', 'DESC']] 
    });
    res.json({ success: true, data: logs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/progress', auth, checkRole(['super_admin', 'admin', 'coach']), async (req, res) => {
  try {
    const { member_id, weight, body_fat, performance_score } = req.body;
    const log = await Progress.create({
      memberId: member_id,
      coachId: req.user.id,
      weight,
      bodyFat: body_fat,
      performanceScore: performance_score
    });
    res.status(201).json({ success: true, data: log });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// --- UTILITY ROUTES ---

app.get('/api/plans', async (req, res) => {
  try {
    const p = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/finance', auth, checkRole(['super_admin']), async (req, res) => {
  // Simple mock of financial data based on active plans
  try {
    const members = await Profile.findAll({ where: { role: 'member' } });
    const plans = await TrainingPlan.findAll();
    const records = members.map(m => {
      const plan = plans.find(p => p.id === m.activePlanId);
      return {
        profile_id: m.id,
        athlete_name: m.name,
        email: m.email,
        status: 'active',
        next_billing: new Date(Date.now() + 2592000000).toISOString(),
        monthly_rate: plan ? parseFloat(plan.price) : 0
      };
    });
    res.json({ success: true, data: records });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await TrainingPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    
    // In a real app, you'd create a Stripe session here.
    // Since we're in a demo/dev environment, we'll return a mock success.
    res.json({ success: true, url: '#' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
