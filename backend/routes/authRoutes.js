const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Route publik
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);

// Route yang memerlukan autentikasi
router.post("/logout", authenticateToken, AuthController.logout);
router.get("/profile", authenticateToken, AuthController.getProfile);

module.exports = router;
