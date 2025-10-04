const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');

// ML Service URLs
const ML_SERVICES = {
  TOI: process.env.TOI_SERVICE_URL || 'http://localhost:5001',
  KOI: process.env.KOI_SERVICE_URL || 'http://localhost:5002',
  K2: process.env.K2_SERVICE_URL || 'http://localhost:5003',
  CUSTOM: process.env.CUSTOM_SERVICE_URL || 'http://localhost:5004'
};

// ----------------- Enhanced Prediction Functions -----------------
const predictWithTOI = async (data) => {
  try {
    const response = await axios.post(`${ML_SERVICES.TOI}/predict`, data, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('TOI Service Error:', error.message);
    throw new Error(`TOI prediction failed: ${error.response?.data?.error || error.message}`);
  }
};

const predictWithKOI = async (data) => {
  try {
    const response = await axios.post(`${ML_SERVICES.KOI}/predict`, data, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('KOI Service Error:', error.message);
    throw new Error(`KOI prediction failed: ${error.response?.data?.error || error.message}`);
  }
};

const predictWithK2 = async (data) => {
  try {
    const response = await axios.post(`${ML_SERVICES.K2}/predict`, data, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('K2 Service Error:', error.message);
    throw new Error(`K2 prediction failed: ${error.response?.data?.error || error.message}`);
  }
};

// ----------------- Enhanced Data Storage -----------------
const storePrediction = async (userId, modelType, inputData, predictionResult) => {
  try {
    const storageData = {
      input: inputData,
      output: predictionResult,
      metadata: {
        model_type: modelType.toUpperCase(),
        timestamp: new Date().toISOString(),
        has_charts: !!predictionResult.charts,
        confidence: predictionResult.confidence || null,
        predicted_class: predictionResult.predicted_class || null,
        is_bulk: Array.isArray(inputData),
        features_used: Object.keys(inputData)
      }
    };

    let createdEntry;
    
    switch (modelType.toLowerCase()) {
      case 'toi':
        createdEntry = await prisma.tOIEntry.create({
          data: {
            userId,
            data: storageData
          }
        });
        break;
      case 'koi':
        createdEntry = await prisma.kOIEntry.create({
          data: {
            userId,
            data: storageData
          }
        });
        break;
      case 'k2':
        createdEntry = await prisma.k2Entry.create({
          data: {
            userId,
            data: storageData
          }
        });
        break;
      case 'custom':
        if (predictionResult.customModelId) {
          createdEntry = await prisma.customModelEntry.create({
            data: {
              customModelId: predictionResult.customModelId,
              data: storageData
            }
          });
        }
        break;
    }

    console.log(`✅ Stored ${modelType} prediction for user ${userId}`);
    return createdEntry;
    
  } catch (error) {
    console.error('Storage Error:', error);
    throw new Error(`Failed to store prediction: ${error.message}`);
  }
};

// ----------------- Export Functions -----------------
const generateCSVExport = async (userId, modelType, entries) => {
  try {
    const csvRows = [];
    
    // Header row
    const headers = [
      'Prediction ID',
      'Timestamp',
      'Model Type',
      'Predicted Class',
      'Confidence',
      'Input Features',
      'All Probabilities',
      'Explanation',
      'Has Charts'
    ];
    csvRows.push(headers.join(','));
    
    // Data rows
    entries.forEach(entry => {
      const data = entry.data;
      const row = [
        entry.id,
        data.metadata?.timestamp || entry.createdAt.toISOString(),
        data.metadata?.model_type || modelType.toUpperCase(),
        data.metadata?.predicted_class || 'N/A',
        data.metadata?.confidence ? (data.metadata.confidence * 100).toFixed(2) + '%' : 'N/A',
        JSON.stringify(data.input).replace(/,/g, ';'), // Avoid CSV conflicts
        JSON.stringify(data.output?.probabilities || {}),
        `"${data.output?.explanation || 'No explanation available'}"`,
        data.metadata?.has_charts ? 'Yes' : 'No'
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  } catch (error) {
    console.error('CSV Generation Error:', error);
    throw new Error(`Failed to generate CSV: ${error.message}`);
  }
};

const generateExcelExport = async (userId, modelType, entries) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${modelType.toUpperCase()} Predictions`);

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'Predicted Class', key: 'predicted_class', width: 18 },
      { header: 'Confidence', key: 'confidence', width: 12 },
      { header: 'Orbital Period', key: 'pl_orbper', width: 15 },
      { header: 'Transit Duration', key: 'pl_trandurh', width: 16 },
      { header: 'Transit Depth', key: 'pl_trandep', width: 15 },
      { header: 'Planet Radius', key: 'pl_rade', width: 15 }
    ];

    // Add data rows
    entries.forEach((entry, index) => {
      const inputData = entry.data?.input || {};
      const outputData = entry.data?.output || {};
      
      const rowData = {
        id: entry.id,
        timestamp: new Date(entry.createdAt).toLocaleString(),
        predicted_class: outputData.predicted_class || 'Unknown',
        confidence: outputData.confidence ? (outputData.confidence * 100).toFixed(2) + '%' : 'N/A',
        pl_orbper: inputData.pl_orbper || 'N/A',
        pl_trandurh: inputData.pl_trandurh || 'N/A',
        pl_trandep: inputData.pl_trandep || 'N/A',
        pl_rade: inputData.pl_rade || 'N/A'
      };

      worksheet.addRow(rowData);

      // Add styling for confidence
      const row = worksheet.getRow(index + 2);
      if (outputData.confidence > 0.8) {
        row.getCell('confidence').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF00FF00' }
        };
      }
    });

    // Add header styling
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E86AB' }
      };
    });

    return workbook;
  } catch (error) {
    console.error('Excel Generation Error:', error);
    throw new Error(`Failed to generate Excel: ${error.message}`);
  }
};

// ----------------- Enhanced Entry Management -----------------
const getEntriesForExport = async (userId, modelType, filters = {}) => {
  try {
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
        throw new Error(`Invalid model type: ${modelType}`);
    }
    
    const where = { userId };
    
    // Add date filters
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }
    
    // Add class filter
    if (filters.predictedClass) {
      where.data = {
        path: ['metadata', 'predicted_class'],
        equals: filters.predictedClass
      };
    }
    
    const entries = await model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 1000 // Limit for performance
    });
    
    return entries;
  } catch (error) {
    console.error('Get Entries Error:', error);
    throw new Error(`Failed to get entries: ${error.message}`);
  }
};

// ----------------- Service Health Checks -----------------
const checkMLServices = async () => {
  const services = {};
  
  for (const [serviceName, serviceUrl] of Object.entries(ML_SERVICES)) {
    try {
      const response = await axios.get(`${serviceUrl}/health`, { timeout: 5000 });
      services[serviceName] = {
        status: 'healthy',
        url: serviceUrl,
        data: response.data
      };
    } catch (error) {
      services[serviceName] = {
        status: 'unhealthy',
        url: serviceUrl,
        error: error.message
      };
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    services
  };
};

// ----------------- Data Validation -----------------
const validateData = (data, modelType) => {
  const errors = [];
  
  if (!data) {
    errors.push('Data is required');
    return { valid: false, errors };
  }

  const isBulk = Array.isArray(data);
  const dataToValidate = isBulk ? data[0] : data;

  // Model-specific validation based on your trained models
  switch (modelType) {
    case 'toi':
      const toiFeatures = ['pl_trandurh', 'pl_trandep', 'pl_rade', 'pl_insol', 'pl_eqt', 'st_tmag', 'st_dist', 'st_teff', 'st_logg', 'st_rad'];
      const missingTOIFeatures = toiFeatures.filter(feature => !(feature in dataToValidate));
      if (missingTOIFeatures.length > 0) {
        errors.push(`Missing TOI features: ${missingTOIFeatures.join(', ')}`);
      }
      break;
      
    case 'koi':
      const koiFeatures = ['koi_impact', 'koi_duration', 'koi_depth', 'koi_teq', 'koi_insol', 'koi_model_snr', 'koi_steff', 'koi_slogg', 'koi_srad', 'koi_kepmag'];
      const missingKOIFeatures = koiFeatures.filter(feature => !(feature in dataToValidate));
      if (missingKOIFeatures.length > 0) {
        errors.push(`Missing KOI features: ${missingKOIFeatures.join(', ')}`);
      }
      break;
      
    case 'k2':
      const k2Features = ['pl_rade', 'pl_bmasse', 'pl_insol', 'st_teff', 'st_rad', 'st_mass', 'st_met', 'st_logg', 'sy_dist', 'sy_vmag'];
      const missingK2Features = k2Features.filter(feature => !(feature in dataToValidate));
      if (missingK2Features.length > 0) {
        errors.push(`Missing K2 features: ${missingK2Features.join(', ')}`);
      }
      break;
      
    case 'custom':
      if (Object.keys(dataToValidate).length === 0) {
        errors.push('At least one feature is required for custom model');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// ----------------- Bulk Data Processing -----------------
const processBulkData = async (data, modelType, userId, customModelId = null) => {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i];
      let prediction;
      
      switch (modelType) {
        case 'toi':
          prediction = await predictWithTOI(item);
          break;
        case 'koi':
          prediction = await predictWithKOI(item);
          break;
        case 'k2':
          prediction = await predictWithK2(item);
          break;
        case 'custom':
          prediction = await predictWithCustomModel(userId, item);
          break;
      }
      
      results.push({
        index: i,
        input: item,
        ...prediction
      });
      
    } catch (error) {
      errors.push({
        index: i,
        input: data[i],
        error: error.message
      });
    }
  }
  
  return {
    success: errors.length === 0,
    processed: results.length,
    failed: errors.length,
    results,
    errors
  };
};

// ----------------- Model Information -----------------
const getModelInfo = async (modelType) => {
  try {
    let serviceUrl;
    switch (modelType.toLowerCase()) {
      case 'toi':
        serviceUrl = ML_SERVICES.TOI;
        break;
      case 'koi':
        serviceUrl = ML_SERVICES.KOI;
        break;
      case 'k2':
        serviceUrl = ML_SERVICES.K2;
        break;
      default:
        throw new Error(`Unknown model type: ${modelType}`);
    }
    
    const response = await axios.get(`${serviceUrl}/model_info`, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`Get Model Info Error for ${modelType}:`, error.message);
    throw new Error(`Failed to get ${modelType} model info: ${error.message}`);
  }
};

// ----------------- Custom Model Functions -----------------
const trainCustomModel = async (user_id, fileData, trainingParams = {}) => {
  try {
    const response = await axios.post(`${ML_SERVICES.CUSTOM}/train`, {
      user_id,
      file: fileData,
      training_params: trainingParams
    }, {
      timeout: 60000
    });
    return response.data;
  } catch (error) {
    console.error('Custom Model Training Error:', error.message);
    throw new Error(`Custom model training failed: ${error.response?.data?.error || error.message}`);
  }
};

const predictWithCustomModel = async (user_id, data, isBulk = false) => {
  try {
    const response = await axios.post(`${ML_SERVICES.CUSTOM}/predict`, {
      user_id,
      data,
      isBulk
    }, {
      timeout: 30000,
      headers: {
        'X-User-ID': user_id
      }
    });
    return response.data;
  } catch (error) {
    console.error('Custom Model Prediction Error:', error.message);
    throw new Error(`Custom model prediction failed: ${error.response?.data?.error || error.message}`);
  }
};

const getCustomModelInfo = async (user_id) => {
  try {
    const response = await axios.get(`${ML_SERVICES.CUSTOM}/model/info`, {
      headers: {
        'X-User-ID': user_id
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Custom Model Info Error:', error.message);
    throw new Error(`Failed to get custom model info: ${error.response?.data?.error || error.message}`);
  }
};

const deleteCustomModel = async (user_id) => {
  try {
    const response = await axios.delete(`${ML_SERVICES.CUSTOM}/model/delete`, {
      data: { user_id },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Custom Model Delete Error:', error.message);
    throw new Error(`Failed to delete custom model: ${error.response?.data?.error || error.message}`);
  }
};

module.exports = {
  // Prediction functions
  predictWithTOI,
  predictWithKOI,
  predictWithK2,
  predictWithCustomModel,
  trainCustomModel,
  
  // Enhanced storage and export
  storePrediction,
  generateCSVExport,
  generateExcelExport,
  getEntriesForExport,
  
  // Model management
  getModelInfo,
  getCustomModelInfo,
  deleteCustomModel,
  
  // Utilities
  validateData,
  processBulkData,
  checkMLServices,
  
  // Service URLs
  ML_SERVICES
};