const express = require("express");
const router = express.Router();
const multer = require('multer');

// Import controller methods
const {
  predictTOI,
  predictKOI,
  predictK2,
  getEntries,
  updateEntry,
  deleteEntry,
  exportPredictions,
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

// Configure multer for file uploads - FIXED: Proper memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is CSV
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' || 
        file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Apply auth middleware to all routes
router.use(authenticateToken);

// ----------------- Pre-trained Models -----------------
router.post("/predict/toi", predictTOI);
router.post("/predict/koi", predictKOI);
router.post("/predict/k2", predictK2);

// ----------------- Model Information -----------------
router.get("/model-info/:modelType", getModelInformation);

// ----------------- Enhanced Entry Management -----------------
router.get("/entries/:modelType", getEntries);
router.put("/entries/:modelType/:entryId", updateEntry);
router.delete("/entries/:modelType/:entryId", deleteEntry);
router.get("/export/:modelType", exportPredictions);

// ----------------- Custom Models -----------------
router.post("/custom-models", createCustomModel);
router.get("/custom-models", getCustomModels);
router.put("/custom-models", updateCustomModel);
router.delete("/custom-models", removeCustomModel);
router.post("/custom-models/predict", predictCustomModel);

// ----------------- File Processing -----------------
// FIXED: Simplified upload handler
router.post("/process-file/:modelType", upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please select a CSV file.'
    });
  }
  
  // Verify file type
  if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
    return res.status(400).json({
      success: false,
      message: 'Only CSV files are allowed'
    });
  }
  
  next();
}, processFile);

router.get("/file-status/:jobId", getFileStatus);

// ----------------- Dashboard & Analytics -----------------
router.get("/dashboard", getDashboardStats);

module.exports = router;