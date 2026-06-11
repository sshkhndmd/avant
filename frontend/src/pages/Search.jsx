import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [gender, setGender] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!q) {
          setItems([]);
          return;
        }

        const data = await api(`/api/products/search?q=${encodeURIComponent(q)}`);
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [q]);

  const filtered = useMemo(() => {
    let arr = [...items];
    if (gender !== "all") arr = arr.filter((p) => p.gender === gender);

    arr.sort((a, b) => {
      if (sort === "priceAsc") return Number(a.price) - Number(b.price);
      if (sort === "priceDesc") return Number(b.price) - Number(a.price);
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return arr;
  }, [items, gender, sort]);

  return (
    <section className="search-page">
      <div className="search-page-top">
        <div>
          <h1>Поиск</h1>
          <p className="search-page-sub">
            {q ? `Запрос: “${q}”` : "Введите запрос через кнопку Поиск"}
          </p>
        </div>

        <div className="search-page-filters">
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="all">Все</option>
            <option value="women">Женщины</option>
            <option value="men">Мужчины</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Сначала новые</option>
            <option value="priceAsc">Сначала дешевле</option>
            <option value="priceDesc">Сначала дороже</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="search-empty">Загрузка…</div>
      ) : q && filtered.length === 0 ? (
        <div className="search-empty">Ничего не найдено</div>
      ) : (
        <div className="search-grid">
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
  );
}