
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

const timestampConfig = {
  created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
  updated_at: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
};

const Lead = sequelize.define('Lead', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  goal: { type: DataTypes.TEXT },
  source: { type: DataTypes.STRING, defaultValue: 'Contact_Form' },
  status: { type: DataTypes.STRING, defaultValue: 'New' },
  ...timestampConfig
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
  ...timestampConfig
}, { tableName: 'profiles', underscored: true, timestamps: true });

const TrainingPlan = sequelize.define('TrainingPlan', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: DataTypes.TEXT,
  features: { type: DataTypes.JSONB, defaultValue: [] },
  ...timestampConfig
}, { tableName: 'plans', underscored: true, timestamps: true });

const Testimonial = sequelize.define('Testimonial', {
  client_name: { type: DataTypes.STRING, allowNull: false },
  client_title: { type: DataTypes.STRING },
  quote: { type: DataTypes.TEXT, allowNull: false },
  rating: { type: DataTypes.INTEGER, defaultValue: 5 },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: true },
  ...timestampConfig
}, { tableName: 'testimonials', underscored: true, timestamps: true });

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

app.get('/api/system/health', async (req, res) => {
  try {
    await sequelize.query('SELECT 1+1 AS result');
    res.json({ success: true, status: 'operational', host: sequelize.config.host });
  } catch (e) {
    res.status(503).json({ success: false, status: 'degraded', error: e.message });
  }
});

app.get('/api/system/bootstrap', async (req, res) => {
  try {
    await sequelize.query(`
      DO $$ 
      DECLARE
        t text;
      BEGIN 
        FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('plans', 'leads', 'profiles', 'testimonials')
        LOOP
          BEGIN
            EXECUTE 'ALTER TABLE ' || t || ' ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()';
            EXECUTE 'ALTER TABLE ' || t || ' ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()';
          EXCEPTION WHEN others THEN NULL;
          END;
          EXECUTE 'UPDATE ' || t || ' SET created_at = NOW() WHERE created_at IS NULL';
          EXECUTE 'UPDATE ' || t || ' SET updated_at = NOW() WHERE updated_at IS NULL';
        END LOOP;
      END $$;
    `);

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
        { id: 'plan_executive', name: 'Elite Executive', price: 499.00, description: 'Human optimization.', features: ['24/7 Support', 'Bio-feedback'] },
        { id: 'plan_pinnacle', name: 'The Pinnacle', price: 1000.00, description: 'VIP bespoke experience.', features: ['1-on-1 Coaching', 'Personal Chef Meal Planning'] }
      ]);
    }

    if (await Testimonial.count() === 0) {
      await Testimonial.bulkCreate([
        { client_name: 'Sarah Jenkins', client_title: 'Executive Director', quote: "The Elite Executive plan changed my body and my clarity at work.", rating: 5 },
        { client_name: 'Marcus V.', client_title: 'Founder', quote: "Pinnacle coaching is the only way to train. Surgical attention to detail.", rating: 5 },
        { client_name: 'David L.', client_title: 'Software Architect', quote: "Science-backed results. Got to 8% body fat in record time.", rating: 5 }
      ]);
    }

    res.json({ success: true, message: 'Infrastructure Ready and Sanitized.' });
  } catch (e) { 
    res.status(500).json({ success: false, error: e.message }); 
  }
});

app.get('/api/testimonials', async (req, res) => {
  try {
    const t = await Testimonial.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: t });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/profiles', async (req, res) => {
  try {
    const { role } = req.query;
    const profiles = await Profile.findAll({ 
      where: role ? { role } : {},
      attributes: { exclude: ['password'] } 
    });
    res.json({ success: true, data: profiles });
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

app.get('/api/profiles/me', auth, async (req, res) => {
  try {
    const p = await Profile.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/leads', async (req, res) => {
  try {
    const l = await Lead.create(req.body);
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/leads/all', auth, async (req, res) => {
  try {
    const l = await Lead.findAll({ order: [['created_at', 'DESC']] });
    res.json({ success: true, data: l });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/plans', async (req, res) => {
  try {
    const p = await TrainingPlan.findAll({ order: [['price', 'ASC']] });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

export default app;
