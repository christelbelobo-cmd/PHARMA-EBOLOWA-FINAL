import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { MapPin, LogIn, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PublicHeader() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo et Branding */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Φ
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-gray-900 leading-none">
                PharmaEbolowa
              </h1>
              <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5 mt-0.5">
                <MapPin size={10} className="text-indigo-500" /> Ebolowa, Cameroun
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Principale */}
        <nav className="hidden md:flex gap-1 items-center">
          <Link href="/">
            <Button 
              variant={location === "/" ? "secondary" : "ghost"} 
              size="sm" 
              className="text-gray-600 font-medium"
            >
              Accueil
            </Button>
          </Link>
          <Link href="/medications">
            <Button 
              variant={location === "/medications" ? "secondary" : "ghost"} 
              size="sm" 
              className="text-gray-600 font-medium"
            >
              Médicaments
            </Button>
          </Link>
          <Link href="/pharmacies">
            <Button 
              variant={location.startsWith("/pharmacies") && location !== "/pharmacies/map" ? "secondary" : "ghost"} 
              size="sm" 
              className="text-gray-600 font-medium"
            >
              Pharmacies
            </Button>
          </Link>
          <Link href="/pharmacies/map">
            <Button 
              variant={location === "/pharmacies/map" ? "secondary" : "ghost"} 
              size="sm" 
              className="text-gray-600 font-medium"
            >
              Carte
            </Button>
          </Link>
        </nav>

        {/* Actions Utilisateur */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">Tableau de bord</span>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-gray-500 hover:text-red-600"
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button 
                variant="default" 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
              >
                <LogIn size={16} />
                <span>Connexion</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
