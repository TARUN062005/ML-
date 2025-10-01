// src/components/common/landingPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "85vh",
    textAlign: "center",
    padding: "2rem",
    background: "linear-gradient(to right, #e0f2fe, #f3e8ff)", // soft gradient
  };

  const contentStyle = {
    maxWidth: "650px",
    backgroundColor: "#ffffff",
    padding: "2.5rem",
    borderRadius: "1rem",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  };

  const titleStyle = {
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "#1f2937", // gray-800
    marginBottom: "1rem",
  };

  const subtitleStyle = {
    fontSize: "1.2rem",
    color: "#4b5563", // gray-600
    marginBottom: "2rem",
    lineHeight: "1.6",
  };

  const buttonGroupStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  };

  const buttonStyle = {
    padding: "0.75rem 2rem",
    borderRadius: "0.5rem",
    textDecoration: "none",
    fontWeight: "600",
    transition: "all 0.3s ease",
  };

  const primaryButton = {
    ...buttonStyle,
    backgroundColor: "#2563eb", // blue-600
    color: "white",
  };

  const secondaryButton = {
    ...buttonStyle,
    backgroundColor: "#e5e7eb", // gray-200
    color: "#374151", // gray-700
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Welcome to My App</h1>
        <p style={subtitleStyle}>
          A simple and secure platform to manage your profile and dashboard.
          Sign in to get started!
        </p>

        <div style={buttonGroupStyle}>
          <Link
            to="/auth/user/signin"
            style={primaryButton}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#1e40af")} // darker blue
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#2563eb")}
          >
            Get Started
          </Link>
          <Link
            to="/auth/other/signin"
            style={secondaryButton}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#d1d5db")} // darker gray
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#e5e7eb")}
          >
            Sign in as Other
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
