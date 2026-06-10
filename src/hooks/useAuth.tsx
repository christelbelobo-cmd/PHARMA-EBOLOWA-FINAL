import { useEffect, useState } from "react";

export function useAuth() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  function loginAs(roleName: string) {
    localStorage.setItem("role", roleName);
    setRole(roleName);
  }

  function logout() {
    localStorage.removeItem("role");
    setRole(null);
  }

  function hasRole(allowedRoles: string[] = []) {
    if (!role) return false;
    return allowedRoles.includes(role);
  }

  return { role, loginAs, logout, hasRole };
}
