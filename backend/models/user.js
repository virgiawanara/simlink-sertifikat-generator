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
        type: DataTypes.ENUM("admin"), // ✅ Bisa diperluas: "admin", "user", "moderator"
        allowNull: false,
        defaultValue: "admin",
        validate: {
          isIn: [["admin"]], // ✅ Validation untuk enum values
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: "Email harus berformat valid", // ✅ Custom error message
          },
          notEmpty: {
            msg: "Email tidak boleh kosong",
          },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Password tidak boleh kosong", // ✅ Validation
          },
          len: {
            args: [6, 255],
            msg: "Password minimal 6 karakter",
          },
        },
      },
      // ✅ TAMBAHAN: Fields yang mungkin berguna
      fullName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "full_name",
        validate: {
          len: {
            args: [0, 255],
            msg: "Nama lengkap maksimal 255 karakter",
          },
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_login_at",
      },
    },
    {
      tableName: "users",
      timestamps: true, // createdAt, updatedAt
      underscored: true, // snake_case untuk kolom
      paranoid: false, // ✅ Set true jika ingin soft delete
      
      // ✅ Model-level validations
      validate: {
        emailNotEmpty() {
          if (!this.email || this.email.trim() === '') {
            throw new Error('Email tidak boleh kosong');
          }
        },
      },
      
      // ✅ Hooks untuk business logic
      hooks: {
        beforeCreate: (user, options) => {
          // Hash password, format email, dll
          if (user.email) {
            user.email = user.email.toLowerCase().trim();
          }
        },
        beforeUpdate: (user, options) => {
          if (user.email) {
            user.email = user.email.toLowerCase().trim();
          }
          if (user.changed('password')) {
            // Re-hash password jika berubah
          }
        },
      },
      
      // ✅ Indexes untuk performance
      indexes: [
        {
          unique: true,
          fields: ["email"],
          name: "users_email_unique",
        },
        {
          fields: ["role"],
          name: "users_role_index",
        },
        {
          fields: ["is_active"],
          name: "users_is_active_index",
        },
        {
          fields: ["created_at"],
          name: "users_created_at_index",
        },
      ],
    }
  );

  // ✅ UPDATED ASSOCIATIONS
  User.associate = (models) => {
    // Association untuk sertifikat yang di-issue oleh user (admin)
    User.hasMany(models.Certificate, {
      foreignKey: "issuedByUserId",
      as: "issuedCertificates", // ✅ Rename untuk clarity
    });
    
    // Association untuk sertifikat yang dimiliki user (participant)
    User.hasMany(models.Certificate, {
      foreignKey: "userId",
      as: "certificates", // ✅ Keep existing name
    });
  };

  // ✅ INSTANCE METHODS
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password; // ✅ Jangan expose password dalam JSON
    return values;
  };

  User.prototype.updateLastLogin = function() {
    return this.update({ lastLoginAt: new Date() });
  };

  // ✅ CLASS METHODS
  User.findByEmail = function(email) {
    return this.findOne({
      where: { 
        email: email.toLowerCase().trim(),
        isActive: true 
      }
    });
  };

  User.findActiveAdmins = function() {
    return this.findAll({
      where: { 
        role: 'admin',
        isActive: true 
      },
      order: [['createdAt', 'DESC']]
    });
  };

  return User;
};