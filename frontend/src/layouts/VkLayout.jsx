import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import vkBridge from "@vkontakte/vk-bridge";
import VkSideMenu from "../vk/VkSideMenu";
import { api } from "../api";

export default function VkLayout() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    vkBridge.send("VKWebAppInit").catch(() => {});
    vkBridge
      .send("VKWebAppSetViewSettings", {
        status_bar_style: "dark",
        action_bar_color: "#ffffff",
      })
      .catch(() => {});
  }, []);

  const loadCartCount = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const data = await api("/api/cart", { token });
      const items = Array.isArray(data) ? data : [];
      const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
      setCartCount(totalQty);
    } catch (e) {
      console.error("LOAD CART COUNT ERROR:", e);
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadCartCount();

    const handleCartUpdated = () => loadCartCount();
    const handleStorage = (e) => {
      if (e.key === "token") loadCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const go = (to) => {
    nav(`${to}?vk=1`);
    setMenuOpen(false);
  };

  return (
    <div className="vk-app">
      <VkSideMenu open={menuOpen} close={() => setMenuOpen(false)} />

      <div className="vk-stickyHeader">
        <div className="vk-topSpacer" />

        <div className="vk-topbar">
          <button className="vk-menuBtn" onClick={() => setMenuOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="vk-brand">AVANT</div>


        </div>
      </div>

      <div className="vk-body">
        <Outlet />
      </div>

      <div className="vk-tabbar">
        <button
          className={pathname === "/" ? "active" : ""}
          onClick={() => go("/")}>
          <span className="material-symbols-outlined vk-ico">home</span>
          <span>Главная</span>
        </button>

        <button
          className={pathname === "/favorites" ? "active" : ""}
          onClick={() => go("/favorites")}>
          <span className="material-symbols-outlined vk-ico">favorite</span>
          <span>Избранное</span>
        </button>

        <button
          className={`vk-tabbarCart ${pathname === "/cart" ? "active" : ""}`}
          onClick={() => go("/cart")}>
          <span className="vk-tabIconWrap">
            <span className="material-symbols-outlined vk-ico">local_mall</span>
            {cartCount > 0 && (
              <span className="vk-cartBadge">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
          <span>Корзина</span>
        </button>

        <button
          className={pathname === "/profile" ? "active" : ""}
          onClick={() => go("/profile")}>
          <span className="material-symbols-outlined vk-ico">account_circle</span>
          <span>Профиль</span>
        </button>
      </div>
    </div>
  );
}