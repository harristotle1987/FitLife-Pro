const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize with PostgreSQL connection string
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/fitlifepro', {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

module.exports = sequelize;