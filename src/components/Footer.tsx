export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container px-4 py-6 text-center text-sm text-muted-foreground">
        <p>PharmaEbolowa — Disponibilité des médicaments dans les pharmacies d'Ebolowa.</p>
        <p className="mt-1 text-xs">
          Données de démonstration à confirmer auprès de chaque pharmacie. © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
