// src/components/user/KOIDashboard.jsx
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

  // KOI-specific configuration with correct KOI data
  const config = {
    name: "Kepler Objects of Interest",
    description: "Kepler Mission exoplanet candidate analysis",
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
      // Set default info based on actual KOI model
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
      const response = await API.get("/api/ml/entries/koi?limit=5");
      setPredictions(response.data.data.entries || []);
    } catch (error) {
      console.error("Failed to fetch KOI prediction history:", error);
      setPredictions([]);
    } finally {
      setLoading(false);
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
          {["predict", "history", "info"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all ${
                activeTab === tab
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "predict" && "🔮 Make Prediction"}
              {tab === "history" && "📊 Prediction History"} 
              {tab === "info" && "ℹ️ Model Info"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          {activeTab === "predict" && (
            <PredictionTab config={config} API={API} modelInfo={modelInfo} />
          )}
          {activeTab === "history" && (
            <HistoryTab 
              predictions={predictions} 
              loading={loading}
              onRefresh={fetchPredictionHistory}
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

// Prediction Tab Component for KOI
const PredictionTab = ({ config, API, modelInfo }) => {
  const [predictionData, setPredictionData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    if (Object.keys(predictionData).length === 0) {
      setError("Please enter prediction data");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await API.post("/api/ml/predict/koi", { 
        data: predictionData,
        isBulk: false 
      });
      
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
    setError(null);
  };

  const clearForm = () => {
    setPredictionData({});
    setResult(null);
    setError(null);
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
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
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing Kepler Data...
              </>
            ) : (
              <>
                <span>🔍</span>
                Detect Exoplanets
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Prediction Results</h3>
          {result ? (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-6 border border-purple-500">
                <h4 className="text-lg font-bold text-white mb-2">Detection Result</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Predicted Class:</span>
                    <span className={`font-bold ${getClassColor(result.data?.prediction?.predicted_class)}`}>
                      {result.data?.prediction?.predicted_class}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Confidence:</span>
                    <span className="font-bold text-purple-400">
                      {((result.data?.prediction?.confidence || 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {result.data?.prediction?.explanation && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-300 text-sm">
                    {result.data.prediction.explanation}
                  </p>
                </div>
              )}

              {/* Probabilities */}
              {result.data?.prediction?.probabilities && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <h5 className="font-semibold text-white mb-3">Class Probabilities:</h5>
                  <div className="space-y-2">
                    {Object.entries(result.data.prediction.probabilities)
                      .sort(([,a], [,b]) => b - a)
                      .map(([className, probability]) => (
                        <div key={className} className="flex justify-between items-center">
                          <span className={`text-sm ${getClassColor(className)}`}>
                            {className}
                          </span>
                          <span className="text-white font-medium">
                            {(probability * 100).toFixed(1)}%
                          </span>
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

// History Tab Component
const HistoryTab = ({ predictions, loading, onRefresh }) => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold text-white">KOI Prediction History</h3>
      <button
        onClick={onRefresh}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Refresh
      </button>
    </div>

    {loading ? (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    ) : predictions.length > 0 ? (
      <div className="space-y-4">
        {predictions.map((prediction, index) => (
          <div key={prediction.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white">KOI Prediction #{predictions.length - index}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(prediction.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-semibold">
                  {prediction.data?.output?.predicted_class || "Unknown"}
                </p>
                <p className="text-purple-400 text-sm">
                  {((prediction.data?.output?.confidence || 0) * 100).toFixed(1)}% confidence
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12 text-gray-400">
        <div className="text-6xl mb-4">📊</div>
        <p>No KOI prediction history yet</p>
      </div>
    )}
  </div>
);

// Info Tab Component
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
            <div key={index} className="mb-1">• {feature}</div>
          )) || config.features.slice(0, 6).map((feature, index) => (
            <div key={index} className="mb-1">• {feature.name}</div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700">
      <h4 className="font-semibold text-purple-400 mb-2">About Kepler Mission</h4>
      <p className="text-purple-300 text-sm">
        The Kepler Mission was a NASA space telescope designed to discover Earth-size planets 
        orbiting other stars. It used the transit method to detect planets by measuring the 
        dimming of stars when planets crossed in front of them. Kepler observed over 150,000 stars.
      </p>
    </div>
  </div>
);

export default KOIDashboard;