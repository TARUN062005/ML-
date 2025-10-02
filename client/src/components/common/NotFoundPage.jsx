// src/components/common/NotFoundPage.jsx
import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

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
    animation: "twinkle 8s infinite ease-in-out",
  };

  const floatingAstronautStyle = {
    position: "absolute",
    top: "20%",
    right: "15%",
    fontSize: "4rem",
    animation: "float 6s infinite ease-in-out",
  };

  const contentStyle = {
    textAlign: "center",
    color: "white",
    zIndex: 2,
    position: "relative",
    background: "rgba(13, 19, 33, 0.9)",
    padding: "3rem",
    borderRadius: "20px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    maxWidth: "500px",
  };

  const planetStyle = {
    width: "150px",
    height: "150px",
    background: "linear-gradient(45deg, #ff6d00, #ffab00, #ff6d00)",
    borderRadius: "50%",
    margin: "0 auto 2rem",
    position: "relative",
    boxShadow: "0 0 50px rgba(255, 109, 0, 0.5)",
    animation: "rotate 15s infinite linear",
  };

  const craterStyle = {
    position: "absolute",
    background: "rgba(0, 0, 0, 0.3)",
    borderRadius: "50%",
  };

  const titleStyle = {
    fontSize: "3.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    background: "linear-gradient(45deg, #ffffff, #ff6d00)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const subtitleStyle = {
    fontSize: "1.5rem",
    marginBottom: "1rem",
    opacity: 0.9,
    color: "#e3f2fd",
  };

  const messageStyle = {
    fontSize: "1rem",
    marginBottom: "2rem",
    opacity: 0.7,
    lineHeight: "1.5",
    color: "#bbdefb",
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    flexWrap: "wrap",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "600",
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
    boxShadow: "0 4px 15px rgba(255, 109, 0, 0.3)",
  };

  const secondaryButton = {
    ...buttonStyle,
    background: "rgba(255, 255, 255, 0.1)",
    color: "#e3f2fd",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  };

  return (
    <div style={containerStyle}>
      <div style={starsStyle}></div>
      <div style={floatingAstronautStyle}>👨‍🚀</div>
      
      <div style={contentStyle}>
        <div style={planetStyle}>
          <div style={{ ...craterStyle, width: "30px", height: "30px", top: "25px", left: "40px" }}></div>
          <div style={{ ...craterStyle, width: "20px", height: "20px", top: "60px", left: "100px" }}></div>
          <div style={{ ...craterStyle, width: "25px", height: "25px", top: "100px", left: "50px" }}></div>
        </div>
        
        <h1 style={titleStyle}>404</h1>
        <p style={subtitleStyle}>Planet Not Found</p>
        <p style={messageStyle}>
          The celestial coordinates you're searching for don't exist in our star charts. 
          This page may have been moved or never existed.
        </p>
        
        <div style={buttonGroupStyle}>
          <Link
            to="/"
            style={primaryButton}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 8px 25px rgba(255, 109, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(255, 109, 0, 0.3)";
            }}
          >
            🚀 Return to Home Page
          </Link>
          
          <Link
            to="/auth/user/login"
            style={secondaryButton}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.15)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            🔭 Launch Mission
          </Link>
        </div>
      </div>

      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `}
      </style>
    </div>
  );
};

export default NotFoundPage;