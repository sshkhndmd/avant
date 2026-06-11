import { useState } from "react";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import Editorial from "../components/Editorial";
import Manifest from "../components/Manifest";
import HeroSlider from "../components/HeroSlider";
import NewProducts from "../components/NewProducts";
import EditorialPicks from "../components/EditorialPicks";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header openMenu={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} close={() => setMenuOpen(false)} />

      <HeroSlider />
      <NewProducts />
      <EditorialPicks />
      <Editorial />
      <Manifest />
    </>
  );
}