// models/Certificate.js - Model yang diperbaiki dan konsisten
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Certificate extends Model {
    static associate(models) {
      // Association untuk user yang menerbitkan certificate
      Certificate.belongsTo(models.User, {
        foreignKey: "issued_by_user_id", // ✅ PERBAIKAN: konsisten dengan database
        as: "issuer",
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      
      // Association untuk user pemilik certificate (opsional)
      Certificate.belongsTo(models.User, {
        foreignKey: "user_id", // ✅ PERBAIKAN: konsisten dengan database
        as: "participant",
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }

  Certificate.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    // ✅ PERBAIKAN: Gunakan nama field database secara konsisten
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "full_name",
    },
    nik: {
      type: DataTypes.STRING(16),
      allowNull: false, // ✅ PERBAIKAN: NIK sekarang wajib diisi
      unique: true,
      validate: {
        notNull: {
          msg: "NIK wajib diisi"
        },
        notEmpty: {
          msg: "NIK tidak boleh kosong"
        },
        len: {
          args: [16, 16],
          msg: "NIK harus tepat 16 digit"
        },
        isNumeric: {
          msg: "NIK harus berupa angka"
        }
      },
      field: "nik",
    },
    gender: {
      type: DataTypes.ENUM("Laki-laki", "Perempuan"),
      allowNull: false,
      field: "gender",
    },
    birth_place: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "birth_place",
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "birth_date",
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 17,
        max: 100
      },
      field: "age",
    },
    // ✅ PERBAIKAN: Sesuai spesifikasi ('Baru', 'Perpanjang')
    certificate_type: {
      type: DataTypes.ENUM("Baru", "Perpanjang"),
      allowNull: false,
      field: "certificate_type",
    },
    // ✅ PERBAIKAN: Semua 11 opsi sesuai database
    license_class: {
      type: DataTypes.ENUM(
        "A", "A Umum", "B1", "B1 Umum", "B2", "B2 Umum", 
        "C", "C1", "C2", "D", "D1"
      ),
      allowNull: false,
      field: "license_class",
    },
    domicile: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "domicile",
    },
    participant_photo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "participant_photo_url",
    },
    // ✅ PERBAIKAN: signature_qr_url field dihapus - menggunakan static image
    certificate_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "certificate_number",
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "issue_date",
    },
    expiration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "expiration_date",
    },
    certificate_file_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "certificate_file_url",
    },
    // ✅ PERBAIKAN: Nama field konsisten dengan database
    issued_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "issued_by_user_id",
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    // ✅ PERBAIKAN: Tambahkan timestamps secara eksplisit
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  }, {
    sequelize,
    modelName: 'Certificate',
    tableName: "certificates",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true, // ✅ PERBAIKAN: konsisten dengan snake_case
    indexes: [
      {
        unique: true,
        fields: ["certificate_number"],
      },
      {
        unique: true,
        fields: ["nik"],
        where: {
          nik: {
            [sequelize.Sequelize.Op.ne]: null // ✅ Unique constraint hanya untuk NIK yang tidak null
          }
        }
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
        fields: ["full_name"],
      },
    ],
    // ✅ PERBAIKAN: Tambahkan hooks untuk auto-update timestamps
    hooks: {
      beforeUpdate: (certificate, options) => {
        certificate.updated_at = new Date();
      }
    }
  });

  return Certificate;
};