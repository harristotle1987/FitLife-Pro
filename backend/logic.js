
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// --- DB CONFIG ---
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:Colony082987%40@db.wyvgrmedubzooqmrorxb.supabase.co:5432/postgres";
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });

// --- MODELS ---
const Lead = sequelize.define('Lead', { name: DataTypes.STRING, email: { type: DataTypes.STRING, unique: true }, phone: DataTypes.STRING, goal: DataTypes.TEXT, source: DataTypes.STRING, status: { type: DataTypes.STRING, defaultValue: 'New' } });
const Profile = sequelize.define('Profile', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, name: DataTypes.STRING, email: { type: DataTypes.STRING, unique: true }, password: DataTypes.STRING, role: { type: DataTypes.STRING, defaultValue: 'member' }, activePlanId: { type: DataTypes.STRING, defaultValue: 'plan_starter' }, stripe_customer_id: DataTypes.STRING, bio: DataTypes.TEXT, assignedCoachName: { type: DataTypes.STRING, defaultValue: 'Coach Bolt' } });
const Progress = sequelize.define('Progress', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, member_id: DataTypes.UUID, coach_id: DataTypes.UUID, weight: DataTypes.FLOAT, body_fat: DataTypes.FLOAT, performance_score: DataTypes.INTEGER, date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW } });
const TrainingPlan = sequelize.define('TrainingPlan', { id: { type: DataTypes.STRING, primaryKey: true }, name: DataTypes.STRING, description: DataTypes.TEXT, price: DataTypes.DECIMAL, durationWeeks: DataTypes.INTEGER, features: DataTypes.JSONB });
const Testimonial = sequelize.define('Testimonial', { clientName: DataTypes.STRING, clientTitle: DataTypes.STRING, quote: DataTypes.TEXT, isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false }, rating: DataTypes.INTEGER });

// --- MIDDLEWARE ---
const JWT_SECRET = process.env.JWT_SECRET || 'fitlife_vault_key_2024';
const auth = (req, res, next) => {
  const h = req.headers.authorization; if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); } catch (e) { res.status(401).json({ success: false, message: 'Invalid Session' }); }
};
const adminAuth = (req, res, next) => { if (!['admin', 'super_admin', 'nutritionist'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access Denied' }); next(); };

// --- ROUTES ---
const router = require('express').Router();

router.post('/leads', async (req, res) => { try { const l = await Lead.create(req.body); res.status(201).json({ success: true, data: l }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } });
router.get('/leads/all', auth, adminAuth, async (req, res) => { const l = await Lead.findAll({ order: [['createdAt', 'DESC']] }); res.json({ success: true, data: l }); });
router.patch('/leads/:id', auth, adminAuth, async (req, res) => { const l = await Lead.findByPk(req.params.id); if (l) { await l.update(req.body); res.json({ success: true }); } else res.status(404).json({ success: false }); });

router.post('/profiles/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try { const p = await Profile.create({ name, email, password: hash }); res.json({ success: true, data: p, token: jwt.sign({ id: p.id, role: p.role }, JWT_SECRET) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.post('/profiles/login', async (req, res) => {
  const p = await Profile.findOne({ where: { email: req.body.email } });
  if (p && await bcrypt.compare(req.body.password, p.password)) res.json({ success: true, data: p, token: jwt.sign({ id: p.id, role: p.role }, JWT_SECRET) });
  else res.status(401).json({ success: false, message: 'Invalid Credentials' });
});
router.get('/profiles/me', auth, async (req, res) => { const p = await Profile.findByPk(req.user.id); res.json({ success: true, data: p }); });
router.get('/profiles', auth, adminAuth, async (req, res) => { const p = await Profile.findAll({ where: { role: req.query.role || 'member' } }); res.json({ success: true, data: p }); });

router.get('/plans', async (req, res) => { const p = await TrainingPlan.findAll(); res.json({ success: true, data: p }); });
router.get('/testimonials/featured', async (req, res) => { const t = await Testimonial.findAll({ where: { isFeatured: true } }); res.json({ success: true, data: t }); });

router.get('/progress', auth, async (req, res) => { const logs = await Progress.findAll({ where: { member_id: req.query.member_id }, order: [['date', 'DESC']] }); res.json({ success: true, data: logs }); });
router.post('/progress', auth, adminAuth, async (req, res) => { const log = await Progress.create({ ...req.body, coach_id: req.user.id }); res.status(201).json({ success: true, data: log }); });

module.exports = { sequelize, router, auth, adminAuth };
