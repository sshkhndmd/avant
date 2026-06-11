import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function NewProducts() {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const sliderRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    api("/api/products/new")
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Не удалось загрузить новинки:", e));
  }, []);

  useEffect(() => {
    if (!token) {
      setFavorites([]);
      return;
    }

    api("/api/favorites", { token })
      .then((data) => setFavorites((data || []).map((p) => p.id)))
      .catch((e) => console.error("Не удалось загрузить избранное:", e));
  }, [token]);

  const toggleFavorite = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert("Сначала войдите в аккаунт");
      return;
    }

    const isFav = favorites.includes(id);

    try {
      await api(`/api/favorites/${id}`, {
        method: isFav ? "DELETE" : "POST",
        token,
      });

      setFavorites((prev) =>
        isFav ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } catch (err) {
      console.error("Ошибка избранного:", err);
      alert(err.message || "Не удалось обновить избранное");
    }
  };

  const scroll = (dir) => {
    if (!sliderRef.current) return;

    const width = sliderRef.current.offsetWidth;
    sliderRef.current.scrollBy({
      left: dir === "left" ? -width / 2 : width / 2,
      behavior: "smooth",
    });
  };

  return (
    <section className="new-products">
      <div className="new-products-header">
        <h2>НОВИНКИ</h2>

        <div className="arrows">
          <button onClick={() => scroll("left")}>←</button>
          <button onClick={() => scroll("right")}>→</button>
        </div>
      </div>

      <div className="new-products-slider" ref={sliderRef}>
        {products.map((p) => {
          const isFav = favorites.includes(p.id);
          const imgSrc = p.main_image
            ? `/images/${p.main_image}`
            : `/images/product-${p.id}.jpg`;

          return (
            <Link key={p.id} to={`/product?id=${p.id}`} className="new-product-card">
              {p.is_new && <div className="badge-new">NEW</div>}

              <div
                className={`badge-fav ${isFav ? "active" : ""}`}
                onClick={(e) => toggleFavorite(e, p.id)}
                title={isFav ? "Убрать из избранного" : "В избранное"}
              >
                {isFav ? "❤️" : "♡"}
              </div>

              <img src={imgSrc} alt={p.title} />
              <h3>{p.title}</h3>
              <span>{Number(p.price).toLocaleString()} ₽</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}