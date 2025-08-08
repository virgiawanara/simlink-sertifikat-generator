// validators/certificateValidator.js - Validator yang diperbaiki sesuai spesifikasi database
const Joi = require("joi");

// ✅ SESUAI SPESIFIKASI: gunakan nama field database dan nilai yang benar
const createCertificateSchema = Joi.object({
  // Gunakan nama field sesuai database (snake_case)
  full_name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Nama lengkap minimal 2 karakter",
    "string.max": "Nama lengkap maksimal 100 karakter",
    "any.required": "Nama lengkap wajib diisi",
  }),

  nik: Joi.string()
    .pattern(/^\d{16}$/)
    .optional()
    .allow('', null)
    .messages({
      "string.pattern.base": "NIK harus berupa 16 digit angka",
    }),

  gender: Joi.string().valid("Laki-laki", "Perempuan").required().messages({
    "any.only": "Jenis kelamin harus Laki-laki atau Perempuan",
    "any.required": "Jenis kelamin wajib diisi",
  }),

  birth_place: Joi.string().min(2).max(50).required().messages({
    "string.min": "Tempat lahir minimal 2 karakter",
    "string.max": "Tempat lahir maksimal 50 karakter",
    "any.required": "Tempat lahir wajib diisi",
  }),

  birth_date: Joi.date().max("now").required().messages({
    "date.max": "Tanggal lahir tidak boleh di masa depan",
    "any.required": "Tanggal lahir wajib diisi",
  }),

  age: Joi.number().integer().min(17).max(80).required().messages({
    "number.min": "Usia minimal 17 tahun",
    "number.max": "Usia maksimal 80 tahun",
    "any.required": "Usia wajib diisi",
  }),

  // ✅ SESUAI SPESIFIKASI: gunakan 'Baru' dan 'Perpanjang'
  certificate_type: Joi.string()
    .valid("Baru", "Perpanjang")
    .required()
    .messages({
      "any.only": "Jenis sertifikat harus berupa 'Baru' atau 'Perpanjang'",
      "any.required": "Jenis sertifikat wajib diisi",
    }),

  // ✅ SESUAI SPESIFIKASI: gunakan semua license class yang ada di database
  license_class: Joi.string()
    .valid("A", "A Umum", "B1", "B1 Umum", "B2", "B2 Umum", "C", "C1", "C2", "D", "D1")
    .required()
    .messages({
      "any.only": "Golongan SIM harus berupa A, A Umum, B1, B1 Umum, B2, B2 Umum, C, C1, C2, D, atau D1",
      "any.required": "Golongan SIM wajib diisi",
    }),

  domicile: Joi.string().min(5).max(200).required().messages({
    "string.min": "Domisili minimal 5 karakter",
    "string.max": "Domisili maksimal 200 karakter",
    "any.required": "Domisili wajib diisi",
  }),

  // Field tanggal (gunakan nama database)
  issue_date: Joi.date().max("now").optional().messages({
    "date.max": "Tanggal penerbitan tidak boleh di masa depan",
  }),

  expiration_date: Joi.date().min(Joi.ref("issue_date")).optional().messages({
    "date.min": "Tanggal kadaluarsa harus setelah tanggal penerbitan",
  }),

  // URL foto dan tanda tangan (gunakan nama database)
  participant_photo_url: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  signature_qr_url: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  certificate_file_url: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  certificate_number: Joi.string().max(50).optional().messages({
    "string.max": "Nomor sertifikat maksimal 50 karakter",
  }),
});

// Schema untuk validasi update sertifikat
const updateCertificateSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Nama lengkap minimal 2 karakter",
    "string.max": "Nama lengkap maksimal 100 karakter",
  }),

  nik: Joi.string()
    .pattern(/^\d{16}$/)
    .optional()
    .allow('', null)
    .messages({
      "string.pattern.base": "NIK harus berupa 16 digit angka",
    }),

  gender: Joi.string().valid("Laki-laki", "Perempuan").optional().messages({
    "any.only": "Jenis kelamin harus Laki-laki atau Perempuan",
  }),

  birth_place: Joi.string().min(2).max(50).optional().messages({
    "string.min": "Tempat lahir minimal 2 karakter",
    "string.max": "Tempat lahir maksimal 50 karakter",
  }),

  birth_date: Joi.date().max("now").optional().messages({
    "date.max": "Tanggal lahir tidak boleh di masa depan",
  }),

  age: Joi.number().integer().min(17).max(80).optional().messages({
    "number.min": "Usia minimal 17 tahun",
    "number.max": "Usia maksimal 80 tahun",
  }),

  certificate_type: Joi.string()
    .valid("Baru", "Perpanjang")
    .optional()
    .messages({
      "any.only": "Jenis sertifikat harus berupa 'Baru' atau 'Perpanjang'",
    }),

  license_class: Joi.string()
    .valid("A", "A Umum", "B1", "B1 Umum", "B2", "B2 Umum", "C", "C1", "C2", "D", "D1")
    .optional()
    .messages({
      "any.only": "Golongan SIM harus berupa A, A Umum, B1, B1 Umum, B2, B2 Umum, C, C1, C2, D, atau D1",
    }),

  domicile: Joi.string().min(5).max(200).optional().messages({
    "string.min": "Domisili minimal 5 karakter",
    "string.max": "Domisili maksimal 200 karakter",
  }),

  issue_date: Joi.date().max("now").optional().messages({
    "date.max": "Tanggal penerbitan tidak boleh di masa depan",
  }),

  expiration_date: Joi.date().optional(),

  participant_photo_url: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  signature_qr_url: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  certificate_file_url: Joi.string()
    .uri({ relativeOnly: true })
    .optional()
    .allow(null, ""),

  certificate_number: Joi.string().max(50).optional(),
})
  .min(1)
  .messages({
    "object.min": "Minimal satu field harus diupdate",
  });

// Schema untuk validasi query parameter pencarian
const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).max(100).optional().allow('').messages({
    "string.min": "Query pencarian tidak boleh kosong",
    "string.max": "Query pencarian maksimal 100 karakter",
  }),

  page: Joi.number().integer().min(1).optional().default(1),

  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

// Schema untuk validasi filter golongan SIM
const licenseClassFilterSchema = Joi.object({
  class: Joi.string()
    .valid("A", "A Umum", "B1", "B1 Umum", "B2", "B2 Umum", "C", "C1", "C2", "D", "D1")
    .required()
    .messages({
      "any.only": "Golongan SIM harus berupa A, A Umum, B1, B1 Umum, B2, B2 Umum, C, C1, C2, D, atau D1",
      "any.required": "Parameter class wajib ada",
    }),

  page: Joi.number().integer().min(1).optional().default(1),

  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

// Schema untuk validasi query parameter umum
const generalQuerySchema = Joi.object({
  search: Joi.string().min(1).max(100).optional().allow('').messages({
    "string.min": "Query pencarian tidak boleh kosong",
    "string.max": "Query pencarian maksimal 100 karakter",
  }),

  certificateType: Joi.string().valid("Baru", "Perpanjang").optional(),

  licenseClass: Joi.string()
    .valid("A", "A Umum", "B1", "B1 Umum", "B2", "B2 Umum", "C", "C1", "C2", "D", "D1")
    .optional(),

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