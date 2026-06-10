import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextValue = {
  role: string | null;
  pharmacyId: string | null;
  token: string | null;
  loginAs: (roleName: string, phId?: string, jwt?: string) => void;
  logout: () => void;
  hasRole: (allowedRoles?: string[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
    setPharmacyId(localStorage.getItem("pharmacyId"));
    setToken(localStorage.getItem("token"));
  }, []);

  function loginAs(roleName: string, phId?: string, jwt?: string) {
    localStorage.setItem("role", roleName);
    setRole(roleName);
    if (phId) {
      localStorage.setItem("pharmacyId", phId);
      setPharmacyId(phId);
    } else {
      localStorage.removeItem("pharmacyId");
      setPharmacyId(null);
    }
    if (jwt) {
      localStorage.setItem("token", jwt);
      setToken(jwt);
    }
  }

  function logout() {
    localStorage.removeItem("role");
    localStorage.removeItem("pharmacyId");
    localStorage.removeItem("token");
    setRole(null);
    setPharmacyId(null);
    setToken(null);
  }

  function hasRole(allowedRoles: string[] = []) {
    if (!role) return false;
    return allowedRoles.includes(role);
  }

  return (
    <AuthContext.Provider value={{ role, pharmacyId, token, loginAs, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
