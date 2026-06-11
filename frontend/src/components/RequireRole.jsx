import { Navigate } from "react-router-dom";
import { api } from "../api";
export default function RequireRole({ user, roles, children }) {
  if (!user) return <Navigate to="/profile" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
