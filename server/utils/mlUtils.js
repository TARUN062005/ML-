// server/utils/mlUtils.js

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

// ----------------- Helper Functions -----------------

/**
 * Returns a human-readable description for a given class name.
 * @param {string} className The abbreviated class name (e.g., 'FP', 'PC').
 * @returns {string} The full description.
 */
const getClassDescription = (className) => {
    const descriptions = {
        'FP': 'False Positive',
        'PC': 'Planetary Candidate', 
        'KP': 'Known Planet',
        'CP': 'Confirmed Planet',
        'APC': 'Ambiguous Planetary Candidate',
        'FA': 'False Alarm'
    };
    return descriptions[className] || className;
};

/**
 * Flattens a nested database entry into a single-level, human-readable object.
 * @param {object} entry The raw prediction entry from the database.
 * @returns {object} A flattened object with meaningful keys.
 */
const getFlattenedData = (entry) => {
    const inputData = entry.data?.input || {};
    const outputData = entry.data?.output || {};
    const metadata = entry.data?.metadata || {};

    const flattened = {
        'Prediction ID': entry.id,
        'Timestamp': new Date(entry.createdAt).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }),
        'Model Type': metadata.model_type || 'N/A',
        'Predicted Class': outputData.predicted_class || 'N/A',
        'Confidence': outputData.confidence !== undefined && outputData.confidence !== null ? (outputData.confidence * 100).toFixed(2) + '%' : 'N/A',
        'Explanation': outputData.explanation || 'No explanation available',
        'Is Mock Data': metadata.is_mock ? 'Yes' : 'No',
        // Add individual input features dynamically
        ...Object.keys(inputData).reduce((acc, key) => {
            acc[key] = inputData[key];
            return acc;
        }, {}),
    };
    return flattened;
};

// ----------------- Prediction Functions -----------------

const predictWithTOI = async (data) => {
    try {
        console.log(`🔮 Making TOI prediction request to: ${ML_SERVICES.TOI}/predict`);
        const response = await axios.post(`${ML_SERVICES.TOI}/predict`, data, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ TOI prediction successful');
        return response.data;
    } catch (error) {
        console.error('❌ TOI Service Error:', error.message);
        if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
            console.log('🔄 TOI service unavailable, returning mock response');
            return generateMockPrediction(data, 'TOI');
        }
        throw new Error(`TOI prediction failed: ${error.response?.data?.error || error.message}`);
    }
};

const predictWithKOI = async (data) => {
    try {
        console.log(`🔮 Making KOI prediction request to: ${ML_SERVICES.KOI}/predict`);
        const response = await axios.post(`${ML_SERVICES.KOI}/predict`, data, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ KOI prediction successful');
        return response.data;
    } catch (error) {
        console.error('❌ KOI Service Error:', error.message);
        if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
            console.log('🔄 KOI service unavailable, returning mock response');
            return generateMockPrediction(data, 'KOI');
        }
        throw new Error(`KOI prediction failed: ${error.response?.data?.error || error.message}`);
    }
};

const predictWithK2 = async (data) => {
    try {
        console.log(`🔮 Making K2 prediction request to: ${ML_SERVICES.K2}/predict`);
        const response = await axios.post(`${ML_SERVICES.K2}/predict`, data, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ K2 prediction successful');
        return response.data;
    } catch (error) {
        console.error('❌ K2 Service Error:', error.message);
        if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
            console.log('🔄 K2 service unavailable, returning mock response');
            return generateMockPrediction(data, 'K2');
        }
        throw new Error(`K2 prediction failed: ${error.response?.data?.error || error.message}`);
    }
};

const generateMockPrediction = (data, modelType) => {
    const classes = ['FP', 'PC', 'KP', 'CP', 'APC', 'FA'];
    const predictedClass = classes[Math.floor(Math.random() * classes.length)];
    const confidence = (0.7 + Math.random() * 0.25).toFixed(3);
    
    const probabilities = {};
    classes.forEach(cls => {
        probabilities[cls] = (cls === predictedClass) ? parseFloat(confidence) : parseFloat(((1 - confidence) / (classes.length - 1)).toFixed(3));
    });
    
    const explanation = `Mock ${modelType} prediction: ${getClassDescription(predictedClass)}. This is a simulated response while the ML service is unavailable.`;
    
    return {
        prediction: {
            predicted_class: predictedClass,
            confidence: parseFloat(confidence),
            probabilities: probabilities,
            explanation: explanation,
            is_mock: true,
            model_type: modelType
        },
        success: true,
        message: `Mock ${modelType} prediction completed (service unavailable)`
    };
};

