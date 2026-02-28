import React from "react";
import { Navigate, useParams } from "react-router-dom";

const ProtectedRoute = ({
  children,
  allowedRole,
  permission,
  checkUserId = false,
}) => {
  const { userId } = useParams();

  const isAuthenticated = () => {
    const token = localStorage.getItem("accessToken");
    return token && token !== "undefined" && token !== "";
  };

  const getRole = () => localStorage.getItem("role");
  const getUserId = () => localStorage.getItem("userId");

  const getAllowedPages = () => {
    const pages = localStorage.getItem("allowedPages");
    return pages ? JSON.parse(pages) : [];
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getRole();

  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  if (permission) {
    const allowedPages = getAllowedPages();
    if (!allowedPages.includes(permission)) {
      return <Navigate to="/" replace />;
    }
  }

  if (checkUserId && userId !== getUserId()) {
    return <Navigate to={`/user/${getUserId()}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;
