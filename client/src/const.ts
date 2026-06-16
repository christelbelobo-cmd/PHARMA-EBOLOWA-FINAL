export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // On récupère la variable ou on met une valeur par défaut locale si elle est vide
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "http://localhost:3000";
  const appId = import.meta.env.VITE_APP_ID || "pharma-ebolowa-unified";
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    // On s'assure que l'URL de base commence bien par http pour ne pas faire crasher 'new URL'
    const baseUrl = oauthPortalUrl.startsWith('http') ? oauthPortalUrl : `http://${oauthPortalUrl}`;
    const url = new URL(`${baseUrl}/app-auth`);
    
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("[Auth] Erreur lors de la création de l'URL de connexion :", error);
    return "#";
  }
};
