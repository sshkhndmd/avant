import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api";

const SIZE_ORDER = ["ONE", "XXS", "XS", "S", "M", "L", "XL", "XXL"];

export default function VkProduct() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const nav = useNavigate();

  const token = localStorage.getItem("token");

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        const data = await api(`/api/products/${id}`);
        setProduct(data);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!token || !id) return;

    api("/api/favorites", { token })
      .then((data) => {
        const ids = (data || []).map((x) => x.id);
        setIsFav(ids.includes(Number(id)));
      })
      .catch(() => {});
  }, [token, id]);

  const sortedSizes = useMemo(() => {
    const arr = (product?.sizes || []).map((s) => ({
      size: String(s.size || "").trim(),
      stock: Number(s.stock || 0),
    }));

    arr.sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a.size);
      const bi = SIZE_ORDER.indexOf(b.size);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    return arr;
  }, [product]);

  useEffect(() => {
    if (!sortedSizes.length) return;
    if (sortedSizes.length === 1 && sortedSizes[0].size === "ONE") {
      setSelectedSize("ONE");
    }
  }, [sortedSizes]);

  const addToCart = async () => {
    if (!token) return nav("/profile?vk=1");
    if (!selectedSize) return alert("Выберите размер");

    try {
      await api("/api/cart", {
        method: "POST",
        token,
        body: { product_id: Number(id), size: selectedSize, qty: 1 },
      });

      window.dispatchEvent(new Event("cart-updated"));
      alert("Добавлено в корзину ✅");
    } catch (e) {
      alert(e.message || "Ошибка");
    }
  };

  const toggleFavorite = async () => {
    if (!token) return nav("/profile?vk=1");

    try {
      await api(`/api/favorites/${id}`, {
        method: isFav ? "DELETE" : "POST",
        token,
      });
      setIsFav((p) => !p);
    } catch (e) {
      alert(e.message || "Ошибка");
    }
  };

  if (loading) return <div className="vk-empty">Загрузка…</div>;
  if (!product) return <div className="vk-empty">Товар не найден</div>;

  const imgSrc =
    (product.images?.[0]?.image_url && `/images/${product.images[0].image_url}`) ||
    (product.main_image && `/images/${product.main_image}`) ||
    `/images/product-${product.id}.jpg`;

  return (
    <div className="vk-screen">
      <div className="vk-prod">
        <div className="vk-prodImg">
          <img src={imgSrc} alt={product.title} />
          {product.is_new && <div className="vk-badge">NEW</div>}

          <button
            className="vk-favBtn"
            onClick={toggleFavorite}
            title="Избранное"
          >
            {isFav ? "❤️" : "♡"}
          </button>
        </div>

        <div className="vk-prodTitle">{product.title}</div>
        <div className="vk-prodPrice">
          {Number(product.price).toLocaleString()} ₽
        </div>

        {!!sortedSizes.length && (
          <div className="vk-sizes">
            {sortedSizes.map((s) => (
              <button
                key={s.size}
                className={`vk-size ${selectedSize === s.size ? "active" : ""}`}
                disabled={s.stock === 0}
                onClick={() => setSelectedSize(s.size)}
              >
                {s.size === "ONE" ? "ONE SIZE" : s.size}
              </button>
            ))}
          </div>
        )}

        <button className="vk-primary" onClick={addToCart}>
          Добавить в корзину
        </button>

        <div className="vk-prodDesc">
          <div className="vk-prodDescTitle">Описание</div>
          <div className="vk-prodDescText" style={{ whiteSpace: "pre-line" }}>
            {product.description || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}