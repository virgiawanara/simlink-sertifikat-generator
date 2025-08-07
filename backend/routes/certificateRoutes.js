const express = require("express");
const router = express.Router();
const certificateController = require("../controllers/certificateController");
const {
  authenticateToken,
  authorizeRole,
} = require("../middlewares/authMiddleware");
const {
  uploadCertificateFiles, // Perbaikan: gunakan uploadCertificateFiles bukan uploadPhoto
  handleMulterError, // Tambahan: handle multer error
  validateUploadedFiles, // Tambahan: validasi file
  cleanupFilesOnError,
  cleanupUploadedFiles,
} = require("../middlewares/uploadMiddleware");

// Validasi middleware untuk memastikan tidak undefined
console.log("Upload middleware check:");
console.log("uploadCertificateFiles:", typeof uploadCertificateFiles);
console.log("handleMulterError:", typeof handleMulterError);
console.log("validateUploadedFiles:", typeof validateUploadedFiles);
console.log("cleanupFilesOnError:", typeof cleanupFilesOnError);

// ========================================
// PUBLIC ROUTES (TANPA AUTHENTICATION)
// ========================================
// Route untuk viewing sertifikat via QR Code (tanpa authentication untuk public access)
router.get('/view/:certificateNumber', certificateController.viewCertificatePublic);

// Alternative route dengan ID (jika ingin menggunakan ID sebagai gantinya)
router.get('/view/id/:id', certificateController.viewCertificateByIdPublic);

// Public download berdasarkan certificate number
router.get('/download/:certificateNumber', certificateController.downloadCertificatePublic);

// Public download berdasarkan ID
router.get('/download/id/:id', certificateController.downloadCertificateByIdPublic);

// ========================================
// PROTECTED ROUTES (DENGAN AUTHENTICATION)
// ========================================
// Semua route di bawah ini akan memerlukan token (dari cookie atau header)
router.use(authenticateToken);

// Middleware otorisasi khusus admin untuk route yang memerlukan akses admin
const adminOnly = authorizeRole(["admin"]);

// Route untuk pencarian dan filter sertifikat (hanya admin)
router.get("/search", adminOnly, certificateController.searchAndFilterCertificates);

// Route untuk membuat sertifikat baru (hanya admin)
router.post(
  "/",
  adminOnly,
  // Gunakan middleware yang benar dan lengkap
  uploadCertificateFiles, // Middleware utama untuk upload
  handleMulterError, // Handle error multer
  validateUploadedFiles, // Validasi file yang diupload
  cleanupFilesOnError, // Cleanup jika error
  certificateController.createCertificate
);

// Route untuk mendapatkan semua sertifikat (hanya admin)
router.get("/", adminOnly, certificateController.getAllCertificates);

// Route untuk mendapatkan sertifikat berdasarkan ID (hanya admin)
router.get("/:id", adminOnly, certificateController.getCertificateById);

// Route untuk memperbarui sertifikat berdasarkan ID (hanya admin)
router.put(
  "/:id",
  adminOnly,
  uploadCertificateFiles, // Middleware yang sama untuk update
  handleMulterError,
  validateUploadedFiles,
  cleanupFilesOnError,
  certificateController.updateCertificate
);

// Route untuk menghapus sertifikat berdasarkan ID (hanya admin)
router.delete("/:id", adminOnly, certificateController.deleteCertificate);

// Route untuk menghasilkan sertifikat visual (hanya admin)
// PERBAIKAN: Gunakan POST bukan GET untuk generate karena ini adalah operasi yang mengubah state
router.post(
  "/:id/generate",
  adminOnly,
  certificateController.generateCertificate
);

// Route untuk download sertifikat (hanya admin)
router.get(
  "/:id/download",
  adminOnly,
  certificateController.downloadCertificate
);

// Error handler untuk routes certificate
router.use((error, req, res, next) => {
  console.error("Certificate routes error:", error);

  // Cleanup files jika ada error
  if (req.files && typeof cleanupUploadedFiles === "function") {
    cleanupUploadedFiles(req.files);
  }

  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan internal server",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = router;