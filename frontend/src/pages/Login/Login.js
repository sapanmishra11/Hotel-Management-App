import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../../api/axios";
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

      const userId = res.data.user_id;
      if (userId) {
        localStorage.setItem("user_id", userId);
      }

      const queryParams = new URLSearchParams(location.search);
      const redirectTo = queryParams.get("redirect");

      if (redirectTo === "checkout") {
        window.location.href = "/checkout";
        return;
      }

      if (role === "Admin") {
        window.location.href = "/admin";
      } else if (role === "Staff") {
        window.location.href = "/staff";
      } else {
        window.location.href = "/home";
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data || "Invalid Credentials");
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
