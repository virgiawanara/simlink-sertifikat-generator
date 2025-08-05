const bcrypt = require("bcryptjs"); // Untuk hashing password
const jwt = require("jsonwebtoken"); // Untuk membuat token JWT

// Mengubah cara impor model
const db = require("../models"); // Mengimpor seluruh objek db
const User = db.User; // Mengakses model User dari objek db

// Kunci rahasia untuk JWT. Ganti dengan string yang kuat dan simpan di environment variable!
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_ganti_di_env";
// Waktu kadaluarsa token (misal: 1 jam)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

class AuthService {
  // Metode untuk pendaftaran pengguna baru (signup)
  static async signup(email, password) {
    try {
      // Periksa apakah email sudah terdaftar
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error("Email sudah terdaftar.");
      }

      // Hash password sebelum menyimpannya ke database
      const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds 10

      // Buat pengguna baru dengan role 'admin'
      const user = await User.create({
        email,
        password: hashedPassword,
        role: "admin", // Sesuai permintaan, role default adalah 'admin'
      });

      // Buat token JWT untuk pengguna yang baru terdaftar
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        }
      );

      return { user, token };
    } catch (error) {
      console.error("Error saat signup:", error.message);
      throw error;
    }
  }

  // Metode untuk login pengguna
  static async login(email, password) {
    try {
      // Cari pengguna berdasarkan email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error("Email atau password salah.");
      }

      // Bandingkan password yang dimasukkan dengan password hash di database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Email atau password salah.");
      }

      // Buat token JWT jika login berhasil
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        }
      );

      return { user, token };
    } catch (error) {
      console.error("Error saat login:", error.message);
      throw error;
    }
  }

  // Metode baru untuk logout
  static async logout() {
    // Logout hanya perlu menghapus cookie di controller
    return { message: "Logout berhasil" };
  }
}

module.exports = AuthService;
