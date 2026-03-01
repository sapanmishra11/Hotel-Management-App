import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import "./Navbar.scss";

const Navbar = () => {
  const navigate = useNavigate();
  const [hotelName, setHotelName] = useState("");

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const rawUserName = localStorage.getItem("userName");
  const userName =
    rawUserName && rawUserName !== "null" && rawUserName !== "undefined"
      ? rawUserName
      : null;

  const savedToken = localStorage.getItem("accessToken");
  const isLoggedIn =
    savedToken && savedToken !== "null" && savedToken !== "undefined";

  const userRole = role ? role.toLowerCase() : "user";

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await API.get("/api/globaldetails/hotelname");
        if (res.data && res.data.success) {
          setHotelName(res.data.hotelName);
        }
      } catch (err) {
        console.error("Error fetching branding for navbar:", err);
      }
    };
    fetchBranding();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <nav className="main-navbar">
      <div className="nav-logo">
        <Link to="/">
          <span className="logo-text">{hotelName}</span>
        </Link>
      </div>

      <div className="nav-links">
        {!isLoggedIn ? (
          <>
            <Link to="/home">Find Hotels</Link>
            <Link to="/login" className="nav-auth-btn">
              Login
            </Link>
            <Link to="/register" className="nav-auth-btn signup">
              Sign Up
            </Link>
          </>
        ) : (
          <div className="nav-authenticated">
            {role === "Admin" && (
              <Link to="/admin/role-access" className="nav-link-item">
                Admin Panel
              </Link>
            )}

            {role === "Staff" && (
              <Link to="/staff" className="nav-link-item">
                Staff Panel
              </Link>
            )}

            {role === "User" && (
              <Link to={`/user/${userId}/dashboard`} className="nav-link-item">
                My Dashboard
              </Link>
            )}

            <div className="user-profile-dropdown">
              <div className="profile-trigger">
                <span className="nav-user-name">{role || "User"}</span>
                <span className="chevron">▾</span>
              </div>

              <div className="dropdown-menu">
                <div className="dropdown-header">
                  {userName && <strong>{userName}</strong>}
                  <span>{role} Account</span>
                </div>
                <hr />

                <Link to={`/${userRole}/${userId}/settings`}>
                  Account Settings
                </Link>

                <hr />
                <button className="dropdown-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
