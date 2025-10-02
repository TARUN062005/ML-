const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ML Service URLs
const ML_SERVICES = {
  TOI: process.env.TOI_SERVICE_URL || 'http://localhost:5001',
  KOI: process.env.KOI_SERVICE_URL || 'http://localhost:5002',
  K2: process.env.K2_SERVICE_URL || 'http://localhost:5003',
  CUSTOM: process.env.CUSTOM_SERVICE_URL || 'http://localhost:5004'
};

// ----------------- ML Service Communication -----------------
const predictWithTOI = async (data, isBulk = false) => {
  try {
    const response = await axios.post(`${ML_SERVICES.TOI}/predict`, {
      data,
      isBulk
    }, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('TOI Service Error:', error.message);
    throw new Error(`TOI prediction failed: ${error.response?.data?.error || error.message}`);
  }
};

const predictWithKOI = async (data, isBulk = false) => {
  try {
    const response = await axios.post(`${ML_SERVICES.KOI}/predict`, {
      data,
      isBulk
    }, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('KOI Service Error:', error.message);
    throw new Error(`KOI prediction failed: ${error.response?.data?.error || error.message}`);
  }
};

const predictWithK2 = async (data, isBulk = false) => {
  try {
    const response = await axios.post(`${ML_SERVICES.K2}/predict`, {
      data,
      isBulk
    }, {
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('K2 Service Error:', error.message);
    throw new Error(`K2 prediction failed: ${error.response?.data?.error || error.message}`);
  }
};

const trainCustomModel = async (user_id, fileData, trainingParams = {}) => {
  try {
    // This would handle file upload to custom model service
    // For now, we'll simulate the training process
    const response = await axios.post(`${ML_SERVICES.CUSTOM}/train`, {
      user_id,
      file: fileData,
      training_params: trainingParams
    }, {
      timeout: 60000 // Longer timeout for training
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
      // Based on your TOI model features
      const toiFeatures = ['pl_trandurh', 'pl_trandep', 'pl_rade', 'pl_insol', 'pl_eqt', 'st_tmag', 'st_dist', 'st_teff', 'st_logg', 'st_rad'];
      const missingTOIFeatures = toiFeatures.filter(feature => !(feature in dataToValidate));
      if (missingTOIFeatures.length > 0) {
        errors.push(`Missing TOI features: ${missingTOIFeatures.join(', ')}`);
      }
      break;
      
    case 'koi':
      // Based on your KOI model features
      const koiFeatures = ['koi_impact', 'koi_duration', 'koi_depth', 'koi_teq', 'koi_insol', 'koi_model_snr', 'koi_steff', 'koi_slogg', 'koi_srad', 'koi_kepmag'];
      const missingKOIFeatures = koiFeatures.filter(feature => !(feature in dataToValidate));
      if (missingKOIFeatures.length > 0) {
        errors.push(`Missing KOI features: ${missingKOIFeatures.join(', ')}`);
      }
      break;
      
    case 'k2':
      // Based on your K2 model features
      const k2Features = ['pl_rade', 'pl_bmasse', 'pl_insol', 'st_teff', 'st_rad', 'st_mass', 'st_met', 'st_logg', 'sy_dist', 'sy_vmag'];
      const missingK2Features = k2Features.filter(feature => !(feature in dataToValidate));
      if (missingK2Features.length > 0) {
        errors.push(`Missing K2 features: ${missingK2Features.join(', ')}`);
      }
      break;
      
    case 'custom':
      // Custom models have flexible validation
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

module.exports = {
  // Prediction functions
  predictWithTOI,
  predictWithKOI,
  predictWithK2,
  predictWithCustomModel,
  trainCustomModel,
  
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