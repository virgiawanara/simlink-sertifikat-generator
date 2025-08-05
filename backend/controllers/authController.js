const AuthService = require("../services/authService");
const { signupSchema, loginSchema } = require("../validators/authValidator");

class AuthController {
  // Handler untuk pendaftaran pengguna (signup)
  static async signup(req, res) {
    try {
      const { error, value } = signupSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { email, password } = value;
      const { user } = await AuthService.signup(email, password);

      res.status(201).json({
        message: "Pendaftaran berhasil!",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Handler untuk login pengguna
  static async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const { email, password } = value;
      const { user, token } = await AuthService.login(email, password);

      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Login berhasil!",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  // Handler untuk logout pengguna
  static async logout(req, res) {
    try {
      res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({
        message: "Logout berhasil!",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Handler untuk mendapatkan profil user yang sedang login
  static async getProfile(req, res) {
    try {
      res.status(200).json({
        message: "Profil berhasil diambil",
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = AuthController;
