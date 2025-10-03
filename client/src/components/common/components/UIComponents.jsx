import React, { useState } from "react";

// Planet Loading Component
export const PlanetLoading = ({ size = 60, color = "#0f5c6e" }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className="relative rounded-full animate-spin"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}40)`,
          boxShadow: `
            inset 0 0 20px ${color}80,
            0 0 20px ${color}40,
            ${size/6}px ${size/6}px 0 ${color}20,
            -${size/6}px -${size/6}px 0 ${color}20
          `
        }}
      >
        {/* Planet rings */}
        <div
          className="absolute border-2 border-transparent border-t-current rounded-full animate-pulse"
          style={{
            width: size * 1.5,
            height: size * 0.3,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(20deg)',
            color: `${color}80`
          }}
        />
        <div
          className="absolute border-2 border-transparent border-t-current rounded-full animate-pulse"
          style={{
            width: size * 1.2,
            height: size * 0.2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            color: `${color}60`,
            animationDelay: '0.5s'
          }}
        />
      </div>
    </div>
  );
};

// Message Component
export const Message = ({ type, message }) => (
  <div className={`p-4 rounded-lg mb-4 flex items-center ${
    type === 'success' 
      ? 'bg-green-900 bg-opacity-50 border border-green-700 text-green-300'
      : 'bg-red-900 bg-opacity-50 border border-red-700 text-red-300'
  }`}>
    <span className="mr-2">{type === 'success' ? '✅' : '⚠️'}</span>
    {message}
  </div>
);

// Loading Screen with Planet Animation
export const LoadingScreen = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900" style={{ 
    background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)" 
  }}>
    <div className="text-center">
      <PlanetLoading size={80} color="#0f5c6e" />
      <p className="text-lg text-gray-300 mt-4">{message}</p>
    </div>
  </div>
);

// Info Field Component
export const InfoField = ({ label, value, multiline = false }) => (
  <div className="border-b border-gray-700 pb-3">
    <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
    {multiline ? (
      <p className="text-white whitespace-pre-wrap">{value || "Not provided"}</p>
    ) : (
      <p className="text-white">{value || "Not provided"}</p>
    )}
  </div>
);

// Edit Profile Form Component
export const EditProfileForm = React.memo(({ profile, onInputChange, onSubmit, onCancel, user, isFirstTime, loading = false }) => {
  const [localProfile, setLocalProfile] = React.useState(profile);

  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleLocalChange = (field, value) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
    setTimeout(() => onInputChange(field, value), 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="h-2 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
      <div className="p-8">
        {isFirstTime && (
          <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-blue-400 text-lg mr-2">🛰️</span>
              <p className="text-blue-300">Complete your mission profile to access all ExoDiscover AI features.</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Mission Parameters</h3>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Astronaut Name *</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={localProfile.name}
                onChange={(e) => handleLocalChange("name", e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Mission Age</label>
              <input
                type="number"
                placeholder="Enter your age"
                value={localProfile.age}
                onChange={(e) => handleLocalChange("age", e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
              <select
                value={localProfile.gender}
                onChange={(e) => handleLocalChange("gender", e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="" className="bg-gray-700">Select Gender</option>
                <option value="MALE" className="bg-gray-700">Male</option>
                <option value="FEMALE" className="bg-gray-700">Female</option>
                <option value="OTHER" className="bg-gray-700">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Launch Date</label>
              <input
                type="date"
                value={localProfile.dob}
                onChange={(e) => handleLocalChange("dob", e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Mission Badge</h3>
              <input
                type="url"
                placeholder="https://example.com/astronaut-image.jpg"
                value={localProfile.profileImage}
                onChange={(e) => handleLocalChange("profileImage", e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Mission Log</h3>
              <textarea
                placeholder="Describe your space exploration experience..."
                value={localProfile.bio}
                onChange={(e) => handleLocalChange("bio", e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg h-32 resize-none text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-700">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <PlanetLoading size={20} color="#ffffff" />
                Processing...
              </>
            ) : isFirstTime ? (
              "Launch Mission"
            ) : (
              "Update Mission Parameters"
            )}
          </button>
          {!isFirstTime && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors border border-gray-600 disabled:opacity-50"
            >
              Abort Changes
            </button>
          )}
        </div>
      </div>
    </form>
  );
});

// Password Change Form Component
export const PasswordChangeForm = ({ onPasswordChange, onPasswordChangeWithOtp }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      if (!requiresOtp) {
        // First step: Request OTP
        const result = await onPasswordChange(currentPassword, newPassword, confirmPassword);
        if (result && result.requiresOtp) {
          setRequiresOtp(true);
          setMessage("OTP sent successfully. Please enter the OTP to complete password change.");
        }
      } else {
        // Second step: Submit with OTP
        const success = await onPasswordChangeWithOtp(currentPassword, newPassword, confirmPassword, otp);
        if (success) {
          // Reset form on success
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setOtp('');
          setRequiresOtp(false);
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setRequiresOtp(false);
    setMessage('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && <Message type="success" message={message} />}
      {error && <Message type="error" message={error} />}
      
      <div className="space-y-4">
        {!requiresOtp ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Current Security Code</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">New Security Code</label>
              <input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Security Code</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Verification Code</label>
            <input
              type="text"
              placeholder="Enter OTP sent to your email/phone"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength="6"
              required
              disabled={loading}
            />
            <p className="text-sm text-gray-400 mt-2">
              Enter the 6-digit code sent to your registered contact method.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <PlanetLoading size={20} color="#ffffff" />
              Processing...
            </>
          ) : requiresOtp ? (
            "Verify and Change Password"
          ) : (
            "Request OTP to Change Password"
          )}
        </button>
        
        {requiresOtp && (
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-3 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors border border-gray-600"
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

// Security Option Component
export const SecurityOption = ({ icon, title, description, status }) => (
  <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:border-blue-400 transition-colors bg-gray-700">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
    <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm font-medium">
      {status}
    </span>
  </div>
);