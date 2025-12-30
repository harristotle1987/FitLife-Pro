
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Testimonial = sequelize.define('Testimonial', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientTitle: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quote: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
}, {
  timestamps: true,
  tableName: 'Testimonials', // Matches the SQL table precisely
  freezeTableName: true
});

module.exports = Testimonial;
