const { prisma } = require("../utils/dbConnector");
const bcrypt = require("bcryptjs");

// Utility functions
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_EXPIRY_MINUTES = 5;
const getOTPExpiry = () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

const clearOldOTPs = async (identifier) => {
  await prisma.otp.deleteMany({
    where: {
      identifier,
      expiresAt: { lt: new Date() }
    }
  });
};

const sendOTPToUser = async (identifier, otp, type = "VERIFICATION") => {
  // Your existing OTP sending implementation
  const sendEmail = require("../utils/sendEmail");
  const { sendOTP } = require("../utils/sendOTP");
  
  const isEmail = identifier.includes('@');
  
  if (isEmail) {
    await sendEmail({
      to: identifier,
      subject: `OTP for ${type}`,
      text: `Your OTP is ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
  } else {
    await sendOTP(identifier, otp);
  }
};

/**
 * Send OTP for specific operations (password change, account deletion, etc.)
 */
const sendOtpForOperation = async (req, res) => {
  try {
    const { operation } = req.body; // 'PASSWORD_CHANGE', 'ACCOUNT_DELETION', 'ACCOUNT_LINKING'
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const identifier = user.email || user.phone;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "No email or phone associated with account for OTP verification."
      });
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await clearOldOTPs(identifier);
    
    await prisma.otp.create({
      data: {
        userId,
        identifier,
        code: otp,
        type: operation, // Use the operation as OTP type
        expiresAt,
      },
    });

    await sendOTPToUser(identifier, otp, operation.replace('_', ' '));

    res.status(200).json({
      success: true,
      message: "OTP sent successfully for verification.",
      operation,
      identifier: identifier.replace(/(?<=.{3}).(?=.*@)/g, '*')
    });
  } catch (error) {
    console.error("❌ Send OTP for operation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while sending OTP",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { 
        addresses: true,
        linkedAccounts: true
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      requiresProfile: !user.profileCompleted && user.firstLogin
    });
  } catch (error) {
    console.error("❌ Get profile error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user profile (partial updates supported)
 */
const updateProfile = async (req, res) => {
  try {
    const { name, age, gender, dob, profileImage, bio, addresses } = req.body;
    const userId = req.user.id;

    // Build update data object only with provided fields
    const dataToUpdate = {};
    
    if (name !== undefined) dataToUpdate.name = name;
    if (age !== undefined) dataToUpdate.age = age ? parseInt(age) : null;
    if (gender !== undefined) dataToUpdate.gender = gender ? gender.toUpperCase() : null;
    if (dob !== undefined) dataToUpdate.dob = dob ? new Date(dob) : null;
    if (profileImage !== undefined) dataToUpdate.profileImage = profileImage;
    if (bio !== undefined) dataToUpdate.bio = bio;

    // Check if profile is now complete
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isProfileComplete = !!(dataToUpdate.name || user.name) && 
                              !!(dataToUpdate.age || user.age) && 
                              !!(dataToUpdate.gender || user.gender);

    if (isProfileComplete) {
      dataToUpdate.profileCompleted = true;
      dataToUpdate.firstLogin = false; // User has completed profile
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update user with only provided fields
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      // Update addresses if provided
      if (addresses !== undefined) {
        await tx.address.deleteMany({ where: { userId } });

        if (Array.isArray(addresses) && addresses.length > 0) {
          const newAddresses = addresses.map(addr => ({
            ...addr,
            userId: userId,
          }));
          await tx.address.createMany({ data: newAddresses });
        }
      }

      return updatedUser;
    });

    const { password: _, ...userWithoutPassword } = result;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: userWithoutPassword,
      profileCompleted: isProfileComplete
    });
  } catch (error) {
    console.error("❌ Update profile error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get linked accounts
 */
const getLinkedAccounts = async (req, res) => {
  try {
    const linkedAccounts = await prisma.linkedAccount.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      linkedAccounts
    });
  } catch (error) {
    console.error("❌ Get linked accounts error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching linked accounts",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove linked account
 */
const removeLinkedAccount = async (req, res) => {
  try {
    const { linkedAccountId } = req.params;

    const linkedAccount = await prisma.linkedAccount.findFirst({
      where: {
        id: linkedAccountId,
        userId: req.user.id
      }
    });

    if (!linkedAccount) {
      return res.status(404).json({
        success: false,
        message: "Linked account not found."
      });
    }

    await prisma.linkedAccount.delete({
      where: { id: linkedAccountId }
    });

    res.status(200).json({
      success: true,
      message: "Linked account removed successfully."
    });
  } catch (error) {
    console.error("❌ Remove linked account error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while removing linked account",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Change password (requires OTP verification)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword, otp } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmPassword || !otp) {
      return res.status(400).json({
        success: false,
        message: "All fields including OTP are required"
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
        message: "New password must be at least 6 characters long"
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const identifier = user.email || user.phone;

    // Verify OTP first
    const otpRecord = await prisma.otp.findFirst({
      where: { 
        identifier, 
        code: otp, 
        type: "PASSWORD_CHANGE",
        expiresAt: { gt: new Date() } 
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP for password change."
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Delete used OTP
      await tx.otp.delete({ where: { id: otpRecord.id } });
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("❌ Change password error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while changing password",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Request account deletion (sends OTP)
 */
const requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const identifier = user.email || user.phone;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "No email or phone associated with account for OTP verification."
      });
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await clearOldOTPs(identifier);
    
    await prisma.otp.create({
      data: {
        userId,
        identifier,
        code: otp,
        type: "ACCOUNT_DELETION",
        expiresAt,
      },
    });

    await sendOTPToUser(identifier, otp, "Account Deletion");

    res.status(200).json({
      success: true,
      message: "OTP sent for account deletion verification. Please verify to proceed.",
      requiresOtp: true
    });
  } catch (error) {
    console.error("❌ Request account deletion error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during account deletion request",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete account (after OTP verification)
 */
const deleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required to delete the account."
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const identifier = user.email || user.phone;
    
    const otpRecord = await prisma.otp.findFirst({
      where: { 
        identifier,
        code: otp, 
        type: "ACCOUNT_DELETION",
        expiresAt: { gt: new Date() } 
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP for account deletion."
      });
    }

    await prisma.$transaction(async (tx) => {
      // Delete all user data
      await tx.otp.deleteMany({ where: { userId } });
      await tx.address.deleteMany({ where: { userId } });
      await tx.linkedAccount.deleteMany({ where: { userId } });
      
      // Soft delete user
      await tx.user.update({
        where: { id: userId },
        data: { isDeleted: true },
      });

      // Delete used OTP
      await tx.otp.delete({ where: { id: otpRecord.id } });
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully."
    });
  } catch (error) {
    console.error("❌ Delete account error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during account deletion",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendOtpForOperation,
  getProfile,
  updateProfile,
  getLinkedAccounts,
  removeLinkedAccount,
  changePassword,
  requestAccountDeletion,
  deleteAccount,
};