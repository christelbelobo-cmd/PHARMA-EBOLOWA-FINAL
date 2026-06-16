import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MapPin } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo et Branding */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Φ
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-900 leading-none">
                PharmaEbolowa
              </h1>
              <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5 mt-0.5">
                <MapPin size={10} className="text-indigo-500" /> Ebolowa, Cameroun
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex gap-2 items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-600 font-medium hover:text-gray-900">
              Accueil
            </Button>
          </Link>
          <Link href="/medications">
            <Button variant="ghost" size="sm" className="text-gray-600 font-medium hover:text-gray-900">
              Médicaments
            </Button>
          </Link>
          <Link href="/pharmacies">
            <Button variant="ghost" size="sm" className="text-gray-600 font-medium hover:text-gray-900">
              Pharmacies
            </Button>
          </Link>
          <Link href="/pharmacies/map">
            <Button variant="ghost" size="sm" className="text-gray-600 font-medium hover:text-gray-900">
              Carte
            </Button>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 ml-2"
              >
                Admin
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
