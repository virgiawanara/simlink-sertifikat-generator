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
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Content-Disposition", "Content-Length"], // ✅ TAMBAHAN untuk download
};
app.use(cors(corsOptions));

// ✅ Enhanced CORS middleware dengan exposedHeaders
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length'); // ✅ TAMBAHAN untuk download
  
  if (req.method === 'OPTIONS') {
    console.log('Handling preflight request from:', req.get('Origin'));
    return res.status(200).end();
  }
  
  console.log(`${req.method} ${req.url} from origin: ${req.get('Origin')}`);
  next();
});

// ✅ Test endpoint untuk debugging
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ Database connection test endpoint
app.get('/api/test/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'PostgreSQL connection successful!',
      database: sequelize.config.database,
      host: sequelize.config.host,
      port: sequelize.config.port
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

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
