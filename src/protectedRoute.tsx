
import React, { type ReactElement } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
     toast.error("You must log in first!");
    return <Navigate to="/signIn" replace />; 
  }

  return children;
};

export default ProtectedRoute;
