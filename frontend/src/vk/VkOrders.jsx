import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const STATUS_LABELS = {
  CREATED: "Создан",
  PAID: "Оплачен",
  SHIPPED: "Отправлен",
  COMPLETED: "Завершён",
  CANCELED: "Отменён",
};

function formatStatus(status) {
  return STATUS_LABELS[status] || status || "Создан";
}

function canReturn(status) {
  return ["PAID", "SHIPPED", "COMPLETED"].includes(status);
}

export default function VkOrders() {
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [itemsByOrder, setItemsByOrder] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
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
      console.error("LOAD ORDERS ERROR:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const loadOrderItems = async (orderId) => {
    if (itemsByOrder[orderId]) return;

    try {
      setLoadingItems((prev) => ({ ...prev, [orderId]: true }));
      const data = await api(`/api/orders/${orderId}/items`, { token });
      setItemsByOrder((prev) => ({
        ...prev,
        [orderId]: Array.isArray(data) ? data : [],
      }));
    } catch (e) {
      console.error("LOAD ORDER ITEMS ERROR:", e);
      setItemsByOrder((prev) => ({
        ...prev,
        [orderId]: [],
      }));
    } finally {
      setLoadingItems((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleOrder = async (orderId) => {
    const nextExpanded = expandedId === orderId ? null : orderId;
    setExpandedId(nextExpanded);

    if (nextExpanded) {
      await loadOrderItems(orderId);
    }

    if (confirmCancelId && confirmCancelId !== orderId) {
      setConfirmCancelId(null);
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
    } catch (e) {
      alert(e.message || "Не удалось отменить заказ");
    } finally {
      setCancelLoadingId(null);
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders]);

  if (!token) {
    return (
      <div className="vk-empty">
        <div className="vk-emptyTitle">Мои заказы</div>
        <div className="vk-emptyText">
          Войдите в аккаунт, чтобы видеть историю заказов.
        </div>
        <button className="vk-primary" onClick={() => nav("/profile?vk=1")}>
          Открыть профиль
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="vk-empty">Загрузка заказов…</div>;
  }

  if (!sortedOrders.length) {
    return (
      <div className="vk-empty">
        <div className="vk-emptyTitle">Заказов пока нет</div>
        <div className="vk-emptyText">
          Когда ты оформишь первый заказ, он появится здесь.
        </div>
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
          <div className="vk-pageTitle">Мои заказы</div>
          <div className="vk-pageSub">{sortedOrders.length} заказ(ов)</div>
        </div>
      </div>

      <div className="vk-ordersList">
        {sortedOrders.map((order) => {
          const isOpen = expandedId === order.id;
          const items = itemsByOrder[order.id] || [];
          const itemsLoading = loadingItems[order.id];
          const isConfirming = confirmCancelId === order.id;
          const isCancelLoading = cancelLoadingId === order.id;

          return (
            <div className="vk-orderCard" key={order.id}>
              <button
                className="vk-orderHead"
                onClick={() => toggleOrder(order.id)}
              >
                <div className="vk-orderHeadLeft">
                  <div className="vk-orderNumber">Заказ #{order.id}</div>
                  <div className="vk-orderMeta">
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <span className="vk-orderDot">•</span>
                    <span>{formatStatus(order.status)}</span>
                  </div>
                </div>

                <div className="vk-orderHeadRight">
                  <div className="vk-orderSum">
                    {Number(order.total_price || 0).toLocaleString()} ₽
                  </div>
                  <div className={`vk-orderArrow ${isOpen ? "open" : ""}`}>⌄</div>
                </div>
              </button>

              {isOpen && (
                <div className="vk-orderBody">
                  <div className="vk-orderInfo">
                    <div>
                      <b>Получатель:</b> {order.customer_name || "—"}
                    </div>
                    <div>
                      <b>Телефон:</b> {order.phone || "—"}
                    </div>
                    <div>
                      <b>Email:</b> {order.email || "—"}
                    </div>
                    <div>
                      <b>Адрес:</b> {order.address || "—"}
                    </div>
                    {order.comment ? (
                      <div>
                        <b>Комментарий:</b> {order.comment}
                      </div>
                    ) : null}
                  </div>

                  <div className="vk-orderItemsTitle">Состав заказа</div>

                  {itemsLoading ? (
                    <div className="vk-orderLoading">Загрузка позиций…</div>
                  ) : items.length === 0 ? (
                    <div className="vk-orderLoading">Позиции не найдены</div>
                  ) : (
                    <div className="vk-orderItems">
                      {items.map((item, idx) => (
                        <div className="vk-orderItem" key={item.id || idx}>
                          <div className="vk-orderItemLeft">
                            <div className="vk-orderItemTitle">{item.title}</div>
                            <div className="vk-orderItemMeta">
                              Размер: {item.size === "ONE" ? "ONE SIZE" : item.size} ·
                              Кол-во: {item.qty}
                            </div>
                          </div>
                          <div className="vk-orderItemRight">
                            {(Number(item.price) * Number(item.qty)).toLocaleString()} ₽
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="vk-orderActions">
                    {order.status !== "CANCELED" && !isConfirming && (
                      <button
                        className="vk-ghost"
                        onClick={() => setConfirmCancelId(order.id)}
                      >
                        Отменить заказ
                      </button>
                    )}

                    {order.status !== "CANCELED" && isConfirming && (
                      <div className="vk-inlineConfirm">
                        <div className="vk-inlineConfirmText">
                          Отменить заказ и вернуть товары в наличие?
                        </div>
                        <div className="vk-inlineConfirmActions">
                          <button
                            className="vk-ghost"
                            onClick={() => setConfirmCancelId(null)}
                            disabled={isCancelLoading}
                          >
                            Нет
                          </button>
                          <button
                            className="vk-primary"
                            onClick={() => cancelOrder(order.id)}
                            disabled={isCancelLoading}
                          >
                            {isCancelLoading ? "Отмена..." : "Да, отменить"}
                          </button>
                        </div>
                      </div>
                    )}

                    {canReturn(order.status) && order.status !== "CANCELED" && (
                      <button
                        className="vk-primary"
                        onClick={() => nav("/returns?vk=1")}
                      >
                        Оформить возврат
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}