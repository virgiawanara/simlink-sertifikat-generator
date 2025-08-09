// controllers/certificateController.js - Controller yang diperbaiki sesuai spesifikasi database
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

      // ✅ PERBAIKAN: Validasi menggunakan schema dengan nama field database
      const { error, value } = createCertificateSchema.validate(req.body);
      if (error) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          if (req.files.participant_photo_url) {
            fs.unlinkSync(req.files.participant_photo_url[0].path);
          }
          // ✅ PERBAIKAN: signature_qr_url cleanup dihapus
        }
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const issuedByUserId = req.user.id;
      const issueDate = new Date();
      const expirationDate = CertificateController.calculateExpirationDate(issueDate);

      let participant_photo_url = null;
      // ✅ PERBAIKAN: signature_qr_url dihapus - menggunakan static image

      // ✅ PERBAIKAN: Handle participant photo dengan nama field database
      if (req.files && req.files.participant_photo_url) {
        participant_photo_url = `/uploads/photos/${req.files.participant_photo_url[0].filename}`;
      }

      // ✅ PERBAIKAN: Data menggunakan nama field database
      const certificateData = {
        ...value,
        participant_photo_url: participant_photo_url,
        // signature_qr_url dihapus - menggunakan static image
        issue_date: issueDate,
        expiration_date: expirationDate,
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
        if (req.files.participant_photo_url) {
          fs.unlinkSync(req.files.participant_photo_url[0].path);
        }
        // ✅ PERBAIKAN: signature_qr_url cleanup dihapus
      }
      console.error("Error saat membuat sertifikat:", error.message);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ PERBAIKAN: Method generateCertificate dengan field database
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
      ctx.fillText("HASIL TES PSIKOLOGI SIM", canvasWidth / 2, 345);
      ctx.restore();

      // ✅ PERBAIKAN: Gunakan field database
      ctx.save();
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.fillText(
        `No Sertifikat : ${certificate.certificate_number || "N/A"}`,
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

      // ✅ PERBAIKAN: Load participant photo dengan field database
      let photoLoaded = false;
      if (certificate.participant_photo_url) {
        try {
          let photoPath = certificate.participant_photo_url;
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
        ctx.fillText("FOTO", photoX + photoWidth / 2, photoY + photoHeight / 2 - 20);
        ctx.fillText("TIDAK", photoX + photoWidth / 2, photoY + photoHeight / 2);
        ctx.fillText("TERSEDIA", photoX + photoWidth / 2, photoY + photoHeight / 2 + 20);
        ctx.restore();
      }

      // ✅ PERBAIKAN: Data Peserta dengan field database
      ctx.save();
      ctx.font = "22px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "left";

      const dataX = photoX + photoWidth + 60;
      const dataYStart = photoY + 30;
      const dataLine = 50;

      const participantData = [
        ["Nama Lengkap", certificate.full_name || "TIDAK TERSEDIA"],
        ["NIK", certificate.nik || "TIDAK TERSEDIA"],
        ["Jenis kelamin", certificate.gender || "TIDAK TERSEDIA"],
        [
          "Tempat, Tanggal Lahir",
          certificate.birth_place && certificate.birth_date
            ? `${certificate.birth_place}, ${new Date(
                certificate.birth_date
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
        ["Jenis SIM", certificate.certificate_type || "TIDAK TERSEDIA"],
        ["Golongan SIM", certificate.license_class || "TIDAK TERSEDIA"],
        ["Domisili", certificate.domicile || "TIDAK TERSEDIA"],
      ];

      let y = dataYStart;
      participantData.forEach(([label, value]) => {
        ctx.font = "22px Arial";
        ctx.fillText(label, dataX, y);
        ctx.fillText(":", dataX + 250, y);
        ctx.fillText(value.toUpperCase(), dataX + 250 + 15, y);
        y += dataLine;
      });
      ctx.restore();

      // Teks "MEMENUHI SYARAT dalam mengajukan permohonan SIM."
      // Teks bagian 1: "MEMENUHI SYARAT" (bold)
      const yPos = 1050;
      const part1 = "MEMENUHI SYARAT";
      const part2 = " dalam mengajukan permohonan SIM.";

      // Ukur lebar masing-masing
      ctx.font = "bold 23px Arial";
      const part1Width = ctx.measureText(part1).width;

      ctx.font = "23px Arial";
      const part2Width = ctx.measureText(part2).width;

      // Hitung posisi awal supaya total tetap center
      const totalWidth = part1Width + part2Width;
      const startX = canvasWidth / 2 - totalWidth / 2;

      // Gambar bagian bold
      ctx.save();
      ctx.font = "bold 23px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(part1, startX, yPos);
      ctx.restore();

      // Gambar bagian normal
      ctx.save();
      ctx.font = "23px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(part2, startX + part1Width, yPos);
      ctx.restore();


      // ✅ PERBAIKAN: Masa Berlaku dengan field database
      ctx.save();
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";

      const issueDate = certificate.issue_date
        ? new Date(certificate.issue_date)
        : new Date();
      const expirationDate = certificate.expiration_date 
        ? new Date(certificate.expiration_date)
        : CertificateController.calculateExpirationDate(issueDate);

      const expirationText = `Sertifikat ini berlaku sampai dengan ${expirationDate.toLocaleDateString(
        "id-ID",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )}`;
      ctx.fillText(expirationText, canvasWidth / 2, 1080);
      ctx.restore();

      // QR Code
      const qrSize = 150;
      const qrPadding = 10; // jarak antara QR dan border
      const qrX = (canvasWidth - (qrSize + qrPadding * 2)) / 2;
      const qrY = canvasHeight - 520;

      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const qrCodeData = `${baseUrl}/certificate/view/${certificate.certificate_number}`;

      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        width: qrSize,
        margin: 1,
        color: { dark: "#000", light: "#fff" },
      });

      const qrImage = await loadImage(qrCodeBuffer);

      ctx.save();

      // Gambar background/border
      ctx.fillStyle = "#fff"; // background putih di belakang QR
      ctx.fillRect(qrX, qrY, qrSize + qrPadding * 2, qrSize + qrPadding * 2);

      ctx.lineWidth = 4; // ketebalan border
      ctx.strokeStyle = "#000"; // warna border
      ctx.strokeRect(qrX, qrY, qrSize + qrPadding * 2, qrSize + qrPadding * 2);

      // Gambar QR code di tengah kotak
      ctx.drawImage(qrImage, qrX + qrPadding, qrY + qrPadding, qrSize, qrSize);

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
      ctx.fillText(currentDate, canvasWidth - 220, canvasHeight - 500);
      ctx.restore();

      // ✅ PERBAIKAN: Tanda tangan menggunakan static image dari assets
      const staticSignaturePath = path.join(__dirname, "../assets/template/QR TTD.png");
      let signatureLoaded = false;
      
      if (fs.existsSync(staticSignaturePath)) {
        try {
          const signatureQrUrl = await loadImage(staticSignaturePath);
          const sigWidth = 150;
          const sigHeight = 150;
          const sigX = canvasWidth - 290;
          const sigY = canvasHeight - 480;

          ctx.save();
          ctx.drawImage(signatureQrUrl, sigX, sigY, sigWidth, sigHeight);
          ctx.restore();
          signatureLoaded = true;
        } catch (e) {
          console.error("Gagal memuat tanda tangan static:", e.message);
        }
      } else {
        console.warn("File tanda tangan static tidak ditemukan:", staticSignaturePath);
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
      ctx.font = "bold 22px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "right";
      ctx.fillText(
        "(Pamila Maysari M.Psi.Psikolog)",
        canvasWidth - 50,
        canvasHeight - 300
      );
      ctx.font = "semibold 22px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText("Psikolog", canvasWidth - 180, canvasHeight - 270);
      ctx.restore();

      // Simpan file
      const fileName = `certificate-${certificate.id}-${Date.now()}.png`;
      const filePath = path.join(uploadDir, fileName);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(filePath, buffer);

      // ✅ PERBAIKAN: Update dengan field database
      await CertificateService.updateCertificate(certificate.id, {
        certificate_file_url: `/uploads/certificates/${fileName}`,
      });

      res.json({
        success: true,
        message: "Sertifikat berhasil dibuat!",
        data: {
          certificateUrl: `/uploads/certificates/${fileName}`,
          certificateId: certificate.id,
          fileName: fileName,
          qrCodeUrl: qrCodeData,
          expirationDate: CertificateController.calculateExpirationDate(certificate.issue_date || new Date()),
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

  // ✅ PERBAIKAN: Method update dengan field database
  static async updateCertificate(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateCertificateSchema.validate(req.body);
      if (error) {
        // Clean up uploaded files if validation fails
        if (req.files) {
          if (req.files.participant_photo_url) {
            fs.unlinkSync(req.files.participant_photo_url[0].path);
          }
          if (req.files.signature_qr_url) {
            fs.unlinkSync(req.files.signature_qr_url[0].path);
          }
        }
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      let participant_photo_url = req.body.participant_photo_url;
      // ✅ PERBAIKAN: signature_qr_url update dihapus

      // Handle participant photo update
      if (req.files && req.files.participant_photo_url) {
        participant_photo_url = `/uploads/photos/${req.files.participant_photo_url[0].filename}`;
      }

      // ✅ PERBAIKAN: signature_qr_url handling dihapus

      const updateData = {
        ...value,
        participant_photo_url: participant_photo_url,
        // signature_qr_url dihapus
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
        if (req.files.participant_photo_url) {
          fs.unlinkSync(req.files.participant_photo_url[0].path);
        }
        if (req.files.signature_qr_url) {
          fs.unlinkSync(req.files.signature_qr_url[0].path);
        }
      }
      console.error("Error saat memperbarui sertifikat:", error.message);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Method lainnya tetap sama seperti sebelumnya
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

      if (!certificate.certificate_file_url) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat belum dibuat. Silakan generate terlebih dahulu.",
        });
      }

      const filePath = path.join(__dirname, "..", certificate.certificate_file_url);
      console.log("File path yang dicek:", filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat tidak ditemukan di server.",
        });
      }

      // ✅ PERBAIKAN: Path untuk halaman kedua (Hasil Test.png)
      const hasilTestPath = path.join(__dirname, "../assets/template/Hasil Test.png");
      console.log("Hasil Test path:", hasilTestPath);

      // Konversi PNG ke PDF dengan 2 halaman dan kirim ke client
      const fileName = `certificate-${certificate.certificate_number}.pdf`;
      res.setHeader("Content-disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/pdf");
      
      const doc = new PDFDocument({ autoFirstPage: false });
      
      // Pipe PDF stream ke response
      doc.pipe(res);
      
      // ✅ HALAMAN 1: Sertifikat utama
      const sizeOf = require("image-size");
      let imageDimensions;
      try {
        imageDimensions = sizeOf(filePath);
      } catch (e) {
        // fallback default A4
        imageDimensions = { width: 595, height: 842, type: "png" };
      }
      
      // Buat halaman PDF dengan ukuran gambar sertifikat
      doc.addPage({
        size: [imageDimensions.width, imageDimensions.height],
        margin: 0,
      });
      doc.image(filePath, 0, 0, {
        width: imageDimensions.width,
        height: imageDimensions.height,
      });

      // ✅ HALAMAN 2: Hasil Test (jika file ada)
      if (fs.existsSync(hasilTestPath)) {
        try {
          let hasilTestDimensions;
          try {
            hasilTestDimensions = sizeOf(hasilTestPath);
          } catch (e) {
            // fallback default A4
            hasilTestDimensions = { width: 595, height: 842, type: "png" };
          }

          // Tambah halaman kedua dengan ukuran gambar Hasil Test
          doc.addPage({
            size: [hasilTestDimensions.width, hasilTestDimensions.height],
            margin: 0,
          });
          doc.image(hasilTestPath, 0, 0, {
            width: hasilTestDimensions.width,
            height: hasilTestDimensions.height,
          });

          console.log("✅ Halaman kedua (Hasil Test) berhasil ditambahkan ke PDF");
        } catch (error) {
          console.warn("⚠️ Gagal menambahkan halaman kedua:", error.message);
          // Lanjutkan tanpa halaman kedua jika ada error
        }
      } else {
        console.warn("⚠️ File Hasil Test.png tidak ditemukan:", hasilTestPath);
        // Lanjutkan tanpa halaman kedua jika file tidak ada
      }

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

      // ✅ PERBAIKAN: Validasi golongan SIM sesuai database
      if (licenseClass) {
        const validClasses = ["A", "A Umum", "B1", "B1 Umum", "B2", "B2 Umum", "C", "C1", "C2", "D", "D1"];
        if (!validClasses.includes(licenseClass)) {
          return res.status(400).json({
            success: false,
            message: "Golongan SIM tidak valid",
          });
        }
      }

      // ✅ PERBAIKAN: Validasi certificate type sesuai database
      if (certificateType) {
        const validTypes = ["Baru", "Perpanjang"];
        if (!validTypes.includes(certificateType)) {
          return res.status(400).json({
            success: false,
            message: "Jenis sertifikat harus berupa 'Baru' atau 'Perpanjang'",
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
        filters.licenseClass = licenseClass;
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
          full_name: certificate.full_name,
          certificate_number: certificate.certificate_number,
          license_class: certificate.license_class,
          certificate_type: certificate.certificate_type,
          issue_date: certificate.issue_date,
          expiration_date: certificate.expiration_date,
          certificate_file_url: certificate.certificate_file_url,
          isValid: new Date() < new Date(certificate.expiration_date)
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
          full_name: certificate.full_name,
          certificate_number: certificate.certificate_number,
          license_class: certificate.license_class,
          certificate_type: certificate.certificate_type,
          issue_date: certificate.issue_date,
          expiration_date: certificate.expiration_date,
          certificate_file_url: certificate.certificate_file_url,
          isValid: new Date() < new Date(certificate.expiration_date)
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
  
      if (!certificate.certificate_file_url) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat belum dibuat. Silakan generate terlebih dahulu.",
        });
      }
  
      const filePath = path.join(__dirname, "..", certificate.certificate_file_url);
      console.log("File path:", filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat tidak ditemukan di server.",
        });
      }

      // ✅ PERBAIKAN: Path untuk halaman kedua (Hasil Test.png)
      const hasilTestPath = path.join(__dirname, "../assets/template/Hasil Test.png");
      console.log("Hasil Test path:", hasilTestPath);
  
      // ✅ Set explicit CORS headers untuk download
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
      
      // Konversi PNG ke PDF dengan 2 halaman dan kirim ke client
      const fileName = `certificate-${certificate.certificate_number}.pdf`;
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
      
      // ✅ HALAMAN 1: Sertifikat utama
      let imageDimensions;
      try {
        const sizeOf = require("image-size");
        imageDimensions = sizeOf(filePath);
        console.log("Certificate image dimensions:", imageDimensions);
      } catch (e) {
        console.warn("Could not get certificate image dimensions, using default:", e.message);
        imageDimensions = { width: 595, height: 842, type: "png" };
      }
      
      // Add halaman pertama
      doc.addPage({
        size: [imageDimensions.width, imageDimensions.height],
        margin: 0,
      });
      
      doc.image(filePath, 0, 0, {
        width: imageDimensions.width,
        height: imageDimensions.height,
      });

      // ✅ HALAMAN 2: Hasil Test (jika file ada)
      if (fs.existsSync(hasilTestPath)) {
        try {
          let hasilTestDimensions;
          try {
            const sizeOf = require("image-size");
            hasilTestDimensions = sizeOf(hasilTestPath);
            console.log("Hasil Test image dimensions:", hasilTestDimensions);
          } catch (e) {
            console.warn("Could not get Hasil Test image dimensions, using default:", e.message);
            hasilTestDimensions = { width: 595, height: 842, type: "png" };
          }

          // Tambah halaman kedua
          doc.addPage({
            size: [hasilTestDimensions.width, hasilTestDimensions.height],
            margin: 0,
          });
          
          doc.image(hasilTestPath, 0, 0, {
            width: hasilTestDimensions.width,
            height: hasilTestDimensions.height,
          });

          console.log("✅ Halaman kedua (Hasil Test) berhasil ditambahkan ke PDF");
        } catch (error) {
          console.warn("⚠️ Gagal menambahkan halaman kedua:", error.message);
          // Lanjutkan tanpa halaman kedua jika ada error
        }
      } else {
        console.warn("⚠️ File Hasil Test.png tidak ditemukan:", hasilTestPath);
        // Lanjutkan tanpa halaman kedua jika file tidak ada
      }
  
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
  
      if (!certificate.certificate_file_url) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat belum dibuat. Silakan generate terlebih dahulu.",
        });
      }
  
      const filePath = path.join(__dirname, "..", certificate.certificate_file_url);
      console.log("File path:", filePath);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File sertifikat tidak ditemukan di server.",
        });
      }

      // ✅ PERBAIKAN: Path untuk halaman kedua (Hasil Test.png)
      const hasilTestPath = path.join(__dirname, "../assets/template/Hasil Test.png");
      console.log("Hasil Test path:", hasilTestPath);
  
      // ✅ Set explicit CORS headers untuk download
      const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.header('Access-Control-Allow-Origin', allowedOrigin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
      
      // Konversi PNG ke PDF dengan 2 halaman dan kirim ke client
      const fileName = `certificate-${certificate.certificate_number}.pdf`;
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
      
      // ✅ HALAMAN 1: Sertifikat utama
      let imageDimensions;
      try {
        const sizeOf = require("image-size");
        imageDimensions = sizeOf(filePath);
        console.log("Certificate image dimensions:", imageDimensions);
      } catch (e) {
        console.warn("Could not get certificate image dimensions, using default:", e.message);
        imageDimensions = { width: 595, height: 842, type: "png" };
      }
      
      // Add halaman pertama
      doc.addPage({
        size: [imageDimensions.width, imageDimensions.height],
        margin: 0,
      });
      
      doc.image(filePath, 0, 0, {
        width: imageDimensions.width,
        height: imageDimensions.height,
      });

      // ✅ HALAMAN 2: Hasil Test (jika file ada)
      if (fs.existsSync(hasilTestPath)) {
        try {
          let hasilTestDimensions;
          try {
            const sizeOf = require("image-size");
            hasilTestDimensions = sizeOf(hasilTestPath);
            console.log("Hasil Test image dimensions:", hasilTestDimensions);
          } catch (e) {
            console.warn("Could not get Hasil Test image dimensions, using default:", e.message);
            hasilTestDimensions = { width: 595, height: 842, type: "png" };
          }

          // Tambah halaman kedua
          doc.addPage({
            size: [hasilTestDimensions.width, hasilTestDimensions.height],
            margin: 0,
          });
          
          doc.image(hasilTestPath, 0, 0, {
            width: hasilTestDimensions.width,
            height: hasilTestDimensions.height,
          });

          console.log("✅ Halaman kedua (Hasil Test) berhasil ditambahkan ke PDF");
        } catch (error) {
          console.warn("⚠️ Gagal menambahkan halaman kedua:", error.message);
          // Lanjutkan tanpa halaman kedua jika ada error
        }
      } else {
        console.warn("⚠️ File Hasil Test.png tidak ditemukan:", hasilTestPath);
        // Lanjutkan tanpa halaman kedua jika file tidak ada
      }
  
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