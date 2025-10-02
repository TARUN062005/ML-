// src/components/common/components/ModalComponents.jsx
import React from "react";

// Delete Account Modal
export const DeleteAccountModal = ({ 
  showModal, 
  onClose, 
  deleteOtpSent, 
  deleteOtp, 
  onOtpChange, 
  onRequestDeletion, 
  onDeleteAccount 
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-700">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-900 bg-opacity-50 mb-4 border border-red-700">
          <span className="text-red-400 text-2xl">⚠️</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Decommission Account</h3>
        <p className="text-gray-400 mb-6">
          {deleteOtpSent 
            ? "Security verification sent to your comms channel. Enter code to confirm decommissioning." 
            : "Initiate account decommissioning? This action is irreversible and all mission data will be permanently erased."
          }
        </p>
        {deleteOtpSent && (
          <input
            type="text"
            placeholder="Enter verification code"
            value={deleteOtp}
            onChange={(e) => onOtpChange(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-center text-white mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors border border-gray-600"
          >
            Abort
          </button>
          <button
            onClick={deleteOtpSent ? onDeleteAccount : onRequestDeletion}
            className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            disabled={deleteOtpSent && !deleteOtp}
          >
            {deleteOtpSent ? "Confirm Decommission" : "Initiate Decommission"}
          </button>
        </div>
      </div>
    </div>
  </div>
);