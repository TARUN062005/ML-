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
        // Use the API instance. The interceptor will handle the header.
        const [userRes, otherRes] = await Promise.all([
          API.get("/user/me").catch(() => null),
          API.get("/other/me").catch(() => null),
        ]);

        if (userRes?.data) {
          console.log('✅ Auth verified:', userRes.data);
          setUser(userRes.data.user);
        } else if (otherRes?.data) {
          console.log('✅ Auth verified:', otherRes.data);
          setUser(otherRes.data.user);
        } else {
          console.log('❌ Auth failed: No user data received.');
          logout();
        }
      } catch (error) {
        // The response interceptor already handles 401 errors,
        // so we just log other potential errors here.
        console.error("❌ Failed to fetch user profile:", error.message);
        // Do not call logout here, as the interceptor already handles it.
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  const authContextValue = { user, token, loading, login, logout, API };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f9f9",
        color: "#333",
        fontFamily: "sans-serif",
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #ddd",
          borderTop: "4px solid #007bff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }} />
        <p>Loading...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
