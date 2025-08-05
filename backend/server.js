const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors"); // Import the cors middleware

const authRoutes = require("./routes/authRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

const { sequelize } = require("./models");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to allow requests from your frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Use routers for authentication and certificates
app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);

// Synchronize database and start the server
sequelize
  .sync()
  .then(() => {
    console.log("Database connected and synchronized.");
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect or synchronize database:", err);
  });
