import express from "express";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.product_id,
        c.size,
        c.qty,
        p.title,
        p.price,
        p.main_image,
        ps.stock
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
      JOIN product_sizes ps ON ps.product_id = c.product_id AND ps.size = c.size
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка загрузки корзины" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { product_id, size, qty } = req.body;

    if (!product_id || !size || !qty) {
      return res.status(400).json({ error: "product_id, size, qty обязательны" });
    }

    const addQty = Number(qty);
    if (!Number.isFinite(addQty) || addQty <= 0) {
      return res.status(400).json({ error: "qty должен быть числом > 0" });
    }

    const stockRes = await pool.query(
      `SELECT stock FROM product_sizes WHERE product_id=$1 AND size=$2`,
      [product_id, size]
    );

    if (!stockRes.rows.length) {
      return res.status(400).json({ error: "Размер не найден" });
    }

    const stock = Number(stockRes.rows[0].stock);

    if (addQty > stock) {
      return res
        .status(400)
        .json({ error: `Недостаточно на складе. Остаток: ${stock}` });
    }

    await pool.query(
      `
      INSERT INTO cart_items (user_id, product_id, size, qty)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id, product_id, size)
      DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty
      `,
      [userId, product_id, size, addQty]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка добавления в корзину" });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { qty } = req.body;

    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) {
      return res.status(400).json({ error: "qty должен быть числом > 0" });
    }

    const itemRes = await pool.query(
      `SELECT product_id, size FROM cart_items WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );
    if (!itemRes.rows.length) return res.sendStatus(404);

    const { product_id, size } = itemRes.rows[0];

    const stockRes = await pool.query(
      `SELECT stock FROM product_sizes WHERE product_id=$1 AND size=$2`,
      [product_id, size]
    );
    const stock = Number(stockRes.rows[0]?.stock ?? 0);

    if (q > stock) {
      return res
        .status(400)
        .json({ error: `Недостаточно на складе. Остаток: ${stock}` });
    }

    await pool.query(
      `UPDATE cart_items SET qty=$1 WHERE id=$2 AND user_id=$3`,
      [q, id, userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка изменения количества" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    await pool.query(
      `DELETE FROM cart_items WHERE id=$1 AND user_id=$2`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка удаления из корзины" });
  }
});

export default router;