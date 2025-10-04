// backend/routes/compareRoutes.js

const express = require('express');
const multer = require('multer');
const compareController = require('../controller/compareController');

const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the route: POST /api/compare
// It expects two files with field names 'file1' and 'file2'
router.post(
  '/compare', 
  upload.fields([{ name: 'file1' }, { name: 'file2' }]), 
  compareController.compareFiles
);

module.exports = router;