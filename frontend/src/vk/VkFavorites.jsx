import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function VkFavorites() {
  const token = localStorage.getItem("token");
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newFirst");

  const load = async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api("/api/favorites", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const toggleFavorite = async (e, id, isFav) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      nav("/profile?vk=1");
      return;
    }

    try {
      await api(`/api/favorites/${id}`, {
        method: isFav ? "DELETE" : "POST",
        token,
      });

      if (isFav) {
        setItems((prev) => prev.filter((x) => x.id !== id));
      } else {
        load();
      }
    } catch (err) {
      alert(err.message || "Не удалось обновить избранное");
    }
  };

  const filtered = useMemo(() => {
    let arr = [...items];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      arr = arr.filter((p) => (p.title || "").toLowerCase().includes(s));
    }

    if (sort === "newFirst") {
      arr.sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new));
    } else if (sort === "priceAsc") {
      arr.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "priceDesc") {
      arr.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return arr;
  }, [items, q, sort]);

  if (!token) {
    return (
      <div className="vk-empty">
        <div className="vk-emptyTitle">Избранное</div>
        <div className="vk-emptyText">
          Войдите в аккаунт, чтобы сохранять понравившиеся вещи.
        </div>
        <button className="vk-primary" onClick={() => nav("/profile?vk=1")}>
          Войти / Регистрация
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="vk-empty">Загрузка…</div>;
  }

  return (
    <div className="vk-screen">
      <div className="vk-pageHead">
        <div>
          <div className="vk-pageTitle">Избранное</div>
          <div className="vk-pageSub">{filtered.length} шт.</div>
        </div>

        <div className="vk-headRight">
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
      </div>

      <div className="vk-searchRow">
        <input
          className="vk-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по избранному…"
        />
        <button className="vk-ghost" onClick={() => setQ("")}>
          Сброс
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="vk-empty">
          <div className="vk-emptyTitle">Пока пусто</div>
          <div className="vk-emptyText">
            Добавляйте товары сердечком — они появятся здесь.
          </div>
          <button
            className="vk-primary"
            onClick={() => nav("/catalog?gender=women&vk=1")}
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="vk-grid">
          {filtered.map((p) => {
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

                  <button
                    className="vk-cardFav active"
                    onClick={(e) => toggleFavorite(e, p.id, true)}
                    title="Убрать из избранного"
                  >
                    ❤️
                  </button>
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