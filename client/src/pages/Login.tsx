import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = trpc.auth.login.useMutation();
  const utils = trpc.useUtils();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await loginMutation.mutateAsync({ username, password });
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      // Compatibilité avec le hook useAuth
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(result.user));
      
      // Rediriger les admins et pharmaciens vers le tableau de bord
      setLocation(result.user.role === "admin" || result.user.role === "pharmacist" ? "/admin" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Φ
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PharmaEbolowa</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Connexion
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Accès administrateur et pharmaciens
          </p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
                disabled={loginMutation.isPending}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                disabled={loginMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !username || !password}
            >
              {loginMutation.isPending ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>Note :</strong> Utilisez les identifiants créés par l'administrateur. Les comptes de démonstration par défaut ont été désactivés pour plus de sécurité.
            </p>

          </div>
        </div>
      </Card>
    </div>
  );
}
