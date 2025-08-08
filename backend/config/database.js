// config/database.js - PostgreSQL Configuration with Sequelize
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      // Jika perlu SSL di production
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false
      // }
    },
    timezone: '+07:00', // Timezone Indonesia
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
    }
  },
);

// Test connection function
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully with Sequelize');
    
    // Sync models (be careful in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // Don't alter tables, just check
      console.log('📊 Database synchronized');
    }
    
    return sequelize;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

module.exports = { sequelize, connectDB };