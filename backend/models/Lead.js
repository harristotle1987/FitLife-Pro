
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
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
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  goal: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'Contact_Form',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'New',
    validate: {
      isIn: [['New', 'Contacted', 'Qualified', 'Closed']]
    }
  }
}, {
  timestamps: true,
  tableName: 'Leads'
});

module.exports = Lead;
