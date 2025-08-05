// validators/certificateValidator.js
const Joi = require("joi");

// Schema untuk validasi pembuatan sertifikat baru
const createCertificateSchema = Joi.object({
  participantFullName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Nama lengkap minimal 2 karakter",
    "string.max": "Nama lengkap maksimal 100 karakter",
    "any.required": "Nama lengkap wajib diisi",
  }),

  participantNIK: Joi.string()
    .pattern(/^\d{16}$/)
    .required()
    .messages({
      "string.pattern.base": "NIK harus berupa 16 digit angka",
      "any.required": "NIK wajib diisi",
    }),

  // PERBAIKAN: Sesuaikan dengan model dan postman
  gender: Joi.string().valid("Laki-laki", "Perempuan").required().messages({
    "any.only": "Jenis kelamin harus Laki-laki atau Perempuan",
    "any.required": "Jenis kelamin wajib diisi",
  }),

  birthPlace: Joi.string().min(2).max(50).required().messages({
    "string.min": "Tempat lahir minimal 2 karakter",
    "string.max": "Tempat lahir maksimal 50 karakter",
    "any.required": "Tempat lahir wajib diisi",
  }),

  birthDate: Joi.date().max("now").required().messages({
    "date.max": "Tanggal lahir tidak boleh di masa depan",
    "any.required": "Tanggal lahir wajib diisi",
  }),

  age: Joi.number().integer().min(17).max(80).required().messages({
    "number.min": "Usia minimal 17 tahun",
    "number.max": "Usia maksimal 80 tahun",
    "any.required": "Usia wajib diisi",
  }),

  // PERBAIKAN: Sesuaikan dengan model
  certificateType: Joi.string()
    .valid("Buat Baru", "Perpanjang")
    .required()
    .messages({
      "any.only": "Jenis sertifikat harus berupa Buat Baru atau Perpanjang",
      "any.required": "Jenis sertifikat wajib diisi",
    }),

  // PERBAIKAN: Sesuaikan dengan model (tambah D)
  licenseClass: Joi.string().valid("A", "B", "C").required().messages({
    "any.only": "Golongan SIM harus berupa A, B atau C",
    "any.required": "Golongan SIM wajib diisi",
  }),

  domicile: Joi.string().min(5).max(100).required().messages({
    "string.min": "Domisili minimal 5 karakter",
    "string.max": "Domisili maksimal 100 karakter",
    "any.required": "Domisili wajib diisi",
  }),

  // Tanggal penerbitan (opsional, akan diset otomatis jika tidak ada)
  issueDate: Joi.date().max("now").optional().messages({
    "date.max": "Tanggal penerbitan tidak boleh di masa depan",
  }),

  // PERBAIKAN: Tambahkan field opsional yang mungkin ada
  expirationDate: Joi.date().min(Joi.ref("issueDate")).optional().messages({
    "date.min": "Tanggal kadaluarsa harus setelah tanggal penerbitan",
  }),

  // URL foto dan tanda tangan (akan diset oleh controller)
  participantPhotoUrl: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  signatureQrUrl: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  // File URL sertifikat (akan diset saat generate)
  certificateFileUrl: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  // Nomor sertifikat (opsional, akan digenerate otomatis)
  certificateNumber: Joi.string().max(50).optional().messages({
    "string.max": "Nomor sertifikat maksimal 50 karakter",
  }),
});

// Schema untuk validasi update sertifikat
const updateCertificateSchema = Joi.object({
  participantFullName: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Nama lengkap minimal 2 karakter",
    "string.max": "Nama lengkap maksimal 100 karakter",
  }),

  participantNIK: Joi.string()
    .pattern(/^\d{16}$/)
    .optional()
    .messages({
      "string.pattern.base": "NIK harus berupa 16 digit angka",
    }),

  gender: Joi.string().valid("Laki-laki", "Perempuan").optional().messages({
    "any.only": "Jenis kelamin harus Laki-laki atau Perempuan",
  }),

  birthPlace: Joi.string().min(2).max(50).optional().messages({
    "string.min": "Tempat lahir minimal 2 karakter",
    "string.max": "Tempat lahir maksimal 50 karakter",
  }),

  birthDate: Joi.date().max("now").optional().messages({
    "date.max": "Tanggal lahir tidak boleh di masa depan",
  }),

  age: Joi.number().integer().min(17).max(80).optional().messages({
    "number.min": "Usia minimal 17 tahun",
    "number.max": "Usia maksimal 80 tahun",
  }),

  certificateType: Joi.string()
    .valid("Buat Baru", "Perpanjang")
    .optional()
    .messages({
      "any.only": "Jenis sertifikat harus berupa Buat Baru atau Perpanjang",
    }),

  licenseClass: Joi.string().valid("A", "B", "C", "D").optional().messages({
    "any.only": "Golongan SIM harus berupa A, B, C, atau D",
  }),

  domicile: Joi.string().min(5).max(100).optional().messages({
    "string.min": "Domisili minimal 5 karakter",
    "string.max": "Domisili maksimal 100 karakter",
  }),

  issueDate: Joi.date().max("now").optional().messages({
    "date.max": "Tanggal penerbitan tidak boleh di masa depan",
  }),

  expirationDate: Joi.date().optional(),

  participantPhotoUrl: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  signatureQrUrl: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  certificateFileUrl: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  certificateNumber: Joi.string().max(50).optional(),
})
  .min(1)
  .messages({
    "object.min": "Minimal satu field harus diupdate",
  });

// Schema untuk validasi query parameter pencarian
const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).max(100).required().messages({
    "string.min": "Query pencarian tidak boleh kosong",
    "string.max": "Query pencarian maksimal 100 karakter",
    "any.required": "Parameter pencarian q wajib ada",
  }),

  page: Joi.number().integer().min(1).optional().default(1),

  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

// Schema untuk validasi filter golongan SIM
const licenseClassFilterSchema = Joi.object({
  class: Joi.string().valid("A", "B", "C", "D").required().messages({
    "any.only": "Golongan SIM harus berupa A, B, C, atau D",
    "any.required": "Parameter class wajib ada",
  }),

  page: Joi.number().integer().min(1).optional().default(1),

  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

// Schema untuk validasi query parameter umum
const generalQuerySchema = Joi.object({
  search: Joi.string().min(1).max(100).optional().messages({
    "string.min": "Query pencarian tidak boleh kosong",
    "string.max": "Query pencarian maksimal 100 karakter",
  }),

  // PERBAIKAN: Sesuaikan dengan yang sebenarnya digunakan
  certificateType: Joi.string().valid("Buat Baru", "Perpanjang").optional(),

  licenseClass: Joi.string().valid("A", "B", "C", "D").optional(),

  gender: Joi.string().valid("Laki-laki", "Perempuan").optional(),

  page: Joi.number().integer().min(1).optional().default(1),

  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

module.exports = {
  createCertificateSchema,
  updateCertificateSchema,
  searchQuerySchema,
  licenseClassFilterSchema,
  generalQuerySchema,
};
