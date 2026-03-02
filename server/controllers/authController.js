const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authModel = require("../models/authModel");
const { sendSetPasswordEmail } = require("../emailService");
require("dotenv").config();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.user_type },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );
  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const existingUser = await authModel.findUserByEmail(email);

    if (existingUser) return res.status(400).json("Email already registered");

    const setupToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await authModel.createUser(
      username,
      email,
      phone,
      "User",
      setupToken,
      expiry,
      "pending",
    );
    await sendSetPasswordEmail(email, setupToken);

    res.json({
      message:
        "Registration successful! Please check your email to set your password.",
      user: newUser.username,
    });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json("Server Error during registration");
  }
};

const addStaff = async (req, res) => {
  try {
    const { username, email, phoneNumber, assigned_hotel_id, password } =
      req.body;
    const existingUser = await authModel.findUserByEmail(email);

    if (existingUser)
      return res
        .status(400)
        .json({ message: "Staff email already registered" });

    const setupToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let passwordHash = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const newStaff = await authModel.createStaff(
      username,
      email,
      phoneNumber,
      assigned_hotel_id,
      passwordHash,
      setupToken,
      expiry,
    );
    await sendSetPasswordEmail(email, setupToken);

    res.status(201).json({
      message: "Staff member added successfully. Invitation email sent.",
      staff: newStaff,
    });
  } catch (err) {
    console.error("Add Staff Error:", err.message);
    res.status(500).json({ message: "Server Error adding staff member" });
  }
};

const getStaffList = async (req, res) => {
  try {
    const staff = await authModel.getStaffList();
    res.json(staff);
  } catch (err) {
    console.error("Staff List Error:", err.message);
    res.status(500).json("Server Error fetching staff list");
  }
};

const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, assigned_hotel_id } = req.body;

    const currentData = await authModel.findUserById(id);
    if (!currentData) return res.status(404).json("Staff member not found");

    const isEmailChanged =
      email.toLowerCase() !== currentData.email.toLowerCase();

    if (isEmailChanged) {
      const setupToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await authModel.updateStaffWithEmail(
        id,
        username,
        email,
        phone,
        assigned_hotel_id,
        setupToken,
        expiry,
      );
      await sendSetPasswordEmail(email, setupToken);
      res.json({ message: "Staff updated and invitation sent to new email." });
    } else {
      await authModel.updateStaffWithoutEmail(
        id,
        username,
        phone,
        assigned_hotel_id,
      );
      res.json({ message: "Staff details updated successfully." });
    }
  } catch (err) {
    console.error("Staff Update Error:", err.message);
    res.status(500).json("Server Error updating staff member");
  }
};

const deleteStaff = async (req, res) => {
  try {
    await authModel.deleteStaff(req.params.id);
    res.json("Staff Member Deleted Successfully");
  } catch (err) {
    console.error("Delete Staff Error:", err.message);
    res.status(500).json("Server Error deleting staff member");
  }
};

const setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json("Token and password required");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const updatedUser = await authModel.updatePasswordByToken(
      passwordHash,
      token,
    );
    if (!updatedUser) return res.status(400).json("Invalid or expired token");

    res.json({ message: "Password set successfully! You can now log in." });
  } catch (err) {
    console.error("Set Password Error:", err.message);
    res.status(500).json("Server Error");
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authModel.findUserById(req.user.id);
    if (!user) return res.status(404).json("User not found");

    const allowedPages = await authModel.getRolePermissions(user.user_type);

    const { password_hash, setup_token, token_expiry, ...userData } = user;

    res.json({ ...userData, allowedPages });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await authModel.findUserByEmail(email);

    if (!user) return res.status(401).json("Invalid Credentials");

    if (user.is_active === false) {
      return res
        .status(403)
        .json("Your account has been deactivated. Please contact an admin.");
    }

    if (!user.password_hash) {
      return res.status(401).json("Set password via email link first.");
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json("Invalid Credentials");

    const allowedPages = await authModel.getRolePermissions(user.user_type);
    const tokens = generateTokens(user);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: tokens.accessToken,
      role: user.user_type,
      user_id: user.id,
      assigned_hotel_id: user.assigned_hotel_id,
      allowedPages,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json("Server Error");
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json("No token provided");

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await authModel.findUserById(payload.id);

    if (!user) return res.status(403).json("User not found");

    if (user.is_active === false) {
      res.clearCookie("refreshToken");
      return res.status(403).json("Account deactivated. Logging out.");
    }

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.user_type },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh Error:", err.message);
    return res.status(403).json("Invalid token");
  }
};

const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Logged out successfully" });
};

const updateAccount = async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, currentPassword, newPassword } = req.body;

  try {
    const user = await authModel.findUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits" });
    }

    const duplicates = await authModel.checkDuplicateAccount(email, phone, id);
    if (duplicates.length > 0) {
      return res.status(400).json({
        message:
          "Email or Phone number is already registered to another account",
      });
    }

    const isEmailChanging = email.toLowerCase() !== user.email.toLowerCase();
    const isPasswordChanging = !!newPassword;

    if (isEmailChanging || isPasswordChanging) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password required for security changes" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch)
        return res.status(401).json({ message: "Incorrect current password" });
    }

    let emailUpdated = false;
    if (isEmailChanging) {
      const setupToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await authModel.updateAccountEmail(id, email, setupToken, expiry);
      emailUpdated = true;
    }

    if (isPasswordChanging && !isEmailChanging) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      await authModel.updateAccountPassword(id, passwordHash);
    }

    await authModel.updateAccountDetails(id, username, phone);
    res.json({ message: "Success", emailUpdated });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== "Admin" && req.user.id !== parseInt(id)) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only view your own profile" });
    }

    const user = await authModel.findUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
    });
  } catch (err) {
    console.error("Fetch User Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  register,
  setPassword,
  getMe,
  getUserProfile,
  updateAccount,
  getStaffList,
  addStaff,
  updateStaff,
  deleteStaff,
};
