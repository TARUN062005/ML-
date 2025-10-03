// src/components/user/userDashboard.jsx
import React, { useState, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../../main.jsx";
import DashboardPage from "../common/DashboardPage";
import ProfilePage from "../common/ProfilePage";
import SecurityPage from "../common/SecurityPage";
import MLDashboard from "./MLDashboard.jsx";
import CustomModelDashboard from "./CustomModelDashboard.jsx";

const UserDashboard = () => {
  const { user, needsProfileCompletion, completeProfile } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleError = (err) => {
    setError(err);
    setTimeout(() => setError(""), 5000);
  };

  const handleProfileComplete = () => {
    completeProfile();
    handleMessage("Profile completed successfully! Welcome to your dashboard.");
  };

  // If profile needs completion, redirect to profile page
  if (needsProfileCompletion) {
    return <Navigate to="/user/profile" replace />;
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
      position: "relative" 
    }}>
      {/* Animated Stars Background */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 40px 70px, #fff, transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent)
        `,
        backgroundSize: "200px 200px",
        animation: "twinkle 8s infinite ease-in-out",
        opacity: 0.3,
        pointerEvents: "none"
      }}></div>

      {/* Message Display */}
      {message && (
        <div style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          background: "#059669",
          color: "white",
          padding: "12px 24px",
          borderRadius: "8px",
          border: "1px solid #34d399",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
        }}>
          ✅ {message}
        </div>
      )}
      
      {error && (
        <div style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          background: "#dc2626",
          color: "white",
          padding: "12px 24px",
          borderRadius: "8px",
          border: "1px solid #f87171",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
        }}>
          ❌ {error}
        </div>
      )}

      {/* Main Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={<DashboardPage user={user} />} 
          />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                user={user}
                needsProfileCompletion={needsProfileCompletion}
                onMessage={handleMessage}
                onError={handleError}
                onProfileComplete={handleProfileComplete}
              />
            } 
          />
          <Route 
            path="/security" 
            element={
              <SecurityPage 
                user={user}
                onMessage={handleMessage}
                onError={handleError}
              />
            } 
          />
          {/* Add ML Model Routes */}
          <Route path="/dashboard/toi" element={<MLDashboard />} />
          <Route path="/dashboard/koi" element={<MLDashboard />} />
          <Route path="/dashboard/k2" element={<MLDashboard />} />
          <Route path="/dashboard/custom/*" element={<CustomModelDashboard />} />
        </Routes>
      </div>

      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );
};

export default UserDashboard;