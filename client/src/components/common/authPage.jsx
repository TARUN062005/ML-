import React, { useState, useEffect, useContext } from "react";
import axios from "axios";

// Mock router hooks for demonstration
const useNavigate = () => {
  return (path, options) => { 
    console.log("NAVIGATE TO:", path, options); 
    window.location.href = path; // Simple redirect for demo
  };
};

const useParams = () => { 
  // Extract userType from URL path
  const path = window.location.pathname;
  if (path.includes('/other/')) return { userType: 'other' };
  return { userType: 'user' };
};

// Real Auth Context
const AuthContext = React.createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  login: (user, token) => console.log("LOGIN:", user),
  logout: () => console.log("LOGOUT")
});

// Axios Configuration
const API = axios.create({
  baseURL: "http://localhost:5000",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to log requests
API.interceptors.request.use(
  (config) => {
    console.log(`🔵 API CALL: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses
API.interceptors.response.use(
  (response) => {
    console.log(`🟢 API RESPONSE:`, response.data);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Planet Loading Component
const PlanetLoading = ({ size = 40, color = "#3B82F6" }) => {
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

// Icons (same as before)
const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" width="24px" height="24px" className="w-6 h-6">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,7.917-11.303,7.917c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.665,8.396,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,38.544,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.219-4.138,5.646c3.27,2.536,7.697,4.046,12.031,4.046c4.542,0,7.817-2.585,7.817-8.138C44,23.323,43.862,21.35,43.611,20.083z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="24px" height="24px" fill="none" className="w-6 h-6">
    <path fill="#1877F2" d="M12 2C6.477 2 2 6.477 2 12c0 5.143 3.75 9.429 8.667 9.803V15.5h-2V13h2v-2c0-2.2 1.35-3.4 3.3-3.4s3.7.1 3.7.1v2.7h-1.8c-1.14 0-1.5.7-1.5 1.4v1.2h3.2l-.5 2.5h-2.7V21.803C18.25 21.429 22 17.143 22 12c0-5.523-4.477-10-10-10z"/>
    <path fill="#FFFFFF" d="M15 13.5h-2.7V22c5.143-.374 9.429-4.66 9.803-9.803C21.429 6.75 17.143 2.5 12 2.197V11h2.5l.5 2.5z"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="24px" height="24px" fill="none" className="w-6 h-6">
    <path fill="#000000" d="M18.244 2.257l-2.493 2.923c-.791-.219-1.631-.335-2.5-.335-4.417 0-7.794 3.568-7.794 8s3.377 8 7.794 8c1.396 0 2.766-.37 3.993-1.071l2.502 2.932c-1.85 1.343-4.042 2.128-6.495 2.128C10.748 24 4.025 17.657 4.025 12S10.748 0 17.248 0c2.453 0 4.645.785 6.495 2.128l-2.502 2.932c-1.227-.701-2.6-.701-3.993-.701z"/>
    <path fill="#FFFFFF" d="M19.23 8.163c-.15.083-.31.145-.478.188L18 8.441l-.478.188c-1.298.406-2.617.587-3.99.587-4.142 0-7.5-3.358-7.5-7.5 0-.46.04-.92.12-1.378l.057-.306.406.01c.219.006.438.016.657.03z"/>
    <path fill="#FFFFFF" d="M14.248 12.001c-1.657 0-3.15-.59-4.322-1.579L7.33 13.045l1.696 1.156c-.52.277-1.077.42-1.655.42-1.808 0-3.328-1.468-3.328-3.3 0-1.832 1.52-3.3 3.328-3.3.424 0 .848.083 1.272.247l2.84 1.745c1.353-.99 3.018-1.579 4.79-1.579 2.76 0 5 2.24 5 5s-2.24 5-5 5z"/>
  </svg>
);

const SocialButton = ({ provider, onClick, isLoading }) => {
  const Icon = {
    Google: GoogleIcon,
    Facebook: FacebookIcon,
    Twitter: XIcon,
  }[provider];

  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      disabled={isLoading}
      className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 w-full"
    >
      {Icon && <Icon />}
      <span className="ml-2 text-sm font-medium">Continue with {provider}</span>
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
  const { login } = useContext(AuthContext);
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
  const [isUser, setIsUser] = useState(true);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [currentStep, setCurrentStep] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Determine user type based on URL parameter
  useEffect(() => {
    if (typeof userType === "string") {
      const normalized = userType.trim().toLowerCase();
      setIsUser(normalized === "user");
      console.log("🔍 User type detected:", normalized, "isUser:", normalized === "user");
    }
  }, [userType]);

  // Theme configuration
  const theme = isUser
    ? {
        primaryColor: "bg-blue-600 hover:bg-blue-700",
        textColor: "text-blue-600",
        borderColor: "border-blue-200",
        secondaryBg: "bg-blue-50",
        focusRing: "focus:ring-blue-500",
        loadingColor: "#3B82F6"
      }
    : {
        primaryColor: "bg-green-600 hover:bg-green-700",
        textColor: "text-green-600",
        borderColor: "border-green-200",
        secondaryBg: "bg-green-50",
        focusRing: "focus:ring-green-500",
        loadingColor: "#10B981"
      };

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
  }, [isUser, isSignupMode, showForgotPassword]);

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
    console.log("🔄 Form submission started", { currentStep, formData, isUser });
    
    if (!validateForm()) {
      console.log("❌ Form validation failed");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = isUser ? "/user" : "/other";
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
    const endpoint = isUser ? "/user" : "/other";
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
    const endpoint = isUser ? "/user" : "/other";
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
      
      const role = res.user.role?.toLowerCase() || (isUser ? 'user' : 'professional');
      console.log("🎯 Navigation role:", role);

      if (res.requiresProfile && !res.user.profileCompleted) {
        navigate(`/auth/${role}/complete-profile`, { replace: true });
      } else {
        navigate(`/auth/${role}/dashboard`, { replace: true });
      }
    } else {
      setError("Login failed. Please check your credentials.");
    }
  };

  const handleAutoLogin = async () => {
    const endpoint = isUser ? "/user" : "/other";
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
        
        const role = loginRes.user.role?.toLowerCase() || (isUser ? 'user' : 'professional');
        
        if (loginRes.requiresProfile && !loginRes.user.profileCompleted) {
          navigate(`/auth/${role}/complete-profile`, { replace: true });
        } else {
          navigate(`/auth/${role}/dashboard`, { replace: true });
        }
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
      const endpoint = isUser ? "/user" : "/other";
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
        <div className={`text-xs ${password.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
          ✓ At least 6 characters
        </div>
        <div className={`text-xs ${password && confirmPassword && password === confirmPassword ? 'text-green-600' : 'text-gray-500'}`}>
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
                    ? `${theme.primaryColor} border-transparent text-white`
                    : "border-gray-300 bg-gray-50 text-gray-400"
                } transition-all duration-300`}>
                  {index + 1}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  index <= currentIndex ? theme.textColor : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 border-t-2 mx-2 h-0 ${
                  index < currentIndex ? theme.textColor.replace('text-', 'border-') : "border-gray-300 opacity-50"
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
      return "Create Account";
    }
    return "Welcome Back";
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
      return "Get started by providing your contact details.";
    }
    return "Sign in to your account to continue.";
  };

  const renderFormFields = () => {
    if (["input", "signin", "forgot_password"].includes(currentStep)) {
      const combinedValue = formData.email || formData.phone;
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email or Phone Number
          </label>
          <input
            type="text"
            placeholder="Enter your email or phone number"
            value={combinedValue}
            onChange={(e) => handleIdentifierChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            required
            disabled={isLoading}
          />
        </div>
      );
    } 
    
    if (currentStep === "otp_verify") {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={formData.otp}
            onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength="6"
            required
            disabled={isLoading}
          />
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || isLoading}
              className={`text-sm ${resendTimer > 0 ? "text-gray-400 cursor-default" : theme.textColor + " hover:underline"}`}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentStep === "set_password" ? "Create Password" : "New Password"}
            </label>
            <input
              type="password"
              placeholder="Enter your password (min 6 characters)"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <PlanetLoading size={24} color={theme.loadingColor} />
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
      if (currentStep === "set_password") return "Complete Registration";
      if (currentStep === "otp_verify") return "Verify Account";
      return "Continue";
    }
    return "Sign In";
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme.secondaryBg}`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isUser ? "👤 User Account" : "🚀 Professional Access"}
          </h1>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-600">Switch Role:</span>
            <button
              onClick={() => setIsUser(prev => !prev)}
              className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
                isUser ? theme.primaryColor + " text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {isUser ? "User" : "Professional"}
            </button>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className={`h-2 ${theme.primaryColor}`}></div>

          <div className="p-6">
            {/* Step Indicator */}
            {getStepIndicator()}

            {/* Title Section */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {getTitle()}
              </h2>
              <p className="text-gray-500 text-sm">{getSubtitle()}</p>
            </div>

            {/* Messages */}
            {message && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center">
                <span className="text-green-600">✅</span>
                <span className="ml-3 text-green-700 text-sm">{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center">
                <span className="text-red-600">⚠️</span>
                <span className="ml-3 text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderFormFields()}

              {/* Password Field for Login */}
              {currentStep === "signin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className={`text-sm font-medium ${theme.textColor} hover:underline`}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-300 ${
                  theme.primaryColor
                } ${isLoading ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}`}
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
                  className={`text-sm ${theme.textColor} hover:underline`}
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

            {/* Mode Toggle */}
            {!showForgotPassword && currentStep === "signin" && (
              <div className="text-center mt-6">
                <span className="text-sm text-gray-500">
                  Don't have an account?
                </span>
                <button
                  onClick={() => setIsSignupMode(true)}
                  className={`ml-1 text-sm font-medium ${theme.textColor} hover:underline`}
                >
                  Sign Up
                </button>
              </div>
            )}
            {!showForgotPassword && currentStep === "input" && (
              <div className="text-center mt-6">
                <span className="text-sm text-gray-500">
                  Already have an account?
                </span>
                <button
                  onClick={() => setIsSignupMode(false)}
                  className={`ml-1 text-sm font-medium ${theme.textColor} hover:underline`}
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
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
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
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;