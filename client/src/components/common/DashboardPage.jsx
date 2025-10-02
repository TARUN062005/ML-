// src/components/common/DashboardPage.jsx
import React, { useState, useContext } from "react";
import { AuthContext, API } from "../../main.jsx";

const DashboardPage = ({ user, showDetection = false }) => {
  const { API: contextAPI } = useContext(AuthContext);
  const API = contextAPI || API;
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [detectionLoading, setDetectionLoading] = useState(false);

  // Exoplanet detection functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
      setDetectionResult(null);
    }
  };

  const handleExoplanetDetection = async () => {
    if (!selectedFile) return;

    setDetectionLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await API.post("/predict", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setDetectionResult(response.data);
    } catch (err) {
      console.error("Detection failed:", err);
    } finally {
      setDetectionLoading(false);
    }
  };

  if (showDetection) {
    return <DetectionScreen 
      selectedFile={selectedFile}
      detectionResult={detectionResult}
      detectionLoading={detectionLoading}
      onFileUpload={handleFileUpload}
      onDetection={handleExoplanetDetection}
    />;
  }

  return <WelcomeScreen user={user} />;
};

// Welcome Screen Component
const WelcomeScreen = ({ user }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center max-w-4xl">
      <div className="mb-8">
        <div className="w-40 h-40 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-6xl text-white">🚀</span>
          </div>
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Welcome to Mission Control, {user?.name || "Astronomer"}!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Ready to explore the cosmos and discover new worlds? Your exoplanet detection mission starts here.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-400 transition-all duration-300 hover:transform hover:-translate-y-2">
          <div className="w-16 h-16 bg-blue-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">🪐</span>
          </div>
          <h3 className="font-semibold text-white mb-2">Exoplanet Detection</h3>
          <p className="text-gray-400 text-sm">Upload Kepler data to discover new exoplanets</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-400 transition-all duration-300 hover:transform hover:-translate-y-2">
          <div className="w-16 h-16 bg-green-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-semibold text-white mb-2">Mission Analytics</h3>
          <p className="text-gray-400 text-sm">Analyze detection results and patterns</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-400 transition-all duration-300 hover:transform hover:-translate-y-2">
          <div className="w-16 h-16 bg-purple-900 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">🔭</span>
          </div>
          <h3 className="font-semibold text-white mb-2">Sky Exploration</h3>
          <p className="text-gray-400 text-sm">Explore celestial objects in real-time</p>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => window.location.hash = "detection"}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 flex items-center gap-2"
        >
          <span>🚀</span>
          Start Detection Mission
        </button>
        <button
          onClick={() => window.location.hash = "profile"}
          className="bg-gray-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300 border border-gray-600"
        >
          View Mission Profile
        </button>
      </div>
    </div>
  </div>
);

// Detection Screen Component
const DetectionScreen = ({ selectedFile, detectionResult, detectionLoading, onFileUpload, onDetection }) => (
  <div className="flex-1 p-8">
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Exoplanet Detection System
        </h1>
        <p className="text-xl text-gray-300">
          Upload Kepler mission data to discover new exoplanets using our advanced AI algorithms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span>📁</span> Upload Observation Data
          </h2>
          
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <div className="text-4xl mb-4">🛰️</div>
              <p className="text-gray-300 mb-4">Upload your Kepler mission CSV file</p>
              <input 
                type="file" 
                accept=".csv"
                onChange={onFileUpload}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              {selectedFile && (
                <p className="mt-4 text-green-400 flex items-center justify-center gap-2">
                  <span>✅</span> Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <button
              onClick={onDetection}
              disabled={!selectedFile || detectionLoading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {detectionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Analyzing Data...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Detect Exoplanets
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span>📊</span> Detection Results
          </h2>

          {detectionResult ? (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-6 border border-green-500">
                <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                  <span>🎯</span> Detection Complete!
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Exoplanets Detected:</span>
                    <span className="text-2xl font-bold text-white">
                      {detectionResult.prediction_text1 || "Analyzing..."}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Confidence Level:</span>
                    <span className="text-lg font-semibold text-blue-400">
                      {detectionResult.prediction_text2 || "High"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Detection Details</h4>
                <p className="text-gray-400 text-sm">
                  The AI model has analyzed the light curve data and identified potential exoplanet transits based on periodic dimming patterns.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌌</div>
              <p className="text-gray-400">Upload a CSV file to begin exoplanet detection</p>
              <p className="text-gray-500 text-sm mt-2">
                Supported: Kepler, K2, and TESS mission data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detection Techniques Info */}
      <div className="mt-12 bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Detection Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "📡", title: "Transit Method", desc: "Detects planets as they pass in front of stars" },
            { icon: "🌠", title: "Radial Velocity", desc: "Measures star wobbles caused by orbiting planets" },
            { icon: "🔭", title: "Direct Imaging", desc: "Captures direct images of distant exoplanets" },
            { icon: "⚡", title: "AI Analysis", desc: "Machine learning algorithms for pattern recognition" }
          ].map((method, index) => (
            <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-center">
              <div className="text-2xl mb-2">{method.icon}</div>
              <h4 className="font-semibold text-white text-sm mb-1">{method.title}</h4>
              <p className="text-gray-400 text-xs">{method.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default DashboardPage;