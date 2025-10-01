const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { ConnectDb } = require("./utils/dbConnector");

// Routers
const userLoginRouter = require("./routes/userLogin");
const otherLoginRouter = require("./routes/otherLogin");

// Load environment variables
dotenv.config();

const app = express();

// ----------------- Middleware -----------------
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // frontend origin
    credentials: true,
  })
);

// ----------------- Routes -----------------
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.use("/user", userLoginRouter);
app.use("/other", otherLoginRouter);

// ----------------- Start Server -----------------
const startServer = async () => {
  try {
    await ConnectDb();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1); // stop app if DB fails
  }
};

startServer();
