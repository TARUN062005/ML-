// src/components/common/ProfilePage.jsx
import React, { useState, useContext } from "react";
import { AuthContext, API } from "../../main.jsx";
import { EditProfileForm, InfoField } from "./components/UIComponents.jsx";
import { DeleteAccountModal } from "./components/ModalComponents.jsx";

const ProfilePage = ({ user, needsProfileCompletion, onMessage, onError, onProfileComplete }) => {
  const { logout, API: contextAPI } = useContext(AuthContext);
  const API = contextAPI || API;
  
  const userType = user?.role?.toLowerCase() === 'other_user' ? 'other' : 'user';
  
  const [profile, setProfile] = useState({ 
    name: user?.name || "", 
    age: user?.age || "", 
    gender: user?.gender || "", 
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : "", 
    bio: user?.bio || "", 
    profileImage: user?.profileImage || "",
    addresses: user?.addresses?.length > 0 
      ? user.addresses 
      : [{ line1: "", line2: "", city: "", state: "", region: "", pincode: "", country: "India" }]
  });
  
  const [isEditing, setIsEditing] = useState(needsProfileCompletion);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    onMessage("");
    onError("");
    setUpdating(true);

    try {
      const payload = { 
        name: profile.name,
        ...(profile.age && { age: parseInt(profile.age) }),
        ...(profile.gender && { gender: profile.gender.toUpperCase() }),
        ...(profile.dob && { dob: new Date(profile.dob).toISOString() }),
        ...(profile.bio && { bio: profile.bio }),
        ...(profile.profileImage && { profileImage: profile.profileImage }),
        addresses: profile.addresses
      };
      
      const res = await API.put(`/${userType}/profile`, payload);
      onMessage("Profile updated successfully! ✅");
      setIsEditing(false);
      
      // If it was first-time setup, redirect to welcome
      if (needsProfileCompletion) {
        setTimeout(() => {
          onProfileComplete();
        }, 1500);
      }
      
    } catch (err) {
      onError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRequestAccountDeletion = async () => {
    onError("");
    onMessage("");
    try {
      const res = await API.post(`/${userType}/request-deletion`);
      onMessage(res.data.message);
      setDeleteOtpSent(true);
    } catch (err) {
      onError(err.response?.data?.message || "Failed to request account deletion.");
    }
  };

  const handleDeleteAccount = async () => {
    onError("");
    onMessage("");
    try {
      const res = await API.delete(`/${userType}/account`, {
        data: { otp: deleteOtp }
      });
      onMessage(res.data.message);
      setShowDeleteModal(false);
      setDeleteOtpSent(false);
      setDeleteOtp("");
      setTimeout(() => logout(), 2000);
    } catch (err) {
      onError(err.response?.data?.message || "Failed to delete account.");
    }
  };

  // Show forced profile completion for first-time users
  if (needsProfileCompletion && !isEditing) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-6xl text-white">👨‍🚀</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Complete Your Mission Profile
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Before you can begin exploring the cosmos, we need to set up your astronaut profile.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
          >
            Start Profile Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {isEditing ? "Mission Profile Setup" : "Astronomer Profile"}
          </h1>
          <p className="text-gray-400">
            {isEditing ? "Configure your mission parameters" : "Your space exploration identity"}
          </p>
        </div>

        {!isEditing ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <span className="mr-2">👨‍🚀</span> Astronomer Information
                  </h3>
                  <div className="space-y-4">
                    <InfoField label="Full Name" value={user?.name} />
                    <InfoField label="Email" value={user?.email} />
                    <InfoField label="Mission Age" value={user?.age} />
                    <InfoField label="Gender" value={user?.gender} />
                    <InfoField label="Launch Date" value={user?.dob ? new Date(user.dob).toLocaleDateString() : null} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <span className="mr-2">📝</span> Mission Log
                  </h3>
                  <InfoField label="Bio" value={user?.bio} multiline />
                  
                  {user?.addresses?.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-white mb-3">Observation Posts</h4>
                      <div className="space-y-3">
                        {user.addresses.map((addr, index) => (
                          <div key={index} className="p-3 border border-gray-700 rounded-lg bg-gray-900">
                            <p className="font-medium text-white">{addr.line1}</p>
                            <p className="text-sm text-gray-400">
                              {addr.city}, {addr.state} {addr.pincode}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Edit Mission Profile
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Decommission Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EditProfileForm 
            profile={profile}
            onInputChange={handleInputChange}
            onSubmit={handleUpdate}
            onCancel={() => !needsProfileCompletion && setIsEditing(false)}
            user={user}
            isFirstTime={needsProfileCompletion}
            loading={updating}
          />
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal 
          showModal={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          deleteOtpSent={deleteOtpSent}
          deleteOtp={deleteOtp}
          onOtpChange={setDeleteOtp}
          onRequestDeletion={handleRequestAccountDeletion}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </div>
  );
};

export default ProfilePage;