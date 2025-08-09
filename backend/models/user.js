// models/User.js - Sequelize Model for User
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'admin',
        validate: {
          isIn: [['admin']]
        },
        field: "role",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        },
        field: "email",
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password",
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
      indexes: [
        {
          unique: true,
          fields: ["email"],
        },
        {
          fields: ["role"],
        },
      ],
    }
  );

  User.associate = (models) => {
    // Association untuk certificates yang diterbitkan user
    User.hasMany(models.Certificate, {
      foreignKey: "issuedByUserId",
      as: "issuedCertificates",
    });
    
    // Association untuk certificates milik user (opsional)
    User.hasMany(models.Certificate, {
      foreignKey: "userId", 
      as: "certificates",
    });
  };

  return User;
};