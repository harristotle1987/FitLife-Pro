
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes, Op } from 'sequelize';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET) {
  console.warn("STRIPE_SECRET_KEY is missing. Payments will fail.");
}

const stripe = new Stripe(STRIPE_SECRET || 'dummy_key_for_init');

function getConnectionString() {
  if (process.env.DATABASE_URL) {
    return `${process.env.DATABASE_URL}?sslmode=require`;
  }
  // Fallback for local development if variables aren't set, but secure for git
  console.warn("DATABASE_URL is missing. Please set it in your environment variables.");
  return process.env.DATABASE_URL || '';
}

pg.defaults.ssl = true;

// Ensure we have a connection string before initializing Sequelize
const connectionString = getConnectionString();
let sequelize;

if (connectionString) {
  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false, 
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
      keepAlive: true,
      connectTimeout: 60000
    },
    pool: { max: 5, min: 1, acquire: 60000, idle: 10000 }
  });
} else {
  // Mock sequelize for build phase if needed, or throw error
  console.error("Critical: Database connection string is missing.");
}

const timestampConfig = {
  created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
};

// Define Models only if sequelize is initialized
const Lead = sequelize ? sequelize.define('Lead', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  goal: { type: DataTypes.TEXT },
  source: { type: DataTypes.STRING, defaultValue: 'Contact_Form' },
  status: { type: DataTypes.STRING, defaultValue: 'New' },
  ...timestampConfig
}, { tableName: 'leads', underscored: true, timestamps: true }) : null;

const Profile = sequelize ? sequelize.define('Profile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'member' },
  phone: { type: DataTypes.STRING },
  avatar_url: { type: DataTypes.STRING },
  bio: { type: DataTypes.TEXT },
  activePlanId: { type: DataTypes.STRING, defaultValue: 'plan_starter' },
  assignedCoachId: { type: DataTypes.STRING },
  assignedCoachName: { type: DataTypes.STRING, defaultValue: 'Coach Bolt' },
  assignedNutritionistName: { type: DataTypes.STRING },
  nutritionalProtocol: { type: DataTypes.TEXT, defaultValue: 'Pending metabolic assessment.' },
  permissions: { type: DataTypes.JSONB, defaultValue: {} },
  ...timestampConfig
}, { tableName: 'profiles', underscored: true, timestamps: true }) : null;

const TrainingPlan = sequelize ? sequelize.define('TrainingPlan', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: DataTypes.TEXT,
  features: { type: DataTypes.JSONB, defaultValue: [] },
  ...timestampConfig
}, { tableName: 'plans', underscored: true, timestamps: true }) : null;

const MemberProgress = sequelize ? sequelize.define('MemberProgress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  member_id: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  weight: { type: DataTypes.DECIMAL(10, 2) },
  body_fat: { type: DataTypes.DECIMAL(10, 2) },
  performance_score: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  coach_id: { type: DataTypes.UUID },
  coach_name: { type: DataTypes.STRING },
  ...timestampConfig
}, { tableName: 'member_progress', underscored: true, timestamps: true }) : null;

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

const adminAuth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(h.split(' ')[1], JWT_SECRET);
    if (decoded.role === 'super_admin' || decoded.role === 'admin') {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ success: false, message: 'Forbidden' });
    }
  } catch (e) { res.status(401).json({ success: false, message: 'Invalid Session' }); }
};

const permissionCheck = (permission) => (req, res, next) => {
  if (req.user.role === 'super_admin' || (req.user.permissions && req.user.permissions[permission])) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: Insufficient Privileges' });
};

// Middleware to check if DB is ready
const checkDb = (req, res, next) => {
  if (!sequelize) {
    return res.status(503).json({ success: false, message: 'Database not configured. Set DATABASE_URL.' });
  }
  next();
};

app.get('/api/system/health', checkDb, async (req, res) => {
  try {
    await sequelize.query('SELECT 1+1 AS result');
    res.json({ success: true, status: 'operational', host: sequelize.config.host });
  } catch (e) {
    res.status(503).json({ success: false, status: 'degraded', error: e.message });
  }
});

app.get('/api/system/bootstrap', checkDb, async (req, res) => {
  try {
    await sequelize.sync({ alter: true });
    
    const hash = await bcrypt.hash('AdminPassword123!', 10);
    await Profile.findOrCreate({ 
      where: { email: 'admin@fitlife.pro' }, 
      defaults: { name: 'Super Admin', password: hash, role: 'super_admin' } 
    });

    res.json({ success: true, message: 'Vault Core Infrastructure Synchronized.' });
  } catch (e) { 
    res.status(500).json({ success: false, error: e.message }); 
  }
});

