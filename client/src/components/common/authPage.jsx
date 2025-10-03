// client/src/components/common/authPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../main.jsx";
import "../../index.css"; // ADD THIS IMPORT

// Mock router hooks for demonstration
const useNavigate = () => {
  return (path, options) => { 
    console.log("NAVIGATE TO:", path, options); 
    window.location.href = path;
  };
};

const useParams = () => { 
  // Extract userType from URL path
  const path = window.location.pathname;
  if (path.includes('/other/')) return { userType: 'other' };
  return { userType: 'user' };
};

// NASA-themed Planet Loading Component
const PlanetLoading = ({ size = 40, color = "#0f5c6e" }) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className="relative rounded-full animate-spin"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 30% 30%, ${color}, ${color}40)`,
          boxShadow: `
            inset 0 0 20px ${color}80,
            0 0 20px ${color}40,
            ${size/6}px ${size/6}px 0 ${color}20,
            -${size/6}px -${size/6}px 0 ${color}20
          `
        }}
      >
        {/* Planet rings */}
        <div
          className="absolute border-2 border-transparent border-t-current rounded-full animate-pulse"
          style={{
            width: size * 1.5,
            height: size * 0.3,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(20deg)',
            color: `${color}80`
          }}
        />
        <div
          className="absolute border-2 border-transparent border-t-current rounded-full animate-pulse"
          style={{
            width: size * 1.2,
            height: size * 0.2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            color: `${color}60`,
            animationDelay: '0.5s'
          }}
        />
      </div>
    </div>
  );
};

// Social buttons with better styling
const SocialButton = ({ provider, onClick, isLoading }) => {
  const getIcon = () => {
    switch(provider) {
      case 'Google':
        return '🔍'; // Magnifying glass for search/exoplanet discovery
      case 'Facebook':
        return '🌌'; // Galaxy
      case 'Twitter':
        return '🚀'; // Rocket
      default:
        return '⭐';
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      disabled={isLoading}
      className="flex items-center justify-center p-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 w-full bg-gray-800 text-white"
    >
      <span className="text-lg mr-2">{getIcon()}</span>
      <span className="text-sm font-medium">Continue with {provider}</span>
    </button>
  );
};

// Password validation function
const validatePassword = (password, confirmPassword) => {
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
};

// Main Auth Component
const AuthPage = () => {
  const { login, API } = useContext(AuthContext);
  const navigate = useNavigate();
  const { userType } = useParams();

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: ""
  });
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpDestination, setOtpDestination] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [userId, setUserId] = useState(null);
  const [otpType, setOtpType] = useState("VERIFICATION");
  const [tempIdentifier, setTempIdentifier] = useState("");
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [currentStep, setCurrentStep] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Reset state on mode change
  useEffect(() => {
    const newStep = showForgotPassword ? "forgot_password" : (isSignupMode ? "input" : "signin");
    setCurrentStep(newStep);

    setFormData({
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      otp: ""
    });
    setMessage("");
    setError("");
    setResendTimer(0);
    setUserId(null);
    setOtpType("VERIFICATION");
    setTempIdentifier("");
  }, [isSignupMode, showForgotPassword]);

  // Auto-clear messages
  useEffect(() => {
    const timers = [];
    if (message) timers.push(setTimeout(() => setMessage(""), 5000));
    if (error) timers.push(setTimeout(() => setError(""), 5000));
    return () => timers.forEach(clearTimeout);
  }, [message, error]);

  // Resend Timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [resendTimer]);

  const handleIdentifierChange = (value) => {
    if (value.includes("@")) {
      setFormData(prev => ({ ...prev, email: value, phone: "" }));
    } else {
      setFormData(prev => ({ ...prev, email: "", phone: value }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    setError("");

    // Email/phone validation
    if (["input", "signin", "forgot_password"].includes(currentStep)) {
      if (!formData.email && !formData.phone) {
        setError("Please enter email or phone number.");
        return false;
      }
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email address.");
        return false;
      }
      if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        setError("Please enter a valid 10-digit phone number.");
        return false;
      }
    }

    // Password validation for set/reset password steps
    if (["set_password", "reset_password"].includes(currentStep)) {
      const passwordError = validatePassword(formData.password, formData.confirmPassword);
      if (passwordError) {
        setError(passwordError);
        return false;
      }
    }

    // OTP validation
    if (currentStep === "otp_verify" && formData.otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return false;
    }

    // Sign in validation
    if (currentStep === "signin" && !formData.password) {
      setError("Please enter your password.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔄 Form submission started", { currentStep, formData });
    
    if (!validateForm()) {
      console.log("❌ Form validation failed");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = "/user";
      console.log("🎯 Using endpoint:", endpoint);
      
      // Forgot Password Flow
      if (showForgotPassword) {
        if (currentStep === "forgot_password") {
          console.log("🔐 Forgot password request");
          const payload = {
            email: formData.email || undefined,
            phone: formData.phone || undefined,
          };
          console.log("📤 Sending payload:", payload);
          
          const response = await API.post(`${endpoint}/forgot-password`, payload);
          const res = response.data;
          
          setMessage("Password reset OTP sent successfully!");
          setOtpDestination(formData.email || formData.phone);
          setOtpType("PASSWORD_RESET");
          setUserId(res.userId || res.data?.userId);
          setTempIdentifier(formData.email || formData.phone);
          setCurrentStep("otp_verify");
          setResendTimer(180);
        } else if (currentStep === "otp_verify" && otpType === "PASSWORD_RESET") {
          console.log("🔐 Verify reset OTP");
          const payload = {
            email: tempIdentifier.includes('@') ? tempIdentifier : undefined,
            phone: !tempIdentifier.includes('@') ? tempIdentifier : undefined,
            otp: formData.otp,
            type: "PASSWORD_RESET",
          };
          console.log("📤 Sending OTP payload:", payload);
          
          await API.post(`${endpoint}/verify-otp`, payload);
          
          setMessage("OTP verified successfully!");
          setCurrentStep("reset_password");
        } else if (currentStep === "reset_password") {
          console.log("🔐 Reset password", { userId, password: formData.password });
          const payload = {
            userId: userId,
            newPassword: formData.password,
            confirmPassword: formData.confirmPassword,
          };
          console.log("📤 Sending reset payload:", payload);
          
          await API.post(`${endpoint}/reset-password`, payload);
          
          setMessage("Password reset successfully!");
          setTimeout(() => {
            setShowForgotPassword(false);
            setIsSignupMode(false);
            setCurrentStep("signin");
          }, 2000);
        }
        return;
      }

      // Sign Up Flow
      if (isSignupMode) {
        if (currentStep === "input") {
          console.log("📝 Registration start");
          const payload = {
            email: formData.email || undefined,
            phone: formData.phone || undefined,
          };
          console.log("📤 Sending registration payload:", payload);
          
          const response = await API.post(`${endpoint}/register`, payload);
          const res = response.data;
          
          setMessage("Verification OTP sent successfully!");
          setOtpDestination(formData.email || formData.phone);
          setOtpType("VERIFICATION");
          setCurrentStep("otp_verify");
          setUserId(res.userId || res.data?.userId);
          setResendTimer(180);
        } else if (currentStep === "otp_verify" && otpType === "VERIFICATION") {
          console.log("📝 Verify registration OTP");
          const payload = {
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            otp: formData.otp,
            type: "VERIFICATION",
          };
          console.log("📤 Sending OTP verification payload:", payload);
          
          const response = await API.post(`${endpoint}/verify-otp`, payload);
          const res = response.data;

          setMessage(res.message);
          setUserId(res.userId);

          if (res.requiresPassword) {
            setCurrentStep("set_password");
          } else {
            // If no password required, complete registration without password
            await handleCompleteRegistration();
          }
        } else if (currentStep === "set_password") {
          console.log("📝 Complete registration with password");
          await handleCompleteRegistration();
        }
      } else {
        // Sign In Flow
        console.log("🔑 Sign in attempt");
        await handleLogin();
      }
    } catch (err) {
      console.error("❌ Auth error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "An unexpected error occurred. Please check if the backend server is running.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    const endpoint = "/user";
    const payload = {
      userId: userId,
    };

    // Only include password if we're in set_password step
    if (currentStep === "set_password") {
      payload.password = formData.password;
      payload.confirmPassword = formData.confirmPassword;
    }

    console.log("📝 Completing registration with payload:", payload);
    
    const response = await API.post(`${endpoint}/complete-registration`, payload);
    const res = response.data;
    
    setMessage(res.message);
    
    if (res.success) {
      // Try to auto-login after successful registration
      await handleAutoLogin();
    }
  };

  const handleLogin = async () => {
    const endpoint = "/user";
    const payload = {
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      password: formData.password,
    };
    
    console.log("🔑 Sending login payload:", payload);
    
    const response = await API.post(`${endpoint}/login`, payload);
    const res = response.data;

    if (res.success && res.token && res.user) {
      login(res.user, res.token);
      
      console.log("🎯 Login successful, navigating to dashboard");
      
      // Navigate to user dashboard
      navigate("/user/dashboard", { replace: true });
    } else {
      setError("Login failed. Please check your credentials.");
    }
  };

  const handleAutoLogin = async () => {
    const endpoint = "/user";
    const identifier = formData.email || formData.phone;
    
    // Only attempt auto-login if we have credentials
    if (!identifier || !formData.password) {
      setMessage("Registration successful! Please sign in with your credentials.");
      setIsSignupMode(false);
      setShowForgotPassword(false);
      setCurrentStep("signin");
      return;
    }

    try {
      const payload = {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
      };
      
      console.log("🔄 Attempting auto-login with:", payload);
      
      const response = await API.post(`${endpoint}/login`, payload);
      const loginRes = response.data;

      if (loginRes.success && loginRes.token && loginRes.user) {
        login(loginRes.user, loginRes.token);
        
        console.log("🎯 Auto-login successful, navigating to dashboard");
        navigate("/user/dashboard", { replace: true });
      }
    } catch (loginErr) {
      console.error("Auto-login failed:", loginErr);
      setMessage("Registration successful! Please sign in with your credentials.");
      setIsSignupMode(false);
      setShowForgotPassword(false);
      setCurrentStep("signin");
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setError("");
    try {
      const endpoint = "/user";
      const identifier = otpDestination || formData.email || formData.phone;

      if (otpType === "PASSWORD_RESET") {
        await API.post(`${endpoint}/forgot-password`, {
          email: identifier.includes('@') ? identifier : undefined,
          phone: !identifier.includes('@') ? identifier : undefined,
        });
        setMessage("New password reset OTP sent!");
      } else if (otpType === "VERIFICATION") {
        await API.post(`${endpoint}/register`, {
          email: identifier.includes('@') ? identifier : undefined,
          phone: !identifier.includes('@') ? identifier : undefined,
        });
        setMessage("New verification OTP sent!");
      }

      setResendTimer(180);
      setFormData(prev => ({ ...prev, otp: "" }));
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to send OTP.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    setError("");
    try {
      setError(`${provider} login is not implemented yet. Please use email/phone login.`);
    } catch (err) {
      setError(`Failed to log in with ${provider}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const maskIdentifier = (identifier) => {
    if (!identifier) return '';
    if (identifier.includes('@')) {
      const [local, domain] = identifier.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    } else if (identifier.length >= 5) {
      return `${identifier.substring(0, 2)}***${identifier.substring(identifier.length - 2)}`;
    }
    return identifier;
  };

  // Real-time password validation display
  const PasswordValidationHint = () => {
    if (!["set_password", "reset_password"].includes(currentStep)) return null;

    const { password, confirmPassword } = formData;
    
    return (
      <div className="mt-2 space-y-1">
        <div className={`text-xs ${password.length >= 6 ? 'text-green-400' : 'text-gray-400'}`}>
          ✓ At least 6 characters
        </div>
        <div className={`text-xs ${password && confirmPassword && password === confirmPassword ? 'text-green-400' : 'text-gray-400'}`}>
          ✓ Passwords match
        </div>
      </div>
    );
  };

  // Render functions
  const getStepIndicator = () => {
    if (!isSignupMode && !showForgotPassword) return null;

    let steps = [];
    if (showForgotPassword) {
      steps = [
        { label: "Request", key: "forgot_password" },
        { label: "Verify", key: "otp_verify" },
        { label: "Reset", key: "reset_password" }
      ];
    } else if (isSignupMode) {
      steps = [
        { label: "Details", key: "input" },
        { label: "Verify", key: "otp_verify" },
        { label: "Password", key: "set_password" }
      ];
    }

    const currentIndex = steps.findIndex(step => step.key === currentStep);

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm ${
                  index <= currentIndex
                    ? "bg-blue-600 hover:bg-blue-700 border-transparent text-white"
                    : "border-gray-600 bg-gray-700 text-gray-400"
                } transition-all duration-300`}>
                  {index + 1}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  index <= currentIndex ? "text-blue-400" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 border-t-2 mx-2 h-0 ${
                  index < currentIndex ? 'border-blue-400' : "border-gray-600 opacity-50"
                } transition-all duration-300`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    if (showForgotPassword) {
      if (currentStep === "otp_verify") return "Verify Reset Code";
      if (currentStep === "reset_password") return "Set New Password";
      return "Reset Your Password";
    }
    if (isSignupMode) {
      if (currentStep === "otp_verify") return "Verify Your Account";
      if (currentStep === "set_password") return "Create Password";
      return "Join Mission Control";
    }
    return "Welcome to ExoDiscover";
  };

  const getSubtitle = () => {
    if (showForgotPassword) {
      if (currentStep === "otp_verify") return `Enter the 6-digit code sent to ${maskIdentifier(otpDestination || tempIdentifier)}`;
      if (currentStep === "reset_password") return "Create a new, strong password for your account.";
      return "Enter your registered email or phone number to start the reset process.";
    }
    if (isSignupMode) {
      if (currentStep === "otp_verify") return `Enter the 6-digit code sent to ${maskIdentifier(otpDestination || formData.email || formData.phone)}`;
      if (currentStep === "set_password") return "Create a secure password to complete your registration.";
      return "Begin your exoplanet discovery journey by providing your contact details.";
    }
    return "Sign in to your mission control dashboard to continue exploring the cosmos.";
  };

  const renderFormFields = () => {
    if (["input", "signin", "forgot_password"].includes(currentStep)) {
      const combinedValue = formData.email || formData.phone;
      return (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email or Phone Number
          </label>
          <input
            type="text"
            placeholder="Enter your email or phone number"
            value={combinedValue}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-white placeholder-gray-400"
            required
            disabled={isLoading}
          />
        </div>
      );
    } 
    
    if (currentStep === "otp_verify") {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={formData.otp}
            onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            maxLength="6"
            required
            disabled={isLoading}
          />
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || isLoading}
              className={`text-sm ${resendTimer > 0 ? "text-gray-500 cursor-default" : "text-blue-400 hover:underline"}`}
            >
              {resendTimer > 0
                ? `Resend OTP in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}`
                : "Resend OTP"
              }
            </button>
          </div>
        </div>
      );
    } 
    
    if (currentStep === "set_password" || currentStep === "reset_password") {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {currentStep === "set_password" ? "Create Password" : "New Password"}
            </label>
            <input
              type="password"
              placeholder="Enter your password (min 6 characters)"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              required
              disabled={isLoading}
            />
            <PasswordValidationHint />
          </div>
        </div>
      );
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center">
          <PlanetLoading size={24} color="#0f5c6e" />
          <span className="ml-2">Processing...</span>
        </div>
      );
    }
    
    if (showForgotPassword) {
      if (currentStep === "reset_password") return "Reset Password";
      if (currentStep === "otp_verify") return "Verify Code";
      return "Send Reset Code";
    }
    if (isSignupMode) {
      if (currentStep === "set_password") return "Launch Mission";
      if (currentStep === "otp_verify") return "Verify Account";
      return "Begin Journey";
    }
    return "Access Mission Control";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Animated Stars Background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 40px 70px, #fff, transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent)
        `,
        backgroundSize: "200px 200px",
        animation: "twinkle 8s infinite ease-in-out",
        opacity: 0.3
      }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-3xl text-white">🚀</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ExoDiscover AI
          </h1>
          <p className="text-gray-300">Discover new worlds beyond our solar system</p>
        </div>

        {/* Auth Card */}
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden backdrop-blur-sm bg-opacity-90">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          <div className="p-6">
            {/* Step Indicator */}
            {getStepIndicator()}

            {/* Title Section */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {getTitle()}
              </h2>
              <p className="text-gray-400 text-sm">{getSubtitle()}</p>
            </div>

            {/* Messages */}
            {message && (
              <div className="mb-4 p-3 rounded-lg bg-green-900 bg-opacity-50 border border-green-700 flex items-center">
                <span className="text-green-400">✅</span>
                <span className="ml-3 text-green-300 text-sm">{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-900 bg-opacity-50 border border-red-700 flex items-center">
                <span className="text-red-400">⚠️</span>
                <span className="ml-3 text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderFormFields()}

              {/* Password Field for Login */}
              {currentStep === "signin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Forgot Password Link */}
              {currentStep === "signin" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-blue-400 hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-300 bg-blue-600 hover:bg-blue-700 ${
                  isLoading ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg hover:transform hover:-translate-y-1"
                }`}
              >
                {getButtonText()}
              </button>
            </form>

            {/* Back to Login/Signup */}
            {showForgotPassword && currentStep !== "forgot_password" && (
              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setIsSignupMode(false);
                    setCurrentStep("signin");
                  }}
                  className="text-sm text-blue-400 hover:underline"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

            {/* Mode Toggle */}
            {!showForgotPassword && currentStep === "signin" && (
              <div className="text-center mt-6">
                <span className="text-sm text-gray-400">
                  Ready to explore the cosmos?
                </span>
                <button
                  onClick={() => setIsSignupMode(true)}
                  className="ml-1 text-sm font-medium text-blue-400 hover:underline"
                >
                  Join Mission
                </button>
              </div>
            )}
            {!showForgotPassword && currentStep === "input" && (
              <div className="text-center mt-6">
                <span className="text-sm text-gray-400">
                  Already have mission access?
                </span>
                <button
                  onClick={() => setIsSignupMode(false)}
                  className="ml-1 text-sm font-medium text-blue-400 hover:underline"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Social Login */}
            {!showForgotPassword && currentStep === "signin" && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid gap-3 mt-4">
                  <SocialButton provider="Google" onClick={handleSocialLogin} isLoading={isLoading} />
                  <SocialButton provider="Facebook" onClick={handleSocialLogin} isLoading={isLoading} />
                  <SocialButton provider="Twitter" onClick={handleSocialLogin} isLoading={isLoading} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-text-fill-color: white !important;
          -webkit-box-shadow: 0 0 0 30px #1f2937 inset !important;
          caret-color: white !important;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;