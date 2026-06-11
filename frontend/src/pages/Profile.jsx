import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import Footer from "../components/Footer";

export default function Profile() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const token = localStorage.getItem("token");
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    api("/api/auth/me", { token })
      .then(setUser)
      .catch(() => setUser(null));
  }, [token]);

  const submit = async () => {
    try {
      const data = await api(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        body: form,
      });

      if (data?.token) {
        localStorage.setItem("token", data.token);
        window.location.reload();
      } else {
        alert(data?.error || "Ошибка");
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "Ошибка запроса");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const roleTitle = useMemo(() => {
    if (!user?.role) return "";
    if (user.role === "ADMIN") return "Администратор";
    if (user.role === "PRODUCT_MANAGER") return "Менеджер товаров";
    if (user.role === "SALES_MANAGER") return "Менеджер продаж";
    if (user.role === "RETURNS_MANAGER") return "Менеджер возвратов";
    return "Покупатель";
  }, [user]);

  const isStaff = user && user.role && user.role !== "CUSTOMER";

  const staffActions = useMemo(() => {
    if (!isStaff) return [];

    if (user.role === "ADMIN") {
      return [
        { label: "Пользователи", hint: "Роли, доступы, управление", to: "/admin/users" },
        { label: "Товары", hint: "Карточки, NEW, остатки", to: "/admin/products" },
      ];
    }

    if (user.role === "PRODUCT_MANAGER") {
      return [{ label: "Товары", hint: "Добавление, NEW, остатки", to: "/admin/products" }];
    }

    if (user.role === "SALES_MANAGER") {
      return [{ label: "Цены", hint: "Правка цен и промо", to: "/admin/products" }];
    }



    return [];
  }, [isStaff, user]);

  return (
    <>
      <Header openMenu={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} close={() => setMenuOpen(false)} />

      <section className="profile-page">
        {!token ? (
          <div className="auth-box">
            <h1>{isLogin ? "Вход" : "Регистрация"}</h1>

            {!isLogin && (
              <>
                <input name="first_name" placeholder="Имя" onChange={handleChange} />
                <input name="last_name" placeholder="Фамилия" onChange={handleChange} />
                <input name="phone" placeholder="+7 (___) ___-__-__" onChange={handleChange} />
              </>
            )}

            <input name="email" placeholder="Email" onChange={handleChange} />
            <input type="password" name="password" placeholder="Пароль" onChange={handleChange} />

            <button onClick={submit}>{isLogin ? "Войти" : "Создать аккаунт"}</button>

            <p className="switch-auth" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
            </p>
          </div>
        ) : user ? (
          <div className={`profile-box ${isStaff ? "staff" : ""}`}>
            <div className="profile-top">
              <div>
                <h1>{isStaff ? "Панель управления" : "Личный кабинет"}</h1>
                <p className="profile-subtitle">
                  {isStaff ? "Доступ к внутренним разделам магазина" : "Профиль, заказы, сохранённые товары"}
                </p>
              </div>

              <button className="logout-btn" onClick={logout}>
                Выйти
              </button>
            </div>

            <div className="profile-card">
              <div className="profile-avatar">
                {user.first_name?.[0]?.toUpperCase() || "A"}
              </div>

              <div className="profile-main">
                <div className="profile-name">
                  {user.first_name} {user.last_name}
                </div>

                <div className="profile-meta">
                  <span>{user.email}</span>
                  <span>·</span>
                  <span>{user.phone || "телефон не указан"}</span>
                </div>

                <div className="profile-badges">
                  <span className={`badge-role role-${user.role}`}>{roleTitle}</span>
                  <span className="badge-soft">
                    с {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {isStaff ? (
              <>
                <div className="staff-grid">
                  {staffActions.map((a) => (
                    <button key={a.to} className="staff-tile" onClick={() => navigate(a.to)}>
                      <div className="staff-tile-title">{a.label}</div>
                      <div className="staff-tile-hint">{a.hint}</div>
                      <div className="staff-tile-go">Открыть →</div>
                    </button>
                  ))}

                  <div className="staff-kpi">
                    <div className="staff-kpi-title">Сводка</div>
                    <div className="staff-kpi-row">
                      <span>Роль:</span> <b>{roleTitle}</b>
                    </div>
                    <div className="staff-kpi-row">
                      <span>Доступ:</span> <b>Внутренние разделы</b>
                    </div>
                    <div className="staff-kpi-row">
                      <span>Сессия:</span> <b>Активна</b>
                    </div>

                    <div className="staff-kpi-note">
                    </div>
                  </div>
                </div>

                <div className="staff-footer">
                  <button className="profile-ghost" onClick={() => navigate("/")}>
                    Перейти на витрину
                  </button>
                  {user.role === "ADMIN" && (
                    <button className="profile-primary" onClick={() => navigate("/admin/users")}>
                      Управлять ролями
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="profile-links">
                  <button onClick={() => navigate("/orders")}>Мои заказы</button>
                </div>


              </>
            )}
          </div>
        ) : (
          <div className="auth-box">
            <h1>Загрузка…</h1>
          </div>
        )}
      </section>

    </>
  );
}