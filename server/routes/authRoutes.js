const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, phone, user_type } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash, phone, user_type) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [username, email, passwordHash, phone, user_type || "User"],
    );

    res.json({ message: "User registered!", user: newUser.rows[0].username });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0)
      return res.status(401).json("Invalid Credentials");

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash,
    );
    if (!validPassword) return res.status(401).json("Invalid Credentials");

    const tokens = generateTokens(user.rows[0]);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: tokens.accessToken,
      role: user.rows[0].user_type,
      user_id: user.rows[0].id,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.status(401).json("No refresh token provided");

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await pool.query(
      "SELECT id, user_type FROM users WHERE id = $1",
      [payload.id],
    );

    if (user.rows.length === 0) return res.status(403).json("User not found");

    const newAccessToken = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].user_type },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh Error:", err.message);
    return res.status(403).json("Invalid or expired refresh token");
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