// ----------------- Enhanced Data Storage -----------------
const storePrediction = async (userId, modelType, inputData, predictionResult) => {
    try {
        const storageData = {
            input: inputData,
            output: predictionResult.prediction || predictionResult,
            metadata: {
                model_type: modelType.toUpperCase(),
                timestamp: new Date().toISOString(),
                has_charts: !!(predictionResult.prediction?.charts || predictionResult.charts),
                confidence: predictionResult.prediction?.confidence || predictionResult.confidence || null,
                predicted_class: predictionResult.prediction?.predicted_class || predictionResult.predicted_class || null,
                is_bulk: Array.isArray(inputData),
                features_used: Object.keys(inputData),
                is_mock: predictionResult.prediction?.is_mock || false
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

// ----------------- Export Functions (Updated) -----------------

const generateCSVExport = async (modelType, entries) => {
    try {
        if (entries.length === 0) return '';

        const flattenedData = entries.map(getFlattenedData);

        const allHeaders = new Set();
        flattenedData.forEach(row => {
            Object.keys(row).forEach(header => allHeaders.add(header));
        });
        const headers = Array.from(allHeaders);

        const csvRows = [];
        csvRows.push(headers.join(','));

        flattenedData.forEach(row => {
            const rowValues = headers.map(header => {
                const value = row[header] !== undefined && row[header] !== null ? row[header] : '';
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(rowValues.join(','));
        });
        
        return csvRows.join('\n');
    } catch (error) {
        console.error('CSV Generation Error:', error);
        throw new Error(`Failed to generate CSV: ${error.message}`);
    }
};

const generateExcelExport = async (modelType, entries) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${modelType.toUpperCase()} Predictions`);

        if (entries.length === 0) return workbook;

        const flattenedData = entries.map(getFlattenedData);
        
        const allHeaders = new Set();
        flattenedData.forEach(row => {
            Object.keys(row).forEach(header => allHeaders.add(header));
        });
        const headers = Array.from(allHeaders);

        worksheet.columns = headers.map(header => ({
            header: header,
            key: header,
            width: header === 'Explanation' ? 50 : 15
        }));

        flattenedData.forEach((row, index) => {
            worksheet.addRow(row);

            const worksheetRow = worksheet.getRow(index + 2);
            const confidenceCell = worksheetRow.getCell('Confidence');
            const confidence = row['Confidence'] ? parseFloat(row['Confidence'].replace('%', '')) / 100 : 0;
            
            if (confidence > 0.8) {
                confidenceCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' }
                };
            } else if (confidence > 0.6) {
                confidenceCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFFF00' }
                };
            }
            
            const mockCell = worksheetRow.getCell('Is Mock Data');
            if (row['Is Mock Data'] === 'Yes') {
                mockCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFA500' }
                };
            }
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E86AB' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
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
        
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate);
            }
        }
        
        if (filters.predictedClass) {
            where.data = {
                path: ['metadata', 'predicted_class'],
                equals: filters.predictedClass
            };
        }
        
        if (filters.includeMock !== undefined) {
            where.data = {
                ...where.data,
                path: ['metadata', 'is_mock'],
                equals: filters.includeMock
            };
        }
        
        const entries = await model.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 1000
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
    const dataToValidate = Array.isArray(data) ? data[0] : data;

    switch (modelType) {
        case 'toi':
            const toiFeatures = ['pl_orbper', 'pl_trandurh', 'pl_trandep', 'pl_rade'];
            const missingTOIFeatures = toiFeatures.filter(feature => !dataToValidate.hasOwnProperty(feature));
            if (missingTOIFeatures.length > 0) {
                errors.push(`Missing TOI features: ${missingTOIFeatures.join(', ')}`);
            }
            break;
        case 'koi':
            const koiFeatures = ['koi_impact', 'koi_duration', 'koi_depth', 'koi_teq'];
            const missingKOIFeatures = koiFeatures.filter(feature => !dataToValidate.hasOwnProperty(feature));
            if (missingKOIFeatures.length > 0) {
                errors.push(`Missing KOI features: ${missingKOIFeatures.join(', ')}`);
            }
            break;
        case 'k2':
            const k2Features = ['pl_rade', 'pl_bmasse', 'pl_insol'];
            const missingK2Features = k2Features.filter(feature => !dataToValidate.hasOwnProperty(feature));
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
    
    for (const item of data) {
        try {
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
            results.push({ input: item, ...prediction });
        } catch (error) {
            errors.push({ input: item, error: error.message });
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
        return {
            is_trained: true,
            model_type: modelType.toUpperCase(),
            class_names: ['FP', 'PC', 'KP', 'CP', 'APC', 'FA'],
            selected_features: ['pl_orbper', 'pl_trandurh', 'pl_trandep', 'pl_rade', 'pl_insol', 'pl_eqt'],
            target_column: 'tfopwg_disp',
            is_mock: true
        };
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
    predictWithTOI,
    predictWithKOI,
    predictWithK2,
    predictWithCustomModel,
    trainCustomModel,
    storePrediction,
    generateCSVExport,
    generateExcelExport,
    getEntriesForExport,
    getModelInfo,
    getCustomModelInfo,
    deleteCustomModel,
    validateData,
    processBulkData,
    checkMLServices,
    ML_SERVICES
};