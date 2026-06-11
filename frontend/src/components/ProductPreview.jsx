import { Link } from "react-router-dom";

export default function ProductPreview() {
  const token = localStorage.getItem("token");

  const products = [
    { id: 1, title: "Драпированное пальто", price: "34 900 ₽", img: "/images/product-1.jpg", is_new: true },
    { id: 2, title: "Авангардный жакет", price: "27 500 ₽", img: "/images/product-2.jpg", is_new: true },
    { id: 3, title: "Минималистичные брюки", price: "19 800 ₽", img: "/images/product-3.jpg", is_new: false },
  ];

  const toggleFavorite = async (e, id) => {
    e.preventDefault();

    if (!token) {
      alert("Сначала войдите в аккаунт");
      return;
    }

    await fetch(`http://localhost:3000/api/favorites/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    alert("Добавлено в избранное ❤️");
  };

  return (
    <section className="products-preview">
      {products.map((p) => (
        <Link to={`/product?id=${p.id}`} className="product-card" key={p.id}>
          {p.is_new && <div className="badge-new">NEW</div>}

          <div className="badge-fav" onClick={(e) => toggleFavorite(e, p.id)}>
            ♡
          </div>

          <img src={p.img} alt="" />
          <h3>{p.title}</h3>
          <span>{p.price}</span>
        </Link>
      ))}
    </section>
  );
}