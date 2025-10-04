// src/components/common/DashboardPage.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../main.jsx";

const DashboardPage = ({ user, showDetection = false }) => {
  const { API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    const handleStorageChange = () => {
      fetchDashboardStats();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await API.get("/api/ml/dashboard");
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setDashboardStats({
        counts: {
          toi: 0,
          koi: 0,
          k2: 0,
          customModels: 0
        },
        recentPredictions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Animated Stars Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + 'vh',
              left: Math.random() * 100 + 'vw',
              animationDelay: Math.random() * 5 + 's',
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            NASA Exoplanet Discovery Platform
          </h1>
          <p className="text-xl text-gray-300">
            Welcome back, {user?.name || "Astronomer"}! Ready to explore the cosmos?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon="🪐"
            title="TOI Predictions"
            value={dashboardStats?.counts?.toi || 0}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon="🌟"
            title="KOI Predictions"
            value={dashboardStats?.counts?.koi || 0}
            color="from-purple-500 to-pink-500"
          />
          <StatCard
            icon="🚀"
            title="K2 Predictions"
            value={dashboardStats?.counts?.k2 || 0}
            color="from-orange-500 to-red-500"
          />
          <StatCard
            icon="🔧"
            title="Custom Models"
            value={dashboardStats?.counts?.customModels || 0}
            color="from-green-500 to-emerald-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <QuickActionCard
            title="Exoplanet Detection"
            description="Use pre-trained NASA models to detect exoplanets"
            icon="🔭"
            color="blue"
            actions={[
              { 
                label: "TOI Model", 
                path: "/user/dashboard/toi", 
                icon: "🪐", 
                description: "TOI Mission Data" 
              },
              { 
                label: "KOI Model", 
                path: "/user/dashboard/koi", 
                icon: "🌟", 
                description: "Kepler Mission Data" 
              },
              { 
                label: "K2 Model", 
                path: "/user/dashboard/k2", 
                icon: "🚀", 
                description: "K2 Mission Data" 
              }
            ]}
            onNavigate={handleNavigation}
          />
          <QuickActionCard
            title="Custom Models"
            description="Train and use your own ML models"
            icon="🧠"
            color="purple"
            actions={[
              { 
                label: "Train Model", 
                path: "/user/dashboard/custom/train", 
                icon: "⚡", 
                description: "Train new model" 
              },
              { 
                label: "My Models", 
                path: "/user/dashboard/custom/models", 
                icon: "📊", 
                description: "View your models" 
              }
            ]}
            onNavigate={handleNavigation}
          />
        </div>

        {/* Recent Activity */}
        <RecentActivity predictions={dashboardStats?.recentPredictions} />
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite;
        }
      `}</style>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:transform hover:-translate-y-2">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-2">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className={`text-3xl bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {icon}
      </div>
    </div>
  </div>
);

// Quick Action Card Component
const QuickActionCard = ({ title, description, icon, color, actions, onNavigate }) => {
  const colorClasses = {
    blue: "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
    purple: "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
    green: "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400">{description}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onNavigate(action.path)}
            className={`w-full bg-gradient-to-r ${colorClasses[color]} text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-left flex items-center justify-between group`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{action.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{action.label}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </div>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ predictions }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
    <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
    {predictions && predictions.length > 0 ? (
      <div className="space-y-3">
        {predictions.slice(0, 5).map((prediction, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm">🔭</span>
              </div>
              <div>
                <p className="text-white font-medium">TOI Prediction</p>
                <p className="text-gray-400 text-sm">
                  {new Date(prediction.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-medium">Completed</p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">🌌</div>
        <p>No recent activity</p>
        <p className="text-sm">Start by making your first prediction!</p>
      </div>
    )}
  </div>
);

// Loading Component
const DashboardLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{animationDelay: '0.1s'}}></div>
      </div>
      <p className="text-white text-lg">Loading Mission Control...</p>
    </div>
  </div>
);

export default DashboardPage;