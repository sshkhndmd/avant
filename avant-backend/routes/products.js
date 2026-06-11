import express from "express";
import { pool } from "../db.js";
import authMiddleware, { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();


router.patch(
  "/:id/new",
  authMiddleware,
  requireRole("ADMIN", "PRODUCT_MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { is_new } = req.body;

      await pool.query(`UPDATE products SET is_new=$1 WHERE id=$2`, [
        Boolean(is_new),
        id,
      ]);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка обновления NEW" });
    }
  }
);

router.patch(
  "/:id/price",
  authMiddleware,
  requireRole("ADMIN", "SALES_MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { price } = req.body;

      const p = Number(price);
      if (!Number.isFinite(p) || p <= 0) {
        return res.status(400).json({ error: "Некорректная цена" });
      }

      await pool.query(`UPDATE products SET price=$1 WHERE id=$2`, [p, id]);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка обновления цены" });
    }
  }
);

router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN", "PRODUCT_MANAGER"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        price,
        category,
        gender,
        is_new,
        main_image,
        category_women,
        category_men,
      } = req.body;

      if (!title || !price) {
        return res.status(400).json({ error: "title и price обязательны" });
      }

      const p = Number(price);
      if (!Number.isFinite(p) || p <= 0) {
        return res.status(400).json({ error: "Некорректная цена" });
      }

      if (gender === "unisex") {
        if (!category_women || !category_men) {
          return res.status(400).json({
            error:
              "Для unisex товара нужно указать category_women и category_men (категории для женщин и мужчин).",
          });
        }
      } else {
        if (!category) {
          return res.status(400).json({ error: "category обязательна" });
        }
      }

      const result = await pool.query(
        `
        INSERT INTO products
          (title, description, price, category, gender, is_new, main_image, category_women, category_men, is_active)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9, true)
        RETURNING id
        `,
        [
          title,
          description || null,
          p,
          gender === "unisex" ? null : category,
          gender || null,
          Boolean(is_new),
          main_image || null,
          gender === "unisex" ? category_women : null,
          gender === "unisex" ? category_men : null,
        ]
      );

      const productId = result.rows[0].id;


      if (main_image && String(main_image).trim()) {
        await pool.query(
          `
          INSERT INTO product_images (product_id, image_url)
          VALUES ($1,$2)
          ON CONFLICT DO NOTHING
          `,
          [productId, String(main_image).trim()]
        );
      }

      res.json({ success: true, id: productId });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка создания товара" });
    }
  }
);


router.post(
  "/:id/sizes",
  authMiddleware,
  requireRole("ADMIN", "PRODUCT_MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { sizes } = req.body;

      if (!Array.isArray(sizes) || sizes.length === 0) {
        return res.status(400).json({ error: "sizes должен быть массивом" });
      }

      await pool.query(`DELETE FROM product_sizes WHERE product_id=$1`, [id]);

      for (const s of sizes) {
        if (!s?.size) continue;
        const stock = Number(s.stock || 0);

        await pool.query(
          `INSERT INTO product_sizes (product_id, size, stock) VALUES ($1,$2,$3)`,
          [id, String(s.size).trim(), stock]
        );
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка сохранения размеров" });
    }
  }
);


router.post(
  "/:id/images",
  authMiddleware,
  requireRole("ADMIN", "PRODUCT_MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { images } = req.body;

      if (!Array.isArray(images)) {
        return res.status(400).json({ error: "images должен быть массивом" });
      }

      await pool.query(`DELETE FROM product_images WHERE product_id=$1`, [id]);

      const uniq = Array.from(
        new Set(images.map((x) => String(x || "").trim()).filter(Boolean))
      );

      for (const url of uniq) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url)
           VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [id, url]
        );
      }

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка сохранения изображений" });
    }
  }
);


router.patch(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "PRODUCT_MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        category,
        gender,
        is_new,
        main_image,
        category_women,
        category_men,
      } = req.body;

      if (gender === "unisex") {
        if (!category_women || !category_men) {
          return res.status(400).json({
            error: "Для unisex товара нужно указать category_women и category_men.",
          });
        }
      } else {
        if (gender && !category) {
          return res.status(400).json({ error: "category обязательна" });
        }
      }

      const result = await pool.query(
        `
        UPDATE products
        SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),

          gender = COALESCE($3, gender),

          category = CASE
            WHEN COALESCE($3, gender) = 'unisex' THEN NULL
            ELSE COALESCE($4, category)
          END,

          is_new = COALESCE($5, is_new),
          main_image = COALESCE($6, main_image),

          category_women = CASE
            WHEN COALESCE($3, gender) = 'unisex' THEN COALESCE($7, category_women)
            ELSE NULL
          END,
          category_men = CASE
            WHEN COALESCE($3, gender) = 'unisex' THEN COALESCE($8, category_men)
            ELSE NULL
          END

        WHERE id=$9
        RETURNING id
        `,
        [
          title ?? null,
          description ?? null,
          gender ?? null,
          category ?? null,
          typeof is_new === "boolean" ? is_new : null,
          main_image ?? null,
          category_women ?? null,
          category_men ?? null,
          id,
        ]
      );

      if (!result.rows.length) return res.sendStatus(404);

      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка редактирования товара" });
    }
  }
);


