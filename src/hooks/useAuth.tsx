import { useEffect, useState } from "react";

export function useAuth() {
  const [role, setRole] = useState<string | null>(null);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setPharmacyId(localStorage.getItem("pharmacyId"));
  }, []);

  function loginAs(roleName: string, phId?: string) {
    localStorage.setItem("role", roleName);
    setRole(roleName);
    if (phId) {
      localStorage.setItem("pharmacyId", phId);
      setPharmacyId(phId);
    } else {
      localStorage.removeItem("pharmacyId");
      setPharmacyId(null);
    }
  }

  function logout() {
    localStorage.removeItem("role");
    localStorage.removeItem("pharmacyId");
    setRole(null);
    setPharmacyId(null);
  }

  function hasRole(allowedRoles: string[] = []) {
    if (!role) return false;
    return allowedRoles.includes(role);
  }

  return { role, pharmacyId, loginAs, logout, hasRole };
}
