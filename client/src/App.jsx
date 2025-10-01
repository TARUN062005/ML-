import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./main.jsx";

// Common components
import Header from "./components/common/header";
import LandingPage from "./components/common/landingPage";
import AuthPage from "./components/common/AuthPage.jsx";
import ProtectedRoutes from "./components/common/ProtectedRoutes.jsx";

// Dashboards
import UserDashboard from "./components/user/userDashboard.jsx";
import OtherDashboard from "./components/other/otherDashboard.jsx";

const App = () => {
  const { user } = useContext(AuthContext);

  const appContainerStyle = {
    minHeight: "100vh",
    backgroundColor: "#f9fafb", // softer background
    color: "#1f2937",
    fontFamily: "sans-serif",
  };

  const mainContentStyle = {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const notFoundStyle = {
    textAlign: "center",
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginTop: "2rem",
  };

  return (
    <div style={appContainerStyle}>
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

          {/* 404 Fallback */}
          <Route
            path="*"
            element={<h1 style={notFoundStyle}>404 - Page Not Found</h1>}
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
