// src/components/common/SecurityPage.jsx
import React, { useState, useContext } from "react";
import { AuthContext, API } from "../../main.jsx";
import { PasswordChangeForm, SecurityOption } from "./components/UIComponents.jsx";

const SecurityPage = ({ user, onMessage, onError }) => {
  const { API: contextAPI } = useContext(AuthContext);
  const API = contextAPI || API;
  
  const userType = user?.role?.toLowerCase() === 'other_user' ? 'other' : 'user';

  const handleChangePassword = async (currentPassword, newPassword, confirmPassword) => {
    onMessage("");
    onError("");

    if (newPassword !== confirmPassword) {
      onError("New passwords do not match.");
      return false;
    }

    if (newPassword.length < 6) {
      onError("New password must be at least 6 characters long.");
      return false;
    }

    try {
      // First request OTP for password change
      const otpResponse = await API.post(`/${userType}/send-otp-for-operation`, {
        operation: 'PASSWORD_CHANGE'
      });

      if (otpResponse.data.success) {
        onMessage("OTP sent to your registered email/phone. Please check and enter the OTP to change your password.");
        return { requiresOtp: true };
      } else {
        onError("Failed to send OTP. Please try again.");
        return false;
      }
    } catch (err) {
      onError(err.response?.data?.message || "Failed to initiate password change.");
      return false;
    }
  };

  const handlePasswordChangeWithOtp = async (currentPassword, newPassword, confirmPassword, otp) => {
    try {
      const res = await API.put(`/${userType}/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword,
        otp
      });

      if (res.data.success) {
        onMessage("Password changed successfully! ✅");
        return true;
      } else {
        onError(res.data.message || "Failed to change password.");
        return false;
      }
    } catch (err) {
      onError(err.response?.data?.message || "Failed to change password.");
      return false;
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Security Systems</h2>
          <div className="space-y-6">
            <PasswordChangeForm 
              onPasswordChange={handleChangePassword}
              onPasswordChangeWithOtp={handlePasswordChangeWithOtp}
            />
            
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

export default SecurityPage;