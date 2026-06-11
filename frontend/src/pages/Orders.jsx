import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Orders() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [loading, setLoading] = useState(true);

  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  const loadOrders = async () => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api("/api/orders/my", { token });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const toggleOrder = async (id) => {
    if (openId === id) {
      setOpenId(null);
      setConfirmCancelId(null);
      return;
    }

    setOpenId(id);
    setConfirmCancelId(null);

    if (itemsByOrder[id]) return;

    try {
      const items = await api(`/api/orders/${id}/items`, { token });
      setItemsByOrder((prev) => ({
        ...prev,
        [id]: Array.isArray(items) ? items : [],
      }));
    } catch (e) {
      console.error(e);
      alert("Не удалось загрузить состав заказа");
    }
  };

  const cancelOrder = async (orderId) => {
    if (!token) return;

    try {
      setCancelLoadingId(orderId);

      const result = await api(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
        token,
      });

      const updatedOrder = result?.order || result;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...(updatedOrder || {}),
                status: "CANCELED",
              }
            : order
        )
      );

      setConfirmCancelId(null);
      alert("Заказ отменён. Товары возвращены в наличие.");
    } catch (e) {
      alert(e.message || "Не удалось отменить заказ");
    } finally {
      setCancelLoadingId(null);
    }
  };

  if (!token) {
    return (
      <section className="orders-page">
        <div className="orders-empty">
          <h2>Войдите в аккаунт</h2>
          <p>Чтобы видеть историю заказов.</p>
          <button className="orders-primary" onClick={() => navigate("/profile")}>
            Войти
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <div className="orders-top">
        <div>
          <h1>Мои заказы</h1>
          <p className="orders-subtitle">
            {loading
              ? "Загрузка…"
              : `${orders.length} ${declOfNum(orders.length, [
                  "заказ",
                  "заказа",
                  "заказов",
                ])}`}
          </p>
        </div>

        <button className="orders-ghost" onClick={() => navigate("/profile")}>
          ← В профиль
        </button>
      </div>

      {loading ? (
        <div className="orders-empty">
          <h2>Загрузка…</h2>
          <p>Ищем ваши заказы.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">
          <h2>Пока нет заказов</h2>
          <p>Оформите первый заказ — и он появится здесь.</p>
          <button className="orders-primary" onClick={() => navigate("/")}>
            Перейти на главную
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((o) => {
            const isOpen = openId === o.id;
            const items = itemsByOrder[o.id] || [];
            const isCanceled = normalizeStatus(o.status) === "CANCELED";
            const isConfirming = confirmCancelId === o.id;
            const isCancelLoading = cancelLoadingId === o.id;

            return (
              <div className={`order-card ${isOpen ? "open" : ""}`} key={o.id}>
                <button className="order-head" onClick={() => toggleOrder(o.id)}>
                  <div className="order-left">
                    <div className="order-number">Заказ #{o.id}</div>
                    <div className="order-meta">
                      <span>{new Date(o.created_at).toLocaleDateString()}</span>
                      <span className={`order-status st-${normalizeStatus(o.status).toLowerCase()}`}>
                        {statusRu(o.status)}
                      </span>
                    </div>
                  </div>

                  <div className="order-right">
                    <div className="order-sum">
                      {Number(o.total_price).toLocaleString()} ₽
                    </div>
                    <div className="order-arrow">{isOpen ? "−" : "+"}</div>
                  </div>
                </button>

                {isOpen && (
                  <div className="order-body">
                    <div className="order-info">
                      <div>
                        <b>Доставка:</b> {o.address || "—"}
                      </div>
                      <div>
                        <b>Телефон:</b> {o.phone || "—"}
                      </div>
                      <div>
                        <b>Email:</b> {o.email || "—"}
                      </div>
                      <div>
                        <b>Комментарий:</b> {o.comment || "—"}
                      </div>
                    </div>

                    <div className="order-items">
                      <div className="order-items-title">Состав заказа</div>

                      {items.length === 0 ? (
                        <div className="order-items-empty">Загрузка позиций…</div>
                      ) : (
                        items.map((it) => (
                          <div className="order-item" key={it.id}>
                            <div className="order-item-left">
                              <div className="order-item-title">{it.title}</div>
                              <div className="order-item-meta">
                                Размер: <b>{it.size === "ONE" ? "ONE SIZE" : it.size}</b> ·
                                Кол-во: <b>{it.qty}</b>
                              </div>
                            </div>

                            <div className="order-item-right">
                              {(Number(it.price) * Number(it.qty)).toLocaleString()} ₽
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="order-actions">
                      {!isCanceled && !isConfirming && (
                        <button
                          className="orders-ghost"
                          onClick={() => setConfirmCancelId(o.id)}
                        >
                          Отменить заказ
                        </button>
                      )}

                      {!isCanceled && isConfirming && (
                        <div className="order-cancel-confirm">
                          <div className="order-cancel-text">
                            Отменить заказ и вернуть товары в наличие?
                          </div>

                          <div className="order-cancel-actions">
                            <button
                              className="orders-ghost"
                              onClick={() => setConfirmCancelId(null)}
                              disabled={isCancelLoading}
                            >
                              Нет
                            </button>

                            <button
                              className="orders-primary"
                              onClick={() => cancelOrder(o.id)}
                              disabled={isCancelLoading}
                            >
                              {isCancelLoading ? "Отмена..." : "Да, отменить"}
                            </button>
                          </div>
                        </div>
                      )}

                      {isCanceled && (
                        <div className="order-canceled-note">
                          Заказ отменён, товары возвращены в наличие.
                        </div>
                      )}

                      <button className="orders-primary" onClick={() => navigate("/")}>
                        Продолжить покупки
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function normalizeStatus(status) {
  return String(status || "").toUpperCase();
}

function statusRu(status) {
  const s = normalizeStatus(status);

  if (s === "CREATED") return "Создан";
  if (s === "PAID") return "Оплачен";
  if (s === "SHIPPED") return "Отправлен";
  if (s === "COMPLETED") return "Завершён";
  if (s === "CANCELED") return "Отменён";

  return status || "—";
}

function declOfNum(n, forms) {
  n = Math.abs(n) % 100;
  const n1 = n % 10;

  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];

  return forms[2];
}