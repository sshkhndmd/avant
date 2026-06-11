import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WOMEN_CATEGORIES, MEN_CATEGORIES } from "../constants/categories";

export default function VkSideMenu({ open, close }) {
  const nav = useNavigate();

  const womenCats = useMemo(() => WOMEN_CATEGORIES || [], []);
  const menCats = useMemo(() => MEN_CATEGORIES || [], []);

  const openCategory = (gender, category) => {
    const qs = new URLSearchParams();
    qs.set("gender", gender);

    if (category === "Новинки") {
      qs.set("is_new", "1");
    } else {
      qs.set("category", category);
    }

    qs.set("vk", "1");
    nav(`/catalog?${qs.toString()}`);
    close();
  };

  return (
    <>
      <div
        className={`vk-menuOverlay ${open ? "active" : ""}`}
        onClick={close}
      />

      <aside className={`vk-sideMenu ${open ? "active" : ""}`}>
        <div className="vk-sideMenuHeader">
          <button className="vk-closeBtn" onClick={close}>
            ×
          </button>
        </div>

        <div className="vk-sideMenuContent">
          <div className="vk-menuBrandWrap">
            <Link to="/?vk=1" className="vk-menuBrand" onClick={close}>
              AVANT
            </Link>
          </div>

          <div className="vk-menuSection">
            <h3>ЖЕНЩИНЫ</h3>
            <ul>
              {womenCats.map((c) => (
                <li key={c} onClick={() => openCategory("women", c)}>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="vk-menuSection">
            <h3>МУЖЧИНЫ</h3>
            <ul>
              {menCats.map((c) => (
                <li key={c} onClick={() => openCategory("men", c)}>
                  {c}
                </li>
              ))}
            </ul>
          </div>


        </div>
      </aside>
    </>
  );
}