// const express = require("express");
// const router = express.Router();
// const { authenticateToken } = require("../middleware/authmiddleware");
// const { 
//   registerUser, 
//   loginUser, 
//   verifyOtp, 
//   completeRegistration,
//   forgotPassword,
//   resetPassword,
//   googleLogin,
//   facebookLogin,
//   twitterLogin,
//   linkAccount,
//   verifyLinkedAccount,
//   makeAccountPrimary
// } = require("../controller/authController");

// const { 
//   getProfile, 
//   updateProfile, 
//   getLinkedAccounts,
//   removeLinkedAccount,
//   changePassword,
//   requestAccountDeletion,
//   deleteAccount,
//   sendOtpForOperation
// } = require("../controller/dashboardController");

// // Auth routes for "other" role
// router.post("/register", (req, res) => registerUser(req, res, "other"));
// router.post("/verify-otp", verifyOtp);
// router.post("/complete-registration", completeRegistration);
// router.post("/login", (req, res) => loginUser(req, res, "other"));
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password", resetPassword);
// router.post("/google-login", googleLogin);
// router.post("/facebook-login", facebookLogin);
// router.post("/twitter-login", twitterLogin);

// // Protected dashboard routes
// router.get("/profile", authenticateToken, getProfile);
// router.put("/profile", authenticateToken, updateProfile);

// // Account management routes
// router.get("/linked-accounts", authenticateToken, getLinkedAccounts);
// router.post("/link-account", authenticateToken, linkAccount);
// router.post("/verify-linked-account", authenticateToken, verifyLinkedAccount);
// router.post("/make-account-primary", authenticateToken, makeAccountPrimary);
// router.delete("/linked-accounts/:linkedAccountId", authenticateToken, removeLinkedAccount);

// // OTP protected operations
// router.post("/send-otp-for-operation", authenticateToken, sendOtpForOperation);
// router.put("/change-password", authenticateToken, changePassword);
// router.post("/request-deletion", authenticateToken, requestAccountDeletion);
// router.delete("/account", authenticateToken, deleteAccount);

// module.exports = router;
