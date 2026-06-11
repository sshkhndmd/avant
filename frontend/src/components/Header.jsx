import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchModal from "./SearchModal";
import { api } from "../api";
export default function Header({ openMenu }) {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    api("/api/auth/me", { token })
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setCartCount(0);
      return;
    }

    api("/api/cart", { token })
      .then((items) => {
        const totalQty = (items || []).reduce(
          (sum, i) => sum + Number(i.qty || 0),
          0
        );
        setCartCount(totalQty);
      })
      .catch(() => setCartCount(0));
  }, [token]);

  return (
    <header className="header">

      <div className="menu-btn" onClick={openMenu}>☰</div>

      <div className="logo" onClick={() => navigate("/")}>
        AVANT
      </div>

      <div className="header-actions">
        <span onClick={() => setSearchOpen(true)}>Поиск</span>

        <span onClick={() => navigate("/profile")}>
          {user ? `Профиль: ${user.first_name}` : "Профиль"}
        </span>

        <span onClick={() => navigate("/favorites")}>
          Избранное
        </span>

        <span onClick={() => navigate("/cart")}>
          Корзина ({cartCount})
        </span>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}