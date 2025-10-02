// src/components/common/ProtectedRoutes.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../main";

const ProtectedRoutes = ({ allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ color: '#e3f2fd', marginTop: '1rem' }}>Initializing Mission Systems...</p>
      </div>
    );
  }

  // Only user role now
  const routeToUserRoleMap = {
    'user': 'USER'
  };

  // Convert allowedRoles (from routes) to actual user roles
  const mappedAllowedRoles = allowedRoles.map(role => routeToUserRoleMap[role] || role);

  const isAuthorized =
    user && (mappedAllowedRoles.length === 0 || mappedAllowedRoles.includes(user.role));

  if (!user) {
    return <Navigate to="/auth/user/login" replace />;
  }

  if (!isAuthorized) {
    // Redirect to user dashboard
    return <Navigate to="/user/dashboard" replace />;
  }

  return <Outlet />;
};

// NASA-themed loading styles
const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
  color: "#ffffff",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const spinnerStyle = {
  width: "60px",
  height: "60px",
  border: "4px solid rgba(255, 255, 255, 0.3)",
  borderTop: "4px solid #0f5c6e",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

// Add CSS animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default ProtectedRoutes;