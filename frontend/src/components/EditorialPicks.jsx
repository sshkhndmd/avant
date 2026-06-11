import { Link } from "react-router-dom";

export default function EditorialPicks() {
  return (
    <section className="picks">
      {/* WOMEN */}
      <div className="picks-block">
        <div className="picks-hero">
          <img src="/images/picks-women.jpg" alt="Женская подборка" />
          <div className="picks-overlay" />
          <div className="picks-hero-text">
            <div className="picks-kicker">ПОДБОРКА</div>
            <h2>ЖЕНЩИНЫ</h2>
            <p>Три ключевые вещи сезона: чистая форма, структура и детали.</p>
            <Link className="picks-btn" to="/catalog?gender=women">
              Смотреть всё женское →
            </Link>
          </div>
        </div>

        <div className="picks-cards">
          <Link to="/product?id=15" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-9.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Платье Midnight Trace</div>
              <div className="pick-price">7 490 ₽</div>
            </div>
          </Link>

          <Link to="/product?id=16" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-10.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Топ Wild Static</div>
              <div className="pick-price">8 990 ₽</div>
            </div>
          </Link>

          <Link to="/product?id=12" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-6.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Брюки Dust Raid</div>
              <div className="pick-price">12 990 ₽</div>
            </div>
          </Link>
          <Link to="/product?id=20" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-14.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Кепка Bronze Rebel</div>
              <div className="pick-price">5 990 ₽</div>
            </div>
          </Link>
        </div>
      </div>

      <div className="picks-block">
        <div className="picks-hero">
          <img src="/images/picks-men.jpg" alt="Мужская подборка" />
          <div className="picks-overlay" />
          <div className="picks-hero-text">
            <div className="picks-kicker">ПОДБОРКА</div>
            <h2>МУЖЧИНЫ</h2>
            <p>Функциональность и графика: базовые формы, но с характером.</p>
            <Link className="picks-btn" to="/catalog?gender=men">
              Смотреть всё мужское →
            </Link>
          </div>
        </div>

        <div className="picks-cards">
          <Link to="/product?id=17" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-11.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Куртка Nocturne Rider</div>
              <div className="pick-price">15 990 ₽</div>
            </div>
          </Link>

          <Link to="/product?id=18" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-12.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Лонгслив Static Stripe</div>
              <div className="pick-price">8 990 ₽</div>
            </div>
          </Link>

          <Link to="/product?id=19" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-13.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Футболка Silent Symbol</div>
              <div className="pick-price">6 490 ₽</div>
            </div>
          </Link>
          <Link to="/product?id=21" className="pick-card">
            <div className="pick-img">
              <img src="/images/product-15.jpg" alt="" />
            </div>
            <div className="pick-meta">
              <div className="pick-title">Перчатки Steel Frame</div>
              <div className="pick-price">7 490 ₽</div>
            </div>
          </Link>
        </div>
      </div>


    </section>
  );
}