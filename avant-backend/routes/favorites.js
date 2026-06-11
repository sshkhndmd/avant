import express from "express";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const favs = await pool.query(
      `
      SELECT p.*
      FROM favorites f
      JOIN products p ON p.id = f.product_id
      WHERE f.user_id = $1
      `,
      [req.userId]
    );

    res.json(favs.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка загрузки избранного" });
  }
});

router.post("/:productId", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    await pool.query(
      `
      INSERT INTO favorites (user_id, product_id)
      VALUES ($1,$2)
      ON CONFLICT DO NOTHING
      `,
      [req.userId, productId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка добавления в избранное" });
  }
});


router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    await pool.query(
      `
      DELETE FROM favorites
      WHERE user_id=$1 AND product_id=$2
      `,
      [req.userId, productId]
    );

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка удаления из избранного" });
  }
});

export default router;