import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function VkCart() {
  const token = localStorage.getItem("token");
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    comment: "",
    payment_method: "COURIER_ON_DELIVERY",
    payment_type: "CASH",
  });

  const load = async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }

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
  };

  useEffect(() => {
    load();
  }, [token]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0),
    [items]
  );

  const updateQty = async (cartItemId, newQty, stock) => {
    if (!token) return;

    const q = Math.max(1, Math.min(Number(newQty), Number(stock || 9999)));

    setItems((prev) =>
      prev.map((x) => (x.id === cartItemId ? { ...x, qty: q } : x))
    );

    try {
      await api(`/api/cart/${cartItemId}`, {
        method: "PATCH",
        token,
        body: { qty: q },
      });

      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      alert(e.message || "Не удалось изменить количество");
      load();
    }
  };

  const removeItem = async (cartItemId) => {
    if (!token) return;

    setItems((prev) => prev.filter((x) => x.id !== cartItemId));

    try {
      await api(`/api/cart/${cartItemId}`, {
        method: "DELETE",
        token,
      });

      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      alert(e.message || "Не удалось удалить");
      load();
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const checkout = async () => {
    if (!token) {
      nav("/profile?vk=1");
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

      alert(`Заказ оформлен ✅ №${data.order_id}`);
      setItems([]);
      setCheckoutOpen(false);
      window.dispatchEvent(new Event("cart-updated"));
      nav("/orders?vk=1");
    } catch (e) {
      alert(e.message || "Ошибка оформления заказа");
    }
  };

  if (!token) {
    return (
      <div className="vk-empty">
        <div className="vk-emptyTitle">Корзина</div>
        <div className="vk-emptyText">
          Войдите, чтобы сохранять корзину и оформлять заказ.
        </div>
        <button className="vk-primary" onClick={() => nav("/profile?vk=1")}>
          Войти / Регистрация
        </button>
      </div>
    );
  }

  if (loading) return <div className="vk-empty">Загрузка…</div>;

  if (!items.length) {
    return (
      <div className="vk-empty">
        <div className="vk-emptyTitle">Корзина пуста</div>
        <div className="vk-emptyText">Добавьте товары — они появятся здесь.</div>
        <button
          className="vk-primary"
          onClick={() => nav("/catalog?gender=women&vk=1")}
        >
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="vk-screen">
      <div className="vk-pageHead">
        <div>
          <div className="vk-pageTitle">Корзина</div>
          <div className="vk-pageSub">{items.length} поз.</div>
        </div>
        <div className="vk-total">{total.toLocaleString()} ₽</div>
      </div>

      <div className="vk-cartList">
        {items.map((p) => {
          const imgSrc = p.main_image
            ? `/images/${p.main_image}`
            : `/images/product-${p.product_id}.jpg`;

          const stock = Number(p.stock || 0);
          const qty = Number(p.qty || 1);

          return (
            <div className="vk-cartItem" key={p.id}>
              <Link to={`/product?id=${p.product_id}&vk=1`} className="vk-cartImg">
                <img src={imgSrc} alt={p.title} />
              </Link>

              <div className="vk-cartMeta">
                <div className="vk-cartTitle">{p.title}</div>

                <div className="vk-cartSub">
                  Размер: <b>{p.size === "ONE" ? "ONE SIZE" : p.size}</b> · Остаток:{" "}
                  <b>{stock}</b>
                </div>

                <div className="vk-cartControls">
                  <button
                    className="vk-step"
                    onClick={() => updateQty(p.id, qty - 1, stock)}
                    disabled={qty <= 1}
                  >
                    −
                  </button>

                  <input
                    className="vk-qty"
                    value={qty}
                    onChange={(e) =>
                      updateQty(p.id, Number(e.target.value || 1), stock)
                    }
                    inputMode="numeric"
                  />

                  <button
                    className="vk-step"
                    onClick={() => updateQty(p.id, qty + 1, stock)}
                    disabled={qty >= stock}
                  >
                    +
                  </button>

                  <button className="vk-remove" onClick={() => removeItem(p.id)}>
                    Удалить
                  </button>
                </div>
              </div>

              <div className="vk-cartSum">
                {(Number(p.price) * qty).toLocaleString()} ₽
              </div>
            </div>
          );
        })}
      </div>

      <button className="vk-primary" onClick={() => setCheckoutOpen(true)}>
        Оформить заказ · {total.toLocaleString()} ₽
      </button>

      {checkoutOpen && (
        <div className="vk-sheetOverlay" onMouseDown={() => setCheckoutOpen(false)}>
          <div
            className="vk-sheet vk-checkoutSheet"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="vk-sheetTop">
              <div className="vk-sheetTitle">Оформление заказа</div>
              <button
                className="vk-sheetClose"
                onClick={() => setCheckoutOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="vk-sheetBody vk-checkoutBody">
              <div className="vk-field">
                <label>Имя</label>
                <input
                  className="vk-input"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={onChange}
                  placeholder="Иван"
                />
              </div>

              <div className="vk-field">
                <label>Телефон *</label>
                <input
                  className="vk-input"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="+7 (999) 999-99-99"
                />
              </div>

              <div className="vk-field">
                <label>Email</label>
                <input
                  className="vk-input"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="mail@example.com"
                />
              </div>

              <div className="vk-field">
                <label>Адрес доставки *</label>
                <input
                  className="vk-input"
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  placeholder="Город, улица, дом, кв."
                />
              </div>

              <div className="vk-field">
                <label>Способ оплаты *</label>

                <div className="vk-paymentBox">
                  <div className="vk-paymentTitle">Оплата при получении курьеру</div>

                  <label
                    className={`vk-paymentOption ${
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
                    <span className="vk-paymentOptionText">Наличными курьеру</span>
                  </label>

                  <label
                    className={`vk-paymentOption ${
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
                    <span className="vk-paymentOptionText">Картой курьеру</span>
                  </label>
                </div>
              </div>

              <div className="vk-field">
                <label>Комментарий</label>
                <textarea
                  className="vk-textarea"
                  name="comment"
                  value={form.comment}
                  onChange={onChange}
                  placeholder="Удобное время доставки..."
                />
              </div>

              <div className="vk-sheetTotal">
                <span>Итого</span>
                <b>{total.toLocaleString()} ₽</b>
              </div>

              <button className="vk-primary" onClick={checkout}>
                Подтвердить заказ
              </button>

              <div className="vk-note">
                Оплата производится при получении заказа курьеру. Наличие
                проверяется на сервере при оформлении.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}