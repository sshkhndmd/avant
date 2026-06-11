import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import VkEditorialPicks from "./VkEditorialPicks";

export default function VkHome() {
  const [newItems, setNewItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api("/api/products/new");
        setNewItems(Array.isArray(data) ? data : []);
      } catch {
        setNewItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="vk-screen">
      <div className="vk-sectionHead">
        <div className="vk-sectionTitle">НОВИНКИ</div>
      </div>

      {loading ? (
        <div className="vk-empty">
          <div className="vk-emptyTitle">Загрузка…</div>
          <div className="vk-emptyText">Подгружаем новинки</div>
        </div>
      ) : (
        <div className="vk-newRailSingle">
          {newItems.map((p) => {
            const img = p.main_image
              ? `/images/${p.main_image}`
              : `/images/product-${p.id}.jpg`;

            return (
              <Link
                key={p.id}
                to={`/product?id=${p.id}&vk=1`}
                className="vk-newCardSingle"
              >
                <div className="vk-newImg">
                  {p.is_new && <div className="vk-badge">NEW</div>}
                  <img src={img} alt={p.title} />
                </div>

                <div className="vk-newMeta">
                  <div className="vk-newTitle">{p.title}</div>
                  <div className="vk-newPrice">
                    {Number(p.price).toLocaleString()} ₽
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <VkEditorialPicks />
    </div>
  );
}