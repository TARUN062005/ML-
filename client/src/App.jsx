// src/App.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./main.jsx";

// Common components
import Header from "./components/common/header";
import LandingPage from "./components/common/landingPage";
import AuthPage from "./components/common/authPage.jsx"; // Fixed typo here
import ProtectedRoutes from "./components/common/ProtectedRoutes.jsx";
import NotFoundPage from "./components/common/NotFoundPage.jsx";

// Dashboards
import UserDashboard from "./components/user/userDashboard.jsx";
import OtherDashboard from "./components/other/otherDashboard.jsx";

const App = () => {
  const { user } = useContext(AuthContext);

  const appContainerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
    color: "#ffffff",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
  };

  const starsStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: `
      radial-gradient(1px 1px at 20px 30px, #eee, transparent),
      radial-gradient(1px 1px at 40px 70px, #fff, transparent),
      radial-gradient(0.5px 0.5px at 90px 40px, #fff, transparent),
      radial-gradient(0.5px 0.5px at 130px 80px, #fff, transparent)
    `,
    backgroundSize: "200px 200px",
    animation: "twinkle 8s infinite ease-in-out",
    pointerEvents: "none",
    zIndex: 0,
  };

  const mainContentStyle = {
    position: "relative",
    zIndex: 1,
    minHeight: "calc(100vh - 80px)",
  };

  return (
    <div style={appContainerStyle}>
      <div style={starsStyle}></div>
      <Header />
      <main style={mainContentStyle}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth (Login/Register) */}
          <Route
            path="/auth/:userType/:mode"
            element={
              user ? (
                // Redirect logged-in users to dashboard
                <Navigate
                  to={
                    user.role === "USER"
                      ? "/user/dashboard"
                      : "/other/dashboard"
                  }
                  replace
                />
              ) : (
                <AuthPage />
              )
            }
          />

          {/* Protected: USER */}
          <Route element={<ProtectedRoutes allowedRoles={["USER"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/profile" element={<UserDashboard />} />
          </Route>

          {/* Protected: OTHER */}
          <Route element={<ProtectedRoutes allowedRoles={["OTHER"]} />}>
            <Route path="/other/dashboard" element={<OtherDashboard />} />
            <Route path="/other/profile" element={<OtherDashboard />} />
          </Route>

          {/* 404 Fallback - NASA Themed */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global Styles */}
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            overflow-x: hidden;
          }
          
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>
    </div>
  );
};

export default App;