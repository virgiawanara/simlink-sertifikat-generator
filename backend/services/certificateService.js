// services/certificateService.js - Service yang diperbaiki sesuai spesifikasi database
const { Certificate, User } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

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

      // Filter pencarian untuk nama dan NIK (gunakan field database)
      if (filters.search && filters.search.trim() !== "") {
        andConditions.push({
          [Op.or]: [
            {
              full_name: { [Op.iLike]: `%${filters.search.trim()}%` },
            },
            { nik: { [Op.iLike]: `%${filters.search.trim()}%` } },
          ],
        });
      }

      // ✅ Filter berdasarkan golongan SIM (gunakan field dan nilai database)
      if (filters.licenseClass && filters.licenseClass.trim() !== "") {
        andConditions.push({
          license_class: filters.licenseClass.trim(),
        });
      }

      // ✅ Filter berdasarkan jenis sertifikat (gunakan field dan nilai database)
      if (filters.certificateType && filters.certificateType.trim() !== "") {
        andConditions.push({
          certificate_type: filters.certificateType.trim(),
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
        order: [["created_at", "DESC"]],
        include: [
          {
            model: User,
            as: "issuer",
            attributes: ["id", "email", "role"],
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
      // ✅ PERBAIKAN: Data sudah dalam format database field names
      const transformedData = { ...certificateData };

      // Generate nomor sertifikat otomatis jika tidak disediakan
      if (!transformedData.certificate_number) {
        transformedData.certificate_number = this.generateCertificateNumber();
      }

      // Periksa apakah nomor sertifikat sudah ada
      const existingCertificate = await Certificate.findOne({
        where: { certificate_number: transformedData.certificate_number },
      });
      if (existingCertificate) {
        // Jika sudah ada, generate ulang
        transformedData.certificate_number = this.generateCertificateNumber();
      }

      // ✅ PERBAIKAN: NIK sekarang wajib, harus selalu ada dan valid
      if (!transformedData.nik || transformedData.nik.trim() === "") {
        throw new Error("NIK wajib diisi dan tidak boleh kosong.");
      }
      
      if (transformedData.nik.length !== 16) {
        throw new Error("NIK harus tepat 16 digit angka.");
      }
      
      if (!/^\d{16}$/.test(transformedData.nik)) {
        throw new Error("NIK harus berupa 16 digit angka.");
      }

      // Periksa apakah NIK sudah ada
      const existingNIK = await Certificate.findOne({
        where: { nik: transformedData.nik },
      });
      if (existingNIK) {
        throw new Error("NIK peserta sudah terdaftar dalam sertifikat lain.");
      }

      // Set tanggal pembuatan jika tidak ada
      if (!transformedData.issue_date) {
        transformedData.issue_date = new Date();
      }

      // ✅ PERBAIKAN: Set expiration date (6 bulan dari issue date)
      if (!transformedData.expiration_date) {
        const expDate = new Date(transformedData.issue_date);
        expDate.setMonth(expDate.getMonth() + 6);
        transformedData.expiration_date = expDate;
      }

      // Tambahkan issuedByUserId dari pengguna yang sedang login (admin)
      const certificate = await Certificate.create({
        ...transformedData,
        issued_by_user_id: userId,
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

      // ✅ PERBAIKAN: Data sudah dalam format database field names
      const transformedData = { ...updateData };

      // Jika nomor sertifikat diupdate, periksa apakah sudah ada yang lain
      if (
        transformedData.certificate_number &&
        transformedData.certificate_number !== certificate.certificate_number
      ) {
        const existingCertificate = await Certificate.findOne({
          where: {
            certificate_number: transformedData.certificate_number,
            id: { [Op.ne]: id },
          },
        });
        if (existingCertificate) {
          throw new Error("Nomor sertifikat yang baru sudah ada.");
        }
      }

      // ✅ PERBAIKAN: Validasi NIK untuk update
      if (transformedData.nik !== undefined && transformedData.nik !== certificate.nik) {
        // NIK sedang diupdate, validasi
        if (!transformedData.nik || transformedData.nik.trim() === "") {
          throw new Error("NIK wajib diisi dan tidak boleh kosong.");
        }
        
        if (transformedData.nik.length !== 16) {
          throw new Error("NIK harus tepat 16 digit angka.");
        }
        
        if (!/^\d{16}$/.test(transformedData.nik)) {
          throw new Error("NIK harus berupa 16 digit angka.");
        }

        // Periksa apakah NIK baru sudah ada di sertifikat lain
        const existingNIK = await Certificate.findOne({
          where: {
            nik: transformedData.nik,
            id: { [Op.ne]: id },
          },
        });
        if (existingNIK) {
          throw new Error(
            "NIK peserta yang baru sudah terdaftar pada sertifikat lain."
          );
        }
      }

      await certificate.update(transformedData);

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
      if (certificate.certificate_file_url) {
        const filePath = path.join(
          __dirname,
          "../../",
          certificate.certificate_file_url
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Hapus file foto peserta jika ada
      if (certificate.participant_photo_url) {
        const photoPath = path.join(
          __dirname,
          "../../",
          certificate.participant_photo_url
        );
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      // ✅ PERBAIKAN: Hapus cleanup signature_qr_url - tidak ada lagi

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
        where: { certificate_number: certificateNumber },
        include: [
          {
            model: User,
            as: "issuer",
            attributes: ["id", "email", "role"],
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