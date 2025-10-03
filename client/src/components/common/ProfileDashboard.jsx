import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../main.jsx";
import DashboardPage from "./DashboardPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import SecurityPage from "./SecurityPage.jsx";

// Message Component (moved from UIComponents)
const Message = ({ type, message }) => (
  <div className={`p-4 rounded-lg mb-4 flex items-center ${
    type === 'success' 
      ? 'bg-green-900 bg-opacity-50 border border-green-700 text-green-300'
      : 'bg-red-900 bg-opacity-50 border border-red-700 text-red-300'
  }`}>
    <span className="mr-2">{type === 'success' ? '✅' : '⚠️'}</span>
    {message}
  </div>
);

// Loading Screen Component
const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900" style={{ 
    background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)" 
  }}>
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg text-gray-300">{message}</p>
    </div>
  </div>
);

const ProfileDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("welcome");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if profile needs completion (first-time setup)
  const needsProfileCompletion = user?.firstLogin && !user?.profileCompleted;
  
  useEffect(() => {
    if (user) {
      setLoading(false);
      
      // If profile needs completion, automatically show profile setup
      if (needsProfileCompletion) {
        setActiveTab("profile");
      }
    }
  }, [user, needsProfileCompletion]);

  // Add real-time user updates
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // User data will be updated via AuthContext, but we can force re-render if needed
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const handleMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleError = (err) => {
    setError(err);
    setTimeout(() => setError(""), 5000);
  };

  const handleLogout = () => {
    logout();
    navigate("/"); // Navigate to home page after logout
  };

  const handleDropdownAction = (action) => {
    setShowProfileDropdown(false);
    switch (action) {
      case "profile":
        setActiveTab("profile");
        break;
      case "security":
        setActiveTab("security");
        break;
      case "logout":
        handleLogout();
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "welcome":
        return <DashboardPage user={user} />;
      case "detection":
        return <DashboardPage user={user} showDetection={true} />;
      case "profile":
        return (
          <ProfilePage 
            user={user} 
            needsProfileCompletion={needsProfileCompletion}
            onMessage={handleMessage}
            onError={handleError}
            onProfileComplete={() => setActiveTab("welcome")}
          />
        );
      case "security":
        return (
          <SecurityPage 
            user={user}
            onMessage={handleMessage}
            onError={handleError}
          />
        );
      default:
        return <DashboardPage user={user} />;
    }
  };

  if (loading) {
    return <LoadingScreen message="Initializing Mission Systems..." />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-gray-300">Astronaut not found. Please login again.</p>
          <button 
            onClick={handleLogout}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Return to Launch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900" style={{ background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)" }}>
      {/* Animated Stars Background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 40px 70px, #fff, transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent)
        `,
        backgroundSize: "200px 200px",
        animation: "twinkle 8s infinite ease-in-out",
        opacity: 0.3
      }}></div>

      {/* Header */}
      <header className="bg-gray-800 bg-opacity-80 backdrop-blur-sm border-b border-gray-700 relative z-10">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🚀</span>
            </div>
            <h1 className="text-2xl font-bold text-white">ExoDiscover AI</h1>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
            {[
              { id: "welcome", label: "Mission Control", icon: "🚀" },
              { id: "detection", label: "Detection", icon: "🔍" },
              { id: "profile", label: "Profile", icon: "👨‍🚀" },
              { id: "security", label: "Security", icon: "🛡️" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  clearMessages();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-300 ${
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-lg" 
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-3 bg-gray-700 rounded-full p-2 border border-gray-600 hover:border-blue-400 transition-all"
            >
              <img
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0f5c6e&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <span className="font-medium text-white">{user?.name || "Astronaut"}</span>
              <span className={`transform transition-transform ${showProfileDropdown ? 'rotate-180' : ''} text-white`}>▼</span>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                <button
                  onClick={() => handleDropdownAction("profile")}
                  className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-200"
                >
                  <span>👨‍🚀</span>
                  <span>Mission Profile</span>
                </button>
                <button
                  onClick={() => handleDropdownAction("security")}
                  className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-200"
                >
                  <span>🛡️</span>
                  <span>Security</span>
                </button>
                <div className="border-t border-gray-700 my-1"></div>
                <button
                  onClick={() => handleDropdownAction("logout")}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-900 flex items-center space-x-2 transition-colors duration-200"
                >
                  <span>🌎</span>
                  <span>Return to Earth</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="px-8 pt-4 relative z-10">
        {message && <Message type="success" message={message} />}
        {error && <Message type="error" message={error} />}
      </div>

      {/* Content Area */}
      <main className="flex-1 relative z-10">
        {renderContent()}
      </main>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default ProfileDashboard;