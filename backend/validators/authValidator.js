// validators/authValidator.js
const Joi = require("joi");

// Skema validasi untuk pendaftaran (signup) pengguna baru
const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email harus dalam format yang valid.",
    "string.empty": "Email tidak boleh kosong.",
    "any.required": "Email wajib diisi.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password minimal harus {{#limit}} karakter.",
    "string.empty": "Password tidak boleh kosong.",
    "any.required": "Password wajib diisi.",
  }),
  // Role akan diatur secara otomatis ke 'admin' di service,
  // jadi tidak perlu divalidasi dari input pengguna untuk signup ini
});

// Skema validasi untuk login pengguna
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email harus dalam format yang valid.",
    "string.empty": "Email tidak boleh kosong.",
    "any.required": "Email wajib diisi.",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password tidak boleh kosong.",
    "any.required": "Password wajib diisi.",
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
};
