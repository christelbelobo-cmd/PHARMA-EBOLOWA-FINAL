import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePharmacies } from "@/hooks/usePharmacies";

const Login = () => {
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  const { data: pharmacies } = usePharmacies();
  const [role, setRole] = useState<"admin" | "pharmacist">("pharmacist");
  const [pharmacyId, setPharmacyId] = useState("");
  const [password, setPassword] = useState("");

  // when pharmacies load, default to first if none selected
  useEffect(() => {
    if (pharmacies && pharmacies.length > 0 && !pharmacyId) {
      setPharmacyId(pharmacies[0].id);
    }
  }, [pharmacies, pharmacyId]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Call backend login
    try {
      const username = role === 'admin' ? 'admin' : pharmacyId;
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert(err.message || 'Échec de la connexion');
      }
      const data = await res.json();
      const user = data.user;
      const token = data.token;
      loginAs(user.role, user.pharmacyId ?? undefined, token);
      if (user.role === 'admin') navigate('/admin');
      else navigate(`/pharmacies/${user.pharmacyId}`);
    } catch (e) {
      alert('Erreur réseau lors de la connexion');
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Se connecter</h1>
      <p className="text-muted-foreground">Connectez-vous en tant qu'administrateur ou pharmacien.</p>

      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Rôle</label>
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pharmacist">Pharmacien</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {role === "pharmacist" && (
          <div>
            <label className="mb-1 block text-sm font-medium">Votre pharmacie</label>
            <Select value={pharmacyId} onValueChange={(v) => setPharmacyId(v)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(pharmacies || []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Mot de passe</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" className="h-11" />
        </div>

        <div className="md:col-span-2">
          <Button type="submit">Se connecter</Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
