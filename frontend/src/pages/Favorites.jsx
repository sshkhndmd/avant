import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import Footer from "../components/Footer";

export default function Favorites() {
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [gender, setGender] = useState("all");
  const [category, setCategory] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await api("/api/favorites", { token });
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Favorites load error:", e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [items]);

  const resetFilters = () => {
    setQ("");
    setGender("all");
    setCategory("all");
    setOnlyInStock(false);
    setPriceFrom("");
    setPriceTo("");
    setSort("newest");
  };

  const toggleFavorite = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert("Сначала войдите в аккаунт");
      navigate("/profile");
      return;
    }

    try {
      await api(`/api/favorites/${id}`, { method: "DELETE", token });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error("toggle fav error:", err);
      alert(err.message || "Не удалось удалить из избранного");
    }
  };

  const filtered = useMemo(() => {
    const from = priceFrom !== "" ? Number(priceFrom) : null;
    const to = priceTo !== "" ? Number(priceTo) : null;

    let arr = [...items];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((p) => (p.title || "").toLowerCase().includes(s));
    }

    if (gender !== "all") {
      arr = arr.filter((p) => p.gender === gender);
    }

    if (category !== "all") {
      arr = arr.filter((p) => p.category === category);
    }

    if (onlyInStock) {
      arr = arr.filter((p) => {
        if (!p.sizes) return true;
        return p.sizes.some((s) => Number(s.stock) > 0);
      });
    }

    if (from !== null && !Number.isNaN(from)) {
      arr = arr.filter((p) => Number(p.price) >= from);
    }
    if (to !== null && !Number.isNaN(to)) {
      arr = arr.filter((p) => Number(p.price) <= to);
    }

    arr.sort((a, b) => {
      if (sort === "priceAsc") return Number(a.price) - Number(b.price);
      if (sort === "priceDesc") return Number(b.price) - Number(a.price);
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return arr;
  }, [items, q, gender, category, onlyInStock, priceFrom, priceTo, sort]);

  if (!token) {
    return (
      <>
        <Header openMenu={() => setMenuOpen(true)} />
        <SideMenu open={menuOpen} close={() => setMenuOpen(false)} />
        <section className="favorites-page">
          <div className="favorites-top">
            <h1>Избранное</h1>
          </div>

          <div className="favorites-empty">
            <h2>Войдите в аккаунт</h2>
            <p>Чтобы сохранять понравившиеся вещи и возвращаться к ним позже.</p>
            <button className="fav-primary" onClick={() => navigate("/profile")}>
              Войти / Регистрация
            </button>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="page">
      <Header openMenu={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} close={() => setMenuOpen(false)} />

      <main className="page-main">
        <section className="favorites-page">
          <div className="favorites-top">
            <div>
              <h1>Избранное</h1>
              <p className="favorites-subtitle">
                {loading
                  ? "Загрузка…"
                  : `${filtered.length} ${declOfNum(filtered.length, [
                      "вещь",
                      "вещи",
                      "вещей",
                    ])}`}
              </p>
            </div>

            <div className="favorites-actions">
              <button className="fav-ghost" onClick={resetFilters}>
                Сбросить
              </button>
            </div>
          </div>

          {/* ФИЛЬТРЫ */}
          <div className="favorites-filters">
            <div className="filter-row">
              <div className="filter-field">
                <label>Поиск</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Например: пальто"
                />
              </div>

              <div className="filter-field">
                <label>Сортировка</label>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Сначала новые</option>
                  <option value="priceAsc">Сначала дешевле</option>
                  <option value="priceDesc">Сначала дороже</option>
                  <option value="title">По названию</option>
                </select>
              </div>

              <div className="filter-field">
                <label>Пол</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="all">Все</option>
                  <option value="women">Женщины</option>
                  <option value="men">Мужчины</option>
                </select>
              </div>

              <div className="filter-field">
                <label>Категория</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option value={c} key={c}>
                      {c === "all" ? "Все" : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-field">
                <label>Цена от</label>
                <input
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>

              <div className="filter-field">
                <label>Цена до</label>
                <input
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  placeholder="99999"
                  inputMode="numeric"
                />
              </div>

              <label className="filter-check">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                />
                Только в наличии
              </label>
            </div>
          </div>

          {/* КОНТЕНТ */}
          {loading ? (
            <div className="favorites-empty">
              <h2>Загрузка…</h2>
              <p>Собираем ваши сохранённые вещи.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="favorites-empty">
              <h2>Пока пусто</h2>
              <p>Добавляйте понравившиеся вещи — они появятся здесь.</p>
              <button className="fav-primary" onClick={() => navigate("/")}>
                Перейти в каталог
              </button>
            </div>
          ) : (
            <div className="favorites-grid">
              {filtered.map((p) => {
                const imgSrc = p.main_image
                  ? `/images/${p.main_image}`
                  : `/images/product-${p.id}.jpg`;

                return (
                  <Link to={`/product?id=${p.id}`} className="fav-card" key={p.id}>
                    <div className="fav-media">
                      <img src={imgSrc} alt={p.title} />
                      {p.is_new && <div className="badge-new">NEW</div>}

                      <div
                        className="badge-fav active"
                        onClick={(e) => toggleFavorite(e, p.id)}
                        title="Убрать из избранного"
                      >
                        ❤️
                      </div>
                    </div>

                    <div className="fav-meta">
                      <h3>{p.title}</h3>
                      <div className="fav-sub">
                        <span className="fav-price">
                          {Number(p.price).toLocaleString()} ₽
                        </span>
                        <span className="fav-tags">
                          {p.gender === "women" ? "Ж" : p.gender === "men" ? "М" : ""}
                          {p.category ? ` · ${p.category}` : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

    </div>
  );
}

function declOfNum(n, forms) {
  n = Math.abs(n) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}