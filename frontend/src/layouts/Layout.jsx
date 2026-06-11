import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import Footer from "../components/Footer";
import { api } from "../api";
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app">
      <Header openMenu={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} close={() => setMenuOpen(false)} />

      <main className="app-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}