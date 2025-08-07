// services/certificateService.js
const { Certificate, User } = require("../models"); // Mengimpor model Certificate dan User
const { Op } = require("sequelize"); // Untuk operator Sequelize seperti LIKE
const path = require("path"); // Impor path untuk menghapus file
const fs = require("fs"); // Impor fs untuk menghapus file
const { sequelize } = require("../models"); // Impor sequelize instance untuk fungsi agregasi

class CertificateService {
  // Generate nomor sertifikat dengan format baru
  static generateCertificateNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    // Generate 8 digit random number
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);

    return `${datePrefix}${randomSuffix}`;
  }

  // Mendapatkan semua sertifikat (dengan opsi pencarian dan paginasi)
  static async getAllCertificates(filters = {}, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = {};
      const andConditions = [];

      // Filter pencarian untuk nama dan NIK
      if (filters.search && filters.search.trim() !== "") {
        andConditions.push({
          [Op.or]: [
            {
              participantFullName: { [Op.like]: `%${filters.search.trim()}%` },
            },
            { participantNIK: { [Op.like]: `%${filters.search.trim()}%` } },
          ],
        });
      }

      // Filter berdasarkan golongan SIM (A, B, C)
      if (filters.licenseClass && filters.licenseClass.trim() !== "") {
        andConditions.push({
          licenseClass: filters.licenseClass.trim().toUpperCase(),
        });
      }

      // Filter berdasarkan jenis sertifikat
      if (filters.certificateType && filters.certificateType.trim() !== "") {
        andConditions.push({
          certificateType: filters.certificateType.trim(),
        });
      }

      // Filter berdasarkan gender
      if (filters.gender && filters.gender.trim() !== "") {
        andConditions.push({
          gender: filters.gender.trim(),
        });
      }

      // Jika ada kondisi AND, gabungkan semua kondisi
      if (andConditions.length > 0) {
        whereClause[Op.and] = andConditions;
      }

      const { count, rows } = await Certificate.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["createdAt", "DESC"]], // Urutkan berdasarkan tanggal pembuatan terbaru
        include: [
          {
            model: User,
            as: "issuer",
            attributes: ["id", "email", "role"], // Hanya ambil id, email, role dari user
          },
        ],
      });

      return {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit,
        certificates: rows,
      };
    } catch (error) {
      console.error("Error saat mendapatkan semua sertifikat:", error.message);
      throw error;
    }
  }

  // Mendapatkan sertifikat berdasarkan ID
  static async getCertificateById(id) {
    try {
      const certificate = await Certificate.findByPk(id, {
        include: [
          {
            model: User,
            as: "issuer",
            attributes: ["id", "email", "role"],
          },
        ],
      });
      if (!certificate) {
        throw new Error("Sertifikat tidak ditemukan.");
      }
      return certificate;
    } catch (error) {
      console.error(
        "Error saat mendapatkan sertifikat berdasarkan ID:",
        error.message
      );
      throw error;
    }
  }

  // Membuat sertifikat baru
  static async createCertificate(certificateData, userId) {
    try {
      // Generate nomor sertifikat otomatis jika tidak disediakan
      if (!certificateData.certificateNumber) {
        certificateData.certificateNumber = this.generateCertificateNumber();
      }

      // Periksa apakah nomor sertifikat sudah ada
      const existingCertificate = await Certificate.findOne({
        where: { certificateNumber: certificateData.certificateNumber },
      });
      if (existingCertificate) {
        // Jika sudah ada, generate ulang
        certificateData.certificateNumber = this.generateCertificateNumber();
      }

      // Periksa apakah NIK peserta sudah ada (jika NIK disediakan)
      if (
        certificateData.participantNIK &&
        certificateData.participantNIK !== ""
      ) {
        // Pastikan NIK tidak kosong
        const existingNIK = await Certificate.findOne({
          where: { participantNIK: certificateData.participantNIK },
        });
        if (existingNIK) {
          throw new Error("NIK peserta sudah terdaftar dalam sertifikat lain.");
        }
      }

      // Set tanggal pembuatan jika tidak ada
      if (!certificateData.issueDate) {
        certificateData.issueDate = new Date();
      }

      // Tambahkan issuedByUserId dari pengguna yang sedang login (admin)
      const certificate = await Certificate.create({
        ...certificateData,
        issuedByUserId: userId,
      });

      // Return certificate dengan data issuer
      const certificateWithIssuer = await Certificate.findByPk(certificate.id, {
        include: [
          {
            model: User,
            as: "issuer",
            attributes: ["id", "email", "role"],
          },
        ],
      });

      return certificateWithIssuer;
    } catch (error) {
      console.error("Error saat membuat sertifikat:", error.message);
      throw error;
    }
  }

  // Memperbarui sertifikat berdasarkan ID
  static async updateCertificate(id, updateData) {
    try {
      const certificate = await Certificate.findByPk(id);
      if (!certificate) {
        throw new Error("Sertifikat tidak ditemukan.");
      }

      // Jika nomor sertifikat diupdate, periksa apakah sudah ada yang lain
      if (
        updateData.certificateNumber &&
        updateData.certificateNumber !== certificate.certificateNumber
      ) {
        const existingCertificate = await Certificate.findOne({
          where: {
            certificateNumber: updateData.certificateNumber,
            id: { [Op.ne]: id }, // Exclude current certificate
          },
        });
        if (existingCertificate) {
          throw new Error("Nomor sertifikat yang baru sudah ada.");
        }
      }

      // Jika NIK peserta diupdate, periksa apakah sudah ada yang lain
      if (
        updateData.participantNIK &&
        updateData.participantNIK !== certificate.participantNIK &&
        updateData.participantNIK !== "" // Pastikan NIK tidak kosong
      ) {
        const existingNIK = await Certificate.findOne({
          where: {
            participantNIK: updateData.participantNIK,
            id: { [Op.ne]: id }, // Exclude current certificate
          },
        });
        if (existingNIK) {
          throw new Error(
            "NIK peserta yang baru sudah terdaftar pada sertifikat lain."
          );
        }
      }

      await certificate.update(updateData);

      // Return updated certificate dengan data issuer
      const updatedCertificate = await Certificate.findByPk(id, {
        include: [
          {
            model: User,
            as: "issuer",
            attributes: ["id", "email", "role"],
          },
        ],
      });

      return updatedCertificate;
    } catch (error) {
      console.error("Error saat memperbarui sertifikat:", error.message);
      throw error;
    }
  }

  // Menghapus sertifikat berdasarkan ID
  static async deleteCertificate(id) {
    try {
      const certificate = await Certificate.findByPk(id);
      if (!certificate) {
        throw new Error("Sertifikat tidak ditemukan.");
      }

      // Hapus file sertifikat jika ada
      if (certificate.certificateFileUrl) {
        const filePath = path.join(
          __dirname,
          "../../",
          certificate.certificateFileUrl
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Hapus file foto peserta jika ada
      if (certificate.participantPhotoUrl) {
        const photoPath = path.join(
          __dirname,
          "../../",
          certificate.participantPhotoUrl
        );
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      // Hapus file tanda tangan jika ada
      if (certificate.signatureQrUrl) {
        const signaturePath = path.join(
          __dirname,
          "../../",
          certificate.signatureQrUrl
        );
        if (fs.existsSync(signaturePath)) {
          fs.unlinkSync(signaturePath);
        }
      }

      await certificate.destroy();
      return { message: "Sertifikat berhasil dihapus." };
    } catch (error) {
      console.error("Error saat menghapus sertifikat:", error.message);
      throw error;
    }
  }
  
  static async getCertificateByCertificateNumber(certificateNumber) {
    try {
      const certificate = await Certificate.findOne({
        where: { certificateNumber: certificateNumber },
        include: [
          {
            model: User,
            as: "issuer",
            attributes: ["id", "email", "role"], // ✅ HANYA kolom yang ada
          },
        ],
      });
  
      if (!certificate) {
        throw new Error("Sertifikat tidak ditemukan");
      }
  
      return certificate;
    } catch (error) {
      console.error("Error dalam getCertificateByCertificateNumber:", error.message);
      throw new Error(`Gagal mengambil sertifikat: ${error.message}`);
    }
  }
}

module.exports = CertificateService;
