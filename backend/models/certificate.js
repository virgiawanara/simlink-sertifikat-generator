"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Certificate = sequelize.define(
    "Certificate",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      participantFullName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "participant_full_name", // ✅ KONSISTEN dengan nama field
      },
      participantNIK: {
        type: DataTypes.STRING(16),
        allowNull: true,
        unique: true,
        field: "participant_nik", // ✅ KONSISTEN dengan nama field
      },
      gender: {
        type: DataTypes.ENUM("Laki-laki", "Perempuan"),
        allowNull: false,
      },
      birthPlace: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "birth_place",
      },
      birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "birth_date",
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      certificateType: {
        type: DataTypes.ENUM("Buat Baru", "Perpanjang"), // ✅ KONSISTEN dengan frontend
        allowNull: false,
        field: "certificate_type",
      },
      licenseClass: {
        type: DataTypes.ENUM("A", "B", "C"),
        allowNull: false,
        field: "license_class",
      },
      domicile: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      participantPhotoUrl: {
        type: DataTypes.STRING(500), // ✅ DIPERBESAR untuk file paths yang panjang
        allowNull: true,
        field: "participant_photo_url",
      },
      signatureQrUrl: {
        type: DataTypes.STRING(500), // ✅ DIPERBESAR untuk file paths yang panjang
        allowNull: true,
        field: "signature_qr_url",
      },
      certificateNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: "certificate_number",
      },
      issueDate: {
        type: DataTypes.DATE, // ✅ UBAH ke DATE (bukan DATEONLY) untuk timestamp lengkap
        allowNull: false,
        field: "issue_date",
        defaultValue: DataTypes.NOW,
      },
      expirationDate: {
        type: DataTypes.DATE, // ✅ UBAH ke DATE (bukan DATEONLY) untuk timestamp lengkap
        allowNull: true,
        field: "expiration_date",
      },
      certificateFileUrl: {
        type: DataTypes.STRING(500), // ✅ DIPERBESAR untuk file paths yang panjang
        allowNull: true,
        field: "certificate_file_url",
      },
      issuedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "issued_by_user_id",
        references: {
          model: 'users', // ✅ TAMBAH FOREIGN KEY REFERENCE
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "user_id",
        references: {
          model: 'users', // ✅ TAMBAH FOREIGN KEY REFERENCE jika diperlukan
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
    },
    {
      tableName: "certificates",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["certificate_number"],
        },
        {
          unique: true,
          fields: ["participant_nik"], // ✅ KONSISTEN dengan field name
        },
        {
          fields: ["issued_by_user_id"],
        },
        {
          fields: ["certificate_type"],
        },
        {
          fields: ["license_class"],
        },
        {
          fields: ["user_id"],
        },
        {
          fields: ["participant_full_name"], // ✅ KONSISTEN dengan field name
        },
      ],
    }
  );

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.User, {
      foreignKey: "issuedByUserId",
      as: "issuer",
    });
    
    // ✅ TAMBAH ASSOCIATION untuk userId jika diperlukan
    Certificate.belongsTo(models.User, {
      foreignKey: "userId", 
      as: "participant",
    });
  };

  return Certificate;
};