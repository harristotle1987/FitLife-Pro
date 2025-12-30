
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
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || 'sk_test_51Pubx8P1qC7BzO0wxjFThVG8TkyWBV6PtKUb3w8OpsYzC1w6rI9FS5xXtFqSyhS9CnUYGEHRIpU6LEkjfyQlrVkC009KGTGs8Y';

const stripe = new Stripe(STRIPE_SECRET);

const DB_PASSWORD = "Colony082987Fit";
const DEFAULT_REF = "euuqfcglulkeyxaqcpvz";

function getConnectionString() {
  let url = process.env.DATABASE_URL;
  if (url) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?sslmode=require`;
  }
  const user = `postgres.${DEFAULT_REF}`;
  const host = `aws-1-eu-west-1.pooler.supabase.com`;
  return `postgresql://${user}:${DB_PASSWORD}@${host}:6543/postgres?sslmode=require`;
}

pg.defaults.ssl = true;

const sequelize = new Sequelize(getConnectionString(), {
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

const Profile = sequelize.define('Profile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'member' },
  permissions: { type: DataTypes.JSONB, defaultValue: {} },
  phone: { type: DataTypes.STRING },
  avatarUrl: { type: DataTypes.STRING, field: 'avatar_url' },
  bio: { type: DataTypes.TEXT },
  activePlanId: { type: DataTypes.STRING, defaultValue: 'plan_starter', field: 'active_plan_id' },
  assignedCoachId: { type: DataTypes.STRING, field: 'assigned_coach_id' },
  assignedCoachName: { type: DataTypes.STRING, defaultValue: 'Coach Bolt', field: 'assigned_coach_name' },
  assignedNutritionistName: { type: DataTypes.STRING, field: 'assigned_nutritionist_name' },
  nutritionalProtocol: { type: DataTypes.TEXT, defaultValue: 'Pending metabolic assessment.', field: 'nutritional_protocol' },
  createdAt: { type: DataTypes.DATE, field: 'created_at', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
}, { tableName: 'profiles', timestamps: true });

const Lead = sequelize.define('Lead', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  goal: { type: DataTypes.TEXT },
  source: { type: DataTypes.STRING, defaultValue: 'Contact_Form' },
  status: { type: DataTypes.STRING, defaultValue: 'New' },
  createdAt: { type: DataTypes.DATE, field: 'created_at', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
}, { tableName: 'leads', timestamps: true });

const TrainingPlan = sequelize.define('TrainingPlan', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: DataTypes.TEXT,
  features: { type: DataTypes.JSONB, defaultValue: [] },
  createdAt: { type: DataTypes.DATE, field: 'created_at', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
}, { tableName: 'plans', timestamps: true });

app.use(cors());
app.use(express.json());

// Public Bootstrap
app.get('/api/system/bootstrap', async (req, res) => {
  try {
    await sequelize.query(`CREATE TABLE IF NOT EXISTS profiles (id UUID PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT)`);
    await sequelize.query(`CREATE TABLE IF NOT EXISTS leads (id SERIAL PRIMARY KEY, name TEXT, email TEXT, phone TEXT, goal TEXT)`);
    await sequelize.query(`CREATE TABLE IF NOT EXISTS plans (id TEXT PRIMARY KEY, name TEXT, price DECIMAL, description TEXT)`);

    const migrations = [
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_plan_id TEXT DEFAULT 'plan_starter'",
      "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_coach_name TEXT DEFAULT 'Coach Bolt'"
    ];
    for (const sql of migrations) await sequelize.query(sql).catch(() => {});
    await sequelize.sync({ alter: true });
    
    const hash = await bcrypt.hash('AdminPassword123!', 10);
    await Profile.findOrCreate({ 
      where: { email: 'admin@fitlife.pro' }, 
      defaults: { name: 'Super Admin', password: hash, role: 'super_admin', permissions: { all: true } } 
    });
    res.json({ success: true, message: 'Vault core infrastructure synchronized.' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/profiles/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const p = await Profile.create({ name, email, password: hash, role: 'member' });
    const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
    res.json({ success: true, data: p, token });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/profiles/login', async (req, res) => {
  try {
    const p = await Profile.findOne({ where: { email: req.body.email } });
    if (p && await bcrypt.compare(req.body.password, p.password)) {
      const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
      res.json({ success: true, data: p, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/me', async (req, res) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(h.split(' ')[1], JWT_SECRET);
    const p = await Profile.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(401).json({ success: false }); }
});

const adminAuth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(h.split(' ')[1], JWT_SECRET);
    if (decoded.role === 'super_admin' || decoded.role === 'admin') {
      req.user = decoded;
      next();
    } else res.status(403).json({ success: false });
  } catch (e) { res.status(401).json({ success: false }); }
};

app.get('/api/profiles', adminAuth, async (req, res) => {
  try {
    const { role } = req.query;
    const profiles = await Profile.findAll({ where: role ? { role } : {}, attributes: { exclude: ['password'] } });
    res.json({ success: true, data: profiles });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.patch('/api/profiles/:id', adminAuth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.params.id);
    if (p) {
      await p.update(req.body);
      res.json({ success: true, data: p });
    } else res.status(404).json({ success: false });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/profiles/manual', adminAuth, async (req, res) => {
  try {
    const { name, email, password, role, permissions, phone } = req.body;
    const hash = await bcrypt.hash(password || 'FitLife2024!', 10);
    const p = await Profile.create({ 
      name, 
      email, 
      password: hash, 
      role: role || 'member', 
      permissions: permissions || {}, 
      phone 
    });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/leads/all', adminAuth, async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/plans', async (req, res) => {
  try {
    const p = await TrainingPlan.findAll();
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