app.post('/api/profiles/manual', adminAuth, permissionCheck('canManageAdmins'), checkDb, async (req, res) => {
  try {
    const { name, email, password, role, activePlanId, phone } = req.body;
    
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
       return res.status(403).json({ success: false, message: 'Only a Super Admin can create another Super Admin.' });
    }

    const hash = await bcrypt.hash(password || 'FitLife2024!', 10);
    
    const exists = await Profile.findOne({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Identifier already exists in Vault.' });

    const p = await Profile.create({
      name,
      email,
      password: hash,
      role: role || 'member',
      phone: phone || '',
      activePlanId: activePlanId || 'plan_starter',
      permissions: role === 'admin' ? { canManageLeads: true, canManageProgress: true } : {}
    });
    res.json({ success: true, data: p });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/profiles', adminAuth, checkDb, async (req, res) => {
  try {
    const { role } = req.query;
    const profiles = await Profile.findAll({ 
      where: role ? { role } : {},
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: profiles });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/profiles/:id', adminAuth, checkDb, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const targetUser = await Profile.findByPk(id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (req.user.role !== 'super_admin') {
      if (updates.role || updates.permissions) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot change roles or permissions.' });
      }
      if (targetUser.role === 'super_admin' || (targetUser.role === 'admin' && targetUser.id !== req.user.id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to modify this user.' });
      }
    }
    
    delete updates.password;
    delete updates.id;

    const [updatedRows] = await Profile.update(updates, { where: { id } });
    if (updatedRows > 0) {
      const p = await Profile.findByPk(id, { attributes: { exclude: ['password'] } });
      res.json({ success: true, data: p });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete('/api/profiles/:id', adminAuth, permissionCheck('canManageAdmins'), checkDb, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await Profile.findByPk(id);
    if (targetUser && targetUser.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Super Admin cannot be deleted.' });
    }
    const deleted = await Profile.destroy({ where: { id } });
    res.json({ success: !!deleted });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/leads', checkDb, async (req, res) => {
  try {
    const { name, email, phone, goal, source } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
    }
    const newLead = await Lead.create({ name, email, phone, goal, source });
    res.status(201).json({ success: true, data: newLead });
  } catch (error) {
    console.error('Error creating lead:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'This email has already requested a pass.' });
    }
    res.status(500).json({ success: false, message: 'Server error processing your request.' });
  }
});

app.get('/api/leads/all', adminAuth, permissionCheck('canManageLeads'), checkDb, async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/leads/:id', adminAuth, permissionCheck('canManageLeads'), checkDb, async (req, res) => {
  try {
    const { id } = req.params;
    await Lead.update(req.body, { where: { id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/plans', checkDb, async (req, res) => {
  try {
    const p = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/plans', adminAuth, permissionCheck('canManagePlans'), checkDb, async (req, res) => {
  try {
    const p = await TrainingPlan.create(req.body);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/plans/:id', adminAuth, permissionCheck('canManagePlans'), checkDb, async (req, res) => {
  try {
    await TrainingPlan.update(req.body, { where: { id: req.params.id } });
    const p = await TrainingPlan.findByPk(req.params.id);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/plans/:id', adminAuth, permissionCheck('canManagePlans'), checkDb, async (req, res) => {
  try {
    const deleted = await TrainingPlan.destroy({ where: { id: req.params.id } });
    res.json({ success: !!deleted });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/checkout', checkDb, async (req, res) => {
  try {
    const { planId, email } = req.body;
    const plan = await TrainingPlan.findByPk(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    if (!stripe._api.auth) {
       return res.status(500).json({ success: false, message: 'Payment gateway not configured (Missing STRIPE_SECRET_KEY).' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name, description: plan.description },
          unit_amount: Math.round(plan.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      customer_email: email || undefined,
    });
    res.json({ success: true, url: session.url });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/progress', adminAuth, permissionCheck('canManageProgress'), checkDb, async (req, res) => {
  try {
    const { member_id } = req.query;
    const p = await MemberProgress.findAll({ 
      where: member_id ? { member_id } : {},
      order: [['date', 'DESC']]
    });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/progress', adminAuth, permissionCheck('canManageProgress'), checkDb, async (req, res) => {
  try {
    const p = await MemberProgress.create({ ...req.body, coach_id: req.user.id });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/profiles/login', checkDb, async (req, res) => {
  try {
    const p = await Profile.findOne({ where: { email: req.body.email } });
    if (p && await bcrypt.compare(req.body.password, p.password)) {
      const token = jwt.sign({ id: p.id, role: p.role, permissions: p.permissions }, JWT_SECRET);
      res.json({ success: true, data: p, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/me', auth, checkDb, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
