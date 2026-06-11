import express from "express";
import { pool } from "../db.js";
import authMiddleware, { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  const u = await pool.query(
    `SELECT id, email, first_name, last_name, phone, role, created_at
     FROM users ORDER BY id DESC`
  );
  res.json(u.rows);
});

router.patch("/users/:id/role", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowed = ["CUSTOMER", "ADMIN", "PRODUCT_MANAGER", "SALES_MANAGER", "RETURNS_MANAGER"];
  if (!allowed.includes(role)) return res.status(400).json({ error: "Неверная роль" });

  await pool.query(`UPDATE users SET role=$1 WHERE id=$2`, [role, id]);
  res.json({ success: true });
});

export default router;
