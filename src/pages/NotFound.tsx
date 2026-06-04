import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-bold text-primary">404</h1>
      <p className="mt-3 text-lg text-muted-foreground">Cette page n'existe pas.</p>
      <Link to="/" className="mt-6 font-medium text-primary hover:underline">
        ← Retour à l'accueil
      </Link>
    </div>
  );
};

export default NotFound;
