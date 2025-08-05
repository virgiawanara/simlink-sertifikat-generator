"use strict";

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
        type: DataTypes.ENUM("admin"),
        allowNull: false,
        defaultValue: "admin",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
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
    User.hasMany(models.Certificate, {
      foreignKey: "userId",
      as: "certificates",
    });
  };

  return User;
};
