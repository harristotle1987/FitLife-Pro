
const { Sequelize } = require('sequelize');
require('dotenv').config();

// SUPABASE CONNECTION STRING
// Using encoded password to prevent parsing issues
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:Colony082987%40@db.wyvgrmedubzooqmrorxb.supabase.co:5432/postgres";

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 30000 
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 60000,
    idle: 10000
  }
});

module.exports = sequelize;
