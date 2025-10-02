const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { ConnectDb } = require("./utils/dbConnector");

// Routers
const userLoginRouter = require("./routes/userLogin");
const mlRoutes = require("./routes/mlRoutes");

// Load environment variables
dotenv.config();

const app = express();

// ----------------- Middleware -----------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ----------------- Routes -----------------
app.get("/", (req, res) => {
  res.json({ 
    message: "NASA Exoplanet Detection API is running...",
    version: "1.0.0",
    models: {
      pre_trained: ["TOI", "KOI", "K2"],
      custom: "User-trained models"
    }
  });
});

// Health check for all ML services
app.get("/health/all", async (req, res) => {
  try {
    const { checkMLServices } = require('./utils/mlUtils');
    const healthStatus = await checkMLServices();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message
    });
  }
});

app.use("/user", userLoginRouter);
app.use("/api/ml", mlRoutes);

// ----------------- Error Handling Middleware -----------------
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ----------------- 404 Handler -----------------
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found",
    path: req.path
  });
});

// ----------------- Start Server -----------------
const startServer = async () => {
  try {
    await ConnectDb();
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🔬 ML Services:`);
      console.log(`   - TOI Model: http://localhost:5001`);
      console.log(`   - KOI Model: http://localhost:5002`);
      console.log(`   - K2 Model: http://localhost:5003`);
      console.log(`   - Custom Model: http://localhost:5004`);
      console.log(`📊 Database: Connected`);
      console.log(`🌐 API Base: http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();