import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function VkCatalog() {
  const [params] = useSearchParams();
  const gender = params.get("gender") || "women";
  const category = params.get("category")
    ? decodeURIComponent(params.get("category"))
    : "";
  const isNew =
    params.get("is_new") === "1" || params.get("is_new") === "true";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newFirst");

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
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [gender, category, isNew]);

  const title = useMemo(() => {
    const g = gender === "men" ? "Мужчины" : "Женщины";

    if (isNew) return `${g} · Новинки`;
    if (category) return `${g} · ${category}`;
    return `${g} · Каталог`;
  }, [gender, category, isNew]);

  const sorted = useMemo(() => {
    const arr = [...items];

    if (sort === "newFirst") {
      arr.sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new));
      return arr;
    }

    if (sort === "priceAsc") {
      arr.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sort === "priceDesc") {
      arr.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return arr;
  }, [items, sort]);

  return (
    <div className="vk-screen">
      <div className="vk-pageHead">
        <div>
          <div className="vk-pageTitle">{title}</div>
          <div className="vk-pageSub">
            {loading ? "Загрузка…" : `${sorted.length} товаров`}
          </div>
        </div>

        <select
          className="vk-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newFirst">Сначала NEW</option>
          <option value="priceAsc">Дешевле</option>
          <option value="priceDesc">Дороже</option>
        </select>
      </div>

      {loading ? (
        <div className="vk-empty">Загрузка…</div>
      ) : sorted.length === 0 ? (
        <div className="vk-empty">В этой категории пока нет товаров.</div>
      ) : (
        <div className="vk-grid">
          {sorted.map((p) => {
            const imgSrc = p.main_image
              ? `/images/${p.main_image}`
              : `/images/product-${p.id}.jpg`;

            return (
              <Link
                key={p.id}
                to={`/product?id=${p.id}&vk=1`}
                className="vk-card"
              >
                <div className="vk-cardImg">
                  <img src={imgSrc} alt={p.title} />
                  {p.is_new && <div className="vk-badge">NEW</div>}
                </div>

                <div className="vk-cardTitle">{p.title}</div>
                <div className="vk-cardPrice">
                  {Number(p.price).toLocaleString()} ₽
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}