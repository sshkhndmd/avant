import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const PICKS_CONFIG = [
  {
    key: "women",
    kicker: "ПОДБОРКА",
    title: "ЖЕНЩИНЫ",
    text: "Чистая форма, структура и выразительные детали.",
    heroImage: "/images/picks-women.jpg",
    heroAlt: "Женская подборка",
    catalogLink: "/catalog?gender=women&vk=1",
    buttonText: "Смотреть всё женское →",
    productIds: [15, 16, 12, 20],
  },
  {
    key: "men",
    kicker: "ПОДБОРКА",
    title: "МУЖЧИНЫ",
    text: "Функциональность, графика и характер в базовых формах.",
    heroImage: "/images/picks-men.jpg",
    heroAlt: "Мужская подборка",
    catalogLink: "/catalog?gender=men&vk=1",
    buttonText: "Смотреть всё мужское →",
    productIds: [17, 18, 19, 21],
  },
];

export default function VkEditorialPicks() {
  const [productsById, setProductsById] = useState({});
  const [loading, setLoading] = useState(true);

  const allIds = useMemo(() => {
    const ids = PICKS_CONFIG.flatMap((section) => section.productIds || []);
    return [...new Set(ids)];
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const results = await Promise.all(
          allIds.map(async (id) => {
            try {
              const product = await api(`/api/products/${id}`);
              return [id, product];
            } catch {
              return [id, null];
            }
          })
        );

        setProductsById(Object.fromEntries(results));
      } finally {
        setLoading(false);
      }
    })();
  }, [allIds]);

  return (
    <section className="vk-picks">
      {PICKS_CONFIG.map((section) => {
        const sectionProducts = (section.productIds || [])
          .map((id) => productsById[id])
          .filter(Boolean);

        return (
          <div className="vk-picksBlock" key={section.key}>
            <div className="vk-picksHero">
              <img src={section.heroImage} alt={section.heroAlt} />
              <div className="vk-picksOverlay" />
              <div className="vk-picksHeroText">
                <div className="vk-picksKicker">{section.kicker}</div>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
                <Link className="vk-picksBtn" to={section.catalogLink}>
                  {section.buttonText}
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="vk-empty">
                <div className="vk-emptyText">Подгружаем подборку…</div>
              </div>
            ) : (
              <div className="vk-picksGrid">
                {sectionProducts.map((product) => {
                  const img = product.main_image
                    ? `/images/${product.main_image}`
                    : `/images/product-${product.id}.jpg`;

                  return (
                    <Link
                      key={product.id}
                      to={`/product?id=${product.id}&vk=1`}
                      className="vk-newCardSingle"
                    >
                      <div className="vk-newImg">
                        {product.is_new && <div className="vk-badge">NEW</div>}
                        <img src={img} alt={product.title} />
                      </div>

                      <div className="vk-newMeta">
                        <div className="vk-newTitle">{product.title}</div>
                        <div className="vk-newPrice">
                          {Number(product.price).toLocaleString()} ₽
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}