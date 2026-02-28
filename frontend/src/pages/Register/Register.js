import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import { toast } from "react-toastify";
import "./Register.scss";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const { username, email, phone } = formData;

    if (username.trim().length < 3) {
      toast.error("Full Name must be at least 3 characters long.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Phone number must be exactly 10 numeric digits.");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await API.post("api/auth/register", formData);
      toast.success(
        "Registration Successful! Please check your email to set your password.",
      );
      navigate("/login");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Registration failed. Try again.";
      toast.error(
        typeof errorMsg === "string" ? errorMsg : "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Join us today! An email will be sent to set your password.
        </p>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Sapan Mishra"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="10-digit number"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setFormData({ ...formData, phone: value });
              }}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
