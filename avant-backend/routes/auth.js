import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role || "CUSTOMER" },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

router.post("/register", async (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;

  try {
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: "Заполните обязательные поля" });
    }

    const exist = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (exist.rows.length) {
      return res.status(400).json({ error: "Email уже используется" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await pool.query(
      `INSERT INTO users (
        email,
        password,
        first_name,
        last_name,
        phone,
        auth_provider
      )
      VALUES ($1, $2, $3, $4, $5, 'email')
      RETURNING id, email, first_name, last_name, phone, role, created_at, vk_user_id, avatar_url, auth_provider`,
      [email, hash, first_name, last_name, phone || null]
    );

    const token = signToken(user.rows[0]);

    res.json({ token, user: user.rows[0] });
  } catch (e) {
    console.log("REGISTER ERROR:", e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (!user.rows.length) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const dbUser = user.rows[0];

    if (!dbUser.password) {
      return res.status(400).json({
        error:
          "Для этого аккаунта пароль ещё не задан. Откройте VK mini app и привяжите email и пароль.",
      });
    }

    const valid = await bcrypt.compare(password, dbUser.password);
    if (!valid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const token = signToken(dbUser);

    res.json({
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        phone: dbUser.phone,
        role: dbUser.role,
        created_at: dbUser.created_at,
        vk_user_id: dbUser.vk_user_id,
        avatar_url: dbUser.avatar_url,
        auth_provider: dbUser.auth_provider,
      },
    });
  } catch (e) {
    console.log("LOGIN ERROR:", e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/vk", async (req, res) => {
  const { vk_user_id, first_name, last_name, photo_100, photo_200 } = req.body;
  try {
    if (!vk_user_id) {
      return res.status(400).json({ error: "Не передан vk_user_id" });
    }
    const avatar = photo_200 || photo_100 || null;
    const existing = await pool.query(
      "SELECT * FROM users WHERE vk_user_id = $1",
      [vk_user_id]
    );
    let user;
    if (existing.rows.length) {
      const updated = await pool.query(
        `UPDATE users
         SET first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             avatar_url = COALESCE($4, avatar_url)
         WHERE vk_user_id = $1
         RETURNING id, email, first_name, last_name, phone, role, created_at, vk_user_id, avatar_url, auth_provider`,
        [vk_user_id, first_name || null, last_name || null, avatar]
      );
      user = updated.rows[0];
    } else {
      const created = await pool.query(
        `INSERT INTO users (
          email,
          password,
          first_name,
          last_name,
          phone,
          vk_user_id,
          avatar_url,
          auth_provider
        )
        VALUES ($1, NULL, $2, $3, NULL, $4, $5, 'vk')
        RETURNING id, email, first_name, last_name, phone, role, created_at, vk_user_id, avatar_url, auth_provider`,
        [null, first_name || "Пользователь", last_name || "", vk_user_id, avatar]
      );

      user = created.rows[0];
    }

    const token = signToken(user);

    res.json({ token, user });
  } catch (e) {
    console.log("VK LOGIN ERROR:", e);
    res.status(500).json({
      error: "Ошибка VK-авторизации",
      details: e.message,
    });
  }
});

router.patch("/bind-site-auth", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Нет токена" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Укажите email и пароль" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Пароль должен быть не короче 6 символов" });
    }

    const duplicate = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id <> $2",
      [email, decoded.id]
    );

    if (duplicate.rows.length) {
      return res.status(400).json({ error: "Этот email уже занят" });
    }

    const hash = await bcrypt.hash(password, 10);

    const updated = await pool.query(
      `UPDATE users
       SET email = $1,
           password = $2
       WHERE id = $3
       RETURNING id, email, first_name, last_name, phone, role, created_at, vk_user_id, avatar_url, auth_provider`,
      [email, hash, decoded.id]
    );

    res.json(updated.rows[0]);
  } catch (e) {
    console.log("BIND SITE AUTH ERROR:", e);
    res.status(500).json({ error: "Ошибка привязки доступа для сайта" });
  }
});

router.patch("/set-password", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Нет токена" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Укажите пароль" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Пароль должен быть не короче 6 символов" });
    }

    const hash = await bcrypt.hash(password, 10);

    const updated = await pool.query(
      `UPDATE users
       SET password = $1
       WHERE id = $2
       RETURNING id, email, first_name, last_name, phone, role, created_at, vk_user_id, avatar_url, auth_provider`,
      [hash, decoded.id]
    );

    res.json(updated.rows[0]);
  } catch (e) {
    console.log("SET PASSWORD ERROR:", e);
    res.status(500).json({ error: "Ошибка сохранения пароля" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await pool.query(
      `SELECT
         id,
         email,
         first_name,
         last_name,
         phone,
         role,
         created_at,
         vk_user_id,
         avatar_url,
         auth_provider,
         CASE WHEN password IS NOT NULL THEN true ELSE false END AS has_password
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (!user.rows.length) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json(user.rows[0]);
  } catch (e) {
    console.log("ME ERROR:", e);
    res.sendStatus(401);
  }
});

export default router;