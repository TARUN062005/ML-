// src/components/common/ProtectedRoutes.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../main";
import './ProtectedRoutes.css'; // New file for component-specific styles

const ProtectedRoutes = ({ allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Initializing Mission Systems...</p>
      </div>
    );
  }

  // Check if a user is authenticated
  if (!user) {
    return <Navigate to="/auth/user/login" replace />;
  }

  // Check if the user's role is allowed for this route
  const isAuthorized = allowedRoles.length === 0 || allowedRoles.includes(user.role);

  if (!isAuthorized) {
    // Redirect unauthorized users to a default dashboard
    return <Navigate to="/user/dashboard" replace />;
  }

  // Render the protected component
  return <Outlet />;
};

export default ProtectedRoutes;