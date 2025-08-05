"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("certificates", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      full_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      nik: {
        type: Sequelize.STRING(16),
        allowNull: true,
        unique: true,
      },
      gender: {
        type: Sequelize.ENUM("Laki-Laki", "Perempuan"),
        allowNull: false,
      },
      birth_place: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      certificate_type: {
        type: Sequelize.ENUM("Perpanjang", "Buat Baru"),
        allowNull: false,
      },
      license_class: {
        type: Sequelize.ENUM("A", "B", "C"),
        allowNull: false,
      },
      domicile: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      participant_photo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      signatureQrUrl: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      certificate_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      expiration_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      certificate_file_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      signature_qr_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      issued_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("certificates", ["certificate_number"], {
      unique: true,
      name: "certificates_certificate_number_unique",
    });

    await queryInterface.addIndex("certificates", ["issued_by_user_id"], {
      name: "certificates_issued_by_user_id_index",
    });

    await queryInterface.addIndex("certificates", ["certificate_type"], {
      name: "certificates_certificate_type_index",
    });

    await queryInterface.addIndex("certificates", ["license_class"], {
      name: "certificates_license_class_index",
    });

    await queryInterface.addIndex("certificates", ["user_id"], {
      name: "certificates_user_id_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("certificates");
  },
};
