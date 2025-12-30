const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  member_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  coach_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  body_fat: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  performance_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  timestamps: true,
  tableName: 'Progress'
});

module.exports = Progress;