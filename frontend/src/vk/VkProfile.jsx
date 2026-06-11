import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import vkBridge from "@vkontakte/vk-bridge";
import { api } from "../api";
import { isVkMiniApp } from "../utils/appMode";

const PROFILE_CACHE_KEY = "vk_profile_cache";

export default function VkProfile() {
  const nav = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(() => {
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [errorText, setErrorText] = useState("");
  const [authStarted, setAuthStarted] = useState(false);

  const [siteAuthForm, setSiteAuthForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const saveProfileCache = (user) => {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(user));
    } catch {}
  };

  const clearProfileCache = () => {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {}
  };

  const clearAuth = () => {
    localStorage.removeItem("token");
    clearProfileCache();
    setToken(null);
    setMe(null);
  };

  const loadMe = async (authToken, { silent = false } = {}) => {
    if (!authToken) {
      if (!silent) setLoading(false);
      return false;
    }

    try {
      if (!silent) setLoading(true);
      setErrorText("");

      const data = await api("/api/auth/me", { token: authToken });

      setMe(data);
      saveProfileCache(data);

      setSiteAuthForm((prev) => ({
        ...prev,
        email: data?.email || "",
      }));

      return true;
    } catch (e) {
      console.error("LOAD ME ERROR:", e);

      if (!me) {
        setErrorText(e.message || "Не удалось загрузить профиль");
      }

      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const vkLogin = async () => {
    try {
      setLoading(true);
      setErrorText("");
      const userInfo = await vkBridge.send("VKWebAppGetUserInfo");
      const data = await api("/api/auth/vk", {
        method: "POST",
        body: {
          vk_user_id: userInfo.id,
          first_name: userInfo.first_name,
          last_name: userInfo.last_name,
          photo_100: userInfo.photo_100,
          photo_200: userInfo.photo_200,
        },
      });

      if (!data?.token) {
        throw new Error("Сервер не вернул токен");
      }
      localStorage.setItem("token", data.token);
      setToken(data.token);
      const ok = await loadMe(data.token, { silent: true });

      if (!ok && data.user) {
        setMe(data.user);
        saveProfileCache(data.user);
      }
    } catch (e) {
      console.error("VK LOGIN FRONT ERROR:", e);
      setErrorText(e.message || "Не удалось выполнить вход через VK");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStarted) return;
    setAuthStarted(true);

    const run = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        setToken(storedToken);

        const ok = await loadMe(storedToken);

        if (!ok && !me) {
          setErrorText("Не удалось обновить профиль. Проверьте соединение.");
        }
        return;
      }

      if (isVkMiniApp()) {
        await vkLogin();
        return;
      }

      setLoading(false);
      setErrorText("Открытие профиля доступно только в VK Mini App");
    };

    run();

  }, [authStarted]);

  const retryProfile = async () => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      await loadMe(storedToken);
      return;
    }

    await vkLogin();
  };

  const onSiteAuthChange = (e) => {
    setSiteAuthForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const saveSiteAuth = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    const email = siteAuthForm.email.trim();
    const password = siteAuthForm.password;
    const confirmPassword = siteAuthForm.confirmPassword;

    if (!email) {
      alert("Укажите email");
      return;
    }

    if (!password) {
      alert("Укажите пароль");
      return;
    }

    if (password.length < 6) {
      alert("Пароль должен быть не короче 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    try {
      const updated = await api("/api/auth/bind-site-auth", {
        method: "PATCH",
        token: currentToken,
        body: { email, password },
      });

      const nextUser = {
        ...me,
        ...updated,
        has_password: true,
      };

      setMe(nextUser);
      saveProfileCache(nextUser);

      setSiteAuthForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      alert("Доступ для сайта успешно сохранён");
    } catch (e) {
      alert(e.message || "Ошибка сохранения доступа для сайта");
    }
  };

  const logout = () => {
    clearAuth();
    setErrorText("");

    if (isVkMiniApp()) {
      nav("/profile?vk=1", { replace: true });
    } else {
      nav("/profile", { replace: true });
    }
  };

  const roleTitle = useMemo(() => {
    if (!me?.role) return "Покупатель";
    if (me.role === "ADMIN") return "Администратор";
    if (me.role === "PRODUCT_MANAGER") return "Менеджер товаров";
    if (me.role === "SALES_MANAGER") return "Менеджер продаж";
    if (me.role === "RETURNS_MANAGER") return "Менеджер возвратов";
    return "Покупатель";
  }, [me]);

  if (loading && !me) {
    return <div className="vk-empty">Загрузка…</div>;
  }

  if (!me) {
    return (
      <div className="vk-screen">
        <div className="vk-authCard">
          <div className="vk-pageTitle">Профиль</div>
          <div className="vk-pageSub">
            {errorText || "Не удалось загрузить профиль"}
          </div>

          <button className="vk-primary" onClick={retryProfile}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const initials = (me.first_name?.[0] || "A").toUpperCase();
  const needsSiteAuth = !me.email || !me.has_password;

  return (
    <div className="vk-screen">
      {!!errorText && (
        <div className="vk-note" style={{ marginBottom: 12 }}>
          {errorText}
        </div>
      )}

      <div className="vk-profileCard2">
        <div className="vk-avatar2">
          {me.avatar_url ? (
            <img
              src={me.avatar_url}
              alt={me.first_name || "avatar"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            initials
          )}
        </div>

        <div className="vk-profileInfo">
          <div className="vk-profileName2">
            {me.first_name} {me.last_name}
          </div>

          <div className="vk-profileMeta2">
            {me.email || "email ещё не привязан"}
          </div>

          <div className="vk-profileMeta2">
            {me.phone || "телефон не указан"}
          </div>

          <div className="vk-profileBadges">
            <span className="vk-pill">{roleTitle}</span>
            <span className="vk-pillSoft">
              c {new Date(me.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <button className="vk-logout" onClick={logout}>
          Выйти
        </button>
      </div>

      {needsSiteAuth && (
        <div className="vk-staffBox">
          <div className="vk-staffTitle">Доступ на сайт</div>
          <div className="vk-staffSub">
            Привяжи email и задай пароль, чтобы потом входить в аккаунт на сайте.
          </div>

          <div className="vk-authGrid">
            <input
              className="vk-input"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={siteAuthForm.email}
              onChange={onSiteAuthChange}
            />

            <input
              className="vk-input"
              type="password"
              name="password"
              placeholder="Пароль"
              value={siteAuthForm.password}
              onChange={onSiteAuthChange}
            />

            <input
              className="vk-input"
              type="password"
              name="confirmPassword"
              placeholder="Повторите пароль"
              value={siteAuthForm.confirmPassword}
              onChange={onSiteAuthChange}
            />
          </div>

          <button className="vk-primary" onClick={saveSiteAuth}>
            Сохранить доступ для сайта
          </button>

          <div className="vk-note">
            После этого ты сможешь войти на сайте по email и паролю.
          </div>
        </div>
      )}

      {!needsSiteAuth && (
        <div className="vk-staffBox">
          <div className="vk-staffTitle">Доступ на сайт настроен</div>
          <div className="vk-staffSub">
            Ты уже можешь входить на сайте по email и паролю.
          </div>
        </div>
      )}

      <div className="vk-actionsGrid">
        <button className="vk-btn" onClick={() => nav("/orders?vk=1")}>
          Мои заказы
        </button>

      </div>
    </div>
  );
}