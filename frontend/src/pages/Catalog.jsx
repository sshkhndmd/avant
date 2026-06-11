import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function Catalog() {
  const [params] = useSearchParams();

  const gender = params.get("gender") || "women";
  const category = params.get("category") ? decodeURIComponent(params.get("category")) : null;
  const isNew = params.get("is_new") === "1" || params.get("is_new") === "true";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [sort, setSort] = useState("newest");

  const title = useMemo(() => {
    const g = gender === "men" ? "Мужчины" : "Женщины";
    if (isNew) return `${g} · Новинки`;
    if (category) return `${g} · ${category}`;
    return `${g} · Каталог`;
  }, [gender, category, isNew]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const qs = new URLSearchParams();
        qs.set("gender", gender);
        if (isNew) qs.set("is_new", "true");
        if (category && !isNew) qs.set("category", category);

        const data = await api(`/api/products?${qs.toString()}`);
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [gender, category, isNew]);

  const filtered = useMemo(() => {
    let arr = [...items];

    const s = q.trim().toLowerCase();
    if (s) arr = arr.filter((p) => (p.title || "").toLowerCase().includes(s));

    const from = priceFrom !== "" ? Number(priceFrom) : null;
    const to = priceTo !== "" ? Number(priceTo) : null;

    if (from !== null && !Number.isNaN(from)) arr = arr.filter((p) => Number(p.price) >= from);
    if (to !== null && !Number.isNaN(to)) arr = arr.filter((p) => Number(p.price) <= to);

    const cmp = (a, b) => {
      if (sort === "priceAsc") return Number(a.price) - Number(b.price);
      if (sort === "priceDesc") return Number(b.price) - Number(a.price);
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      return new Date(b.created_at || 0) - new Date(a.created_at || 0); 
    };

    const news = arr.filter((p) => !!p.is_new).sort(cmp);
    const others = arr.filter((p) => !p.is_new).sort(cmp);
    return [...news, ...others];
  }, [items, q, priceFrom, priceTo, sort]);

  const resetFilters = () => {
    setQ("");
    setPriceFrom("");
    setPriceTo("");
    setSort("newest");
  };

  return (
    <section className="favorites-page catalog-page">
      <div className="favorites-top">
        <div>
          <h1>{title}</h1>
          <p className="favorites-subtitle">
            {loading ? "Загрузка…" : `${filtered.length} товаров`}
          </p>
        </div>

        <div className="favorites-actions">
          <button className="fav-ghost" onClick={resetFilters}>
            Сбросить
          </button>
        </div>
      </div>

      {/* ФИЛЬТРЫ */}
      <div className="catalog-filters">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию…"
        />

        <div className="cat-price">
          <input
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            placeholder="Цена от"
            inputMode="numeric"
          />
          <input
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            placeholder="Цена до"
            inputMode="numeric"
          />
        </div>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Сначала новые</option>
          <option value="priceAsc">Сначала дешевле</option>
          <option value="priceDesc">Сначала дороже</option>
          <option value="title">По названию</option>
        </select>
      </div>

      {loading ? (
        <div className="favorites-empty">
          <h2>Загрузка…</h2>
          <p>Получаем товары по выбранной категории.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="favorites-empty">
          <h2>Пока пусто</h2>
          <p>По фильтрам ничего не найдено.</p>
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
                </div>

                <div className="fav-meta">
                  <h3>{p.title}</h3>
                  <div className="fav-sub">
                    <span className="fav-price">{Number(p.price).toLocaleString()} ₽</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}