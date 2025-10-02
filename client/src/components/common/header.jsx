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

  // NASA-inspired styles
  const headerStyle = {
    background: "linear-gradient(135deg, #0b3d91 0%, #1a237e 100%)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    padding: "1rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    borderBottom: "2px solid #ff6d00",
  };

  const navStyle = {
    display: "flex",
    alignItems: "center",
    gap: "2rem",
  };

  const linkStyle = {
    textDecoration: "none",
    color: "#e3f2fd",
    fontWeight: 500,
    fontSize: "1rem",
    transition: "all 0.3s ease",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "all 0.3s ease",
    fontSize: "0.9rem",
  };

  const primaryButton = {
    ...buttonStyle,
    background: "linear-gradient(45deg, #ff6d00, #ff9100)",
    color: "#ffffff",
    boxShadow: "0 2px 10px rgba(255, 109, 0, 0.3)",
  };

  const logoutButton = {
    ...buttonStyle,
    background: "linear-gradient(45deg, #d32f2f, #f44336)",
    color: "#ffffff",
    boxShadow: "0 2px 10px rgba(211, 47, 47, 0.3)",
  };

  const userInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    color: "#e3f2fd",
    fontSize: "0.9rem",
  };

  return (
    <header style={headerStyle}>
      {/* NASA-themed Logo */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div style={{
          width: "40px",
          height: "40px",
          background: "linear-gradient(45deg, #ff6d00, #ffab00)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "1.2rem",
          boxShadow: "0 0 15px rgba(255, 109, 0, 0.5)"
        }}>
          🌌
        </div>
        <span style={{
          fontSize: "1.4rem",
          fontWeight: "bold",
          background: "linear-gradient(45deg, #ffffff, #e3f2fd)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          ExoDiscover
        </span>
      </Link>

      {/* Navigation */}
      <nav style={navStyle}>
        {user ? (
          <>
            <div style={userInfoStyle}>
              <span>Welcome, {user.name || user.email}</span>
              <span style={{ opacity: 0.7 }}>|</span>
              <span style={{ 
                background: "rgba(255, 255, 255, 0.1)",
                padding: "0.25rem 0.75rem",
                borderRadius: "12px",
                fontSize: "0.8rem"
              }}>
                {user.role}
              </span>
            </div>
            <Link
              to={user.role === "USER" ? "/user/dashboard" : "/other/dashboard"}
              style={linkStyle}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.1)";
                e.target.style.color = "#ffab00";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#e3f2fd";
              }}
            >
              Mission Control
            </Link>
            <button 
              onClick={handleLogout} 
              style={logoutButton}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              Logout
            </button>
          </>
        ) : (
          <Link 
            to="/auth/user/login" 
            style={primaryButton}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 15px rgba(255, 109, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 10px rgba(255, 109, 0, 0.3)";
            }}
          >
            Launch Mission
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;