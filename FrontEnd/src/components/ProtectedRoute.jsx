import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function ProtectedRoute() {
  const { isLoggedIn, loading } = useContext(AuthContext);

  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return <Outlet />;
}

