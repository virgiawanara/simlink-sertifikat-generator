// middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Fungsi untuk memastikan direktori upload ada
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Konfigurasi storage untuk foto peserta
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/photos");
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `photo-${uniqueSuffix}${extension}`);
  },
});

// Konfigurasi storage untuk tanda tangan
const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/signatures");
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `signature-${uniqueSuffix}${extension}`);
  },
});

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

// Konfigurasi multer untuk foto peserta
const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: imageFileFilter,
});

// Konfigurasi multer untuk tanda tangan
const uploadSignature = multer({
  storage: signatureStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
  fileFilter: imageFileFilter,
});

// Middleware untuk upload multiple files (foto dan tanda tangan)
const uploadCertificateFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;
      if (file.fieldname === "participantPhotoUrl") {
        uploadPath = path.join(__dirname, "../uploads/photos");
      } else if (file.fieldname === "signatureQrUrl") {
        uploadPath = path.join(__dirname, "../uploads/signatures");
      } else {
        return cb(new Error("Field name tidak valid"));
      }

      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);

      let prefix;
      if (file.fieldname === "participantPhotoUrl") {
        prefix = "photo";
      } else if (file.fieldname === "signatureQrUrl") {
        prefix = "signature";
      }

      cb(null, `${prefix}-${uniqueSuffix}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // maksimal 5MB per file
    files: 2, // maksimal total 2 file (1 foto + 1 ttd)
  },
  fileFilter: imageFileFilter,
}).fields([
  { name: "participantPhotoUrl", maxCount: 1 },
  { name: "signatureQrUrl", maxCount: 1 },
]);

// Middleware error handler untuk multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "File terlalu besar. Maksimal 5MB untuk foto dan 2MB untuk tanda tangan.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Terlalu banyak file. Maksimal 1 foto dan 1 tanda tangan.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          "Field file tidak dikenali. Gunakan participantPhoto dan signatureQrUrl.",
      });
    }
  }

  if (error.message.includes("Hanya file gambar")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Jika error lain, lanjutkan ke error handler berikutnya
  next(error);
};

// Middleware untuk validasi file yang diupload
const validateUploadedFiles = (req, res, next) => {
  // Cek apakah ada file yang diupload
  if (
    !req.files ||
    (Object.keys(req.files).length === 0 && req.files.constructor === Object)
  ) {
    // Tidak ada file, lanjutkan (mungkin update tanpa file baru)
    return next();
  }

  // Validasi foto peserta
  if (req.files.participantPhoto) {
    const photoFile = req.files.participantPhoto[0];
    const photoSizeMB = photoFile.size / (1024 * 1024);

    if (photoSizeMB > 5) {
      return res.status(400).json({
        success: false,
        message: "Foto peserta tidak boleh lebih dari 5MB",
      });
    }
  }

  // Validasi tanda tangan
  if (req.files.signatureQrUrl) {
    const signatureFile = req.files.signatureQrUrl[0];
    const signatureSizeMB = signatureFile.size / (1024 * 1024);

    if (signatureSizeMB > 2) {
      return res.status(400).json({
        success: false,
        message: "File tanda tangan tidak boleh lebih dari 2MB",
      });
    }
  }

  next();
};

// Middleware untuk membersihkan file jika terjadi error
const cleanupFilesOnError = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send dan res.json untuk mendeteksi error response
  res.send = function (body) {
    if (res.statusCode >= 400 && req.files) {
      cleanupUploadedFiles(req.files);
    }
    originalSend.call(this, body);
  };

  res.json = function (body) {
    if (res.statusCode >= 400 && req.files) {
      cleanupUploadedFiles(req.files);
    }
    originalJson.call(this, body);
  };

  next();
};

// Fungsi helper untuk membersihkan file yang diupload
const cleanupUploadedFiles = (files) => {
  if (!files) return;

  Object.keys(files).forEach((fieldname) => {
    files[fieldname].forEach((file) => {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          console.log(`Cleaned up file: ${file.path}`);
        } catch (error) {
          console.error(`Error cleaning up file ${file.path}:`, error.message);
        }
      }
    });
  });
};

// Middleware untuk kompresi gambar (opsional, memerlukan sharp)
const compressImages = async (req, res, next) => {
  // Jika ada library sharp, bisa implement kompresi di sini
  // Untuk sekarang, skip kompresi
  next();
};

module.exports = {
  uploadPhoto,
  uploadSignature,
  uploadCertificateFiles,
  handleMulterError,
  validateUploadedFiles,
  cleanupFilesOnError,
  cleanupUploadedFiles,
  compressImages,
};
