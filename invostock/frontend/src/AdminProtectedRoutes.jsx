import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

const AdminProtectedRoutes = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "systemadmin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminProtectedRoutes;
