const express = require("express");
const router = express.Router();

// Import controller methods
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
  removeCustomModel,
  predictCustomModel,
  processFile,
  getFileStatus,
  getDashboardStats,
  getModelInformation
} = require("../controller/mlController");

const { authenticateToken } = require("../middleware/authmiddleware");

// Apply auth middleware to all routes
router.use(authenticateToken);

// ----------------- Pre-trained Models -----------------
router.post("/predict/toi", predictTOI);
router.post("/predict/koi", predictKOI);
router.post("/predict/k2", predictK2);

// ----------------- Model Information -----------------
router.get("/model-info/:modelType", getModelInformation);

// ----------------- Entry Management -----------------
router.get("/entries/:modelType", getEntries);
router.put("/entries/:modelType/:entryId", updateEntry);
router.delete("/entries/:modelType/:entryId", deleteEntry);

// ----------------- Custom Models -----------------
router.post("/custom-models", createCustomModel);
router.get("/custom-models", getCustomModels);
router.put("/custom-models", updateCustomModel);
router.delete("/custom-models", removeCustomModel); // FIXED: Updated to removeCustomModel
router.post("/custom-models/predict", predictCustomModel);

// ----------------- File Processing -----------------
router.post("/process-file/:modelType", processFile);
router.get("/file-status/:jobId", getFileStatus);

// ----------------- Dashboard & Analytics -----------------
router.get("/dashboard", getDashboardStats);

module.exports = router;