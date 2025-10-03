const { prisma } = require("../utils/dbConnector");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { sendOTP } = require("../utils/sendOTP");
const { handleGoogleLogin, handleFacebookLogin, handleTwitterLogin } = require("../utils/socialAuth");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const OTP_EXPIRY_MINUTES = 5;

/**
 * Utility Functions
 */
const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getOTPExpiry = () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

const clearOldOTPs = async (identifier) => {
  await prisma.otp.deleteMany({
    where: {
      identifier,
      expiresAt: { lt: new Date() }
    }
  });
};

const sendOTPToUser = async (identifier, otp, type = "VERIFICATION") => {
  const isEmail = identifier.includes('@');
  
  if (isEmail) {
    await sendEmail({
      to: identifier,
      subject: `OTP for ${type}`,
      text: `Your OTP is ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p style="font-size: 16px;">Use the following OTP to complete your ${type.toLowerCase()}:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666;">
            This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.
          </p>
        </div>
      `,
    });
  } else {
    await sendOTP(identifier, otp);
  }
};

const getPrismaRole = (routeRole) => {
  const roleMap = {
    'user': 'USER',
    'other': 'OTHER_USER',
    'admin': 'ADMIN'
  };
  return roleMap[routeRole] || 'USER';
};

const maskIdentifier = (identifier) => {
  if (!identifier) return '';
  if (identifier.includes('@')) {
    const [local, domain] = identifier.split('@');
    return `${local.substring(0, 3)}***@${domain}`;
  } else {
    return `${identifier.substring(0, 3)}***${identifier.substring(identifier.length - 2)}`;
  }
};

/**
 * Step 1: Registration - Sends OTP for verification
 * Reworked the logic to correctly find an existing user (by email OR phone)
 * regardless of isDeleted status first, to prevent P2002 Unique Constraint error
 * if a soft-deleted user holds the identifier.
 */
const registerUser = async (req, res, role) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ 
        success: false,
        message: "Email or phone is required" 
      });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone format"
      });
    }

    const identifier = email || phone;
    const prismaRole = getPrismaRole(role);

    // FIX: Use a robust OR query structure to search for ANY user 
    // matching the provided unique identifier (email or phone) across ALL records.
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      // If the existing user is soft-deleted, we should not treat them as available
      if (existingUser.isDeleted) {
        return res.status(409).json({
          success: false,
          message: "This account identifier is reserved or associated with a deleted account."
        });
      }

      // If user exists and is fully verified, stop registration
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: "User already exists and is verified. Please login instead."
        });
      }
      
      // If user exists but is not fully verified, UPDATE the existing user record
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: prismaRole }, // Update role if needed
      });

      // Continue to send OTP to the existing user
      const otp = generateOTP();
      const expiresAt = getOTPExpiry();

      await clearOldOTPs(identifier);
      
      await prisma.otp.create({
        data: {
          userId: user.id,
          identifier,
          code: otp,
          type: "VERIFICATION",
          expiresAt,
        },
      });

      await sendOTPToUser(identifier, otp, "Account Verification");

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully. Please check your email or phone.",
        userId: user.id,
        identifier: maskIdentifier(identifier)
      });
    }

    // 2. If no active user found with the identifier, create a new one.
    const userData = {
      role: prismaRole,
      isOtpVerified: false,
      isVerified: false,
      firstLogin: true,
      profileCompleted: false,
      // Use spread operator to conditionally include email or phone
      ...(email && { email }), 
      ...(phone && { phone }) 
    };
    
    const user = await prisma.user.create({
      data: userData,
    });

    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await clearOldOTPs(identifier);
    
    await prisma.otp.create({
      data: {
        userId: user.id,
        identifier,
        code: otp,
        type: "VERIFICATION",
        expiresAt,
      },
    });

    await sendOTPToUser(identifier, otp, "Account Verification");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Please check your email or phone.",
      userId: user.id,
      identifier: maskIdentifier(identifier)
    });

  } catch (error) {
    console.error(`❌ Register error (${role}):`, error.message);
    
    // P2002 error handling remains for new user creation attempts
    if (error.code === 'P2002') {
      // Provide a more specific error message based on which unique key failed
      if (error.message.includes('email') || error.message.includes('Email')) {
        return res.status(409).json({
          success: false,
          message: "Email already exists. Please use a different email or login instead."
        });
      } else if (error.message.includes('phone') || error.message.includes('Phone')) {
        return res.status(409).json({
          success: false,
          message: "Phone number already exists. Please use a different phone number or login instead."
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Step 2: Verify OTP for registration
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp, type = "VERIFICATION" } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }

    const identifier = email || phone;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required"
      });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: { 
        identifier, 
        code: otp, 
        type,
        expiresAt: { gt: new Date() } 
      },
      include: { user: true }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP."
      });
    }

    const updateData = { isOtpVerified: true };
    if (type === "DELETE_ACCOUNT") {
      updateData.isDeleteVerified = true; 
    }

    const user = await prisma.user.update({
      where: { id: otpRecord.userId },
      data: updateData,
    });

    await prisma.otp.delete({ where: { id: otpRecord.id } });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      userId: user.id,
      requiresPassword: type === "VERIFICATION" && !user.password,
      requiresProfile: type === "VERIFICATION" && user.firstLogin
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during OTP verification",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Step 3: Complete registration with profile details
 */
