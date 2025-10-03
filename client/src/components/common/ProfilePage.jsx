// src/components/common/ProfilePage.jsx
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../main.jsx";
import { useNavigate } from "react-router-dom";

const ProfilePage = ({ user, needsProfileCompletion, onMessage, onError, onProfileComplete }) => {
  const { API, completeProfile, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(needsProfileCompletion);

  // FIXED: Better state synchronization - force editing mode for incomplete profiles
  useEffect(() => {
    if (user) {
      setUserData(user);
    }
    // Always start in editing mode if profile needs completion
    if (needsProfileCompletion && !isEditing) {
      setIsEditing(true);
    }
  }, [user, needsProfileCompletion]);

  const updateProfile = async (updatedData) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await API.put("/user/profile", updatedData);
      const updatedUser = response.data.user || response.data;
      
      // FIXED: Get current token to maintain login state
      const currentToken = localStorage.getItem("token");
      
      // Update state immediately with complete user data
      setUserData(updatedUser);
      
      // FIXED: Update localStorage with complete user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // FIXED: Update AuthContext state by calling login again with updated data
      if (currentToken) {
        login(updatedUser, currentToken);
      }
      
      // FIXED: Trigger storage event to update all components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(updatedUser)
      }));
      
      const successMsg = "Profile updated successfully! ✅";
      setMessage(successMsg);
      onMessage(successMsg);
      
      // If this was first-time setup, mark as complete
      if (needsProfileCompletion) {
        completeProfile();
        // FIXED: Removed automatic redirect - stay on profile page
        onProfileComplete();
      }
      
      setIsEditing(false);
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update profile";
      setMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Show forced profile completion for first-time users
  if (needsProfileCompletion && !isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-6xl text-white">👨‍🚀</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Complete Your Mission Profile
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Before you can begin exploring the cosmos, we need to set up your astronaut profile.
            This helps us personalize your exoplanet discovery experience.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Start Profile Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {!needsProfileCompletion && (
              <button
                onClick={() => navigate("/user/dashboard")}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </button>
            )}
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {isEditing ? "Mission Profile Setup" : "Astronomer Profile"}
            </h1>
            <p className="text-gray-400 mt-2">
              {isEditing 
                ? needsProfileCompletion 
                  ? "Complete your profile to access the dashboard" 
                  : "Configure your mission parameters"
                : "Your space exploration identity"
              }
            </p>
          </div>
          
          {/* Navigation Buttons - Only show if profile is complete */}
          {!needsProfileCompletion && (
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/user/dashboard")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                🏠 Dashboard
              </button>
              <button
                onClick={() => navigate("/user/security")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                🔒 Security
              </button>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes("✅") ? "bg-green-900/50 border border-green-500" : "bg-red-900/50 border border-red-500"
          }`}>
            {message}
          </div>
        )}

        {/* Profile Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <ProfileTab 
            userData={userData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onUpdate={updateProfile}
            loading={loading}
            needsProfileCompletion={needsProfileCompletion}
          />
        </div>
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ userData, isEditing, setIsEditing, onUpdate, loading, needsProfileCompletion }) => {
  const [formData, setFormData] = useState({
    name: userData?.name || "",
    email: userData?.email || "",
    age: userData?.age || "",
    gender: userData?.gender || "",
    dob: userData?.dob ? new Date(userData.dob).toISOString().split('T')[0] : "",
    bio: userData?.bio || "",
    profileImage: userData?.profileImage || ""
  });

  // FIXED: Update form data when userData changes
  useEffect(() => {
    setFormData({
      name: userData?.name || "",
      email: userData?.email || "",
      age: userData?.age || "",
      gender: userData?.gender || "",
      dob: userData?.dob ? new Date(userData.dob).toISOString().split('T')[0] : "",
      bio: userData?.bio || "",
      profileImage: userData?.profileImage || ""
    });
  }, [userData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields for profile completion
    if (needsProfileCompletion) {
      if (!formData.name || !formData.email) {
        alert("Please fill in at least Name and Email to complete your profile.");
        return;
      }
    }
    
    onUpdate(formData);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name {needsProfileCompletion && "*"}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter your full name"
              required={needsProfileCompletion}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address {needsProfileCompletion && "*"}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter your email"
              required={needsProfileCompletion}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({...prev, age: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter your age"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({...prev, gender: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData(prev => ({...prev, dob: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Image URL
            </label>
            <input
              type="url"
              value={formData.profileImage}
              onChange={(e) => setFormData(prev => ({...prev, profileImage: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
            rows="4"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
            placeholder="Tell us about your interest in exoplanet discovery..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-8 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {needsProfileCompletion ? "Setting Up..." : "Updating..."}
              </>
            ) : (
              needsProfileCompletion ? "Complete Setup 🚀" : "Update Profile"
            )}
          </button>
          
          {!needsProfileCompletion && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {needsProfileCompletion && (
          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Note:</strong> You must complete your profile before accessing the dashboard. 
              At minimum, provide your Name and Email address.
            </p>
          </div>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">👨‍🚀</span> Astronomer Information
          </h3>
          <div className="space-y-4">
            <InfoField label="Full Name" value={userData?.name} />
            <InfoField label="Email" value={userData?.email} />
            <InfoField label="Mission Age" value={userData?.age} />
            <InfoField label="Gender" value={userData?.gender} />
            <InfoField label="Launch Date" value={userData?.dob ? new Date(userData.dob).toLocaleDateString() : null} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">📝</span> Mission Log
          </h3>
          <InfoField label="Bio" value={userData?.bio} multiline />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-700">
        <button
          onClick={() => setIsEditing(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
        >
          Edit Mission Profile
        </button>
      </div>
    </div>
  );
};

// Helper Components
const InfoField = ({ label, value, multiline = false }) => (
  <div className="border-b border-gray-700 pb-3">
    <p className="text-sm text-gray-400 mb-1">{label}</p>
    {multiline ? (
      <p className="text-white whitespace-pre-wrap">{value || "Not provided"}</p>
    ) : (
      <p className="text-white">{value || "Not provided"}</p>
    )}
  </div>
);

export default ProfilePage;