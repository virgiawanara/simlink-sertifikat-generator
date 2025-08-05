const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;

// Kunci rahasia untuk JWT. Harus sama dengan yang di AuthService!
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_ganti_di_env";

// Middleware untuk memverifikasi token JWT
const authenticateToken = async (req, res, next) => {
  try {
    let token;

    // Prioritas 1: Ambil token dari cookie (lebih aman untuk aplikasi web)
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // Prioritas 2: Ambil token dari header Authorization (fallback untuk API testing, misal dari Postman tanpa cookie)
    else if (req.headers["authorization"]) {
      const authHeader = req.headers["authorization"];
      token = authHeader && authHeader.split(" ")[1]; // Ambil bagian token setelah 'Bearer '
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: "Akses ditolak. Token tidak disediakan." });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Cari pengguna berdasarkan ID dari token
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res
        .status(403)
        .json({ message: "Token tidak valid. Pengguna tidak ditemukan." });
    }

    // Tambahkan informasi pengguna ke objek request
    req.user = user;
    next();
  } catch (error) {
    console.error("Error saat verifikasi token:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token kadaluarsa." });
    }
    return res.status(403).json({ message: "Token tidak valid." });
  }
};

// Middleware untuk memeriksa role pengguna
const authorizeRole = (roles) => {
  return (req, res, next) => {
    // Pastikan req.user sudah ada dari middleware authenticateToken
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ message: "Akses ditolak. Informasi role tidak tersedia." });
    }

    // Periksa apakah role pengguna termasuk dalam role yang diizinkan
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Akses ditolak. Anda tidak memiliki izin." });
    }
    next(); // Lanjutkan jika role diizinkan
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
};