const completeRegistration = async (req, res) => {
  try {
    const { userId, password, confirmPassword, name, age, gender, dob, profileImage, bio } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    if (password && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const user = await prisma.user.findFirst({
      where: { 
        id: userId, 
        isOtpVerified: true, 
        isDeleted: false 
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or OTP not verified."
      });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    // FIXED: Simplified profile completion logic
    const isProfileComplete = !!(name && age && gender);

    const updateData = {
      isVerified: true,
      // FIXED: Always set firstLogin to false after registration completion
      firstLogin: false,
      profileCompleted: isProfileComplete,
      ...(name && { name }),
      ...(age && { age: parseInt(age) }),
      ...(gender && { gender: gender.toUpperCase() }),
      ...(dob && { dob: new Date(dob) }),
      ...(profileImage && { profileImage }),
      ...(bio && { bio }),
      ...(hashedPassword && { password: hashedPassword }),
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: isProfileComplete ? "Registration completed successfully!" : "Basic registration complete. Please complete your profile for better experience.",
      user: userWithoutPassword,
      requiresProfile: !isProfileComplete
    });
  } catch (error) {
    console.error("❌ Complete registration error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration completion",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Login with email/phone + password
 */
// In your userController.js - Fix the loginUser function
const loginUser = async (req, res, role) => {
  try {
    const { email, phone, password } = req.body;
    const prismaRole = getPrismaRole(role);

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean),
        isDeleted: false,
        isVerified: true,
        role: prismaRole,
      },
      include: {
        linkedAccounts: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not verified.",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Please set a password for your account first.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // FIXED: Simplified profile completion check
    const requiresProfile = !user.profileCompleted;

    // Update firstLogin status if it's still true
    if (user.firstLogin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { firstLogin: false }
      });
      // Update the user object for response
      user.firstLogin = false;
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: userWithoutPassword,
      requiresProfile: requiresProfile
    });
  } catch (error) {
    console.error(`❌ Login error (${role}):`, error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Forgot password - Sends OTP for password reset
 */
const forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const identifier = email || phone;
    const identifierField = email ? { email } : { phone };

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required."
      });
    }

    const user = await prisma.user.findFirst({
      where: { 
        ...identifierField,
        isDeleted: false,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await clearOldOTPs(identifier);

    await prisma.otp.create({
      data: {
        userId: user.id,
        identifier,
        code: otp,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    await sendOTPToUser(identifier, otp, "Password Reset");

    res.status(200).json({
      success: true,
      message: "OTP sent for password reset.",
      userId: user.id,
      identifier: maskIdentifier(identifier)
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during password reset request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset password after OTP verification
 */
const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;
    
    if (!userId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const user = await prisma.user.findFirst({ 
      where: { 
        id: userId, 
        isDeleted: false,
        isOtpVerified: true // Ensure OTP was verified before allowing password reset
      } 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or OTP not verified."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        isOtpVerified: false // Reset OTP verification status after password reset
      }
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully."
    });
  } catch (error) {
    console.error("❌ Reset password error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during password reset",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Link additional account (email/phone)
 */
const linkAccount = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const userId = req.user.id;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Either email or phone is required"
      });
    }

    const identifier = email || phone;

    // Check if already linked - use isVerified instead of status
    const existingAccount = await prisma.linkedAccount.findFirst({
      where: {
        OR: [{ email }, { phone }],
        userId,
        isVerified: true // Use isVerified instead of status
      }
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Account already linked"
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await clearOldOTPs(identifier);
    
    // Create pending linked account - REMOVE THE IDENTIFIER FIELD
    const linkedAccount = await prisma.linkedAccount.create({
      data: {
        userId,
        // Remove this line: identifier: identifier,
        email: email || null,
        phone: phone || null,
        type: email ? 'EMAIL' : 'PHONE',
        status: 'PENDING'
      }
    });

    // Create OTP
    await prisma.otp.create({
      data: {
        userId,
        identifier,
        code: otp,
        type: "ACCOUNT_LINKING",
        expiresAt,
      },
    });

    await sendOTPToUser(identifier, otp, "Account Linking");

    res.status(200).json({
      success: true,
      message: "OTP sent for account linking verification",
      linkedAccountId: linkedAccount.id // Send back the ID
    });
  } catch (error) {
    console.error("❌ Link account error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while linking account",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Verify linked account
 */
const verifyLinkedAccount = async (req, res) => {
  try {
    const { email, phone, otp, linkedAccountId } = req.body;
    const userId = req.user.id;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }

    // Find the pending linked account
    const identifier = email || phone;
    const linkedAccount = await prisma.linkedAccount.findFirst({
      where: {
        OR: [{ email }, { phone }],
        userId,
        status: 'PENDING' // Only verify pending accounts
      }
    });

    if (!linkedAccount) {
      return res.status(404).json({
        success: false,
        message: "Pending linked account not found"
      });
    }

    // Verify OTP
    const otpRecord = await prisma.otp.findFirst({
      where: { 
        identifier,
        code: otp, 
        type: "ACCOUNT_LINKING",
        expiresAt: { gt: new Date() } 
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    await prisma.$transaction(async (tx) => {
      // Update linked account status to verified
      await tx.linkedAccount.update({
        where: { id: linkedAccount.id },
        data: { 
          status: 'VERIFIED',
          isVerified: true, // Also set isVerified to true
          verifiedAt: new Date()
        }
      });

      // Delete used OTP
      await tx.otp.delete({ where: { id: otpRecord.id } });
    });

    res.status(200).json({
      success: true,
      message: "Account linked successfully!"
    });
  } catch (error) {
    console.error("❌ Verify linked account error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while verifying linked account",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Make linked account primary
 */
const makeAccountPrimary = async (req, res) => {
  try {
    const { linkedAccountId } = req.body;
    const userId = req.user.id;

    const linkedAccount = await prisma.linkedAccount.findFirst({
      where: {
        id: linkedAccountId,
        userId,
        isVerified: true
      }
    });

    if (!linkedAccount) {
      return res.status(404).json({
        success: false,
        message: "Verified linked account not found."
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Start transaction to swap accounts
    await prisma.$transaction(async (tx) => {
      // Get current primary account info
      const currentPrimary = {
        email: user.email,
        phone: user.phone
      };

      // Update user with new primary account
      await tx.user.update({
        where: { id: userId },
        data: {
          email: linkedAccount.email || currentPrimary.email,
          phone: linkedAccount.phone || currentPrimary.phone
        }
      });

      // Update linked account with old primary info
      await tx.linkedAccount.update({
        where: { id: linkedAccountId },
        data: {
          email: currentPrimary.email,
          phone: currentPrimary.phone,
          isVerified: true
        }
      });
    });

    res.status(200).json({
      success: true,
      message: "Primary account updated successfully!"
    });
  } catch (error) {
    console.error("❌ Make account primary error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating primary account",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Social login placeholder functions
const googleLogin = async (req, res) => {
  res.status(501).json({ success: false, message: "Google login not implemented yet." });
};

const facebookLogin = async (req, res) => {
  res.status(501).json({ success: false, message: "Facebook login not implemented yet." });
};

const twitterLogin = async (req, res) => {
  res.status(501).json({ success: false, message: "Twitter login not implemented yet." });
};

module.exports = {
  registerUser,
  verifyOtp,
  completeRegistration,
  loginUser,
  forgotPassword,
  resetPassword,
  linkAccount,
  verifyLinkedAccount,
  makeAccountPrimary,
  googleLogin,
  facebookLogin,
  twitterLogin,
};
