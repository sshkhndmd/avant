import { useNavigate } from "react-router-dom";
import { WOMEN_CATEGORIES, MEN_CATEGORIES } from "../constants/categories";

export default function SideMenu({ open, close }) {
  const navigate = useNavigate();

  const goCatalog = (gender) => {
    navigate(`/catalog?gender=${gender}`);
    close();
  };

  const goCategory = (gender, category) => {
    if (category === "Новинки") {
      navigate(`/catalog?gender=${gender}&is_new=1`);
    } else {
      navigate(`/catalog?gender=${gender}&category=${encodeURIComponent(category)}`);
    }
    close();
  };

  return (
    <>
      <div
        className={`menu-overlay ${open ? "active" : ""}`}
        onClick={close}
      />

      <aside className={`side-menu ${open ? "active" : ""}`}>
        <div className="side-menu-header">
          <span className="close-btn" onClick={close}>×</span>
        </div>

        <div className="side-menu-content">
          <div className="menu-section">
            <h3 className="menu-title-link" onClick={() => goCatalog("women")}>
              ЖЕНЩИНЫ
            </h3>

            <ul>
              {WOMEN_CATEGORIES.map((c) => (
                <li key={`w-${c}`} onClick={() => goCategory("women", c)}>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="menu-section">
            {/* ✅ кликабельный заголовок */}
            <h3 className="menu-title-link" onClick={() => goCatalog("men")}>
              МУЖЧИНЫ
            </h3>

            <ul>
              {MEN_CATEGORIES.map((c) => (
                <li key={`m-${c}`} onClick={() => goCategory("men", c)}>
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