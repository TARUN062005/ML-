// server/controller/mlController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const csv = require('csv-parser');
const stream = require('stream');

const {
  predictWithTOI,
  predictWithKOI,
  predictWithK2,
  trainCustomModel,
  predictWithCustomModel,
  validateData,
  getModelInfo,
  getCustomModelInfo,
  deleteCustomModel: deleteCustomModelService,
  checkMLServices,
  storePrediction,
  generateCSVExport,
  generateExcelExport,
  getEntriesForExport
} = require('../utils/mlUtils');

// ----------------- Enhanced Prediction with Storage -----------------
const predictTOI = async (req, res) => {
  try {
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    console.log(`🔮 TOI Prediction requested by user ${userId}, bulk: ${isBulk}`);

    // Validate input data
    const validation = validateData(data, 'toi');
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format for TOI model',
        errors: validation.errors
      });
    }

    // Call TOI ML service
    const predictionResult = await predictWithTOI(data);

    // Enhanced storage with metadata
    if (!isBulk) {
      // Single prediction - store with enhanced data structure
      const storedEntry = await storePrediction(userId, 'toi', data, predictionResult.prediction || predictionResult);
      console.log(`✅ TOI prediction stored with ID: ${storedEntry.id}`);
    } else {
      // Bulk predictions - store each result
      const predictions = predictionResult.predictions || [];
      let storedCount = 0;
      
      for (const result of predictions) {
        if (!result.error) {
          await storePrediction(userId, 'toi', result.input_features, result);
          storedCount++;
        }
      }
      console.log(`✅ Stored ${storedCount} TOI predictions`);
    }

    res.json({
      success: true,
      data: predictionResult,
      message: isBulk ? 
        `Processed ${(predictionResult.predictions || []).length} TOI records` : 
        'TOI prediction completed successfully',
      stored: true,
      model_type: 'TOI'
    });

  } catch (error) {
    console.error('TOI Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'TOI prediction failed',
      error: error.message
    });
  }
};

const predictKOI = async (req, res) => {
  try {
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    console.log(`🔮 KOI Prediction requested by user ${userId}, bulk: ${isBulk}`);

    const validation = validateData(data, 'koi');
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format for KOI model',
        errors: validation.errors
      });
    }

    const predictionResult = await predictWithKOI(data);

    // Enhanced storage
    if (!isBulk) {
      const storedEntry = await storePrediction(userId, 'koi', data, predictionResult.prediction || predictionResult);
      console.log(`✅ KOI prediction stored with ID: ${storedEntry.id}`);
    } else {
      const predictions = predictionResult.predictions || [];
      let storedCount = 0;
      
      for (const result of predictions) {
        if (!result.error) {
          await storePrediction(userId, 'koi', result.input_features, result);
          storedCount++;
        }
      }
      console.log(`✅ Stored ${storedCount} KOI predictions`);
    }

    res.json({
      success: true,
      data: predictionResult,
      message: isBulk ? 
        `Processed ${(predictionResult.predictions || []).length} KOI records` : 
        'KOI prediction completed successfully',
      stored: true,
      model_type: 'KOI'
    });

  } catch (error) {
    console.error('KOI Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'KOI prediction failed',
      error: error.message
    });
  }
};

const predictK2 = async (req, res) => {
  try {
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    console.log(`🔮 K2 Prediction requested by user ${userId}, bulk: ${isBulk}`);

    const validation = validateData(data, 'k2');
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format for K2 model',
        errors: validation.errors
      });
    }

    const predictionResult = await predictWithK2(data);

    // Enhanced storage
    if (!isBulk) {
      const storedEntry = await storePrediction(userId, 'k2', data, predictionResult.prediction || predictionResult);
      console.log(`✅ K2 prediction stored with ID: ${storedEntry.id}`);
    } else {
      const predictions = predictionResult.predictions || [];
      let storedCount = 0;
      
      for (const result of predictions) {
        if (!result.error) {
          await storePrediction(userId, 'k2', result.input_features, result);
          storedCount++;
        }
      }
      console.log(`✅ Stored ${storedCount} K2 predictions`);
    }

    res.json({
      success: true,
      data: predictionResult,
      message: isBulk ? 
        `Processed ${(predictionResult.predictions || []).length} K2 records` : 
        'K2 prediction completed successfully',
      stored: true,
      model_type: 'K2'
    });

  } catch (error) {
    console.error('K2 Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'K2 prediction failed',
      error: error.message
    });
  }
};

