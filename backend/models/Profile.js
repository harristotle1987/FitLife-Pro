
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'member',
  },
  stripe_customer_id: DataTypes.STRING,
  phone: DataTypes.STRING,
  address: DataTypes.STRING,
  avatar_url: DataTypes.TEXT,
  bio: {
    type: DataTypes.TEXT,
    defaultValue: 'New Athlete Profile - System Initialization Pending.'
  },
  activePlanId: {
    type: DataTypes.STRING,
    defaultValue: 'plan_starter'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  assignedCoachName: {
    type: DataTypes.STRING,
    defaultValue: 'Coach Bolt'
  }
}, {
  timestamps: true,
  tableName: 'Profiles'
});

module.exports = Profile;
