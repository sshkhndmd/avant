import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";

import Header from "../components/Header";
import SideMenu from "../components/SideMenu";

const SIZE_ORDER = ["ONE", "XXS", "XS", "S", "M", "L", "XL", "XXL"];

export default function Product() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [search] = useSearchParams();
  const id = search.get("id");

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
      } catch (e) {
        console.error("Не удалось загрузить товар:", e);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!token || !id) {
      setIsFav(false);
      return;
    }

    (async () => {
      try {
        const data = await api("/api/favorites", { token });
        const ids = (data || []).map((p) => p.id);
        setIsFav(ids.includes(Number(id)));
      } catch (e) {
        console.error("Не удалось проверить избранное:", e);
      }
    })();
  }, [id, token]);

  const sortedSizes = useMemo(() => {
    const arr = (product?.sizes || []).map((s) => ({
      ...s,
      stock: Number(s.stock || 0),
      size: String(s.size || "").trim(),
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
      return;
    }

    if (selectedSize && !sortedSizes.some((s) => s.size === selectedSize)) {
      setSelectedSize(null);
    }
  }, [sortedSizes, selectedSize]);

  const addToCart = async () => {
    if (!token) {
      alert("Сначала войдите в аккаунт");
      return;
    }

    if (!selectedSize) {
      alert("Выберите размер");
      return;
    }

    try {
      await api("/api/cart", {
        method: "POST",
        token,
        body: {
          product_id: Number(id),
          size: selectedSize,
          qty: 1,
        },
      });

      alert("Добавлено в корзину ✅");
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка добавления в корзину");
    }
  };

  const toggleFavorite = async () => {
    if (!token) {
      alert("Сначала войдите в аккаунт");
      return;
    }

    try {
      await api(`/api/favorites/${id}`, {
        method: isFav ? "DELETE" : "POST",
        token,
      });

      setIsFav((prev) => !prev);
    } catch (e) {
      console.error("Ошибка избранного:", e);
      alert(e.message || "Не удалось обновить избранное");
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;
  if (!product) return <p style={{ padding: 40 }}>Товар не найден</p>;

  const hasImages = Array.isArray(product.images) && product.images.length > 0;

  const fallbackImg = product.main_image
    ? `/images/${product.main_image}`
    : `/images/product-${product.id}.jpg`;

  return (
    <>
      <Header openMenu={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} close={() => setMenuOpen(false)} />

      <section className="product-layout">
        <div className="product-gallery">
          {hasImages ? (
            product.images.map((img, i) => (
              <img key={i} src={`/images/${img.image_url}`} alt={product.title} />
            ))
          ) : (
            <img src={fallbackImg} alt={product.title} />
          )}
        </div>

        <div className="product-info">
          <h1>{product.title}</h1>

          <p className="product-price">{Number(product.price).toLocaleString()} ₽</p>

          <div className="sizes">
            {sortedSizes.map((s) => {
              const label = s.size === "ONE" ? "ONE SIZE" : s.size;

              return (
                <button
                  key={s.size}
                  disabled={s.stock === 0}
                  onClick={() => setSelectedSize(s.size)}
                  className={[
                    "size-btn",
                    s.stock === 0 ? "disabled" : "",
                    selectedSize === s.size ? "active" : "",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="product-buttons">
            <button
              className="add-to-cart"
              onClick={addToCart}
              disabled={!selectedSize}
              style={!selectedSize ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            >
              {selectedSize ? "В КОРЗИНУ" : "ВЫБЕРИТЕ РАЗМЕР"}
            </button>

            <button className="add-to-fav" onClick={toggleFavorite}>
              {isFav ? "❤️ В избранном" : "♡ В избранное"}
            </button>
          </div>

          <div className="product-description">
            <h3>Описание</h3>

            <div className="product-desc">
              {renderDescription(product.description)}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
function renderDescription(text = "") {
  const lines = String(text).split("\n");

  const blocks = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length) {
      blocks.push(
        <ul className="desc-list" key={`list-${blocks.length}`}>
          {currentList.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === "") {
      flushList();
      blocks.push(<div className="desc-spacer" key={`sp-${blocks.length}`} />);
      continue;
    }

    if (line.trim().startsWith("•")) {
      currentList.push(line.trim().replace(/^•\s?/, ""));
      continue;
    }

      flushList();
    blocks.push(
      <p className="desc-p" key={`p-${blocks.length}`}>
        {line}
      </p>
    );
  }

  flushList();
  return blocks;
}