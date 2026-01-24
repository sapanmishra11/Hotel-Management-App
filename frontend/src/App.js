import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./components/Navbar/Navbar";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard/StaffDashboard";
import UserHome from "./pages/UserHome/UserHome";
import Checkout from "./pages/Checkout/Checkout";

function App() {
  const isAuthenticated = () => {
    const token = localStorage.getItem("accessToken");
    return (
      token !== null &&
      token !== undefined &&
      token !== "" &&
      token !== "undefined"
    );
  };

  const getRole = () => localStorage.getItem("role");

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />

      <Navbar />

      <div className="App">
        <Routes>
          <Route path="/" element={<UserHome />} />
          <Route path="/home" element={<UserHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/checkout"
            element={
              isAuthenticated() && getRole() === "User" ? (
                <Checkout />
              ) : (
                <Navigate to="/login?redirect=checkout" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              isAuthenticated() && getRole() === "Admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/staff"
            element={
              isAuthenticated() && getRole() === "Staff" ? (
                <StaffDashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
