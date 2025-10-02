const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  predictWithTOI,
  predictWithKOI,
  predictWithK2,
  trainCustomModel,
  predictWithCustomModel,
  validateData,
  processBulkData
} = require('../utils/mlUtils');

// ----------------- Pre-trained Model Predictions -----------------
const predictTOI = async (req, res) => {
  try {
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    // Validate input data
    const validation = validateData(data, 'toi');
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        errors: validation.errors
      });
    }

    let predictions;
    if (isBulk) {
      predictions = await processBulkData(data, 'toi', userId);
    } else {
      // Single prediction
      const prediction = await predictWithTOI(data);
      
      // Store in database
      const entry = await prisma.tOIEntry.create({
        data: {
          userId,
          data: {
            input: data,
            output: prediction,
            timestamp: new Date().toISOString()
          }
        }
      });

      predictions = [{
        entryId: entry.id,
        ...prediction
      }];
    }

    res.json({
      success: true,
      data: predictions,
      message: isBulk ? 
        `Processed ${predictions.length} records` : 
        'Prediction completed successfully'
    });

  } catch (error) {
    console.error('TOI Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed',
      error: error.message
    });
  }
};

const predictKOI = async (req, res) => {
  try {
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    const validation = validateData(data, 'koi');
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        errors: validation.errors
      });
    }

    let predictions;
    if (isBulk) {
      predictions = await processBulkData(data, 'koi', userId);
    } else {
      const prediction = await predictWithKOI(data);
      
      const entry = await prisma.kOIEntry.create({
        data: {
          userId,
          data: {
            input: data,
            output: prediction,
            timestamp: new Date().toISOString()
          }
        }
      });

      predictions = [{
        entryId: entry.id,
        ...prediction
      }];
    }

    res.json({
      success: true,
      data: predictions,
      message: isBulk ? 
        `Processed ${predictions.length} records` : 
        'Prediction completed successfully'
    });

  } catch (error) {
    console.error('KOI Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed',
      error: error.message
    });
  }
};

const predictK2 = async (req, res) => {
  try {
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    const validation = validateData(data, 'k2');
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        errors: validation.errors
      });
    }

    let predictions;
    if (isBulk) {
      predictions = await processBulkData(data, 'k2', userId);
    } else {
      const prediction = await predictWithK2(data);
      
      const entry = await prisma.k2Entry.create({
        data: {
          userId,
          data: {
            input: data,
            output: prediction,
            timestamp: new Date().toISOString()
          }
        }
      });

      predictions = [{
        entryId: entry.id,
        ...prediction
      }];
    }

    res.json({
      success: true,
      data: predictions,
      message: isBulk ? 
        `Processed ${predictions.length} records` : 
        'Prediction completed successfully'
    });

  } catch (error) {
    console.error('K2 Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed',
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
          message: 'Invalid model type'
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
    let prediction;
    switch (modelType.toLowerCase()) {
      case 'toi':
        prediction = await predictWithTOI(data);
        break;
      case 'koi':
        prediction = await predictWithKOI(data);
        break;
      case 'k2':
        prediction = await predictWithK2(data);
        break;
    }

    // Update entry
    const updatedEntry = await model.update({
      where: { id: entryId },
      data: {
        data: {
          input: data,
          output: prediction,
          timestamp: new Date().toISOString(),
          updated: true
        }
      }
    });

    res.json({
      success: true,
      data: {
        entry: updatedEntry,
        prediction
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

// ----------------- Custom Models -----------------
const createCustomModel = async (req, res) => {
  try {
    const { name, trainingData, parameters } = req.body;
    const userId = req.user.id;

    if (!name || !trainingData) {
      return res.status(400).json({
        success: false,
        message: 'Name and training data are required'
      });
    }

    // Train the model
    const modelResult = await trainCustomModel(trainingData, parameters);

    // Store model in database
    const customModel = await prisma.customModel.create({
      data: {
        userId,
        name,
        params: {
          parameters: parameters || {},
          accuracy: modelResult.accuracy,
          features: modelResult.features,
          modelInfo: modelResult.modelInfo
        }
      }
    });

    res.json({
      success: true,
      data: {
        model: customModel,
        trainingResults: modelResult
      },
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
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [models, total] = await Promise.all([
      prisma.customModel.findMany({
        where: { userId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { entries: true }
          }
        }
      }),
      prisma.customModel.count({ where: { userId } })
    ]);

    res.json({
      success: true,
      data: {
        models,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
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
    const { modelId } = req.params;
    const { name, trainingData, parameters } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const existingModel = await prisma.customModel.findFirst({
      where: { id: modelId, userId }
    });

    if (!existingModel) {
      return res.status(404).json({
        success: false,
        message: 'Model not found or access denied'
      });
    }

    let updateData = { name };
    let trainingResults = null;

    // Retrain if new data provided
    if (trainingData) {
      trainingResults = await trainCustomModel(trainingData, parameters);
      updateData.params = {
        parameters: parameters || {},
        accuracy: trainingResults.accuracy,
        features: trainingResults.features,
        modelInfo: trainingResults.modelInfo,
        retrainedAt: new Date().toISOString()
      };
    }

    const updatedModel = await prisma.customModel.update({
      where: { id: modelId },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        model: updatedModel,
        trainingResults
      },
      message: trainingData ? 
        'Model retrained successfully' : 
        'Model updated successfully'
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

const deleteCustomModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const model = await prisma.customModel.findFirst({
      where: { id: modelId, userId }
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Model not found or access denied'
      });
    }

    await prisma.customModel.delete({
      where: { id: modelId }
    });

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
    const { modelId } = req.params;
    const { data, isBulk = false } = req.body;
    const userId = req.user.id;

    // Verify ownership and get model
    const customModel = await prisma.customModel.findFirst({
      where: { id: modelId, userId }
    });

    if (!customModel) {
      return res.status(404).json({
        success: false,
        message: 'Model not found or access denied'
      });
    }

    let predictions;
    if (isBulk) {
      predictions = await processBulkData(data, 'custom', userId, modelId);
    } else {
      const prediction = await predictWithCustomModel(data, customModel);
      
      // Store prediction
      const entry = await prisma.customModelEntry.create({
        data: {
          customModelId: modelId,
          data: {
            input: data,
            output: prediction,
            timestamp: new Date().toISOString()
          }
        }
      });

      predictions = [{
        entryId: entry.id,
        ...prediction
      }];
    }

    res.json({
      success: true,
      data: predictions,
      message: isBulk ? 
        `Processed ${predictions.length} records` : 
        'Prediction completed successfully'
    });

  } catch (error) {
    console.error('Custom Model Prediction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Prediction failed',
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

    // This would typically handle file upload and processing
    // For now, we'll simulate file processing
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you'd queue this for background processing
    res.json({
      success: true,
      data: {
        jobId,
        status: 'queued',
        message: 'File processing started'
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

// ----------------- Dashboard -----------------
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      toiCount,
      koiCount,
      k2Count,
      customModelsCount,
      recentPredictions
    ] = await Promise.all([
      prisma.tOIEntry.count({ where: { userId } }),
      prisma.kOIEntry.count({ where: { userId } }),
      prisma.k2Entry.count({ where: { userId } }),
      prisma.customModel.count({ where: { userId } }),
      prisma.tOIEntry.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

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
        summary: {
          totalModels: 3 + customModelsCount, // 3 pre-trained + custom
          activeModels: customModelsCount > 0 ? 4 : 3
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

module.exports = {
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
};