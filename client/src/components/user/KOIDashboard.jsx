import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../main.jsx";

const KOIDashboard = () => {
  const navigate = useNavigate();
  const { API } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("predict");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [bulkResults, setBulkResults] = useState(null);

  const config = {
    name: "Kepler Objects of Interest",
    description: "Kepler Mission exoplanet candidate analysis with advanced visualization",
    color: "purple",
    icon: "🌟",
    features: [
      { name: "koi_period", label: "Orbital Period (days)", type: "number", placeholder: "9.48803557" },
      { name: "koi_impact", label: "Impact Parameter", type: "number", placeholder: "0.146" },
      { name: "koi_duration", label: "Transit Duration (hours)", type: "number", placeholder: "2.9575" },
      { name: "koi_depth", label: "Transit Depth (ppm)", type: "number", placeholder: "616.0" },
      { name: "koi_prad", label: "Planet Radius (Earth radii)", type: "number", placeholder: "2.26" },
      { name: "koi_teq", label: "Equilibrium Temperature (K)", type: "number", placeholder: "793.0" },
      { name: "koi_insol", label: "Insolation Flux (Earth flux)", type: "number", placeholder: "93.59" },
      { name: "koi_model_snr", label: "Model Signal-to-Noise Ratio", type: "number", placeholder: "35.8" },
      { name: "koi_steff", label: "Star Temperature (K)", type: "number", placeholder: "5455" },
      { name: "koi_slogg", label: "Star Surface Gravity (log g)", type: "number", placeholder: "4.467" },
      { name: "koi_srad", label: "Star Radius (Solar radii)", type: "number", placeholder: "0.927" },
      { name: "koi_kepmag", label: "Kepler Magnitude", type: "number", placeholder: "15.347" }
    ],
    sampleData: {
      koi_period: 9.48803557,
      koi_impact: 0.146,
      koi_duration: 2.9575,
      koi_depth: 616.0,
      koi_prad: 2.26,
      koi_teq: 793.0,
      koi_insol: 93.59,
      koi_model_snr: 35.8,
      koi_steff: 5455,
      koi_slogg: 4.467,
      koi_srad: 0.927,
      koi_kepmag: 15.347
    }
  };

  useEffect(() => {
    fetchModelInfo();
    if (activeTab === "history") {
      fetchPredictionHistory();
    }
  }, [activeTab]);

  const fetchModelInfo = async () => {
    try {
      const response = await API.get("/api/ml/model-info/koi");
      setModelInfo(response.data.data);
    } catch (error) {
      console.error("Failed to fetch KOI model info:", error);
      setModelInfo({
        model_type: "Ensemble Classifier",
        is_trained: true,
        class_names: ["CONFIRMED", "CANDIDATE", "FALSE POSITIVE", "NOT DISPOSITIONED"],
        selected_features: config.features.map(f => f.name),
        target_column: "koi_disposition"
      });
    }
  };

  const fetchPredictionHistory = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/ml/entries/koi?limit=20");
      setPredictions(response.data.data.entries || []);
    } catch (error) {
      console.error("Failed to fetch KOI prediction history:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const response = await API.get(`/api/ml/export/koi?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `koi_predictions_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("/user/dashboard")}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {config.name}
            </h1>
            <p className="text-gray-400 mt-2">{config.description}</p>
          </div>
          <div className="text-6xl">
            {config.icon}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-8">
          {["predict", "bulk", "history", "info"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all ${
                activeTab === tab
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "predict" && "🔮 Single Prediction"}
              {tab === "bulk" && "📁 Bulk Analysis"} 
              {tab === "history" && "📊 History"}
              {tab === "info" && "ℹ️ Model Info"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          {activeTab === "predict" && (
            <PredictionTab config={config} API={API} modelInfo={modelInfo} />
          )}
          {activeTab === "bulk" && (
            <BulkTab config={config} API={API} onResults={setBulkResults} />
          )}
          {activeTab === "history" && (
            <HistoryTab 
              predictions={predictions} 
              loading={loading}
              onRefresh={fetchPredictionHistory}
              onExport={handleExport}
            />
          )}
          {activeTab === "info" && (
            <InfoTab config={config} modelInfo={modelInfo} />
          )}
        </div>
      </div>
    </div>
  );
};

// Single Prediction Tab for KOI
const PredictionTab = ({ config, API, modelInfo }) => {
  const [predictionData, setPredictionData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionTime, setPredictionTime] = useState(null);

  const handlePredict = async () => {
    if (Object.keys(predictionData).length === 0) {
      setError("Please enter prediction data");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictionTime(null);
    const startTime = Date.now();
    
    try {
      const response = await API.post("/api/ml/predict/koi", { 
        data: predictionData
      });
      
      const endTime = Date.now();
      setPredictionTime(((endTime - startTime) / 1000).toFixed(2));
      
      if (response.data.success) {
        setResult(response.data);
      } else {
        throw new Error(response.data.message || "Prediction failed");
      }
    } catch (error) {
      console.error("KOI Prediction failed:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (featureName, value) => {
    setPredictionData(prev => ({
      ...prev,
      [featureName]: value ? parseFloat(value) : 0
    }));
  };

  const loadSampleData = () => {
    setPredictionData(config.sampleData);
    setResult(null);
    setError(null);
  };

  const clearForm = () => {
    setPredictionData({});
    setResult(null);
    setError(null);
    setPredictionTime(null);
  };

  const getClassColor = (className) => {
    const colors = {
      'CONFIRMED': 'text-green-400',
      'CANDIDATE': 'text-yellow-400', 
      'FALSE POSITIVE': 'text-red-400',
      'NOT DISPOSITIONED': 'text-gray-400'
    };
    return colors[className] || 'text-white';
  };

  const getClassDescription = (className) => {
    const descriptions = {
      'CONFIRMED': 'Confirmed Exoplanet',
      'CANDIDATE': 'Planetary Candidate', 
      'FALSE POSITIVE': 'False Positive',
      'NOT DISPOSITIONED': 'Not Dispositioned'
    };
    return descriptions[className] || className;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 animate-pulse">
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Enter Kepler Observation Data</h3>
            <div className="flex space-x-2">
              <button
                onClick={loadSampleData}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                Load Sample
              </button>
              <button
                onClick={clearForm}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {config.features.map((feature) => (
              <div key={feature.name} className="bg-gray-900/50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {feature.label}
                </label>
                <input
                  type={feature.type}
                  step="any"
                  placeholder={feature.placeholder}
                  value={predictionData[feature.name] || ''}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  onChange={(e) => handleInputChange(feature.name, e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Example: {feature.placeholder}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {loading && (
              <div className="absolute inset-0 bg-purple-600 animate-pulse"></div>
            )}
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white z-10"></div>
                <span className="z-10">Analyzing Kepler Data...</span>
              </>
            ) : (
              <>
                <span className="z-10">🔍</span>
                <span className="z-10">Detect Exoplanets</span>
              </>
            )}
          </button>

          {loading && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Processing Kepler data...</span>
                <span className="text-purple-400">AI Analyzing</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Prediction Results</h3>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="bg-gray-900 rounded-lg p-6 border border-purple-500">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="h-24 bg-gray-700 rounded"></div>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-900 rounded-lg p-6 border border-purple-500">
                <h4 className="text-lg font-bold text-white mb-2">Detection Result</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Predicted Class:</span>
                    <span className={`font-bold ${getClassColor(result.data?.prediction?.predicted_class)}`}>
                      {getClassDescription(result.data?.prediction?.predicted_class)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Confidence:</span>
                    <span className="font-bold text-purple-400">
                      {((result.data?.prediction?.confidence || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                  {predictionTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Processing Time:</span>
                      <span className="font-bold text-green-400">
                        {predictionTime}s
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Charts Display */}
              {result.data?.prediction?.charts && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-3">Visual Analysis</h5>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(result.data.prediction.charts).map(([chartName, chartData]) => (
                      <div key={chartName} className="text-center">
                        <img 
                          src={`data:image/png;base64,${chartData}`} 
                          alt={chartName}
                          className="max-w-full h-auto rounded-lg border border-gray-600"
                        />
                        <p className="text-gray-400 text-sm mt-2 capitalize">
                          {chartName.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.data?.prediction?.explanation && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-2">Scientific Explanation</h5>
                  <p className="text-gray-300 text-sm">
                    {result.data.prediction.explanation}
                  </p>
                </div>
              )}

              {/* Probabilities */}
              {result.data?.prediction?.probabilities && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-3">Class Probabilities</h5>
                  <div className="space-y-2">
                    {Object.entries(result.data.prediction.probabilities)
                      .sort(([,a], [,b]) => b - a)
                      .map(([className, probability]) => (
                        <div key={className} className="flex justify-between items-center">
                          <span className={`text-sm ${getClassColor(className)}`}>
                            {getClassDescription(className)}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-20 bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${probability * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-white font-medium w-12 text-right">
                              {(probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🌟</div>
              <p>Enter Kepler data and click detect to see results</p>
              <p className="text-sm mt-2">Real-time Kepler Objects of Interest analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Bulk Analysis Tab for KOI
const BulkTab = ({ config, API, onResults }) => {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState({ csv: false, excel: false });

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const processBulkFile = async () => {
    if (!file) {
      setError("Please select a CSV file first");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await API.post("/api/ml/process-file/koi", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.data.success) {
        setResults(response.data.data);
        onResults(response.data.data);
        
        // Auto-download results after processing
        setTimeout(() => {
          handleExport('csv');
        }, 1000);
      } else {
        throw new Error(response.data.message || "Processing failed");
      }
    } catch (error) {
      console.error("Bulk processing failed:", error);
      setError(error.response?.data?.message || error.message || "Processing service unavailable");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleExport = async (format = 'csv') => {
    setExporting(prev => ({ ...prev, [format]: true }));
    try {
      const response = await API.get(`/api/ml/export/koi?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `koi_predictions_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      setError("Export failed: " + (error.response?.data?.message || error.message));
    } finally {
      setExporting(prev => ({ ...prev, [format]: false }));
    }
  };

  const downloadTemplate = () => {
    const headers = config.features.map(f => f.name).join(',');
    const sampleRow = config.features.map(f => config.sampleData[f.name]).join(',');
    const csvContent = `${headers}\n${sampleRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'koi_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Bulk Kepler Data Analysis</h3>
          
          <div className={`bg-gray-900/50 rounded-lg p-6 border-2 border-dashed transition-all ${
            file ? 'border-green-500 bg-green-900/20' : 'border-gray-600 hover:border-purple-500'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-300 mb-2">Upload CSV File</p>
              <p className="text-gray-400 text-sm mb-4">
                File should contain columns: {config.features.map(f => f.name).join(', ')}
              </p>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="bulk-file-input-koi"
                disabled={loading}
              />
              <label
                htmlFor="bulk-file-input-koi"
                className={`inline-block px-6 py-3 rounded-lg cursor-pointer transition-all ${
                  loading 
                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white font-semibold`}
              >
                {loading ? 'Processing...' : 'Choose File'}
              </label>
              
              {file && (
                <div className="mt-3 p-2 bg-gray-800 rounded">
                  <p className="text-green-400 text-sm">
                    ✅ Selected: {file.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Size: {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={processBulkFile}
              disabled={!file || loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
            >
              {loading && (
                <div className="absolute inset-0 bg-green-600 animate-pulse"></div>
              )}
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white z-10"></div>
                  <span className="z-10">Processing...</span>
                </>
              ) : (
                <>
                  <span className="z-10">🚀</span>
                  <span className="z-10">Process File</span>
                </>
              )}
            </button>
            
            <button
              onClick={downloadTemplate}
              disabled={loading}
              className="px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📋 Template
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 animate-pulse">
              <div className="flex items-center">
                <span className="text-red-400 text-lg mr-2">⚠️</span>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Bulk Results</h3>
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="h-24 bg-gray-700 rounded"></div>
              </div>
            </div>
          ) : results ? (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-900 rounded-lg p-6 border border-green-500">
                <h4 className="text-lg font-bold text-white mb-2">✅ Processing Complete</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">File:</span>
                    <span className="text-white font-mono">{file.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Records Processed:</span>
                    <span className="text-green-400 font-semibold">{results.processed || 'Multiple'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Stored:</span>
                    <span className="text-purple-400 font-semibold">{results.stored || results.processed} predictions</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-3">Download Results</h5>
                <p className="text-gray-300 text-sm mb-3">
                  Your predictions have been processed and stored in the database. 
                  Download the results for further analysis.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting.csv}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {exporting.csv && (
                      <div className="absolute inset-0 bg-purple-700 animate-pulse"></div>
                    )}
                    {exporting.csv ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white z-10"></div>
                        <span className="z-10">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <span className="z-10">📥</span>
                        <span className="z-10">Download CSV</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={exporting.excel}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {exporting.excel && (
                      <div className="absolute inset-0 bg-green-700 animate-pulse"></div>
                    )}
                    {exporting.excel ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white z-10"></div>
                        <span className="z-10">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <span className="z-10">📊</span>
                        <span className="z-10">Download Excel</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📈</div>
              <p>Upload a CSV file to process multiple Kepler observations</p>
              <p className="text-sm mt-2">Batch processing with automatic storage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// History Tab with Export for KOI
const HistoryTab = ({ predictions, loading, onRefresh, onExport }) => {
  const [exporting, setExporting] = useState({ csv: false, excel: false });

  const handleExportWithAnimation = async (format) => {
    setExporting(prev => ({ ...prev, [format]: true }));
    try {
      await onExport(format);
    } finally {
      setTimeout(() => {
        setExporting(prev => ({ ...prev, [format]: false }));
      }, 1000);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">KOI Prediction History</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExportWithAnimation('csv')}
            disabled={exporting.csv}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 relative overflow-hidden"
          >
            {exporting.csv && (
              <div className="absolute inset-0 bg-purple-700 animate-pulse"></div>
            )}
            {exporting.csv ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white z-10"></div>
                <span className="z-10">Downloading...</span>
              </>
            ) : (
              <>
                <span className="z-10">📥</span>
                <span className="z-10">CSV</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleExportWithAnimation('excel')}
            disabled={exporting.excel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 relative overflow-hidden"
          >
            {exporting.excel && (
              <div className="absolute inset-0 bg-green-700 animate-pulse"></div>
            )}
            {exporting.excel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white z-10"></div>
                <span className="z-10">Downloading...</span>
              </>
            ) : (
              <>
                <span className="z-10">📊</span>
                <span className="z-10">Excel</span>
              </>
            )}
          </button>
          <button
            onClick={onRefresh}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading prediction history...</p>
        </div>
      ) : predictions.length > 0 ? (
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={prediction.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-white">KOI Prediction #{predictions.length - index}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(prediction.createdAt).toLocaleString()}
                  </p>
                  
                  {prediction.data?.input && (
                    <div className="mt-2">
                      <p className="text-gray-400 text-xs">Features:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(prediction.data.input).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="text-xs bg-gray-800 px-2 py-1 rounded">
                            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                          </span>
                        ))}
                        {Object.keys(prediction.data.input).length > 3 && (
                          <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                            +{Object.keys(prediction.data.input).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <p className={`font-semibold ${
                    prediction.data?.output?.predicted_class === 'CONFIRMED' ? 'text-green-400' :
                    prediction.data?.output?.predicted_class === 'CANDIDATE' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {prediction.data?.output?.predicted_class || "Unknown"}
                  </p>
                  <p className="text-purple-400 text-sm">
                    {((prediction.data?.output?.confidence || 0) * 100).toFixed(1)}% confidence
                  </p>
                  {prediction.data?.metadata?.has_charts && (
                    <p className="text-green-400 text-xs mt-1">📊 Charts Available</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <p>No KOI prediction history yet</p>
          <p className="text-sm mt-2">Make your first prediction to see it here</p>
        </div>
      )}
    </div>
  );
};

// Info Tab Component for KOI
const InfoTab = ({ config, modelInfo }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-white">KOI Model Information</h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-2">Model Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white">{modelInfo?.model_type || "Ensemble Classifier"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Trained:</span>
            <span className="text-white">{modelInfo?.is_trained ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Target:</span>
            <span className="text-white">{modelInfo?.target_column || "koi_disposition"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Classes:</span>
            <span className="text-white">{modelInfo?.class_names?.join(", ") || "CONFIRMED, CANDIDATE, FALSE POSITIVE, NOT DISPOSITIONED"}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-2">Kepler Features Used</h4>
        <div className="text-sm text-gray-300 max-h-32 overflow-y-auto">
          {modelInfo?.selected_features?.map((feature, index) => (
            <div key={index} className="mb-1 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              {feature}
            </div>
          )) || config.features.slice(0, 6).map((feature, index) => (
            <div key={index} className="mb-1 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              {feature.name}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
      <h4 className="font-semibold text-purple-400 mb-2">About Kepler Mission</h4>
      <p className="text-purple-300 text-sm">
        The Kepler Mission was a NASA space telescope designed to discover Earth-size planets 
        orbiting other stars. It used the transit method to detect planets by measuring the 
        dimming of stars when planets crossed in front of them. Kepler observed over 150,000 stars
        and discovered thousands of exoplanet candidates, revolutionizing our understanding of planetary systems.
      </p>
    </div>

    <div className="bg-gray-900 rounded-lg p-4">
      <h4 className="font-semibold text-white mb-3">Class Descriptions</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          <span className="text-gray-300">CONFIRMED:</span>
          <span className="text-gray-400 ml-2">Validated exoplanet</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
          <span className="text-gray-300">CANDIDATE:</span>
          <span className="text-gray-400 ml-2">Potential exoplanet</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
          <span className="text-gray-300">FALSE POSITIVE:</span>
          <span className="text-gray-400 ml-2">Not a planet</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
          <span className="text-gray-300">NOT DISPOSITIONED:</span>
          <span className="text-gray-400 ml-2">Under review</span>
        </div>
      </div>
    </div>
  </div>
);

export default KOIDashboard;