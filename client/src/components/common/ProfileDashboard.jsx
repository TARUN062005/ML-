import React, { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../../main.jsx";

const ProfileDashboard = () => {
  const { user, logout, API: contextAPI } = useContext(AuthContext);
  const API = contextAPI || API; // Use context API if available, fallback to prop
  
  // Determine userType from user role
  const userType = user?.role?.toLowerCase() === 'other_user' ? 'other' : 'user';
  
  const [profile, setProfile] = useState({ 
    name: "", 
    age: null, 
    gender: "", 
    dob: "", 
    bio: "", 
    profileImage: "",
    addresses: [{ line1: "", line2: "", city: "", state: "", region: "", pincode: "", country: "India" }]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("welcome");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // State for OTP-based deletion
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");

  // Check if profile is complete
  const isProfileComplete = user?.name && user?.age && user?.gender && user?.dob;

  // Use ref to prevent infinite re-renders
  const profileSetupDone = React.useRef(false);

  useEffect(() => {
    if (user && !profileSetupDone.current) {
      setProfile({
        name: user.name || "",
        age: user.age || "",
        gender: user.gender || "",
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
        bio: user.bio || "",
        profileImage: user.profileImage || "",
        addresses: user.addresses?.length > 0 
          ? user.addresses 
          : [{ line1: "", line2: "", city: "", state: "", region: "", pincode: "", country: "India" }]
      });
      
      // If profile is incomplete, show profile setup (only once)
      if (!isProfileComplete && !profileSetupDone.current) {
        setActiveTab("profile");
        setIsEditing(true);
        profileSetupDone.current = true;
      }
      
      setLoading(false);
    }
  }, [user, isProfileComplete]);

  // Debounced profile update function
  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = { 
        name: profile.name,
        ...(profile.age && { age: parseInt(profile.age) }),
        ...(profile.gender && { gender: profile.gender.toUpperCase() }),
        ...(profile.dob && { dob: new Date(profile.dob).toISOString() }),
        ...(profile.bio && { bio: profile.bio }),
        ...(profile.profileImage && { profileImage: profile.profileImage }),
        addresses: profile.addresses.map(addr => ({
          ...addr,
          id: addr.id || undefined
        }))
      };
      
      const res = await API.put(`/${userType}/profile`, payload);
      setMessage("Profile updated successfully! ✅");
      setIsEditing(false);
      
      // If it was first-time setup, show welcome
      if (!isProfileComplete) {
        setActiveTab("welcome");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  // Optimized input handler with debouncing
  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = async (currentPassword, newPassword, confirmPassword) => {
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const res = await API.put(`/${userType}/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword
      });
      setMessage("Password changed successfully! ✅");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
      return false;
    }
  };

  const handleRequestAccountDeletion = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.post(`/${userType}/request-deletion`);
      setMessage(res.data.message);
      setDeleteOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request account deletion.");
    }
  };

  const handleDeleteAccount = async () => {
    setError("");
    setMessage("");
    try {
      const res = await API.delete(`/${userType}/account`, {
        data: { otp: deleteOtp }
      });
      setMessage(res.data.message);
      setShowDeleteModal(false);
      setDeleteOtpSent(false);
      setDeleteOtp("");
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account.");
    }
  };

  const WelcomeScreen = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-6xl text-white">👋</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to MyApp, {user?.name || "User"}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {userType === 'other' ? "Professional account activated successfully!" : "We're excited to have you on board. Your account is ready to use."}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Dashboard</h3>
            <p className="text-gray-600 text-sm">Access your personalized dashboard</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600 text-sm">Customize your preferences</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
            <p className="text-gray-600 text-sm">Manage your account security</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("profile")}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
        >
          {isProfileComplete ? "View Profile" : "Complete Your Profile"}
        </button>
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? "Edit Profile" : "Profile Information"}
          </h1>
          <p className="text-gray-600">
            {isEditing ? "Update your personal information" : "View and manage your profile details"}
          </p>
        </div>

        {!isEditing ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-700"></div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">👤</span> Personal Information
                  </h3>
                  <div className="space-y-4">
                    <InfoField label="Full Name" value={user?.name} />
                    <InfoField label="Email" value={user?.email} />
                    <InfoField label="Phone" value={user?.phone} />
                    <InfoField label="Age" value={user?.age} />
                    <InfoField label="Gender" value={user?.gender} />
                    <InfoField label="Date of Birth" value={user?.dob ? new Date(user.dob).toLocaleDateString() : null} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📝</span> Additional Information
                  </h3>
                  <InfoField label="Bio" value={user?.bio} multiline />
                  
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Addresses</h4>
                    <div className="space-y-3">
                      {user?.addresses?.map((addr, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="font-medium">{addr.line1}</p>
                          <p className="text-sm text-gray-600">
                            {addr.city}, {addr.state} {addr.pincode}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EditProfileForm 
            profile={profile}
            handleInputChange={handleInputChange}
            handleUpdate={handleUpdate}
            setIsEditing={setIsEditing}
            user={user}
            isFirstTime={!isProfileComplete}
          />
        )}
      </div>
    </div>
  );

  const SecurityScreen = () => (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold mb-6">Security Settings</h2>
          <div className="space-y-6">
            <PasswordChangeForm onPasswordChange={handleChangePassword} />
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Security Options</h3>
              <div className="space-y-4">
                <SecurityOption 
                  icon="📱"
                  title="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                  status="Coming Soon"
                />
                <SecurityOption 
                  icon="📧"
                  title="Login Alerts"
                  description="Get notified of new sign-ins"
                  status="Coming Soon"
                />
                <SecurityOption 
                  icon="🔐"
                  title="Session Management"
                  description="Manage your active sessions"
                  status="Coming Soon"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
          <div className="space-y-6">
            <SettingsOption 
              icon="🌙"
              title="Dark Mode"
              description="Switch between light and dark themes"
              status="Coming Soon"
            />
            <SettingsOption 
              icon="🔔"
              title="Notifications"
              description="Manage your notification preferences"
              status="Coming Soon"
            />
            <SettingsOption 
              icon="🌍"
              title="Language & Region"
              description="Set your preferred language and region"
              status="Coming Soon"
            />
            <SettingsOption 
              icon="👥"
              title="Privacy Settings"
              description="Control your privacy and visibility"
              status="Coming Soon"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "welcome":
        return <WelcomeScreen />;
      case "profile":
        return <ProfileScreen />;
      case "security":
        return <SecurityScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">User not found. Please login again.</p>
          <button 
            onClick={logout}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-center px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MyApp</h1>
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-3 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:shadow-xl transition-all"
            >
              <img
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <span className="font-medium text-gray-700">{user?.name || "User"}</span>
              <span className={`transform transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("security");
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <span>🔒</span>
                  <span>Security</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
                <div className="border-t my-1"></div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="px-8 pt-4">
        {message && <Message type="success" message={message} />}
        {error && <Message type="error" message={error} />}
      </div>

      {/* Content Area */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal 
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          deleteOtpSent={deleteOtpSent}
          deleteOtp={deleteOtp}
          setDeleteOtp={setDeleteOtp}
          onRequestDeletion={handleRequestAccountDeletion}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
};

// Reusable Components
const Message = ({ type, message }) => (
  <div className={`p-4 rounded-lg mb-4 flex items-center ${
    type === 'success' 
      ? 'bg-green-50 border border-green-200 text-green-700'
      : 'bg-red-50 border border-red-200 text-red-700'
  }`}>
    <span className="mr-2">{type === 'success' ? '✅' : '⚠️'}</span>
    {message}
  </div>
);

const InfoField = ({ label, value, multiline = false }) => (
  <div className="border-b border-gray-100 pb-3">
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    {multiline ? (
      <p className="text-gray-900 whitespace-pre-wrap">{value || "Not provided"}</p>
    ) : (
      <p className="text-gray-900">{value || "Not provided"}</p>
    )}
  </div>
);

const EditProfileForm = React.memo(({ profile, handleInputChange, handleUpdate, setIsEditing, user, isFirstTime }) => {
  // Use local state for inputs to prevent stuttering
  const [localProfile, setLocalProfile] = React.useState(profile);

  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleLocalChange = (field, value) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
    // Debounce the parent update
    setTimeout(() => handleInputChange(field, value), 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUpdate(e);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-700"></div>
      <div className="p-8">
        {isFirstTime && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-blue-600 text-lg mr-2">ℹ️</span>
              <p className="text-blue-700">Please complete your profile to get started with MyApp.</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={localProfile.name}
                onChange={(e) => handleLocalChange("name", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
              <input
                type="number"
                placeholder="Enter your age"
                value={localProfile.age}
                onChange={(e) => handleLocalChange("age", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={localProfile.gender}
                onChange={(e) => handleLocalChange("gender", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                value={localProfile.dob}
                onChange={(e) => handleLocalChange("dob", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Profile Image</h3>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={localProfile.profileImage}
                onChange={(e) => handleLocalChange("profileImage", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Bio</h3>
              <textarea
                placeholder="Tell us about yourself..."
                value={localProfile.bio}
                onChange={(e) => handleLocalChange("bio", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t">
          <button
            type="submit"
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-all duration-300"
          >
            {isFirstTime ? "Complete Profile" : "Save Changes"}
          </button>
          {!isFirstTime && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setLocalProfile(user);
              }}
              className="flex-1 py-3 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
});

const PasswordChangeForm = ({ onPasswordChange }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onPasswordChange(currentPassword, newPassword, confirmPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && <Message type="success" message={message} />}
      {error && <Message type="error" message={error} />}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
          <input
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-all duration-300"
      >
        Update Password
      </button>
    </form>
  );
};

const SecurityOption = ({ icon, title, description, status }) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
      {status}
    </span>
  </div>
);

const SettingsOption = ({ icon, title, description, status }) => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
      {status}
    </span>
  </div>
);

const DeleteModal = ({ showDeleteModal, setShowDeleteModal, deleteOtpSent, deleteOtp, setDeleteOtp, onRequestDeletion, onDeleteAccount }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-md w-full p-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
        <p className="text-gray-600 mb-6">
          {deleteOtpSent 
            ? "An OTP has been sent to your registered email/phone. Please enter it to confirm account deletion." 
            : "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
          }
        </p>
        {deleteOtpSent && (
          <input
            type="text"
            placeholder="Enter OTP"
            value={deleteOtp}
            onChange={(e) => setDeleteOtp(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-center mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        )}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteOtp("");
            }}
            className="flex-1 py-3 px-4 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={deleteOtpSent ? onDeleteAccount : onRequestDeletion}
            className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            disabled={deleteOtpSent && !deleteOtp}
          >
            {deleteOtpSent ? "Confirm Deletion" : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileDashboard;