import express from "express";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/checkout", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const {
    customer_name,
    phone,
    email,
    address,
    comment,
    payment_method,
    payment_type,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartRes = await client.query(
      `
      SELECT c.id, c.product_id, c.size, c.qty, p.title, p.price
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = $1
      ORDER BY c.id
      `,
      [userId]
    );

    const cart = cartRes.rows;

    if (!cart.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Корзина пуста" });
    }

    if (!phone || !address) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Укажите телефон и адрес доставки" });
    }

    if (payment_method !== "COURIER_ON_DELIVERY") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Выберите способ оплаты" });
    }

    if (!["CASH", "CARD"].includes(payment_type)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Выберите: наличными или картой курьеру" });
    }

    for (const item of cart) {
      const stockRes = await client.query(
        `
        SELECT stock
        FROM product_sizes
        WHERE product_id = $1 AND size = $2
        FOR UPDATE
        `,
        [item.product_id, item.size]
      );

      if (!stockRes.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Размер ${item.size} не найден для товара #${item.product_id}`,
        });
      }

      const stock = Number(stockRes.rows[0].stock);

      if (Number(item.qty) > stock) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Недостаточно на складе: "${item.title}" размер ${item.size}. Остаток: ${stock}`,
        });
      }
    }

    const total = cart.reduce(
      (sum, i) => sum + Number(i.price) * Number(i.qty),
      0
    );

    const orderRes = await client.query(
      `
      INSERT INTO orders (
        user_id,
        total_price,
        status,
        customer_name,
        phone,
        email,
        address,
        comment,
        payment_method,
        payment_type
      )
      VALUES ($1, $2, 'CREATED', $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, status
      `,
      [
        userId,
        total,
        customer_name || null,
        phone || null,
        email || null,
        address || null,
        comment || null,
        payment_method,
        payment_type,
      ]
    );

    const orderId = orderRes.rows[0].id;

    for (const item of cart) {
      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, title, size, price, qty)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          orderId,
          item.product_id,
          item.title,
          item.size,
          item.price,
          item.qty,
        ]
      );

      await client.query(
        `
        UPDATE product_sizes
        SET stock = stock - $1
        WHERE product_id = $2 AND size = $3
        `,
        [item.qty, item.product_id, item.size]
      );
    }

    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

    await client.query("COMMIT");

    res.json({
      success: true,
      order_id: orderId,
      status: "CREATED",
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("CHECKOUT ERROR:", e);
    res.status(500).json({ error: "Ошибка оформления заказа" });
  } finally {
    client.release();
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const ordersRes = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(ordersRes.rows);
  } catch (e) {
    console.error("LOAD MY ORDERS ERROR:", e);
    res.status(500).json({ error: "Ошибка загрузки заказов" });
  }
});

router.get("/:id/items", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const own = await pool.query(
      `SELECT id FROM orders WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (!own.rows.length) {
      return res.status(404).json({ error: "Заказ не найден" });
    }

    const items = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id`,
      [id]
    );

    res.json(items.rows);
  } catch (e) {
    console.error("LOAD ORDER ITEMS ERROR:", e);
    res.status(500).json({ error: "Ошибка загрузки позиций заказа" });
  }
});

router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const orderId = Number(req.params.id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1 AND user_id = $2
      FOR UPDATE
      `,
      [orderId, userId]
    );

    if (!orderResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Заказ не найден" });
    }

    const order = orderResult.rows[0];

    if (order.status === "CANCELED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Заказ уже отменён" });
    }

    const itemsResult = await client.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    const items = itemsResult.rows;

    for (const item of items) {
      const updateRes = await client.query(
        `
        UPDATE product_sizes
        SET stock = stock + $1
        WHERE product_id = $2 AND size = $3
        RETURNING id
        `,
        [item.qty, item.product_id, item.size]
      );

      if (!updateRes.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Не найден размер ${item.size} для товара #${item.product_id}`,
        });
      }
    }

    const updatedOrder = await client.query(
      `
      UPDATE orders
      SET status = 'CANCELED'
      WHERE id = $1
      RETURNING *
      `,
      [orderId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      order: updatedOrder.rows[0],
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("CANCEL ORDER ERROR:", e);
    res.status(500).json({
      error: "Ошибка отмены заказа",
      details: e.message,
    });
  } finally {
    client.release();
  }
});

export default router;