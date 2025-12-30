
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
const DEFAULT_REF = "euuqfcglulkeyxaqcpvz";

/**
 * PRODUCTION-READY CONNECTION LOGIC
 * This function ensures we use the Supavisor Pooler (Port 6543)
 * which is required for stable connections from Vercel/Serverless.
 */
function getConnectionString() {
  // 1. High Priority: Explicitly set Vercel Environment Variable
  if (process.env.DATABASE_URL) {
    console.log("[DB] Using DATABASE_URL from environment.");
    return process.env.DATABASE_URL;
  }
  
  // 2. Fallback: Manual Construction for the AWS West 1 Pooler
  const ref = DEFAULT_REF;
  const user = `postgres.${ref}`;
  const host = `aws-1-eu-west-1.pooler.supabase.com`;
  const port = 6543;
  const db = "postgres";
  const params = "sslmode=require&supavisor_session=true";

  console.log(`[DB] Using manual fallback to ${host}:${port}`);
  return `postgresql://${user}:${DB_PASSWORD}@${host}:${port}/${db}?${params}`;
}

const sequelize = new Sequelize(getConnectionString(), {
  dialect: 'postgres',
  dialectModule: pg,
  logging: (msg) => console.log(`[SEQUELIZE] ${msg.substring(0, 100)}...`),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 25000,
  },
  pool: {
    max: 4,
    min: 0,
    acquire: 40000,
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
  nutritionalProtocol: { type: DataTypes.TEXT, defaultValue: 'Pending metabolic assessment.' }
}, { tableName: 'profiles', underscored: true, timestamps: true });

const TrainingPlan = sequelize.define('TrainingPlan', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: DataTypes.TEXT,
  features: { type: DataTypes.JSONB, defaultValue: [] }
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

// --- ROUTES ---

app.get('/api/system/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      success: true, 
      status: 'operational', 
      database: {
        connected: true,
        host: sequelize.config.host,
        port: sequelize.config.port,
        pooler: sequelize.config.port === 6543
      }
    });
  } catch (e) {
    res.status(503).json({ 
      success: false, 
      status: 'degraded', 
      error: e.message,
      help: "Ensure Port 6543 is used in your Vercel DATABASE_URL.",
      diagnostic: {
        host: sequelize.config.host,
        port: sequelize.config.port,
        protocol: 'postgres'
      }
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

app.post('/api/profiles/login', async (req, res) => {
  try {
    const p = await Profile.findOne({ where: { email: req.body.email } });
    if (p && await bcrypt.compare(req.body.password, p.password)) {
      const token = jwt.sign({ id: p.id, role: p.role }, JWT_SECRET);
      res.json({ success: true, data: p, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/leads/all', auth, async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/plans', async (req, res) => {
  try {
    const p = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles/me', auth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
