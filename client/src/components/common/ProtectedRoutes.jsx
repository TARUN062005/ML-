import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../main";

const ProtectedRoutes = ({ allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={spinnerStyle}></div>
        <p>Checking access...</p>
      </div>
    );
  }

  // Map route roles to actual user roles
  const routeToUserRoleMap = {
    'user': 'USER',
    'other': 'OTHER_USER'
  };

  // Convert allowedRoles (from routes) to actual user roles
  const mappedAllowedRoles = allowedRoles.map(role => routeToUserRoleMap[role] || role);

  const isAuthorized =
    user && (mappedAllowedRoles.length === 0 || mappedAllowedRoles.includes(user.role));

  if (!user) {
    return <Navigate to="/auth/user/login" replace />;
  }

  if (!isAuthorized) {
    // Redirect to appropriate dashboard based on user role
    const userRoleRoute = user.role === 'OTHER_USER' ? 'other' : 'user';
    return <Navigate to={`/auth/${userRoleRoute}/dashboard`} replace />;
  }

  return <Outlet />;
};

// Styles remain the same...
const loadingStyle = {
  minHeight: "80vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#374151",
  fontFamily: "sans-serif",
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #ddd",
  borderTop: "4px solid #2563eb",
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