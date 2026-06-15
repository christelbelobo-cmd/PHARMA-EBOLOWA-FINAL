import { Link, NavLink, useNavigate } from "react-router-dom";
import { Cross, Menu, LogOut, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [open, setOpen] = useState(false);
  const { role, logout, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = !!token;

  const NAV_BASE = [
    { to: "/", label: "Accueil", end: true },
    { to: "/medicaments", label: "Médicaments" },
    { to: "/pharmacies", label: "Pharmacies" },
  ];

  const NAV = (role === "admin") ? [...NAV_BASE, { to: "/admin", label: "Admin" }] : NAV_BASE;

  const handleLogout = () => {
    logout();
    toast({ title: "Déconnecté", description: "Vous avez été déconnecté avec succès." });
    navigate("/");
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Cross className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold">PharmaEbolowa</span>
            <span className="text-xs text-muted-foreground">Disponibilité des médicaments</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Authentication section */}
          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="capitalize">{role === "admin" ? "Administrateur" : "Pharmacien"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <Link to="/login" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
                Se connecter
              </Link>
            )}
          </div>
        </nav>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-secondary md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <nav className="border-t md:hidden">
          <div className="container flex flex-col px-4 py-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            
            {/* Mobile authentication section */}
            <div className="border-t pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="capitalize">{role === "admin" ? "Administrateur" : "Pharmacien"}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/60 text-left flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/60 block">
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
