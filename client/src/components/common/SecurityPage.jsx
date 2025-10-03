import React, { useState, useContext } from "react";
import { AuthContext } from "../../main.jsx";

const SecurityPage = ({ user, onMessage, onError }) => {
  const { API } = useContext(AuthContext);
  
  const userType = user?.role?.toLowerCase() === 'other_user' ? 'other' : 'user';
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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
        const response = await API.post(`/${userType}/send-otp-for-operation`, {
          operation: 'PASSWORD_CHANGE'
        });

        if (response.data.success) {
          setRequiresOtp(true);
          setResendTimer(180);
          onMessage("OTP sent to your registered email/phone. Please enter the OTP to continue.");
        } else {
          onError("Failed to send OTP. Please try again.");
        }
      } else {
        // Submit password change with OTP
        const response = await API.put(`/${userType}/change-password`, {
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
        } else {
          onError(response.data.message || "Failed to change password.");
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
      const response = await API.post(`/${userType}/send-otp-for-operation`, {
        operation: 'PASSWORD_CHANGE'
      });
      
      if (response.data.success) {
        setResendTimer(180);
        onMessage("New OTP sent successfully!");
      } else {
        onError("Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      onError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Security Systems</h2>
          <div className="space-y-6">
            {/* Password Change Form */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h4 className="font-semibold text-white mb-4">Change Password</h4>
              <form onSubmit={handlePasswordChange} className="space-y-4">
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
                        disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
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
                      disabled={loading}
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
        </div>
      </div>
    </div>
  );
};

// Security Option Component (local version)
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

export default SecurityPage;