const express = require("express");
const router = express.Router();

// Import controller methods directly
const {
  predictTOI,
  predictKOI,
  predictK2,
  getEntries,
  updateEntry,
  deleteEntry,
  createCustomModel,
  getCustomModels,
  updateCustomModel,
  deleteCustomModel,
  predictCustomModel,
  processFile,
  getFileStatus,
  getDashboardStats
} = require("../controller/mlController");

const { authenticateToken } = require("../middleware/authmiddleware");

// Apply auth middleware to all routes
router.use(authenticateToken);

// Pre-trained Models
router.post("/predict/toi", predictTOI);
router.post("/predict/koi", predictKOI);
router.post("/predict/k2", predictK2);

// Entry Management
router.get("/entries/:modelType", getEntries);
router.put("/entries/:modelType/:entryId", updateEntry);
router.delete("/entries/:modelType/:entryId", deleteEntry);

// Custom Models
router.post("/custom-models", createCustomModel);
router.get("/custom-models", getCustomModels);
router.put("/custom-models/:modelId", updateCustomModel);
router.delete("/custom-models/:modelId", deleteCustomModel);
router.post("/custom-models/:modelId/predict", predictCustomModel);

// File Processing
router.post("/process-file/:modelType", processFile);
router.get("/file-status/:jobId", getFileStatus);

// Dashboard
router.get("/dashboard", getDashboardStats);

module.exports = router;