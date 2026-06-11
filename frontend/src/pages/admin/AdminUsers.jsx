import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

const ROLES = ["CUSTOMER", "ADMIN", "PRODUCT_MANAGER", "SALES_MANAGER", "RETURNS_MANAGER"];

export default function AdminUsers() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api("/api/admin/users", { token });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setUsers([]);
      alert(e.message || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setRole = async (id, role) => {
    if (!token) return;

    try {
      await api(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        token,
        body: { role },
      });
      load();
    } catch (e) {
      console.error(e);
      alert(e.message || "Не удалось изменить роль");
    }
  };

  if (!token) {
    return (
      <section className="admin-page">
        <div className="admin-top">
          <h1>Пользователи и роли</h1>
          <p>Нужна авторизация</p>
        </div>

        <div className="orders-empty">
          <h2>Войдите в аккаунт</h2>
          <p>Чтобы управлять ролями пользователей.</p>
          <button className="orders-primary" onClick={() => navigate("/profile")}>
            Войти
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-top">
        <h1>Пользователи и роли</h1>
        <p>{loading ? "Загрузка…" : `${users.length} пользователей`}</p>
      </div>

      <div className="admin-table">
        <div className="admin-row admin-head">
          <div>ID</div>
          <div>Email</div>
          <div>Имя</div>
          <div>Роль</div>
        </div>

        {loading ? (
          <div className="orders-empty">
            <h2>Загрузка…</h2>
            <p>Получаем список пользователей.</p>
          </div>
        ) : users.length === 0 ? (
          <div className="orders-empty">
            <h2>Пока пусто</h2>
            <p>Пользователи не найдены.</p>
          </div>
        ) : (
          users.map((u) => (
            <div className="admin-row" key={u.id}>
              <div>{u.id}</div>
              <div>{u.email}</div>
              <div>
                {(u.first_name || "")} {(u.last_name || "")}
              </div>
              <div>
                <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                  {ROLES.map((r) => (
                    <option value={r} key={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}