router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN", "PRODUCT_MANAGER"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      await client.query("BEGIN");

      const exists = await client.query(`SELECT id FROM products WHERE id=$1`, [id]);
      if (!exists.rows.length) {
        await client.query("ROLLBACK");
        return res.sendStatus(404);
      }

      await client.query(`DELETE FROM cart_items WHERE product_id=$1`, [id]);
      await client.query(`DELETE FROM favorites WHERE product_id=$1`, [id]);

      await client.query(
        `UPDATE products SET is_active=false, is_new=false WHERE id=$1`,
        [id]
      );

      await client.query("COMMIT");
      res.json({ success: true, archived: true });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error(e);
      res.status(500).json({ error: "Ошибка архивации товара" });
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/:id/restore",
  authMiddleware,
  requireRole("ADMIN", "PRODUCT_MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const r = await pool.query(
        `UPDATE products SET is_active=true WHERE id=$1 RETURNING id`,
        [id]
      );
      if (!r.rows.length) return res.sendStatus(404);
      res.json({ success: true, restored: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка восстановления товара" });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const { gender, category, is_new, include_inactive } = req.query;

    const where = [];
    const params = [];

    const showInactive = String(include_inactive) === "1";

    if (!showInactive) {
      where.push(`is_active = true`);
    }

    if (typeof is_new !== "undefined") {
      const flag = String(is_new) === "true" || String(is_new) === "1";
      params.push(flag);
      where.push(`is_new = $${params.length}`);
    }

    if (gender) {
      const g = String(gender);

      if (category) {
        params.push(String(category));
        const cat = `$${params.length}`;

        if (g === "women") {
          where.push(`
            (
              (gender='women' AND category=${cat})
              OR
              (gender='unisex' AND category_women=${cat})
            )
          `);
        } else if (g === "men") {
          where.push(`
            (
              (gender='men' AND category=${cat})
              OR
              (gender='unisex' AND category_men=${cat})
            )
          `);
        } else {
          where.push(`gender='unisex'`);
          where.push(`(category_women=${cat} OR category_men=${cat})`);
        }
      } else {
        if (g === "women") where.push(`gender IN ('women','unisex')`);
        else if (g === "men") where.push(`gender IN ('men','unisex')`);
        else if (g === "unisex") where.push(`gender='unisex'`);
        else {
          params.push(g);
          where.push(`gender = $${params.length}`);
        }
      }
    } else {

      if (category) {
        params.push(String(category));
        where.push(`category = $${params.length}`);
      }
    }

    const sql = `
      SELECT *
      FROM products
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY is_new DESC, created_at DESC, id DESC
    `;

    const products = await pool.query(sql, params);
    res.json(products.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка загрузки товаров" });
  }
});


router.get("/new", async (req, res) => {
  try {
    const { gender } = req.query;

    const where = [`is_new=true`, `is_active=true`];

    if (gender === "women") where.push(`gender IN ('women','unisex')`);
    if (gender === "men") where.push(`gender IN ('men','unisex')`);

    const sql = `
      SELECT *
      FROM products
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
    `;

    const products = await pool.query(sql);
    res.json(products.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка загрузки новинок" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const result = await pool.query(
      `
      SELECT id, title, price, category, gender, is_new, main_image, category_women, category_men
      FROM products
      WHERE is_active=true AND (
        title ILIKE $1
        OR description ILIKE $1
        OR category ILIKE $1
        OR category_women ILIKE $1
        OR category_men ILIKE $1
      )
      ORDER BY created_at DESC
      LIMIT 30
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка поиска" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await pool.query(
      "SELECT * FROM products WHERE id=$1 AND is_active=true",
      [id]
    );
    if (!product.rows.length) return res.sendStatus(404);

    let images = await pool.query(
      `
      SELECT DISTINCT image_url
      FROM product_images
      WHERE product_id=$1
      ORDER BY image_url
      `,
      [id]
    );

    if ((!images.rows || images.rows.length === 0) && product.rows[0]?.main_image) {
      images = { rows: [{ image_url: product.rows[0].main_image }] };
    }

    const sizes = await pool.query(
      `
      SELECT size, stock
      FROM product_sizes
      WHERE product_id=$1
      ORDER BY CASE size
        WHEN 'ONE' THEN 0
        WHEN 'XXS' THEN 1
        WHEN 'XS'  THEN 2
        WHEN 'S'   THEN 3
        WHEN 'M'   THEN 4
        WHEN 'L'   THEN 5
        WHEN 'XL'  THEN 6
        WHEN 'XXL' THEN 7
        ELSE 99
      END
      `,
      [id]
    );

    res.json({
      ...product.rows[0],
      images: images.rows,
      sizes: sizes.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка загрузки товара" });
  }
});

export default router;