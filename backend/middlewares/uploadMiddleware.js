// middleware/uploadMiddleware.js - Upload Middleware yang diperbaiki
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Fungsi untuk memastikan direktori upload ada
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Ensure upload directories exist on module load
const uploadDirs = [
  path.join(__dirname, "../uploads"),
  path.join(__dirname, "../uploads/photos"),
  path.join(__dirname, "../uploads/signatures"),
  path.join(__dirname, "../uploads/certificates"),
];

uploadDirs.forEach(ensureDirectoryExists);

// File filter untuk validasi tipe file gambar
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Hanya file gambar yang diperbolehkan (JPEG, JPG, PNG, GIF, WEBP)"
      )
    );
  }
};

// ✅ PERBAIKAN: Middleware untuk upload multiple files dengan field names yang benar
const uploadCertificateFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;
      // ✅ PERBAIKAN: Gunakan field names database yang benar
      if (file.fieldname === "participant_photo_url") {
        uploadPath = path.join(__dirname, "../uploads/photos");
      } else if (file.fieldname === "signature_qr_url") {
        uploadPath = path.join(__dirname, "../uploads/signatures");
      } else {
        return cb(new Error(`Field name tidak valid: ${file.fieldname}. Gunakan participant_photo_url atau signature_qr_url.`));
      }

      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);

      let prefix;
      if (file.fieldname === "participant_photo_url") {
        prefix = "photo";
      } else if (file.fieldname === "signature_qr_url") {
        prefix = "signature";
      }

      cb(null, `${prefix}-${uniqueSuffix}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // maksimal 5MB per file
    files: 2, // maksimal total 2 file (1 foto + 1 signature)
  },
  fileFilter: imageFileFilter,
}).fields([
  // ✅ PERBAIKAN: Field names sesuai database
  { name: "participant_photo_url", maxCount: 1 },
  { name: "signature_qr_url", maxCount: 1 },
]);

// ✅ PERBAIKAN: Error handler dengan pesan yang lebih akurat
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "Error saat upload file";
    
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "File terlalu besar. Maksimal 5MB per file.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Terlalu banyak file. Maksimal 1 file (foto peserta saja).";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Field file tidak dikenali. Hanya gunakan participant_photo_url.";
        break;
      case "LIMIT_PART_COUNT":
        message = "Terlalu banyak parts dalam form.";
        break;
      case "LIMIT_FIELD_KEY":
        message = "Field name terlalu panjang.";
        break;
      case "LIMIT_FIELD_VALUE":
        message = "Field value terlalu panjang.";
        break;
      case "LIMIT_FIELD_COUNT":
        message = "Terlalu banyak field dalam form.";
        break;
      default:
        message = `Upload error: ${error.message}`;
    }

    return res.status(400).json({
      success: false,
      message: message,
      error: error.code
    });
  }

  if (error && error.message.includes("Hanya file gambar")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error && error.message.includes("Field name tidak valid")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Jika error lain, lanjutkan ke error handler berikutnya
  next(error);
};

// ✅ PERBAIKAN: Validasi dengan field names yang benar
const validateUploadedFiles = (req, res, next) => {
  // Cek apakah ada file yang diupload
  if (
    !req.files ||
    (Object.keys(req.files).length === 0 && req.files.constructor === Object)
  ) {
    // Tidak ada file, lanjutkan (mungkin update tanpa file baru)
    return next();
  }

  try {
    // ✅ PERBAIKAN: Validasi hanya foto peserta
    if (req.files.participant_photo_url) {
      const photoFile = req.files.participant_photo_url[0];
      const photoSizeMB = photoFile.size / (1024 * 1024);

      if (photoSizeMB > 5) {
        return res.status(400).json({
          success: false,
          message: "Foto peserta tidak boleh lebih dari 5MB",
        });
      }

      // Validasi tipe file photo
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedImageTypes.includes(photoFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Foto peserta harus berformat JPEG, JPG, PNG, GIF, atau WEBP",
        });
      }
    }

    // ✅ PERBAIKAN: signature_qr_url validation dihapus

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Error saat validasi file: " + error.message,
    });
  }
};

// Middleware untuk membersihkan file jika terjadi error
const cleanupFilesOnError = (error, req, res, next) => {
  // Cleanup files jika ada error dan ada files yang diupload
  if (error && req.files) {
    cleanupUploadedFiles(req.files);
  }
  next(error);
};

// ✅ PERBAIKAN: Fungsi helper yang lebih robust
const cleanupUploadedFiles = (files) => {
  if (!files) return;

  try {
    Object.keys(files).forEach((fieldname) => {
      if (Array.isArray(files[fieldname])) {
        files[fieldname].forEach((file) => {
          if (file && file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(`✅ Cleaned up file: ${file.path}`);
            } catch (error) {
              console.error(`❌ Error cleaning up file ${file.path}:`, error.message);
            }
          }
        });
      }
    });
  } catch (error) {
    console.error("❌ Error during file cleanup:", error.message);
  }
};

// Middleware tambahan untuk debugging (opsional)
const logUploadInfo = (req, res, next) => {
  if (req.files && Object.keys(req.files).length > 0) {
    console.log("📁 Files uploaded:");
    Object.keys(req.files).forEach(fieldname => {
      req.files[fieldname].forEach(file => {
        console.log(`  - ${fieldname}: ${file.filename} (${file.size} bytes)`);
      });
    });
  }
  next();
};

// Middleware untuk kompresi gambar (placeholder untuk implementasi masa depan)
const compressImages = async (req, res, next) => {
  // TODO: Implement image compression with sharp
  // if (req.files) {
  //   // Compress images here
  // }
  next();
};

module.exports = {
  uploadCertificateFiles,
  handleMulterError,
  validateUploadedFiles,
  cleanupFilesOnError,
  cleanupUploadedFiles,
  compressImages,
  logUploadInfo, // ✅ TAMBAHAN: untuk debugging
  ensureDirectoryExists, // ✅ TAMBAHAN: export untuk testing
};