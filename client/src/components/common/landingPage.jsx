// src/components/common/landingPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  // NASA-inspired styles
  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Animated stars background
  const starsStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: `
      radial-gradient(2px 2px at 20px 30px, #eee, transparent),
      radial-gradient(2px 2px at 40px 70px, #fff, transparent),
      radial-gradient(1px 1px at 90px 40px, #fff, transparent),
      radial-gradient(1px 1px at 130px 80px, #fff, transparent),
      radial-gradient(2px 2px at 160px 30px, #eee, transparent)
    `,
    backgroundSize: "200px 200px",
    animation: "twinkle 8s infinite linear",
  };

  // Floating planets animation
  const planetsStyle = {
    position: "absolute",
    width: "100%",
    height: "100%",
  };

  const planet1Style = {
    position: "absolute",
    top: "20%",
    left: "10%",
    width: "80px",
    height: "80px",
    background: "linear-gradient(45deg, #ff6d00, #ffab00)",
    borderRadius: "50%",
    boxShadow: "0 0 30px rgba(255, 109, 0, 0.5)",
    animation: "float 20s infinite ease-in-out",
  };

  const planet2Style = {
    position: "absolute",
    bottom: "15%",
    right: "15%",
    width: "120px",
    height: "120px",
    background: "linear-gradient(45deg, #2962ff, #448aff)",
    borderRadius: "50%",
    boxShadow: "0 0 40px rgba(41, 98, 255, 0.5)",
    animation: "float 25s infinite ease-in-out reverse",
  };

  const contentStyle = {
    maxWidth: "800px",
    background: "rgba(13, 19, 33, 0.85)",
    backdropFilter: "blur(10px)",
    padding: "3rem",
    borderRadius: "20px",
    boxShadow: `
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 100px rgba(41, 98, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    textAlign: "center",
    position: "relative",
    zIndex: 2,
  };

  const titleStyle = {
    fontSize: "3.5rem",
    fontWeight: "bold",
    background: "linear-gradient(45deg, #ffffff, #448aff, #ff6d00)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "1rem",
    textShadow: "0 0 30px rgba(68, 138, 255, 0.3)",
  };

  const subtitleStyle = {
    fontSize: "1.3rem",
    color: "#e3f2fd",
    marginBottom: "2.5rem",
    lineHeight: "1.6",
    opacity: 0.9,
  };

  const featureGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  };

  const featureStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "all 0.3s ease",
  };

  const featureIconStyle = {
    fontSize: "2rem",
    marginBottom: "1rem",
    display: "block",
  };

  const buttonGroupStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  };

  const buttonStyle = {
    padding: "1rem 2.5rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "1.1rem",
    transition: "all 0.3s ease",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const primaryButton = {
    ...buttonStyle,
    background: "linear-gradient(45deg, #ff6d00, #ff9100)",
    color: "white",
    boxShadow: "0 4px 20px rgba(255, 109, 0, 0.3)",
  };

  const secondaryButton = {
    ...buttonStyle,
    background: "rgba(255, 255, 255, 0.1)",
    color: "#e3f2fd",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  };

  return (
    <div style={containerStyle}>
      {/* Animated Background Elements */}
      <div style={starsStyle}></div>
      <div style={planetsStyle}>
        <div style={planet1Style}></div>
        <div style={planet2Style}></div>
      </div>

      <div style={contentStyle}>
        <h1 style={titleStyle}>ExoDiscover</h1>
        <p style={subtitleStyle}>
          Harness the power of artificial intelligence to explore the cosmos and 
          discover new exoplanets hidden within NASA's Kepler, K2, and TESS mission data.
        </p>

        <div style={featureGridStyle}>
          <div style={featureStyle}>
            <span style={featureIconStyle}>🛰️</span>
            <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>NASA Data</h3>
            <p style={{ color: "#e3f2fd", fontSize: "0.9rem", opacity: 0.8 }}>
              Trained on verified datasets from Kepler, K2, and TESS missions
            </p>
          </div>
          <div style={featureStyle}>
            <span style={featureIconStyle}>🤖</span>
            <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>AI Powered</h3>
            <p style={{ color: "#e3f2fd", fontSize: "0.9rem", opacity: 0.8 }}>
              Advanced machine learning models for accurate exoplanet detection
            </p>
          </div>
          <div style={featureStyle}>
            <span style={featureIconStyle}>🌍</span>
            <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Web Interface</h3>
            <p style={{ color: "#e3f2fd", fontSize: "0.9rem", opacity: 0.8 }}>
              Interactive platform for researchers and astronomy enthusiasts
            </p>
          </div>
        </div>

        <div style={buttonGroupStyle}>
          <Link
            to="/auth/user/login"
            style={primaryButton}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 8px 25px rgba(255, 109, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 20px rgba(255, 109, 0, 0.3)";
            }}
          >
            🚀 Launch Mission
          </Link>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-20px) rotate(120deg); }
            66% { transform: translateY(10px) rotate(240deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;