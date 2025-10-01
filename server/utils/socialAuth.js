// server/utils/socialAuth.js
const { prisma } = require("./dbConnector");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Role } = require("@prisma/client"); // Ensure enum usage

// ----------------- Generate JWT Token -----------------
const generateToken = (id, role = Role.USER) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ----------------- Google Login -----------------
const handleGoogleLogin = async (googleToken) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${googleToken}`
    );
    const { email, sub: googleId, name, picture } = response.data;

    console.log("🔐 Google login:", { email, googleId });

    let user = await prisma.user.findFirst({
      where: { OR: [{ email }, { googleId }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name,
          profileImage: picture,
          role: Role.USER,
          isVerified: true,
        },
      });
    }

    const token = generateToken(user.id, user.role);
    const { password, ...safeUser } = user;
    return { user: safeUser, token };
  } catch (err) {
    console.error("❌ Google login failed:", err.message);
    throw new Error("Google login failed");
  }
};

// ----------------- Facebook Login -----------------
const handleFacebookLogin = async (accessToken) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    const { id: facebookId, email, name, picture } = response.data;

    console.log("🔐 Facebook login:", { email, facebookId });

    let user = await prisma.user.findFirst({
      where: { OR: [{ email }, { facebookId }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          facebookId,
          name,
          profileImage: picture?.data?.url || null,
          role: Role.USER,
          isVerified: true,
        },
      });
    }

    const token = generateToken(user.id, user.role);
    const { password, ...safeUser } = user;
    return { user: safeUser, token };
  } catch (err) {
    console.error("❌ Facebook login failed:", err.message);
    throw new Error("Facebook login failed");
  }
};

// ----------------- Twitter Login -----------------
const handleTwitterLogin = async (oauthToken) => {
  try {
    const response = await axios.get("https://api.twitter.com/2/me", {
      headers: { Authorization: `Bearer ${oauthToken}` },
    });
    const { id: twitterId, name } = response.data;

    console.log("🔐 Twitter login:", { twitterId });

    let user = await prisma.user.findFirst({ where: { twitterId } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          twitterId,
          name,
          role: Role.USER,
          isVerified: true,
        },
      });
    }

    const token = generateToken(user.id, user.role);
    const { password, ...safeUser } = user;
    return { user: safeUser, token };
  } catch (err) {
    console.error("❌ Twitter login failed:", err.message);
    throw new Error("Twitter login failed");
  }
};

module.exports = {
  handleGoogleLogin,
  handleFacebookLogin,
  handleTwitterLogin,
};