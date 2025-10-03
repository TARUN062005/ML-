import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../main.jsx";
import { useNavigate } from "react-router-dom";

const SecurityPage = ({ user, onMessage, onError }) => {
  const { API, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const userType = user?.role?.toLowerCase() === 'other_user' ? 'other' : 'user';

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Account Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRequiresOtp, setDeleteRequiresOtp] = useState(false);

  // Linked Accounts State
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [linkingAccount, setLinkingAccount] = useState(false);
  const [linkOtp, setLinkOtp] = useState("");
  const [linkIdentifier, setLinkIdentifier] = useState("");
  const [linkRequiresOtp, setLinkRequiresOtp] = useState(false);
  const [linkedAccountId, setLinkedAccountId] = useState(null);

  // Utility function to detect identifier type
  const detectIdentifierType = (identifier) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    
    const cleanIdentifier = identifier.trim();
    
    if (emailRegex.test(cleanIdentifier)) {
      return { type: 'email', value: cleanIdentifier };
    } else if (phoneRegex.test(cleanIdentifier.replace(/\D/g, ''))) {
      return { type: 'phone', value: cleanIdentifier.replace(/\D/g, '') };
    } else {
      return { type: 'invalid', value: cleanIdentifier };
    }
  };

  // Resend Timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [resendTimer]);

  // Load linked accounts
  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await API.get("/user/linked-accounts");
      setLinkedAccounts(response.data.linkedAccounts || []);
    } catch (error) {
      console.error("Failed to fetch linked accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Password Change Functions
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

  // Account Deletion Functions
  const handleRequestAccountDeletion = async () => {
    setDeleteLoading(true);
    try {
      const response = await API.post("/user/request-deletion");
      if (response.data.success) {
        setDeleteRequiresOtp(true);
        onMessage("OTP sent for account deletion verification.");
      } else {
        onError("Failed to initiate account deletion.");
      }
    } catch (error) {
      onError(error.response?.data?.message || "Failed to request account deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteOtp) {
      onError("Please enter the verification OTP.");
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await API.delete("/user/account", {
        data: { otp: deleteOtp }
      });

      if (response.data.success) {
        onMessage("Account deleted successfully. Goodbye! 👋");
        setTimeout(() => {
          logout();
          navigate("/");
        }, 2000);
      } else {
        onError(response.data.message || "Failed to delete account.");
      }
    } catch (error) {
      onError(error.response?.data?.message || "Failed to delete account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Linked Account Functions
  const handleRemoveLinkedAccount = async (linkedAccountId) => {
    if (!window.confirm("Are you sure you want to remove this linked account?")) {
      return;
    }

    try {
      const response = await API.delete(`/user/linked-accounts/${linkedAccountId}`);
      if (response.data.success) {
        onMessage("Linked account removed successfully.");
        fetchLinkedAccounts(); // Refresh the list
      } else {
        onError("Failed to remove linked account.");
      }
    } catch (error) {
      onError(error.response?.data?.message || "Failed to remove linked account.");
    }
  };

  // Add Account Functions
  const handleStartLinking = async () => {
    if (!linkIdentifier) {
      onError("Please enter either email or phone number.");
      return;
    }

    const { type, value } = detectIdentifierType(linkIdentifier);
    
    if (type === 'invalid') {
      onError("Please enter a valid email address or phone number.");
      return;
    }

    setLinkingAccount(true);

    try {
      const payload = type === 'email' 
        ? { email: value, phone: undefined }
        : { phone: value, email: undefined };

      const response = await API.post("/user/link-account", payload);
      if (response.data.success) {
        setLinkRequiresOtp(true);
        setLinkedAccountId(response.data.linkedAccountId); // Store the ID
        onMessage(`OTP sent to ${value} to verify account linking.`);
      } else {
        onError("Failed to initiate account linking.");
      }
    } catch (error) {
      onError(error.response?.data?.message || "Failed to initiate account linking.");
    } finally {
      setLinkingAccount(false);
    }
  };

  const handleVerifyLinkedAccount = async () => {
    if (!linkOtp) {
      onError("Please enter the verification OTP.");
      return;
    }

    setLinkingAccount(true);
    try {
      const { type, value } = detectIdentifierType(linkIdentifier);
      
      const payload = {
        otp: linkOtp,
        linkedAccountId: linkedAccountId
      };

      // Add email or phone based on type
      if (type === 'email') {
        payload.email = value;
      } else {
        payload.phone = value;
      }

      const response = await API.post("/user/verify-linked-account", payload);

      if (response.data.success) {
        onMessage(`Account linked successfully! ✅`);
        setShowAddAccount(false);
        setLinkOtp("");
        setLinkIdentifier("");
        setLinkRequiresOtp(false);
        setLinkedAccountId(null);
        fetchLinkedAccounts();
      } else {
        onError(response.data.message || "Failed to verify account linking.");
      }
    } catch (error) {
      onError(error.response?.data?.message || "Failed to verify account linking.");
    } finally {
      setLinkingAccount(false);
    }
  };

  const handleCancelLinking = () => {
    setShowAddAccount(false);
    setLinkOtp("");
    setLinkIdentifier("");
    setLinkRequiresOtp(false);
    setLinkedAccountId(null);
  };

  const handleMakePrimary = async (linkedAccountId) => {
    try {
      const response = await API.post("/user/make-account-primary", {
        linkedAccountId
      });

      if (response.data.success) {
        onMessage("Primary account updated successfully!");
        fetchLinkedAccounts(); // Refresh the list
      } else {
        onError("Failed to set account as primary.");
      }
    } catch (error) {
      onError(error.response?.data?.message || "Failed to set account as primary.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("/user/dashboard")}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Security Center
            </h1>
            <p className="text-gray-400 mt-2">
              Manage your account security and connected services
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Security Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Password Change Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
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
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
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
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
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
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
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
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-center text-xl tracking-widest text-white focus:outline-none focus:border-purple-500"
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
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

            {/* Linked Accounts Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Linked Accounts</h2>
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span>+</span>
                  Add Account
                </button>
              </div>

              {showAddAccount && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">Link New Account</h3>

                  {!linkRequiresOtp ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email or Phone Number
                        </label>
                        <input
                          type="text"
                          value={linkIdentifier}
                          onChange={(e) => setLinkIdentifier(e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                          placeholder="Enter email address or phone number"
                          disabled={linkingAccount}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Enter a valid email address or phone number
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleStartLinking}
                          disabled={linkingAccount || !linkIdentifier}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {linkingAccount ? "Sending OTP..." : "Send OTP"}
                        </button>
                        <button
                          onClick={handleCancelLinking}
                          className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-300">
                        Enter the OTP sent to {linkIdentifier} to verify account linking.
                      </p>
                      <input
                        type="text"
                        value={linkOtp}
                        onChange={(e) => setLinkOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-3 text-center text-xl tracking-widest text-white focus:outline-none focus:border-green-500"
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleVerifyLinkedAccount}
                          disabled={linkingAccount || !linkOtp}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {linkingAccount ? "Verifying..." : "Verify & Link"}
                        </button>
                        <button
                          onClick={handleCancelLinking}
                          className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {loadingAccounts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                </div>
              ) : linkedAccounts.length > 0 ? (
                <div className="space-y-4">
                  {linkedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-lg">🔗</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">
                            {account.identifier}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Linked on {new Date(account.createdAt).toLocaleDateString()}
                          </p>
                          {account.isPrimary && (
                            <span className="inline-block mt-1 px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">
                              Primary
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.isPrimary && (
                          <button
                            onClick={() => handleMakePrimary(account.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Make Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveLinkedAccount(account.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-4">🔗</div>
                  <p>No linked accounts</p>
                  <p className="text-sm">Link additional email/phone accounts for backup access</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar with Security Options */}
          <div className="space-y-6">
            {/* Security Status */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Security Status</h3>
              <div className="space-y-3">
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
                <SecurityOption
                  icon="🔗"
                  title="Linked Accounts"
                  description={`${linkedAccounts.length} accounts connected`}
                  status={linkedAccounts.length > 0 ? "Connected" : "None"}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Security Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Password Strength</span>
                  <span className="text-green-400 font-semibold">Strong</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Login</span>
                  <span className="text-gray-300">Just now</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Account Age</span>
                  <span className="text-gray-300">
                    {user?.createdAt ? Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0} days
                  </span>
                </div>
              </div>
            </div>

            {/* Account Deletion */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-red-700/50">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              <p className="text-gray-400 text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  {!deleteRequiresOtp ? (
                    <>
                      <p className="text-yellow-400 text-sm">
                        Are you sure you want to delete your account? This action cannot be undone.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleRequestAccountDeletion}
                          disabled={deleteLoading}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading ? "Processing..." : "Yes, Delete"}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-400 text-sm">
                        Enter the OTP sent to your email/phone to confirm account deletion.
                      </p>
                      <input
                        type="text"
                        value={deleteOtp}
                        onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full bg-gray-700 border border-red-600 rounded-lg px-4 py-2 text-center text-white focus:outline-none focus:border-red-500"
                        placeholder="Enter OTP"
                        maxLength="6"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteRequiresOtp(false);
                            setDeleteOtp("");
                          }}
                          className="flex-1 bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Security Option Component
const SecurityOption = ({ icon, title, description, status }) => (
  <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
    <div className="flex items-center space-x-3">
      <div className="text-xl">{icon}</div>
      <div>
        <h4 className="font-semibold text-white text-sm">{title}</h4>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
    </div>
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
      status === "Active" || status === "Enabled" || status === "Connected"
        ? "bg-green-900 text-green-400" 
        : status === "None"
        ? "bg-yellow-900 text-yellow-400"
        : "bg-gray-700 text-gray-400"
    }`}>
      {status}
    </span>
  </div>
);

export default SecurityPage;