// ----------------- Enhanced Export Endpoints -----------------
const exportPredictions = async (req, res) => {
  try {
    const { modelType } = req.params;
    const { format = 'csv', startDate, endDate, predictedClass } = req.query;
    const userId = req.user.id;

    console.log(`📊 Export requested for ${modelType} in ${format} format by user ${userId}`);

    const entries = await getEntriesForExport(userId, modelType, {
      startDate,
      endDate,
      predictedClass
    });

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No predictions found for the specified criteria'
      });
    }

    let fileBuffer, contentType, fileName;

    if (format.toLowerCase() === 'excel') {
      const workbook = await generateExcelExport(modelType, entries);
      fileBuffer = await workbook.xlsx.writeBuffer();
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `${modelType}_predictions_${Date.now()}.xlsx`;
    } else {
      const csvData = await generateCSVExport(modelType, entries);
      fileBuffer = Buffer.from(csvData, 'utf-8');
      contentType = 'text/csv';
      fileName = `${modelType}_predictions_${Date.now()}.csv`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    console.log(`✅ Exported ${entries.length} ${modelType} predictions as ${format}`);
    res.send(fileBuffer);

  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed',
      error: error.message
    });
  }
};

// ----------------- Updated File Processing -----------------
const processFile = async (req, res) => {
  try {
    const { modelType } = req.params;
    const userId = req.user.id;

    console.log(`📁 File processing requested for ${modelType} by user ${userId}`);

    if (!req.file || !req.file.buffer) {
      console.log('No file found in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file is empty.'
      });
    }

    const uploadedFile = req.file;

    if (!uploadedFile.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Only CSV files are supported'
      });
    }

    console.log(`✅ Processing file: ${uploadedFile.originalname}, Size: ${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`);

    const results = [];
    const errors = [];
    let totalRows = 0;

    const readableStream = new stream.Readable();
    readableStream.push(uploadedFile.buffer);
    readableStream.push(null); // End of the stream

    const parserStream = readableStream.pipe(csv({
      skipComments: true, 
      skipEmptyLines: true,
      mapValues: ({ header, value }) => {
        const trimmedValue = value ? value.trim() : '';
        if (!isNaN(trimmedValue) && trimmedValue !== '') {
          return parseFloat(trimmedValue);
        }
        return trimmedValue;
      }
    }));
    
    parserStream.on('data', async (rowData) => {
      parserStream.pause();
      totalRows++;

      try {
        const requiredFields = ['pl_orbper', 'pl_trandurh', 'pl_trandep', 'pl_rade'];
        const missingFields = requiredFields.filter(field => rowData[field] === undefined || rowData[field] === null || rowData[field] === '');
        
        if (missingFields.length > 0) {
          errors.push({
            row: totalRows,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            data: rowData
          });
          parserStream.resume();
          return;
        }

        let predictionResult;
        try {
          switch (modelType.toLowerCase()) {
            case 'toi':
              predictionResult = await predictWithTOI(rowData);
              break;
            case 'koi':
              predictionResult = await predictWithKOI(rowData);
              break;
            case 'k2':
              predictionResult = await predictWithK2(rowData);
              break;
            default:
              throw new Error(`Unsupported model type: ${modelType}`);
          }
        } catch (predictionError) {
          console.error(`❌ ML Service error for row ${totalRows}:`, predictionError.message);
          errors.push({
            row: totalRows,
            error: `ML Service unavailable: ${predictionError.message}`,
            data: rowData
          });
          parserStream.resume();
          return;
        }

        const storedEntry = await storePrediction(userId, modelType, rowData, predictionResult);
        results.push({
          row: totalRows,
          input: rowData,
          prediction: predictionResult,
          entryId: storedEntry.id
        });

        if (totalRows > 100 && totalRows % 100 === 0) {
          console.log(`📊 Processing progress: ${totalRows} rows completed`);
        }
      } catch (rowError) {
        console.error(`❌ Error processing row ${totalRows}:`, rowError.message);
        errors.push({
          row: totalRows,
          error: `Processing failed: ${rowError.message}`,
          data: rowData
        });
      }

      parserStream.resume();
    });

    parserStream.on('end', () => {
      console.log(`🎉 Bulk processing completed: ${results.length} successful, ${errors.length} errors`);
      const responseData = {
        processed: results.length,
        errors: errors.length,
        total: totalRows,
        results: results.slice(0, 10),
        errorsList: errors.slice(0, 10),
        stored: results.length,
        fileInfo: {
          name: uploadedFile.originalname,
          size: uploadedFile.size,
          rowsProcessed: totalRows
        }
      };

      res.json({
        success: true,
        data: responseData,
        message: `Processed ${results.length} records successfully${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      });
    });

    parserStream.on('error', (err) => {
      console.error('CSV Parsing Error:', err.message);
      res.status(500).json({
        success: false,
        message: 'CSV parsing failed. Please check file format.',
        error: err.message
      });
    });
    
  } catch (error) {
    console.error('File Processing Error:', error);
    res.status(500).json({
      success: false,
      message: 'File processing failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ----------------- Custom Models -----------------
const createCustomModel = async (req, res) => {
  try {
    const { trainingData, parameters, targetColumn, modelType } = req.body;
    const userId = req.user.id;

    console.log(`🎯 Custom model training requested by user ${userId}`);

    if (!trainingData) {
      return res.status(400).json({
        success: false,
        message: 'Training data is required'
      });
    }

    // Train the model using custom ML service
    const trainingResult = await trainCustomModel(
      userId, 
      trainingData, 
      { 
        targetColumn, 
        modelType, 
        ...parameters 
      }
    );

    res.json({
      success: true,
      data: trainingResult,
      message: 'Custom model trained successfully'
    });

  } catch (error) {
    console.error('Create Custom Model Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom model',
      error: error.message
    });
  }
};

const getCustomModels = async (req, res) => {
  try {
    const userId = req.user.id;

    const modelInfo = await getCustomModelInfo(userId);

    res.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    console.error('Get Custom Models Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom models',
      error: error.message
    });
  }
};

const updateCustomModel = async (req, res) => {
  try {
    const { trainingData, parameters } = req.body;
    const userId = req.user.id;

    if (!trainingData) {
      return res.status(400).json({
        success: false,
        message: 'Training data is required for updating model'
      });
    }

    const trainingResult = await trainCustomModel(userId, trainingData, parameters);

    res.json({
      success: true,
      data: trainingResult,
      message: 'Custom model retrained successfully'
    });

  } catch (error) {
    console.error('Update Custom Model Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update custom model',
      error: error.message
    });
  }
};

const removeCustomModel = async (req, res) => {
  try {
    const userId = req.user.id;

    await deleteCustomModelService(userId);

    res.json({
      success: true,
      message: 'Custom model deleted successfully'
    });

  } catch (error) {
    console.error('Delete Custom Model Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete custom model',
      error: error.message
    });
  }
};

const predictCustomModel = async (req, res) => {
  try {
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    console.log(`🔮 Custom model prediction requested by user ${userId}, bulk: ${isBulk}`);

    const validation = validateData(data, 'custom');
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format for custom model',
        errors: validation.errors
      });
    }

    const predictionResult = await predictWithCustomModel(userId, data, isBulk);

    res.json({
      success: true,
      data: predictionResult,
      message: isBulk ? 
        `Processed ${(predictionResult.predictions || []).length} custom model records` : 
        'Custom model prediction completed successfully'
    });

  } catch (error) {
    console.error('Custom Model Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Custom model prediction failed',
      error: error.message
    });
  }
};

// ----------------- Enhanced Entry Management -----------------
const getEntries = async (req, res) => {
  try {
    const { modelType } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 10, search, startDate, endDate, predictedClass } = req.query;

    const skip = (page - 1) * limit;

    let model;
    switch (modelType.toLowerCase()) {
      case 'toi':
        model = prisma.tOIEntry;
        break;
      case 'koi':
        model = prisma.kOIEntry;
        break;
      case 'k2':
        model = prisma.k2Entry;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid model type. Use: toi, koi, k2'
        });
    }

    // Build where clause with enhanced filtering
    const where = { userId };
    
    if (search) {
      where.OR = [
        { data: { path: ['metadata', 'predicted_class'], string_contains: search } },
        { data: { path: ['output', 'explanation'], string_contains: search } },
        { data: { path: ['input', 'pl_rade'], string_contains: search } },
        { data: { path: ['input', 'koi_period'], string_contains: search } },
        { data: { path: ['input', 'pl_orbper'], string_contains: search } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (predictedClass) {
      where.data = {
        ...where.data,
        path: ['metadata', 'predicted_class'],
        equals: predictedClass
      };
    }

    const [entries, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          data: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      model.count({ where })
    ]);

    // Enhanced response with summary
    const summary = {
      totalPredictions: total,
      withHighConfidence: entries.filter(e => e.data.metadata?.confidence > 0.8).length,
      uniqueClasses: [...new Set(entries.map(e => e.data.metadata?.predicted_class).filter(Boolean))],
      dateRange: {
        oldest: entries.length > 0 ? new Date(entries[entries.length - 1].createdAt).toLocaleDateString() : 'N/A',
        newest: entries.length > 0 ? new Date(entries[0].createdAt).toLocaleDateString() : 'N/A'
      }
    };

    res.json({
      success: true,
      data: {
        entries,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get Entries Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entries',
      error: error.message
    });
  }
};

const updateEntry = async (req, res) => {
  try {
    const { modelType, entryId } = req.params;
    const { data } = req.body;
    const userId = req.user.id;

    let model;
    switch (modelType.toLowerCase()) {
      case 'toi':
        model = prisma.tOIEntry;
        break;
      case 'koi':
        model = prisma.kOIEntry;
        break;
      case 'k2':
        model = prisma.k2Entry;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid model type'
        });
    }

    // Verify entry belongs to user
    const existingEntry = await model.findFirst({
      where: { id: entryId, userId }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found or access denied'
      });
    }

    // Re-predict with updated data
    let predictionResult;
    switch (modelType.toLowerCase()) {
      case 'toi':
        predictionResult = await predictWithTOI(data);
        break;
      case 'koi':
        predictionResult = await predictWithKOI(data);
        break;
      case 'k2':
        predictionResult = await predictWithK2(data);
        break;
    }

    // Update entry with enhanced metadata
    const updatedEntry = await model.update({
      where: { id: entryId },
      data: {
        data: {
          input: data,
          output: predictionResult.prediction || predictionResult,
          metadata: {
            model_type: modelType.toUpperCase(),
            timestamp: new Date().toISOString(),
            has_charts: !!(predictionResult.prediction?.charts || predictionResult.charts),
            confidence: predictionResult.prediction?.confidence || predictionResult.confidence || null,
            predicted_class: predictionResult.prediction?.predicted_class || predictionResult.predicted_class || null,
            updated: true,
            original_timestamp: existingEntry.data.metadata?.timestamp || existingEntry.createdAt.toISOString()
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        entry: updatedEntry,
        prediction: predictionResult
      },
      message: 'Entry updated successfully'
    });

  } catch (error) {
    console.error('Update Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update entry',
      error: error.message
    });
  }
};

const deleteEntry = async (req, res) => {
  try {
    const { modelType, entryId } = req.params;
    const userId = req.user.id;

    let model;
    switch (modelType.toLowerCase()) {
      case 'toi':
        model = prisma.tOIEntry;
        break;
      case 'koi':
        model = prisma.kOIEntry;
        break;
      case 'k2':
        model = prisma.k2Entry;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid model type'
        });
    }

    // Verify ownership
    const entry = await model.findFirst({
      where: { id: entryId, userId }
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found or access denied'
      });
    }

    await model.delete({
      where: { id: entryId }
    });

    console.log(`🗑️ Deleted ${modelType} entry ${entryId} for user ${userId}`);

    res.json({
      success: true,
      message: 'Entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete entry',
      error: error.message
    });
  }
};

const getFileStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Simulate job status check
    const statuses = ['queued', 'processing', 'completed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    res.json({
      success: true,
      data: {
        jobId,
        status: randomStatus,
        progress: randomStatus === 'completed' ? 100 : randomStatus === 'processing' ? 50 : 0,
        result: randomStatus === 'completed' ? 'File processed successfully' : 'Processing...',
        downloadUrl: randomStatus === 'completed' ? `/api/ml/export/${jobId}` : null
      }
    });

  } catch (error) {
    console.error('Get File Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file status',
      error: error.message
    });
  }
};

// ----------------- Enhanced Dashboard & Analytics -----------------
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      toiCount,
      koiCount,
      k2Count,
      recentPredictions,
      toiEntries,
      koiEntries,
      k2Entries
    ] = await Promise.all([
      prisma.tOIEntry.count({ where: { userId } }),
      prisma.kOIEntry.count({ where: { userId } }),
      prisma.k2Entry.count({ where: { userId } }),
      prisma.tOIEntry.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          data: true,
          createdAt: true
        }
      }),
      prisma.tOIEntry.findMany({
        where: { userId },
        take: 100,
        select: { data: true }
      }),
      prisma.kOIEntry.findMany({
        where: { userId },
        take: 100,
        select: { data: true }
      }),
      prisma.k2Entry.findMany({
        where: { userId },
        take: 100,
        select: { data: true }
      })
    ]);

    // Calculate confidence statistics
    const calculateStats = (entries) => {
      const confidences = entries.map(e => e.data.metadata?.confidence).filter(c => c != null);
      const total = confidences.length;
      
      if (total === 0) return { average: 0, highConfidence: 0, total: 0, distribution: {} };
      
      const average = confidences.reduce((a, b) => a + b, 0) / total;
      const highConfidence = confidences.filter(c => c > 0.8).length;
      
      // Calculate distribution
      const distribution = {
        '0-20%': confidences.filter(c => c <= 0.2).length,
        '21-40%': confidences.filter(c => c > 0.2 && c <= 0.4).length,
        '41-60%': confidences.filter(c => c > 0.4 && c <= 0.6).length,
        '61-80%': confidences.filter(c => c > 0.6 && c <= 0.8).length,
        '81-100%': confidences.filter(c => c > 0.8).length
      };

      return { average, highConfidence, total, distribution };
    };

    const servicesHealth = await checkMLServices();

    // Check custom models
    let customModelsCount = 0;
    try {
      const customModelInfo = await getCustomModelInfo(userId);
      customModelsCount = customModelInfo.has_model ? 1 : 0;
    } catch (error) {
      console.log('Custom model check failed:', error.message);
    }

    const toiStats = calculateStats(toiEntries);
    const koiStats = calculateStats(koiEntries);
    const k2Stats = calculateStats(k2Entries);

    res.json({
      success: true,
      data: {
        counts: {
          toi: toiCount,
          koi: koiCount,
          k2: k2Count,
          customModels: customModelsCount,
          total: toiCount + koiCount + k2Count
        },
        confidenceStats: {
          toi: toiStats,
          koi: koiStats,
          k2: k2Stats
        },
        recentPredictions,
        services: servicesHealth.services,
        summary: {
          totalPreTrainedModels: 3,
          activeCustomModels: customModelsCount,
          totalPredictions: toiCount + koiCount + k2Count,
          averageConfidence: (
            toiStats.average + koiStats.average + k2Stats.average
          ) / 3,
          highConfidencePredictions: toiStats.highConfidence + koiStats.highConfidence + k2Stats.highConfidence,
          userSince: recentPredictions.length > 0 ? 
            new Date(recentPredictions[recentPredictions.length - 1].createdAt).toLocaleDateString() : 
            'New User'
        }
      }
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

// ----------------- Model Information -----------------
const getModelInformation = async (req, res) => {
  try {
    const { modelType } = req.params;

    const modelInfo = await getModelInfo(modelType);

    res.json({
      success: true,
      data: modelInfo
    });

  } catch (error) {
    console.error('Get Model Information Error:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get ${modelType} model information`,
      error: error.message
    });
  }
};

module.exports = {
  // Pre-trained models
  predictTOI,
  predictKOI,
  predictK2,
  
  // Custom models
  createCustomModel,
  getCustomModels,
  updateCustomModel,
  removeCustomModel,
  predictCustomModel,
  
  // Enhanced entry management
  getEntries,
  updateEntry,
  deleteEntry,
  exportPredictions,
  
  // File processing
  processFile,
  getFileStatus,
  
  // Dashboard & analytics
  getDashboardStats,
  getModelInformation
};