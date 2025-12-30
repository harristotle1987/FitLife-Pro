
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrainingPlan = sequelize.define('TrainingPlan', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  durationWeeks: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
}, {
  timestamps: true,
  tableName: 'TrainingPlans', // Matches the SQL table precisely
  freezeTableName: true
});

module.exports = TrainingPlan;
