import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  allowedRoles: string[];
  children: ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: Props) => {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
