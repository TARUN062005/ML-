import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../main.jsx";

const ProfilePage = ({ user, needsProfileCompletion, onMessage, onError, onProfileComplete }) => {
  const { API, completeProfile } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(needsProfileCompletion);

  // Real-time state synchronization
  useEffect(() => {
    setUserData(user);
  }, [user]);

  const updateProfile = async (updatedData) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await API.put("/user/profile", updatedData);
      const updatedUser = response.data.user || response.data;
      
      // Update state immediately
      setUserData(updatedUser);
      
      // Update localStorage immediately
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Trigger storage event to update other components
      window.dispatchEvent(new Event('storage'));
      
      const successMsg = "Profile updated successfully! ✅";
      setMessage(successMsg);
      onMessage(successMsg);
      
      // If this was first-time setup, mark as complete
      if (needsProfileCompletion) {
        completeProfile();
        setTimeout(() => {
          onProfileComplete();
        }, 1500);
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
            <button
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {isEditing ? "Mission Profile Setup" : "Astronomer Profile"}
            </h1>
            <p className="text-gray-400 mt-2">
              {isEditing ? "Configure your mission parameters" : "Your space exploration identity"}
            </p>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = "/user/dashboard"}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              🏠 Dashboard
            </button>
            <button
              onClick={() => window.location.href = "/user/security"}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              🔒 Security
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes("✅") ? "bg-green-900/50 border border-green-500" : "bg-red-900/50 border border-red-500"
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-8">
          {["profile", "security"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all ${
                activeTab === tab
                  ? "bg-purple-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "profile" && "👤 Profile"}
              {tab === "security" && "🔒 Security"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          {activeTab === "profile" && (
            <ProfileTab 
              userData={userData}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              onUpdate={updateProfile}
              loading={loading}
              needsProfileCompletion={needsProfileCompletion}
            />
          )}
          {activeTab === "security" && (
            <SecurityTab 
              user={userData}
              onMessage={onMessage}
              onError={onError}
            />
          )}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter your email"
              required
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

// Security Tab Component - COMPLETED IMPLEMENTATION
const SecurityTab = ({ user, onMessage, onError }) => {
  const { API } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend Timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [resendTimer]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate passwords
      if (newPassword.length < 6) {
        onError("New password must be at least 6 characters long.");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        onError("New passwords do not match.");
        return;
      }

      if (!requiresOtp) {
        // Request OTP for password change
        const response = await API.post("/user/send-otp-for-operation", {
          operation: 'PASSWORD_CHANGE'
        });

        if (response.data.success) {
          setRequiresOtp(true);
          setResendTimer(180);
          onMessage("OTP sent to your registered email/phone. Please enter the OTP to continue.");
        }
      } else {
        // Submit password change with OTP
        const response = await API.put("/user/change-password", {
          currentPassword,
          newPassword,
          confirmPassword,
          otp
        });

        if (response.data.success) {
          onMessage("Password changed successfully! ✅");
          // Reset form
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setOtp("");
          setRequiresOtp(false);
        }
      }
    } catch (error) {
      onError(error.response?.data?.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      await API.post("/user/send-otp-for-operation", {
        operation: 'PASSWORD_CHANGE'
      });
      setResendTimer(180);
      onMessage("New OTP sent successfully!");
    } catch (error) {
      onError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-6">Security Systems</h3>
      
      <div className="bg-gray-900 rounded-lg p-6">
        <h4 className="font-semibold text-white mb-4">Change Password</h4>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {!requiresOtp ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-center text-xl tracking-widest text-white focus:outline-none focus:border-purple-500"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                required
              />
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  className={`text-sm ${resendTimer > 0 ? "text-gray-500 cursor-default" : "text-blue-400 hover:underline"}`}
                >
                  {resendTimer > 0
                    ? `Resend OTP in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}`
                    : "Resend OTP"
                  }
                </button>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : requiresOtp ? (
              "Change Password"
            ) : (
              "Request OTP"
            )}
          </button>
        </form>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Security Protocols</h3>
        <div className="space-y-4">
          <SecurityOption 
            icon="🛡️"
            title="Two-Factor Authentication"
            description="Enhanced security for mission-critical operations"
            status="Active"
          />
          <SecurityOption 
            icon="📡"
            title="Mission Alerts"
            description="Real-time notifications for account activity"
            status="Enabled"
          />
          <SecurityOption 
            icon="🔐"
            title="Session Encryption"
            description="Secure communication channels"
            status="Active"
          />
        </div>
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

const SecurityOption = ({ icon, title, description, status }) => (
  <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
    <div className="flex items-center space-x-4">
      <div className="text-2xl">{icon}</div>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
      status === "Active" || status === "Enabled" 
        ? "bg-green-900 text-green-400" 
        : "bg-yellow-900 text-yellow-400"
    }`}>
      {status}
    </span>
  </div>
);

export default ProfilePage;