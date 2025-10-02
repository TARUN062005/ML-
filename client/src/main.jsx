// src/main.jsx
import React, { createContext, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import axios from "axios";

// ----------------- Global Authentication Context -----------------
export const AuthContext = createContext();

// Create an Axios instance with a base URL
export const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Function to handle user login and token storage
  const login = (userData, authToken) => {
    console.log('🔐 Login called with:', { user: userData, token: authToken });
    localStorage.setItem("token", authToken);
    localStorage.setItem('user', JSON.stringify(userData)); // Store user data
    setToken(authToken); // This will trigger the useEffect
    setUser(userData);
  };

  // Function to handle user logout and token removal
  const logout = () => {
    console.log("🔒 Logging out: clearing token");
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // Clear user data
    setToken(null);
    setUser(null);
  };

  // Use an interceptor to automatically add the Authorization header
  // to every single request. This is the key fix.
  useEffect(() => {
    // Add a request interceptor
    const requestInterceptor = API.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem("token");
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add a response interceptor to handle 401 Unauthorized errors globally
    const responseInterceptor = API.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log("Caught 401 Unauthorized, automatically logging out.");
          logout();
        }
        return Promise.reject(error);
      }
    );
  
    // Cleanup interceptors on component unmount
    return () => {
      API.interceptors.request.eject(requestInterceptor);
      API.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect to fetch user profile on initial load or token change
  useEffect(() => {
    const fetchUserProfile = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      console.log('🔍 Auth check:', { token: storedToken, userData: storedUser });
      
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Try to get user info using the stored user data first
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('✅ Using stored user data:', userData);
            setUser(userData);
            setLoading(false);
            return; // Exit early if we have stored user data
          } catch (parseError) {
            console.error('❌ Error parsing stored user data:', parseError);
          }
        }

        // If no stored user data, try to fetch from /user/me endpoint
        console.log('🔄 Attempting to fetch user profile from /user/me');
        const userRes = await API.get("/user/me").catch((error) => {
          console.log('⚠️ /user/me endpoint not available:', error.message);
          return null;
        });

        if (userRes?.data) {
          console.log('✅ Auth verified via /user/me:', userRes.data);
          const userData = userRes.data.user || userRes.data;
          setUser(userData);
          // Update localStorage with fresh user data
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.log('ℹ️ No user data from /user/me, but token is valid');
          // Token is valid but no user endpoint - create minimal user object
          const minimalUser = { 
            role: 'USER', 
            email: 'user@example.com',
            name: 'User'
          };
          setUser(minimalUser);
          localStorage.setItem('user', JSON.stringify(minimalUser));
        }
      } catch (error) {
        console.error("❌ Failed to fetch user profile:", error.message);
        // Don't logout immediately for network errors
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (parseError) {
            console.error('❌ Error parsing stored user data:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  const authContextValue = { user, token, loading, login, logout, API };

  // NASA-themed loading screen
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a2a 0%, #1a237e 50%, #311b92 100%)",
        color: "#ffffff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Animated stars background */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: `
            radial-gradient(1px 1px at 20px 30px, #eee, transparent),
            radial-gradient(1px 1px at 40px 70px, #fff, transparent),
            radial-gradient(0.5px 0.5px at 90px 40px, #fff, transparent)
          `,
          backgroundSize: "200px 200px",
          animation: "twinkle 3s infinite ease-in-out",
        }}></div>
        
        {/* Rotating planet loader */}
        <div style={{
          width: "80px",
          height: "80px",
          background: "linear-gradient(45deg, #ff6d00, #ffab00, #ff6d00)",
          borderRadius: "50%",
          marginBottom: "2rem",
          position: "relative",
          boxShadow: "0 0 30px rgba(255, 109, 0, 0.5)",
          animation: "planetRotate 2s infinite linear",
        }}>
          {/* Planet craters */}
          <div style={{
            position: "absolute",
            width: "15px",
            height: "15px",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "50%",
            top: "20px",
            left: "20px",
          }}></div>
          <div style={{
            position: "absolute",
            width: "10px",
            height: "10px",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "50%",
            top: "50px",
            left: "50px",
          }}></div>
        </div>
        
        <p style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          background: "linear-gradient(45deg, #ffffff, #448aff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "1rem",
        }}>
          Initializing Mission Control...
        </p>
        
        <p style={{
          fontSize: "0.9rem",
          opacity: 0.7,
          textAlign: "center",
          maxWidth: "300px",
        }}>
          Loading celestial navigation systems
        </p>

        <style>
          {`
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.8; }
            }
            @keyframes planetRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Root component for the application
const Root = () => (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);