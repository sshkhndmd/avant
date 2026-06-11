import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function SearchModal({ open, onClose }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const query = q.trim();
    if (!query) {
      setItems([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await api(`/api/products/search?q=${encodeURIComponent(query)}`);
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q, open]);

  const submit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const title = useMemo(() => {
    if (!q.trim()) return "Начните вводить запрос";
    if (loading) return "Поиск…";
    if (!items.length) return "Ничего не найдено";
    return "Результаты";
  }, [q, loading, items.length]);

  if (!open) return null;

  return (
    <div className="search-overlay" onMouseDown={onClose}>
      <div className="search-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="search-top">
          <form className="search-form" onSubmit={submit}>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по товарам…"
            />
            <button type="submit">Найти</button>
          </form>

          <button className="search-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="search-hint">{title}</div>

        <div className="search-results">
          {items.map((p) => {
            const imgSrc = p.main_image
              ? `/images/${p.main_image}`
              : `/images/product-${p.id}.jpg`;

            return (
              <Link
                to={`/product?id=${p.id}`}
                key={p.id}
                className="search-item"
                onClick={onClose}
              >
                <div className="search-item-img">
                  <img src={imgSrc} alt={p.title} />
                  {p.is_new && <div className="badge-new">NEW</div>}
                </div>

                <div className="search-item-meta">
                  <div className="search-item-title">{p.title}</div>
                  <div className="search-item-sub">
                    <span>{Number(p.price).toLocaleString()} ₽</span>
                    <span className="dot">·</span>
                    <span>{p.category || "—"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {!!q.trim() && (
          <button className="search-more" onClick={submit}>
            Показать все результаты →
          </button>
        )}
      </div>
    </div>
  );
}