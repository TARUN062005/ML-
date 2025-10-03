// src/components/user/MLDashboard.jsx
import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../main.jsx";

const MLDashboard = () => {
  const { modelType } = useParams();
  const navigate = useNavigate();
  const { API } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("predict");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const modelConfig = {
    toi: {
      name: "TESS Objects of Interest",
      description: "Transiting Exoplanet Survey Satellite data analysis",
      color: "blue",
      features: [
        "pl_orbper", "pl_trandurh", "pl_trandep", "pl_rade", "pl_insol",
        "pl_eqt", "st_tmag", "st_dist", "st_teff", "st_logg", "st_rad"
      ]
    },
    koi: {
      name: "Kepler Objects of Interest", 
      description: "Kepler Mission exoplanet candidate analysis",
      color: "purple",
      features: [
        "koi_impact", "koi_duration", "koi_depth", "koi_teq", "koi_insol",
        "koi_model_snr", "koi_steff", "koi_slogg", "koi_srad", "koi_kepmag"
      ]
    },
    k2: {
      name: "K2 Mission Data",
      description: "K2 Mission extended exoplanet search",
      color: "orange", 
      features: [
        "pl_rade", "pl_bmasse", "pl_insol", "st_teff", "st_rad",
        "st_mass", "st_met", "st_logg", "sy_dist", "sy_vmag"
      ]
    }
  };

  const config = modelConfig[modelType] || modelConfig.toi;

  useEffect(() => {
    if (activeTab === "history") {
      fetchPredictionHistory();
    }
  }, [activeTab, modelType]);

  const fetchPredictionHistory = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      setPredictions([
        {
          id: 1,
          createdAt: new Date().toISOString(),
          data: {
            output: {
              predicted_class: "CANDIDATE",
              confidence: 0.85
            }
          }
        },
        {
          id: 2,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          data: {
            output: {
              predicted_class: "FALSE_POSITIVE", 
              confidence: 0.72
            }
          }
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch prediction history:", error);
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {config.name}
            </h1>
            <p className="text-gray-400 mt-2">{config.description}</p>
          </div>
          <div className="text-6xl">
            {modelType === 'toi' ? '🪐' : modelType === 'koi' ? '🌟' : '🚀'}
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
                  ? "bg-blue-600 text-white shadow-lg"
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
            <PredictionTab modelType={modelType} config={config} API={API} />
          )}
          {activeTab === "history" && (
            <HistoryTab 
              predictions={predictions} 
              loading={loading}
              onRefresh={fetchPredictionHistory}
            />
          )}
          {activeTab === "info" && (
            <InfoTab config={config} modelType={modelType} />
          )}
        </div>
      </div>
    </div>
  );
};

// Prediction Tab Component
const PredictionTab = ({ modelType, config, API }) => {
  const [predictionData, setPredictionData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("single");

  const handlePredict = async () => {
    if (mode === "single" && Object.keys(predictionData).length === 0) {
      alert("Please enter prediction data");
      return;
    }

    setLoading(true);
    try {
      // Mock prediction for demonstration
      setTimeout(() => {
        setResult({
          data: {
            prediction: {
              predicted_class: "CANDIDATE",
              confidence: 0.87,
              explanation: "Light curve analysis shows periodic dimming consistent with planetary transit."
            }
          }
        });
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Prediction failed:", error);
      alert("Prediction failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            mode === "single" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Single Prediction
        </button>
        <button
          onClick={() => setMode("bulk")} 
          className={`px-4 py-2 rounded-lg font-semibold ${
            mode === "bulk"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Bulk Prediction
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">
            {mode === "single" ? "Enter Observation Data" : "Upload CSV Data"}
          </h3>
          
          {mode === "single" ? (
            <div className="space-y-4">
              {config.features.slice(0, 5).map((feature) => (
                <div key={feature}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {feature}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder={`Enter ${feature}`}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    onChange={(e) => setPredictionData(prev => ({
                      ...prev,
                      [feature]: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
              ))}
              <p className="text-sm text-gray-400">
                * Demo mode: Enter any values to test the interface
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-300 mb-4">Upload CSV file with observation data</p>
              <input 
                type="file"
                accept=".csv"
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <p className="text-sm text-gray-400 mt-4">
                * Bulk upload feature coming soon
              </p>
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing...
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
              <div className="bg-gray-900 rounded-lg p-6 border border-green-500">
                <h4 className="text-lg font-bold text-green-400 mb-2">Detection Result</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Predicted Class:</span>
                    <span className="font-bold text-white">
                      {result.data?.prediction?.predicted_class}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Confidence:</span>
                    <span className="font-bold text-blue-400">
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
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">🌌</div>
              <p>Enter data and click detect to see results</p>
              <p className="text-sm mt-2">This is a demo interface - real ML integration coming soon</p>
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
      <h3 className="text-xl font-bold text-white">Prediction History</h3>
      <button
        onClick={onRefresh}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                <p className="font-semibold text-white">
                  Prediction #{predictions.length - index}
                </p>
                <p className="text-gray-400 text-sm">
                  {new Date(prediction.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-semibold">
                  {prediction.data?.output?.predicted_class || "Unknown"}
                </p>
                <p className="text-blue-400 text-sm">
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
        <p>No prediction history yet</p>
        <p className="text-sm">Make your first prediction to see it here</p>
      </div>
    )}
  </div>
);

// Info Tab Component
const InfoTab = ({ config, modelType }) => {
  const modelInfo = {
    model_type: "Ensemble Classifier",
    is_trained: true,
    class_names: ["CONFIRMED", "CANDIDATE", "FALSE_POSITIVE"],
    selected_features: config.features.slice(0, 8)
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Model Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Model Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className="text-white">{modelInfo.model_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Trained:</span>
              <span className="text-white">{modelInfo.is_trained ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Classes:</span>
              <span className="text-white">{modelInfo.class_names?.join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-2">Features Used</h4>
          <div className="text-sm text-gray-300">
            {modelInfo.selected_features?.map((feature, index) => (
              <div key={index} className="mb-1">• {feature}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-2">About This Model</h4>
        <p className="text-gray-300 text-sm">
          This model analyzes {config.name.toLowerCase()} data to classify astronomical objects 
          as confirmed exoplanets, candidates, or false positives using advanced machine learning 
          algorithms trained on NASA mission data.
        </p>
      </div>

      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700">
        <h4 className="font-semibold text-blue-400 mb-2">Demo Notice</h4>
        <p className="text-blue-300 text-sm">
          This is a demonstration interface. Real machine learning model integration 
          will be implemented in future updates with actual NASA data pipelines.
        </p>
      </div>
    </div>
  );
};

export default MLDashboard;