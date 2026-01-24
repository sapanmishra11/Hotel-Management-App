import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Navbar.scss";
import logoImg from "../../assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("accessToken");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <nav className="main-navbar">
      <div className="nav-logo">
        <Link to="/">
          <img
            src={logoImg}
            alt="Hotel Palace Logo"
            className="navbar-logo-image"
          />
          <span className="logo-text">Hotel Palace</span>
        </Link>
      </div>

      <div className="nav-links">
        {!token && (
          <>
            <Link to="/home">Find Hotels</Link>
            <Link to="/login" className="nav-auth-btn">
              Login
            </Link>
            <Link to="/register" className="nav-auth-btn signup">
              Sign Up
            </Link>
          </>
        )}
        {token && (
          <>
            {role === "Admin" && <Link to="/admin">Admin Panel</Link>}
            {role === "Staff" && <Link to="/staff">Staff Portal</Link>}
            {role === "User" && <Link to="/home">Find Hotels</Link>}

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
