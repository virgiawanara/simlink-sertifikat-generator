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
        field: "full_name",
      },
      participantNIK: {
        type: DataTypes.STRING(16),
        allowNull: true,
        unique: true,
        field: "nik",
      },
      gender: {
        // PERBAIKAN: Ubah menjadi konsisten dengan Postman dan validator
        type: DataTypes.ENUM("Laki-laki", "Perempuan"), // Huruf kecil 'l' di 'laki'
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
        // PERBAIKAN: Sesuaikan dengan validator
        type: DataTypes.ENUM("Buat Baru", "Perpanjang"),
        allowNull: false,
        field: "certificate_type",
      },
      licenseClass: {
        // PERBAIKAN: Tambahkan D sesuai validator, atau sesuaikan validator
        type: DataTypes.ENUM("A", "B", "C"),
        allowNull: false,
        field: "license_class",
      },
      domicile: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      participantPhotoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "participant_photo_url",
      },
      signatureQrUrl: {
        type: DataTypes.STRING(255),
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
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "issue_date",
        defaultValue: DataTypes.NOW, // Auto set jika tidak disediakan
      },
      expirationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "expiration_date",
      },
      certificateFileUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "certificate_file_url",
      },
      issuedByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "issued_by_user_id",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "user_id",
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
          fields: ["nik"], // Index untuk NIK
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
          fields: ["full_name"], // Index untuk pencarian nama
        },
      ],
    }
  );

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.User, {
      foreignKey: "issuedByUserId",
      as: "issuer",
    });
  };

  return Certificate;
};
