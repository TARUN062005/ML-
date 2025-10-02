const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  predictWithTOI,
  predictWithKOI,
  predictWithK2,
  trainCustomModel,
  predictWithCustomModel,
  validateData,
  processBulkData,
  getModelInfo,
  getCustomModelInfo,
  deleteCustomModel: deleteCustomModelService,
  checkMLServices
} = require('../utils/mlUtils');

// ----------------- Pre-trained Model Predictions -----------------
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
    const predictionResult = await predictWithTOI(data, isBulk);

    // Store in database
    if (!isBulk) {
      await prisma.tOIEntry.create({
        data: {
          userId,
          data: {
            input: data,
            output: predictionResult,
            timestamp: new Date().toISOString()
          }
        }
      });
    } else {
      // For bulk predictions, store each result
      for (const result of predictionResult.predictions || []) {
        if (!result.error) {
          await prisma.tOIEntry.create({
            data: {
              userId,
              data: {
                input: result.input_features,
                output: result,
                timestamp: new Date().toISOString()
              }
            }
          });
        }
      }
    }

    res.json({
      success: true,
      data: predictionResult,
      message: isBulk ? 
        `Processed ${(predictionResult.predictions || []).length} TOI records` : 
        'TOI prediction completed successfully'
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

    const predictionResult = await predictWithKOI(data, isBulk);

    // Store in database
    if (!isBulk) {
      await prisma.kOIEntry.create({
        data: {
          userId,
          data: {
            input: data,
            output: predictionResult,
            timestamp: new Date().toISOString()
          }
        }
      });
    } else {
      for (const result of predictionResult.predictions || []) {
        if (!result.error) {
          await prisma.kOIEntry.create({
            data: {
              userId,
              data: {
                input: result.input_features,
                output: result,
                timestamp: new Date().toISOString()
              }
            }
          });
        }
      }
    }

    res.json({
      success: true,
      data: predictionResult,
      message: isBulk ? 
        `Processed ${(predictionResult.predictions || []).length} KOI records` : 
        'KOI prediction completed successfully'
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

    const predictionResult = await predictWithK2(data, isBulk);

    // Store in database
    if (!isBulk) {
      await prisma.k2Entry.create({
        data: {
          userId,
          data: {
            input: data,
            output: predictionResult,
            timestamp: new Date().toISOString()
          }
        }
      });
    } else {
      for (const result of predictionResult.predictions || []) {
        if (!result.error) {
          await prisma.k2Entry.create({
            data: {
              userId,
              data: {
                input: result.input_features,
                output: result,
                timestamp: new Date().toISOString()
              }
            }
          });
        }
      }
    }

    res.json({
      success: true,
      data: predictionResult,
      message: isBulk ? 
        `Processed ${(predictionResult.predictions || []).length} K2 records` : 
        'K2 prediction completed successfully'
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

    // For custom models, updating means retraining
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

// FIXED: Renamed this function to avoid conflict
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

// ----------------- Entry Management -----------------
const getEntries = async (req, res) => {
  try {
    const { modelType } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 10, search } = req.query;

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

    const where = { userId };
    if (search) {
      where.OR = [
        { data: { path: ['output', 'predicted_class'], string_contains: search } },
        { data: { path: ['output', 'explanation'], string_contains: search } }
      ];
    }

    const [entries, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      model.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        entries,
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

    // Update entry
    const updatedEntry = await model.update({
      where: { id: entryId },
      data: {
        data: {
          input: data,
          output: predictionResult,
          timestamp: new Date().toISOString(),
          updated: true
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

// ----------------- File Processing -----------------
const processFile = async (req, res) => {
  try {
    const { modelType } = req.params;
    const { fileData, options } = req.body;
    const userId = req.user.id;

    console.log(`📁 File processing requested for ${modelType} by user ${userId}`);

    // This would handle file upload and processing
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you'd queue this for background processing
    res.json({
      success: true,
      data: {
        jobId,
        status: 'queued',
        message: 'File processing started',
        modelType,
        userId
      }
    });

  } catch (error) {
    console.error('File Processing Error:', error);
    res.status(500).json({
      success: false,
      message: 'File processing failed',
      error: error.message
    });
  }
};

const getFileStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Simulate job status check
    res.json({
      success: true,
      data: {
        jobId,
        status: 'completed',
        progress: 100,
        result: 'File processed successfully'
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

// ----------------- Dashboard & Analytics -----------------
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      toiCount,
      koiCount,
      k2Count,
      recentPredictions
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
      })
    ]);

    // Get ML services health
    const servicesHealth = await checkMLServices();

    // Check if user has custom model
    let customModelsCount = 0;
    try {
      const customModelInfo = await getCustomModelInfo(userId);
      customModelsCount = customModelInfo.has_model ? 1 : 0;
    } catch (error) {
      console.log('Custom model check failed:', error.message);
    }

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
        recentPredictions,
        services: servicesHealth.services,
        summary: {
          totalPreTrainedModels: 3,
          activeCustomModels: customModelsCount,
          totalPredictions: toiCount + koiCount + k2Count
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
  removeCustomModel, // FIXED: Changed from deleteCustomModel to removeCustomModel
  predictCustomModel,
  
  // Entry management
  getEntries,
  updateEntry,
  deleteEntry,
  
  // File processing
  processFile,
  getFileStatus,
  
  // Dashboard & analytics
  getDashboardStats,
  getModelInformation
};