import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/40">
      <Header />
      <main className="container flex-1 px-4 py-6 md:py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
