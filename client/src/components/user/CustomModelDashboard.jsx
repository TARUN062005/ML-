// src/components/user/CustomModelDashboard.jsx
import React, { useState, useContext, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthContext } from "../../main.jsx";

const CustomModelDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<CustomModelHome />} />
          <Route path="/train" element={<TrainModel />} />
          <Route path="/models" element={<MyModels />} />
          <Route path="/predict/:modelId" element={<CustomModelPredict />} />
        </Routes>
      </div>
    </div>
  );
};

// Custom Model Home Component
const CustomModelHome = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Custom Model Training
        </h1>
        <p className="text-xl text-gray-300">
          Train your own machine learning models with custom datasets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-green-500 transition-all duration-300 hover:transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/user/dashboard/custom/train")}
        >
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-2xl font-bold text-white mb-4">Train New Model</h3>
          <p className="text-gray-400 mb-6">
            Upload your dataset and train a custom machine learning model for exoplanet detection
          </p>
          <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
            Start Training →
          </button>
        </div>

        <div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:transform hover:-translate-y-2 cursor-pointer"
          onClick={() => navigate("/user/dashboard/custom/models")}
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-white mb-4">My Models</h3>
          <p className="text-gray-400 mb-6">
            Manage and use your trained custom models for predictions and analysis
          </p>
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
            View Models →
          </button>
        </div>
      </div>

      <div className="mt-12 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Upload Data", desc: "Provide your labeled dataset in CSV format", icon: "📁" },
            { step: "2", title: "Train Model", desc: "Our system automatically trains an optimized model", icon: "⚡" },
            { step: "3", title: "Make Predictions", desc: "Use your custom model for real-time predictions", icon: "🔮" }
          ].map((item) => (
            <div key={item.step} className="text-center p-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-lg">{item.icon}</span>
              </div>
              <h4 className="font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-blue-900/20 rounded-xl p-6 border border-blue-700">
        <h4 className="font-semibold text-blue-400 mb-2">Coming Soon</h4>
        <p className="text-blue-300 text-sm">
          Custom model training features are currently in development. 
          This interface demonstrates the future capabilities of the platform.
        </p>
      </div>
    </div>
  );
};

// Train Model Component
const TrainModel = () => {
  const { API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [training, setTraining] = useState(false);
  const [file, setFile] = useState(null);

  const handleTrainModel = async () => {
    if (!file) {
      alert("Please select a training file");
      return;
    }

    setTraining(true);
    try {
      // Mock training process
      setTimeout(() => {
        alert("Model training feature coming soon! This is a demo interface.");
        setTraining(false);
      }, 3000);
    } catch (error) {
      console.error("Training failed:", error);
      alert("Training failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate("/user/dashboard/custom")}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <span>←</span>
        <span>Back to Custom Models</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Train Custom Model</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Training Dataset
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-300 mb-4">Upload your CSV training dataset</p>
                <input 
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                />
                {file && (
                  <p className="mt-4 text-green-400">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Dataset Requirements</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• CSV format with header row</li>
                <li>• At least 100 samples recommended</li>
                <li>• Include a target column for classification</li>
                <li>• Clean, numeric data works best</li>
              </ul>
            </div>

            <button
              onClick={handleTrainModel}
              disabled={!file || training}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {training ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Training Model...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Train Model
                </>
              )}
            </button>

            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> This is a demonstration interface. 
                Actual model training functionality will be available in future updates.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Training Information</h3>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">What Happens During Training</h4>
              <p className="text-gray-300 text-sm">
                Our system will automatically preprocess your data, handle missing values, 
                perform feature selection, and train an ensemble model using XGBoost, 
                Random Forest, and Logistic Regression.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Expected Training Time</h4>
              <p className="text-gray-300 text-sm">
                Training typically takes 1-5 minutes depending on dataset size. 
                You'll be able to use your model immediately after training completes.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Model Performance</h4>
              <p className="text-gray-300 text-sm">
                You'll receive accuracy metrics and can monitor your model's performance 
                through the prediction history and analytics dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// My Models Component
const MyModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Mock data loading
    setTimeout(() => {
      setModels([]); // Empty for demo
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div>
      <button
        onClick={() => navigate("/user/dashboard/custom")}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <span>←</span>
        <span>Back to Custom Models</span>
      </button>

      <h2 className="text-2xl font-bold text-white mb-6">My Custom Models</h2>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      ) : models.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-xl mb-2">No custom models yet</p>
          <p className="mb-6">Train your first model to get started</p>
          <button
            onClick={() => navigate("/user/dashboard/custom/train")}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Train Your First Model
          </button>
          <div className="mt-6 bg-blue-900/20 rounded-lg p-4 border border-blue-700 max-w-md mx-auto">
            <p className="text-blue-300 text-sm">
              Custom model training feature coming soon in future updates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Model Card Component
const ModelCard = ({ model }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-white">{model.name}</h3>
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-sm">🤖</span>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-300 mb-4">
        <div className="flex justify-between">
          <span>Created:</span>
          <span>{new Date(model.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Accuracy:</span>
          <span className="text-green-400">
            {model.params?.accuracy ? (model.params.accuracy * 100).toFixed(1) + '%' : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Features:</span>
          <span>{model.params?.features?.length || 0}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => navigate(`/user/dashboard/custom/predict/${model.id}`)}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Predict
        </button>
      </div>
    </div>
  );
};

// Custom Model Predict Component
const CustomModelPredict = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate("/user/dashboard/custom/models")}
        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <span>←</span>
        <span>Back to My Models</span>
      </button>
      
      <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center">
        <div className="text-6xl mb-4">🔮</div>
        <h2 className="text-2xl font-bold text-white mb-4">Custom Model Prediction</h2>
        <p className="text-gray-400 mb-6">
          This feature will allow you to make predictions using your custom trained models.
        </p>
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700 max-w-md mx-auto">
          <p className="text-blue-300 text-sm">
            Custom model prediction functionality coming soon in future updates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomModelDashboard;