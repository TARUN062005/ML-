const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock ML prediction functions - Replace with actual ML model integration
const predictWithTOI = async (data) => {
  // This would integrate with your actual TOI ML model
  // For now, returning mock data
  const classes = ['FP', 'PC', 'APC', 'KP', 'FA'];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  
  return {
    predicted_class: randomClass,
    confidence: (Math.random() * 0.5 + 0.5).toFixed(4), // 0.5 to 1.0
    explanation: getExplanation(randomClass),
    probabilities: classes.reduce((acc, cls) => {
      acc[cls] = Math.random().toFixed(4);
      return acc;
    }, {}),
    timestamp: new Date().toISOString()
  };
};

const predictWithKOI = async (data) => {
  const classes = ['CONFIRMED', 'CANDIDATE', 'FALSE POSITIVE'];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  
  return {
    predicted_class: randomClass,
    confidence: (Math.random() * 0.5 + 0.5).toFixed(4),
    explanation: getExplanation(randomClass),
    probabilities: classes.reduce((acc, cls) => {
      acc[cls] = Math.random().toFixed(4);
      return acc;
    }, {}),
    timestamp: new Date().toISOString()
  };
};

const predictWithK2 = async (data) => {
  const classes = ['PLANET', 'NOT PLANET', 'UNKNOWN'];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  
  return {
    predicted_class: randomClass,
    confidence: (Math.random() * 0.5 + 0.5).toFixed(4),
    explanation: getExplanation(randomClass),
    probabilities: classes.reduce((acc, cls) => {
      acc[cls] = Math.random().toFixed(4);
      return acc;
    }, {}),
    timestamp: new Date().toISOString()
  };
};

const predictWithCustomModel = async (data, customModel) => {
  // This would use the custom model stored in the database
  // For now, returning mock data
  const classes = ['CLASS_A', 'CLASS_B', 'CLASS_C', 'CLASS_D'];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  
  return {
    predicted_class: randomClass,
    confidence: (Math.random() * 0.5 + 0.5).toFixed(4),
    explanation: `Custom model prediction: ${randomClass}`,
    probabilities: classes.reduce((acc, cls) => {
      acc[cls] = Math.random().toFixed(4);
      return acc;
    }, {}),
    model_id: customModel.id,
    model_name: customModel.name,
    timestamp: new Date().toISOString()
  };
};

const trainCustomModel = async (trainingData, parameters = {}) => {
  // This would train a custom ML model
  // For now, returning mock training results
  return {
    accuracy: (Math.random() * 0.3 + 0.7).toFixed(4), // 0.7 to 1.0
    features: Object.keys(trainingData[0] || {}),
    modelInfo: {
      algorithm: parameters.algorithm || 'XGBoost',
      parameters: parameters,
      trainingSamples: trainingData.length,
      trainingTime: `${(Math.random() * 10 + 5).toFixed(2)}s`
    },
    timestamp: new Date().toISOString()
  };
};

const validateData = (data, modelType) => {
  const errors = [];
  
  if (!data) {
    errors.push('Data is required');
    return { valid: false, errors };
  }

  // Check if it's bulk data (array) or single data (object)
  const isBulk = Array.isArray(data);
  const dataToValidate = isBulk ? data[0] : data;

  // Model-specific validation
  switch (modelType) {
    case 'toi':
      if (!dataToValidate.pl_orbper) errors.push('pl_orbper is required for TOI');
      if (!dataToValidate.pl_trandurh) errors.push('pl_trandurh is required for TOI');
      break;
    case 'koi':
      if (!dataToValidate.koi_period) errors.push('koi_period is required for KOI');
      if (!dataToValidate.koi_duration) errors.push('koi_duration is required for KOI');
      break;
    case 'k2':
      if (!dataToValidate.k2_period) errors.push('k2_period is required for K2');
      if (!dataToValidate.k2_duration) errors.push('k2_duration is required for K2');
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

const processBulkData = async (data, modelType, userId, customModelId = null) => {
  const results = [];
  
  for (const item of data) {
    try {
      let prediction;
      let entry;

      switch (modelType) {
        case 'toi':
          prediction = await predictWithTOI(item);
          entry = await prisma.tOIEntry.create({
            data: {
              userId,
              data: {
                input: item,
                output: prediction,
                timestamp: new Date().toISOString()
              }
            }
          });
          break;
        case 'koi':
          prediction = await predictWithKOI(item);
          entry = await prisma.kOIEntry.create({
            data: {
              userId,
              data: {
                input: item,
                output: prediction,
                timestamp: new Date().toISOString()
              }
            }
          });
          break;
        case 'k2':
          prediction = await predictWithK2(item);
          entry = await prisma.k2Entry.create({
            data: {
              userId,
              data: {
                input: item,
                output: prediction,
                timestamp: new Date().toISOString()
              }
            }
          });
          break;
        case 'custom':
          if (!customModelId) throw new Error('Custom model ID required');
          const customModel = await prisma.customModel.findFirst({
            where: { id: customModelId, userId }
          });
          prediction = await predictWithCustomModel(item, customModel);
          entry = await prisma.customModelEntry.create({
            data: {
              customModelId,
              data: {
                input: item,
                output: prediction,
                timestamp: new Date().toISOString()
              }
            }
          });
          break;
      }

      results.push({
        entryId: entry.id,
        ...prediction
      });

    } catch (error) {
      console.error(`Error processing item in bulk:`, error);
      results.push({
        error: error.message,
        input: item
      });
    }
  }

  return results;
};

const getExplanation = (predictionClass) => {
  const explanations = {
    'FP': 'False Positive - Likely not a planetary signal',
    'PC': 'Planetary Candidate - Potential exoplanet requiring further verification',
    'APC': 'Ambiguous Planetary Candidate - Uncertain classification',
    'KP': 'Known Planet - Previously confirmed exoplanet',
    'FA': 'False Alarm - Instrumental or data processing artifact',
    'CONFIRMED': 'Confirmed Exoplanet - Validated planetary detection',
    'CANDIDATE': 'Exoplanet Candidate - Requires additional observation',
    'FALSE POSITIVE': 'False Positive - Non-planetary signal source',
    'PLANET': 'High Probability Planet - Strong planetary indicators',
    'NOT PLANET': 'Non-planetary Object - Insufficient planetary evidence',
    'UNKNOWN': 'Uncertain Classification - Inconclusive data'
  };

  return explanations[predictionClass] || 'Classification completed';
};

module.exports = {
  predictWithTOI,
  predictWithKOI,
  predictWithK2,
  predictWithCustomModel,
  trainCustomModel,
  validateData,
  processBulkData,
  getExplanation
};