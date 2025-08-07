const CertificateService = require("../services/certificateService");
const PDFDocument = require("pdfkit");
const {
  createCertificateSchema,
  updateCertificateSchema,
} = require("../validators/certificateValidator");
const { createCanvas, loadImage } = require("canvas");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

class CertificateController {
  // Helper function to calculate expiration date (6 months from issue date)
  static calculateExpirationDate(issueDate) {
    const expDate = new Date(issueDate);
    expDate.setMonth(expDate.getMonth() + 6);
    return expDate;
  }

  // Mendapatkan semua sertifikat
  static async getAllCertificates(req, res) {
    try {
      const {
        search,
        certificateType,
        licenseClass,
        gender,
        page = 1,
        limit = 10,
      } = req.query;

      const filters = { search, certificateType, licenseClass, gender };
      const certificates = await CertificateService.getAllCertificates(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: "Data sertifikat berhasil diambil",
        data: certificates,
        requestedBy: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      console.error("Error saat mengambil sertifikat:", error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Mendapatkan sertifikat berdasarkan ID
  static async getCertificateById(req, res) {
    try {
      const { id } = req.params;
      const certificate = await CertificateService.getCertificateById(id);

      res.status(200).json({
        success: true,
        message: "Sertifikat berhasil ditemukan",
        data: certificate,
        requestedBy: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      console.error("Error saat mengambil sertifikat:", error.message);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Membuat sertifikat baru
  static async createCertificate(req, res) {
    try {
      console.log("req.files:", req.files);
      console.log("req.body:", req.body);

      const { error, value } = createCertificateSchema.validate(req.body);
      if (error) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          if (req.files.participantPhotoUrl) {
            fs.unlinkSync(req.files.participantPhotoUrl[0].path);
          }
          if (req.files.signatureQrUrl) {
            fs.unlinkSync(req.files.signatureQrUrl[0].path);
          }
        }
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const issuedByUserId = req.user.id;
      const issueDate = new Date();
      const expirationDate =
        CertificateController.calculateExpirationDate(issueDate);

      let participantPhotoUrl = null;
      let signatureQrUrl = null;

      // Handle participant photo
      if (req.files && req.files.participantPhotoUrl) {
        participantPhotoUrl = `/uploads/photos/${req.files.participantPhotoUrl[0].filename}`;
      }

      // Handle signature QR image
      if (req.files && req.files.signatureQrUrl) {
        signatureQrUrl = `/uploads/signatures/${req.files.signatureQrUrl[0].filename}`;
      }

      const certificateData = {
        ...value,
        participantPhotoUrl: participantPhotoUrl,
        signatureQrUrl: signatureQrUrl,
        issueDate,
        expirationDate,
      };

      const certificate = await CertificateService.createCertificate(
        certificateData,
        issuedByUserId
      );

      // Generate certificate visual file after creation
      await CertificateController.generateCertificate(
        { ...req, params: { id: certificate.id } },
        {
          status: () => ({
            json: () => {},
          }),
        }
      );

      res.status(201).json({
        success: true,
        message: "Sertifikat berhasil dibuat!",
        data: {
          certificate,
          createdBy: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
          },
        },
      });
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (req.files) {
        if (req.files.participantPhotoUrl) {
          fs.unlinkSync(req.files.participantPhotoUrl[0].path);
        }
        if (req.files.signatureQrUrl) {
          fs.unlinkSync(req.files.signatureQrUrl[0].path);
        }
      }
      console.error("Error saat membuat sertifikat:", error.message);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // UPDATE METHOD generateCertificate - BAGIAN QR CODE
  static async generateCertificate(req, res) {
    try {
      const certificateId = req.params.id;
      const certificate = await CertificateService.getCertificateById(certificateId);
      
      if (!certificate) {
        console.warn(`Sertifikat dengan ID ${certificateId} tidak ditemukan.`);
        return res.status(404).json({
          success: false,
          message: "Sertifikat tidak ditemukan",
        });
      }

      // Pastikan direktori uploads ada
      const uploadDir = path.join(__dirname, "../uploads/certificates");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // A4 size at 300 DPI
      const canvasWidth = 1240;
      const canvasHeight = 1754;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Load background image
      const bgPath = path.join(__dirname, "../assets/template/BG Sertif.png");
      let bgImage;
      try {
        bgImage = await loadImage(bgPath);
        ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
      } catch (e) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        console.error("Gagal memuat background sertifikat:", e.message);
      }

      // Certificate Content Layout
      // Judul SERTIFIKAT
      ctx.save();
      ctx.font = "bold 52px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = 10;
      ctx.fillText("SERTIFIKAT", canvasWidth / 2, 300);
      ctx.restore();

      // Judul HASIL TES PSIKOLOGI
      ctx.save();
      ctx.font = "bold 32px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.16)";
      ctx.shadowBlur = 8;
      ctx.fillText("HASIL TES PSIKOLOGI", canvasWidth / 2, 345);
      ctx.restore();

      // Nomor Sertifikat
      ctx.save();
      ctx.font = "24px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(
        `No Sertifikat : ${certificate.certificateNumber || "N/A"}`,
        canvasWidth / 2,
        385
      );
      ctx.restore();

      // Foto Peserta
      const photoWidth = 180;
      const photoHeight = 220;
      const totalContentWidth = 800;
      const photoX = (canvasWidth - totalContentWidth) / 2;
      const photoY = 470;

      // Teks "Sertifikat ini diberikan kepada:"
      ctx.save();
      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "left";
      ctx.fillText("Sertifikat ini diberikan kepada:", photoX, 450);
      ctx.restore();

      // Load and display participant photo
      let photoLoaded = false;
      if (certificate.participantPhotoUrl) {
        try {
          let photoPath = certificate.participantPhotoUrl;
          if (!photoPath.startsWith("/")) photoPath = "/" + photoPath;
          const absPhotoPath = path.join(__dirname, "..", photoPath);

          if (fs.existsSync(absPhotoPath)) {
            const photo = await loadImage(absPhotoPath);
            let aspect = photo.width / photo.height;
            let drawW = photoWidth,
              drawH = photoHeight,
              drawX = photoX,
              drawY = photoY;
            if (aspect > photoWidth / photoHeight) {
              drawW = photoHeight * aspect;
              drawX = photoX - (drawW - photoWidth) / 2;
            } else {
              drawH = photoWidth / aspect;
              drawY = photoY - (drawH - photoHeight) / 2;
            }
            ctx.save();
            ctx.beginPath();
            ctx.rect(photoX, photoY, photoWidth, photoHeight);
            ctx.clip();
            ctx.drawImage(photo, drawX, drawY, drawW, drawH);
            ctx.restore();
            photoLoaded = true;
          }
        } catch (e) {
          console.error("Foto peserta gagal dimuat:", e.message);
        }
      }

      if (!photoLoaded) {
        // Fallback if photo not loaded
        ctx.save();
        ctx.fillStyle = "#C62828";
        ctx.fillRect(photoX, photoY, photoWidth, photoHeight);
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(
          "FOTO",
          photoX + photoWidth / 2,
          photoY + photoHeight / 2 - 20
        );
        ctx.fillText(
          "TIDAK",
          photoX + photoWidth / 2,
          photoY + photoHeight / 2
        );
        ctx.fillText(
          "TERSEDIA",
          photoX + photoWidth / 2,
          photoY + photoHeight / 2 + 20
        );
        ctx.restore();
      }

      // Data Peserta
      ctx.save();
      ctx.font = "22px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "left";

      const dataX = photoX + photoWidth + 60;
      const dataYStart = photoY + 30;
      const dataLine = 32;

      const participantData = [
        ["Nama Lengkap", certificate.participantFullName || "TIDAK TERSEDIA"],
        ["NIK", certificate.participantNIK || "TIDAK TERSEDIA"],
        ["Jenis kelamin", certificate.gender || "TIDAK TERSEDIA"],
        [
          "Tempat, Tanggal Lahir",
          certificate.birthPlace && certificate.birthDate
            ? `${certificate.birthPlace}, ${new Date(
                certificate.birthDate
              ).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}`
            : "TIDAK TERSEDIA",
        ],
        [
          "Usia",
          certificate.age ? `${certificate.age} TAHUN` : "TIDAK TERSEDIA",
        ],
        ["Jenis SIM", certificate.certificateType || "TIDAK TERSEDIA"],
        ["Golongan SIM", certificate.licenseClass || "TIDAK TERSEDIA"],
        ["Domisili", certificate.domicile || "TIDAK TERSEDIA"],
      ];

      let y = dataYStart;
      participantData.forEach(([label, value]) => {
        ctx.font = "bold 22px Arial";
        ctx.fillText(label, dataX, y);
        ctx.fillText(":", dataX + 250, y);
        ctx.fillText(value.toUpperCase(), dataX + 250 + 15, y);
        y += dataLine;
      });
      ctx.restore();

      // Teks "MEMENUHI SYARAT dalam mengajukan permohonan Kerja."
      ctx.save();
      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(
        "MEMENUHI SYARAT dalam mengajukan permohonan Kerja.",
        canvasWidth / 2,
        1070
      );
      ctx.restore();

      // Masa Berlaku - Updated to use issue date and calculate 6 months later
      ctx.save();
      ctx.font = "24px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";

      const issueDate = certificate.issueDate
        ? new Date(certificate.issueDate)
        : new Date();
      const expirationDate =
        CertificateController.calculateExpirationDate(issueDate);

      const expirationText = `Sertifikat ini berlaku sampai dengan ${expirationDate.toLocaleDateString(
        "id-ID",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )}`;
      ctx.fillText(expirationText, canvasWidth / 2, 1100);
      ctx.restore();

      // QR Code
      const qrSize = 200;
      const qrX = (canvasWidth - qrSize) / 2;
      const qrY = canvasHeight - 470;
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // URL frontend
      const qrCodeData = `${baseUrl}/certificate/view/${certificate.certificateNumber}`;
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        width: qrSize,
        margin: 1,
        color: { dark: "#000", light: "#fff" },
      });
      const qrImage = await loadImage(qrCodeBuffer);
      ctx.save();
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText("Scan untuk Verifikasi", qrX + qrSize / 2, qrY - 15);
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      ctx.restore();

      // Tanggal pembuatan
      ctx.save();
      ctx.font = "22px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      const currentDate = issueDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      ctx.fillText(currentDate, canvasWidth - 270, canvasHeight - 500);
      ctx.restore();

      // Tanda tangan psikolog - Use uploaded signature QR image
      let signatureLoaded = false;
      if (certificate.signatureQrUrl) {
        try {
          let signaturePath = certificate.signatureQrUrl;
          if (!signaturePath.startsWith("/"))
            signaturePath = "/" + signaturePath;
          const absSignaturePath = path.join(__dirname, "..", signaturePath);

          if (fs.existsSync(absSignaturePath)) {
            const signatureQrUrl = await loadImage(absSignaturePath);
            const sigWidth = 150;
            const sigHeight = 150;
            const sigX = canvasWidth - 340;
            const sigY = canvasHeight - 480;

            ctx.save();
            ctx.drawImage(signatureQrUrl, sigX, sigY, sigWidth, sigHeight);
            ctx.restore();
            signatureLoaded = true;
          }
        } catch (e) {
          console.error("Gagal memuat tanda tangan:", e.message);
        }
      }

      if (!signatureLoaded) {
        // Fallback text
        ctx.save();
        ctx.font = "20px Arial";
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText("[Tanda Tangan]", canvasWidth - 280, canvasHeight - 350);
        ctx.restore();
      }

      // Nama dan jabatan psikolog
      ctx.save();
      ctx.font = "bold 26px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "right";
      ctx.fillText(
        "(Pamila Maysari M.Psi.Psikolog)",
        canvasWidth - 80,
        canvasHeight - 300
      );
      ctx.font = "semibold 26px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText("Psikolog", canvasWidth - 210, canvasHeight - 270);
      ctx.restore();

      // Simpan file
      const fileName = `certificate-${certificate.id}-${Date.now()}.png`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filePath, buffer);

      await CertificateService.updateCertificate(certificate.id, {
        certificateFileUrl: `/uploads/certificates/${fileName}`,
      });

      res.json({
        success: true,
        message: "Sertifikat berhasil dibuat!",
        data: {
          certificateUrl: `/uploads/certificates/${fileName}`,
          certificateId: certificate.id,
          fileName: fileName,
          qrCodeUrl: qrCodeData, // Tambahkan ini untuk debugging
          expirationDate: CertificateController.calculateExpirationDate(certificate.issueDate || new Date()),
          generatedBy: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
          },
        },
      });
    } catch (error) {
      console.error("Error saat menghasilkan sertifikat:", error);
      res.status(500).json({
        success: false,
        message: "Error saat menghasilkan sertifikat",
        error: error.message,
      });
    }
  }

  // Memperbarui sertifikat berdasarkan ID
  static async updateCertificate(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateCertificateSchema.validate(req.body);
      if (error) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          if (req.files.participantPhotoUrl) {
            fs.unlinkSync(req.files.participantPhotoUrl[0].path);
          }
          if (req.files.signatureQrUrl) {
            fs.unlinkSync(req.files.signatureQrUrl[0].path);
          }
        }
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      let participantPhotoUrl = req.body.participantPhotoUrl;
      let signatureQrUrl = req.body.signatureQrUrl;

      // Handle participant photo update
      if (req.files && req.files.participantPhotoUrl) {
        participantPhotoUrl = `/uploads/photos/${req.files.participantPhotoUrl[0].filename}`;
      }

      // Handle signature QR image update
      if (req.files && req.files.signatureQrUrl) {
        signatureQrUrl = `/uploads/signatures/${req.files.signatureQrUrl[0].filename}`;
      }

      const updateData = {
        ...value,
        participantPhotoUrl: participantPhotoUrl,
        signatureQrUrl: signatureQrUrl,
      };

      const updatedCertificate = await CertificateService.updateCertificate(
        id,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Sertifikat berhasil diperbarui!",
        data: {
          certificate: updatedCertificate,
          updatedBy: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
          },
        },
      });
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (req.files) {
        if (req.files.participantPhotoUrl) {
          fs.unlinkSync(req.files.participantPhotoUrl[0].path);
        }
        if (req.files.signatureQrUrl) {
          fs.unlinkSync(req.files.signatureQrUrl[0].path);
        }
      }
      console.error("Error saat memperbarui sertifikat:", error.message);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Menghapus sertifikat berdasarkan ID
  static async deleteCertificate(req, res) {
    try {
      const { id } = req.params;
      const result = await CertificateService.deleteCertificate(id);

      res.status(200).json({
        success: true,
        message: result.message,
        deletedBy: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      console.error("Error saat menghapus sertifikat:", error.message);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Method untuk download sertifikat sebagai PDF
  static async downloadCertificate(req, res) {
    try {
      const { id } = req.params;
      const certificate = await CertificateService.getCertificateById(id);

      if (!certificate.certificateFileUrl) {
        return res.status(404).json({
          success: false,
          message:
            "File sertifikat belum dibuat. Silakan generate terlebih dahulu.",
        });
      }

      const filePath = path.join(
        __dirname,
        "..",
        certificate.certificateFileUrl
      );
      console.log("File path yang dicek:", filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat tidak ditemukan di server.",
        });
      }

      // Konversi PNG ke PDF dan kirim ke client
      const fileName = `certificate-${certificate.certificateNumber}.pdf`;
      res.setHeader(
        "Content-disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Type", "application/pdf");
      const doc = new PDFDocument({
        autoFirstPage: false,
      });
      // Pipe PDF stream ke response
      doc.pipe(res);
      // Dapatkan ukuran gambar PNG
      const sizeOf = require("image-size");
      let imageDimensions;
      try {
        imageDimensions = sizeOf(filePath);
      } catch (e) {
        // fallback default A4
        imageDimensions = { width: 595, height: 842, type: "png" };
      }
      // Buat halaman PDF dengan ukuran gambar
      doc.addPage({
        size: [imageDimensions.width, imageDimensions.height],
        margin: 0,
      });
      doc.image(filePath, 0, 0, {
        width: imageDimensions.width,
        height: imageDimensions.height,
      });

      doc.end();
    } catch (error) {
      console.error("Error saat download sertifikat:", error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Method gabungan untuk pencarian dan filter sertifikat
  static async searchAndFilterCertificates(req, res) {
    try {
      const {
        q,
        licenseClass,
        certificateType,
        gender,
        page = 1,
        limit = 10,
      } = req.query;

      // Validasi golongan SIM jika ada
      if (licenseClass) {
        const validClasses = ["A", "B", "C"];
        if (!validClasses.includes(licenseClass.toUpperCase())) {
          return res.status(400).json({
            success: false,
            message: "Golongan SIM harus berupa A, B, atau C",
          });
        }
      }

      // Buat object filters yang akan dikirim ke service
      const filters = {};

      // Filter pencarian (nama dan NIK)
      if (q && q.trim() !== "") {
        filters.search = q.trim();
      }

      // Filter golongan SIM
      if (licenseClass && licenseClass.trim() !== "") {
        filters.licenseClass = licenseClass.toUpperCase();
      }

      // Filter jenis sertifikat
      if (certificateType && certificateType.trim() !== "") {
        filters.certificateType = certificateType;
      }

      // Filter gender
      if (gender && gender.trim() !== "") {
        filters.gender = gender;
      }

      const certificates = await CertificateService.getAllCertificates(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      return res.status(200).json({
        success: true,
        message: "Hasil pencarian dan filter sertifikat",
        data: certificates,
        filters: {
          search: filters.search || null,
          licenseClass: filters.licenseClass || null,
          certificateType: filters.certificateType || null,
          gender: filters.gender || null,
        },
        requestedBy: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      console.error("Error saat pencarian/filter sertifikat:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Method untuk viewing sertifikat secara public (untuk QR Code)
  static async viewCertificatePublic(req, res) {
    try {
      const { certificateNumber } = req.params;
      const certificate = await CertificateService.getCertificateByCertificateNumber(certificateNumber);

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Sertifikat tidak ditemukan"
        });
      }

      // Return data minimal untuk public view
      res.status(200).json({
        success: true,
        message: "Sertifikat ditemukan",
        data: {
          id: certificate.id,
          participantFullName: certificate.participantFullName,
          certificateNumber: certificate.certificateNumber,
          licenseClass: certificate.licenseClass,
          certificateType: certificate.certificateType,
          issueDate: certificate.issueDate,
          expirationDate: certificate.expirationDate,
          certificateFileUrl: certificate.certificateFileUrl,
          isValid: new Date() < new Date(certificate.expirationDate)
        }
      });
    } catch (error) {
      console.error("Error saat mengambil sertifikat public:", error.message);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Alternative method menggunakan ID
  static async viewCertificateByIdPublic(req, res) {
    try {
      const { id } = req.params;
      const certificate = await CertificateService.getCertificateById(id);

      res.status(200).json({
        success: true,
        message: "Sertifikat ditemukan",
        data: {
          id: certificate.id,
          participantFullName: certificate.participantFullName,
          certificateNumber: certificate.certificateNumber,
          licenseClass: certificate.licenseClass,
          certificateType: certificate.certificateType,
          issueDate: certificate.issueDate,
          expirationDate: certificate.expirationDate,
          certificateFileUrl: certificate.certificateFileUrl,
          isValid: new Date() < new Date(certificate.expirationDate)
        }
      });
    } catch (error) {
      console.error("Error saat mengambil sertifikat public:", error.message);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Method untuk download sertifikat secara public berdasarkan certificate number
  static async downloadCertificatePublic(req, res) {
    try {
      console.log("Download request for certificate:", req.params.certificateNumber);
      
      const { certificateNumber } = req.params;
      const certificate = await CertificateService.getCertificateByCertificateNumber(certificateNumber);
  
      if (!certificate.certificateFileUrl) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat belum dibuat. Silakan generate terlebih dahulu.",
        });
      }
  
      const filePath = path.join(__dirname, "..", certificate.certificateFileUrl);
      console.log("File path:", filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat tidak ditemukan di server.",
        });
      }
  
      // ✅ Set explicit CORS headers untuk download
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
      
      // Konversi PNG ke PDF dan kirim ke client
      const fileName = `certificate-${certificate.certificateNumber}.pdf`;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/pdf");
      
      console.log("Starting PDF generation for:", fileName);
      
      const doc = new PDFDocument({ autoFirstPage: false });
      
      // ✅ Handle PDF stream errors
      doc.on('error', (error) => {
        console.error("PDF generation error:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error generating PDF",
          });
        }
      });
      
      // Pipe PDF ke response
      doc.pipe(res);
      
      // Dapatkan ukuran gambar PNG
      let imageDimensions;
      try {
        const sizeOf = require("image-size");
        imageDimensions = sizeOf(filePath);
        console.log("Image dimensions:", imageDimensions);
      } catch (e) {
        console.warn("Could not get image dimensions, using default:", e.message);
        imageDimensions = { width: 595, height: 842, type: "png" };
      }
      
      // Add page dan image
      doc.addPage({
        size: [imageDimensions.width, imageDimensions.height],
        margin: 0,
      });
      
      doc.image(filePath, 0, 0, {
        width: imageDimensions.width,
        height: imageDimensions.height,
      });
  
      doc.end();
      console.log("PDF generation completed for:", fileName);
      
    } catch (error) {
      console.error("Error saat download sertifikat public:", error.message);
      console.error("Stack trace:", error.stack);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  }
  
  // Method untuk download sertifikat secara public berdasarkan ID
  static async downloadCertificateByIdPublic(req, res) {
    try {
      console.log("Download request for certificate ID:", req.params.id);
      
      const { id } = req.params;
      const certificate = await CertificateService.getCertificateById(id);
  
      if (!certificate.certificateFileUrl) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat belum dibuat. Silakan generate terlebih dahulu.",
        });
      }
  
      const filePath = path.join(__dirname, "..", certificate.certificateFileUrl);
      console.log("File path:", filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat tidak ditemukan di server.",
        });
      }
  
      // ✅ Set explicit CORS headers untuk download
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
      
      // Konversi PNG ke PDF dan kirim ke client
      const fileName = `certificate-${certificate.certificateNumber}.pdf`;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/pdf");
      
      console.log("Starting PDF generation for:", fileName);
      
      const doc = new PDFDocument({ autoFirstPage: false });
      
      // ✅ Handle PDF stream errors
      doc.on('error', (error) => {
        console.error("PDF generation error:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error generating PDF",
          });
        }
      });
      
      // Pipe PDF ke response
      doc.pipe(res);
      
      // Dapatkan ukuran gambar PNG
      let imageDimensions;
      try {
        const sizeOf = require("image-size");
        imageDimensions = sizeOf(filePath);
        console.log("Image dimensions:", imageDimensions);
      } catch (e) {
        console.warn("Could not get image dimensions, using default:", e.message);
        imageDimensions = { width: 595, height: 842, type: "png" };
      }
      
      // Add page dan image
      doc.addPage({
        size: [imageDimensions.width, imageDimensions.height],
        margin: 0,
      });
      
      doc.image(filePath, 0, 0, {
        width: imageDimensions.width,
        height: imageDimensions.height,
      });
  
      doc.end();
      console.log("PDF generation completed for:", fileName);
      
    } catch (error) {
      console.error("Error saat download sertifikat public (by ID):", error.message);
      console.error("Stack trace:", error.stack);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    }
  }
}

module.exports = CertificateController;
