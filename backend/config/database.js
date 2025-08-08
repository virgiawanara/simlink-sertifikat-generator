// GANTI SELURUH ISI FILE backend/config/database.js dengan ini:

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres', // ✅ UBAH dari 'mysql' ke 'postgres'
    port: process.env.DB_PORT,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // ✅ PostgreSQL specific options
    dialectOptions: {
      // Jika perlu SSL di production
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false
      // }
    },
    timezone: '+07:00' // Sesuaikan timezone
  },
);

module.exports = sequelize;