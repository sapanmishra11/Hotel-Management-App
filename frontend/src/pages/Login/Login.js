import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";
import "./Login.scss";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("api/auth/login", { email, password });

      localStorage.setItem("accessToken", res.data.accessToken);

      const role = res.data.role || "User";
      localStorage.setItem("role", role);

      if (res.data.allowedPages) {
        localStorage.setItem(
          "allowedPages",
          JSON.stringify(res.data.allowedPages),
        );
      } else {
        localStorage.setItem("allowedPages", JSON.stringify([]));
      }

      const userId = res.data.user_id;
      if (userId) {
        localStorage.setItem("userId", userId);
      }

      const assignedHotelId = res.data.assigned_hotel_id;
      const assignedHotelName = res.data.assigned_hotel_name;

      if (assignedHotelId) {
        localStorage.setItem("assigned_hotel_id", assignedHotelId);
      }

      if (assignedHotelName) {
        localStorage.setItem("assigned_hotel_name", assignedHotelName);
      }

      const queryParams = new URLSearchParams(location.search);
      const redirectTo = queryParams.get("redirect");

      const hasPendingBooking = localStorage.getItem("pendingBooking");

      if (redirectTo === "checkout" || hasPendingBooking) {
        window.location.href = "/checkout";
        return;
      }

      if (role === "Admin") {
        navigate("/admin");
      } else if (role === "Staff") {
        navigate("/staff");
      } else if (role === "User") {
        navigate("/user");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login Error:", err);
      toast.error(err.response?.data?.error || "Invalid Credentials");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Hotel Management Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
