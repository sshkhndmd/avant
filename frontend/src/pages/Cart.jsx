import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Cart() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    comment: "",
    payment_method: "COURIER_ON_DELIVERY",
    payment_type: "CASH",
  });

  const onChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]:
      name === "phone"
        ? value.replace(/\D/g, "").slice(0, 11)
        : value,
  }));
};

  useEffect(() => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const data = await api("/api/cart", { token });
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const total = useMemo(() => {
    return (items || []).reduce(
      (sum, i) => sum + Number(i.price) * Number(i.qty),
      0
    );
  }, [items]);

  const updateQty = async (id, qty) => {
    if (!token) return;

    try {
      await api(`/api/cart/${id}`, {
        method: "PATCH",
        token,
        body: { qty },
      });

      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x)));
    } catch (e) {
      alert(e.message);
    }
  };

  const removeItem = async (id) => {
    if (!token) return;

    try {
      await api(`/api/cart/${id}`, { method: "DELETE", token });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const checkout = async () => {
    if (!token) {
      alert("Сначала войдите в аккаунт");
      navigate("/profile");
      return;
    }

    if (!items.length) {
      alert("Корзина пуста");
      return;
    }

    if (!form.phone.trim() || !form.address.trim()) {
      alert("Укажите телефон и адрес доставки");
      return;
    }

    if (!form.payment_type) {
      alert("Выберите способ оплаты");
      return;
    }

    try {
      const data = await api("/api/orders/checkout", {
        method: "POST",
        token,
        body: form,
      });

      alert(`Заказ оформлен! №${data.order_id}`);
      setItems([]);
      navigate("/profile");
    } catch (e) {
      alert(e.message);
    }
  };

  if (!token) {
    return (
      <section className="cart-page">
        <div className="cart-top">
          <h1>Корзина</h1>
        </div>

        <div className="cart-empty">
          <h2>Войдите в аккаунт</h2>
          <p>Чтобы сохранять корзину и оформлять заказы.</p>
          <button className="cart-primary" onClick={() => navigate("/profile")}>
            Войти / Регистрация
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-top">
        <div>
          <h1>Корзина</h1>
          <p className="cart-subtitle">
            {loading ? "Загрузка…" : `${items.length} поз.`}
          </p>
        </div>

        <div className="cart-total">
          <span>Итого</span>
          <b>{total.toLocaleString()} ₽</b>
        </div>
      </div>

      {loading ? (
        <div className="cart-empty">
          <h2>Загрузка…</h2>
          <p>Собираем вашу корзину.</p>
        </div>
      ) : items.length === 0 ? (
        <div className="cart-empty">
          <h2>Корзина пуста</h2>
          <p>Добавьте товары — они появятся здесь.</p>
          <button className="cart-primary" onClick={() => navigate("/")}>
            Перейти на главную
          </button>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-list">
            {items.map((p) => {
              const imgSrc = p.main_image
                ? `/images/${p.main_image}`
                : `/images/product-${p.product_id}.jpg`;

              return (
                <div className="cart-item" key={p.id}>
                  <Link to={`/product?id=${p.product_id}`} className="cart-img">
                    <img src={imgSrc} alt={p.title} />
                  </Link>

                  <div className="cart-info">
                    <div className="cart-title">
                      <h3>{p.title}</h3>
                      <button className="cart-remove" onClick={() => removeItem(p.id)}>
                        Удалить
                      </button>
                    </div>

                    <div className="cart-meta">
                      <span>
                        Размер: <b>{p.size}</b>
                      </span>
                      <span>
                        Цена: <b>{Number(p.price).toLocaleString()} ₽</b>
                      </span>
                      <span>
                        Остаток: <b>{p.stock}</b>
                      </span>
                    </div>

                    <div className="cart-qty">
                      <button
                        onClick={() => updateQty(p.id, Math.max(1, p.qty - 1))}
                        disabled={p.qty <= 1}
                      >
                        −
                      </button>

                      <input
                        value={p.qty}
                        onChange={(e) => {
                          const v = Number(e.target.value || 1);
                          if (!Number.isFinite(v)) return;
                          updateQty(p.id, Math.max(1, Math.min(v, Number(p.stock))));
                        }}
                        inputMode="numeric"
                      />

                      <button
                        onClick={() =>
                          updateQty(p.id, Math.min(Number(p.stock), p.qty + 1))
                        }
                        disabled={p.qty >= Number(p.stock)}
                      >
                        +
                      </button>

                      {p.qty > Number(p.stock) && (
                        <span className="cart-warning">Недостаточно на складе</span>
                      )}
                    </div>
                  </div>

                  <div className="cart-sum">
                    {(Number(p.price) * Number(p.qty)).toLocaleString()} ₽
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-checkout">
            <h2>Оформление</h2>

            <div className="checkout-fields">
              <div className="field">
                <label>Имя</label>
                <input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={onChange}
                  placeholder="Иван"
                />
              </div>

              <div className="field">
                <label>Телефон*</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="+7 (999) 999-99-99"
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="mail@example.com"
                />
              </div>

              <div className="field">
                <label>Адрес доставки*</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  placeholder="Город, улица, дом, кв."
                />
              </div>

              <div className="field">
                <label>Способ оплаты*</label>

                <div className="checkout-payment">
                  <label
                    className={`checkout-pay-btn ${
                      form.payment_type === "CASH" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_type"
                      value="CASH"
                      checked={form.payment_type === "CASH"}
                      onChange={onChange}
                    />
                    <span>Наличными курьеру</span>
                  </label>

                  <label
                    className={`checkout-pay-btn ${
                      form.payment_type === "CARD" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_type"
                      value="CARD"
                      checked={form.payment_type === "CARD"}
                      onChange={onChange}
                    />
                    <span>Картой курьеру</span>
                  </label>
                </div>
              </div>

              <div className="field">
                <label>Комментарий</label>
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={onChange}
                  placeholder="Удобное время доставки..."
                />
              </div>
            </div>

            <div className="checkout-total">
              <span>Итого</span>
              <b>{total.toLocaleString()} ₽</b>
            </div>

            <button className="cart-primary" onClick={checkout}>
              Оформить заказ
            </button>

            <p className="checkout-note">
              Оплата производится при получении заказа курьеру. Наличие
              проверяется при оформлении. Остатки списываются автоматически.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}