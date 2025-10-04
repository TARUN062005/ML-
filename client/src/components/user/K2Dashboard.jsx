// src/components/user/K2Dashboard.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../main.jsx";

const K2Dashboard = () => {
  const navigate = useNavigate();
  const { API } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("predict");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);

  // K2-specific configuration with correct K2 data
  const config = {
    name: "K2 Mission Data",
    description: "K2 Mission extended exoplanet search",
    color: "orange",
    icon: "🚀",
    features: [
      { name: "pl_orbper", label: "Orbital Period (days)", type: "number", placeholder: "41.688644" },
      { name: "pl_orbsmax", label: "Orbital Semi-Major Axis (AU)", type: "number", placeholder: "0.241" },
      { name: "pl_rade", label: "Planet Radius (Earth radii)", type: "number", placeholder: "2.23" },
      { name: "pl_bmasse", label: "Planet Mass (Earth masses)", type: "number", placeholder: "16.3" },
      { name: "pl_orbeccen", label: "Orbital Eccentricity", type: "number", placeholder: "0.0" },
      { name: "pl_insol", label: "Insolation Flux (Earth flux)", type: "number", placeholder: "546.0" },
      { name: "pl_eqt", label: "Equilibrium Temperature (K)", type: "number", placeholder: "793.0" },
      { name: "st_teff", label: "Star Temperature (K)", type: "number", placeholder: "5766" },
      { name: "st_rad", label: "Star Radius (Solar radii)", type: "number", placeholder: "0.928" },
      { name: "st_mass", label: "Star Mass (Solar masses)", type: "number", placeholder: "0.961" },
      { name: "st_met", label: "Star Metallicity [Fe/H]", type: "number", placeholder: "-0.15" },
      { name: "st_logg", label: "Star Surface Gravity (log g)", type: "number", placeholder: "4.5" },
      { name: "sy_dist", label: "System Distance (pc)", type: "number", placeholder: "179.461" },
      { name: "sy_vmag", label: "Visual Magnitude", type: "number", placeholder: "10.849" }
    ],
    sampleData: {
      pl_orbper: 41.688644,
      pl_orbsmax: 0.241,
      pl_rade: 2.23,
      pl_bmasse: 16.3,
      pl_orbeccen: 0.0,
      pl_insol: 546.0,
      pl_eqt: 793.0,
      st_teff: 5766,
      st_rad: 0.928,
      st_mass: 0.961,
      st_met: -0.15,
      st_logg: 4.5,
      sy_dist: 179.461,
      sy_vmag: 10.849
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
      const response = await API.get("/api/ml/model-info/k2");
      setModelInfo(response.data.data);
    } catch (error) {
      console.error("Failed to fetch K2 model info:", error);
      // Set default info based on actual K2 model
      setModelInfo({
        model_type: "Ensemble Classifier",
        is_trained: true,
        class_names: ["CONFIRMED", "CANDIDATE", "FALSE POSITIVE"],
        selected_features: config.features.map(f => f.name),
        target_column: "disposition"
      });
    }
  };

  const fetchPredictionHistory = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/ml/entries/k2?limit=5");
      setPredictions(response.data.data.entries || []);
    } catch (error) {
      console.error("Failed to fetch K2 prediction history:", error);
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
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
                  ? "bg-orange-600 text-white shadow-lg"
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

// Prediction Tab Component for K2
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
      const response = await API.post("/api/ml/predict/k2", { 
        data: predictionData,
        isBulk: false 
      });
      
      if (response.data.success) {
        setResult(response.data);
      } else {
        throw new Error(response.data.message || "Prediction failed");
      }
    } catch (error) {
      console.error("K2 Prediction failed:", error);
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
      'FALSE POSITIVE': 'text-red-400'
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
            <h3 className="text-xl font-bold text-white">Enter K2 Observation Data</h3>
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
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
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
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing K2 Data...
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
              <div className="bg-gray-900 rounded-lg p-6 border border-orange-500">
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
                    <span className="font-bold text-orange-400">
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
              <div className="text-6xl mb-4">🚀</div>
              <p>Enter K2 data and click detect to see results</p>
              <p className="text-sm mt-2">Real-time K2 Mission analysis</p>
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
      <h3 className="text-xl font-bold text-white">K2 Prediction History</h3>
      <button
        onClick={onRefresh}
        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
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
                <p className="font-semibold text-white">K2 Prediction #{predictions.length - index}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(prediction.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-yellow-400 font-semibold">
                  {prediction.data?.output?.predicted_class || "Unknown"}
                </p>
                <p className="text-orange-400 text-sm">
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
        <p>No K2 prediction history yet</p>
      </div>
    )}
  </div>
);

// Info Tab Component
const InfoTab = ({ config, modelInfo }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-bold text-white">K2 Model Information</h3>
    
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
            <span className="text-white">{modelInfo?.target_column || "disposition"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Classes:</span>
            <span className="text-white">{modelInfo?.class_names?.join(", ") || "CONFIRMED, CANDIDATE, FALSE POSITIVE"}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-2">K2 Features Used</h4>
        <div className="text-sm text-gray-300 max-h-32 overflow-y-auto">
          {modelInfo?.selected_features?.map((feature, index) => (
            <div key={index} className="mb-1">• {feature}</div>
          )) || config.features.slice(0, 6).map((feature, index) => (
            <div key={index} className="mb-1">• {feature.name}</div>
          ))}
        </div>
      </div>
    </div>

    <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-700">
      <h4 className="font-semibold text-orange-400 mb-2">About K2 Mission</h4>
      <p className="text-orange-300 text-sm">
        The K2 mission was an extension of the Kepler Mission that continued the search for exoplanets 
        while studying young stars, supernovae, and other astronomical phenomena across multiple fields 
        along the ecliptic plane. K2 discovered over 500 exoplanet candidates.
      </p>
    </div>
  </div>
);

export default K2Dashboard;