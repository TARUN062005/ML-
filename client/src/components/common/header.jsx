// src/components/common/header.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../main";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 🔹 Styles
  const headerStyle = {
    background: "#ffffff",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    padding: "1rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  const navStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  };

  const linkStyle = {
    textDecoration: "none",
    color: "#374151", // text-gray-700
    fontWeight: 500,
    transition: "color 0.3s ease",
  };

  const linkHover = {
    color: "#2563eb", // blue-600
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    borderRadius: "0.5rem",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "background-color 0.3s ease",
  };

  const primaryButton = {
    ...buttonStyle,
    backgroundColor: "#2563eb",
    color: "#ffffff",
  };

  const logoutButton = {
    ...buttonStyle,
    backgroundColor: "#ef4444", // red-500
    color: "#ffffff",
  };

  return (
    <header style={headerStyle}>
      {/* Logo / Brand */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#2563eb",
        }}
      >
        My App
      </Link>

      {/* Navigation */}
      <nav style={navStyle}>
        {user ? (
          <>
            <Link
              to={user.role === "USER" ? "/user/dashboard" : "/other/dashboard"}
              style={linkStyle}
              onMouseEnter={(e) => (e.target.style.color = linkHover.color)}
              onMouseLeave={(e) => (e.target.style.color = linkStyle.color)}
            >
              Dashboard
            </Link>
            <button onClick={handleLogout} style={logoutButton}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth/user/login" style={primaryButton}>
            Get Started
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
