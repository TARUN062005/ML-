// src/components/user/userDashboard.jsx
import React, { useState, useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../main.jsx";
import DashboardPage from "../common/DashboardPage";
import ProfilePage from "../common/ProfilePage";
import SecurityPage from "../common/SecurityPage";
import MLDashboard from "./MLDashboard.jsx";
import CustomModelDashboard from "./CustomModelDashboard.jsx";

const UserDashboard = () => {
  const { user, needsProfileCompletion, completeProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  console.log('🔍 UserDashboard - Profile completion status:', {
    needsProfileCompletion,
    user: user ? { 
      name: user.name, 
      profileCompleted: user.profileCompleted 
    } : 'No user',
    currentPath: location.pathname
  });

  // FIXED: Better redirect logic with protection against loops
  useEffect(() => {
    if (needsProfileCompletion && user && location.pathname !== '/user/profile') {
      console.log('🔄 Auto-redirecting to profile completion page');
      setRedirecting(true);
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        navigate("/user/profile", { replace: true });
      }, 100);
    }
  }, [needsProfileCompletion, user, navigate, location.pathname]);

  const handleMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleError = (err) => {
    setError(err);
    setTimeout(() => setError(""), 5000);
  };

  const handleProfileComplete = () => {
    console.log('✅ Profile completion triggered in UserDashboard');
    completeProfile();
    handleMessage("Profile completed successfully! Welcome to your dashboard.");
    // Navigate to dashboard after profile completion
    setTimeout(() => {
      navigate("/user/dashboard", { replace: true });
    }, 1500);
  };

  // FIXED: Show loading while checking redirect - only if we're actually redirecting
  if (redirecting && needsProfileCompletion) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative" 
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting to profile setup...</p>
        </div>
      </div>
    );
  }

  // FIXED: If we're on profile page and profile needs completion, don't redirect
  if (needsProfileCompletion && location.pathname === '/user/profile') {
    console.log('✅ On profile page, showing profile content');
    // Continue to show the profile page
  } else if (needsProfileCompletion) {
    // If we're not on profile page and profile needs completion, show loading
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative" 
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Setting up your mission profile...</p>
        </div>
      </div>
    );
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