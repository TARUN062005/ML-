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
  res.json({ message: "API is running..." });
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

// ----------------- 404 Handler (Fixed for Express 5) -----------------
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ----------------- Start Server -----------------
const startServer = async () => {
  try {
    await ConnectDb();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();