import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import { WOMEN_CATEGORIES, MEN_CATEGORIES } from "../../constants/categories";

const SIZE_SET = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

export default function AdminProducts() {
  const token = localStorage.getItem("token");

  const [me, setMe] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    gender: "women",

    category: "",

    category_women: "",
    category_men: "",

    is_new: true,
    main_image: "",
    images: "",

    sizesMode: "multi", 
    sizesStock: {
      XXS: 0,
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      ONE: 0,
    },
  });

  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({
    title: "",
    description: "",
    gender: "women",

    category: "",
    category_women: "",
    category_men: "",

    is_new: false,
    main_image: "",
    images: "",
    sizesMode: "multi",
    sizesStock: {
      XXS: 0,
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      ONE: 0,
    },
  });

  const canEditProduct = useMemo(() => me?.role === "ADMIN" || me?.role === "PRODUCT_MANAGER", [me]);
  const canEditPrice = useMemo(() => me?.role === "ADMIN" || me?.role === "SALES_MANAGER", [me]);

  useEffect(() => {
    if (!token) {
      setMe(null);
      return;
    }
    api("/api/auth/me", { token }).then(setMe).catch(() => setMe(null));
  }, [token]);

  const womenCats = useMemo(() => WOMEN_CATEGORIES.filter((c) => c !== "Новинки"), []);
  const menCats = useMemo(() => MEN_CATEGORIES.filter((c) => c !== "Новинки"), []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };

      if (name === "gender") {
        if (value === "unisex") {
          next.category = "";
        } else {
          next.category_women = "";
          next.category_men = "";
        }
      }
      return next;
    });
  };

  const setStock = (size, value) => {
    const v = Number(value);
    setForm((prev) => ({
      ...prev,
      sizesStock: { ...prev.sizesStock, [size]: Number.isFinite(v) ? v : 0 },
    }));
  };

  const setEditStock = (size, value) => {
    const v = Number(value);
    setEdit((prev) => ({
      ...prev,
      sizesStock: { ...prev.sizesStock, [size]: Number.isFinite(v) ? v : 0 },
    }));
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await api("/api/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setPrice = async (id, price) => {
    try {
      await api(`/api/products/${id}/price`, {
        method: "PATCH",
        token,
        body: { price },
      });
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const setNew = async (id, is_new) => {
    try {
      await api(`/api/products/${id}/new`, {
        method: "PATCH",
        token,
        body: { is_new },
      });
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const buildSizesPayload = (sizesMode, sizesStock) => {
    if (sizesMode === "one") {
      return [{ size: "ONE", stock: Number(sizesStock.ONE || 0) }];
    }
    return SIZE_SET.map((sz) => ({
      size: sz,
      stock: Number(sizesStock[sz] || 0),
    }));
  };

  const createProduct = async () => {
    if (!form.title.trim() || !form.price) {
      alert("Название и цена обязательны");
      return;
    }
    if (form.gender === "unisex") {
      if (!form.category_women || !form.category_men) {
        alert("Для унисекс товара выберите категории: Женщины и Мужчины");
        return;
      }
    } else {
      if (!form.category) {
        alert("Выберите категорию");
        return;
      }
    }

    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        gender: form.gender,
        is_new: form.is_new,
        main_image: form.main_image.trim() || null,
      };

      if (form.gender === "unisex") {
        body.category = null;
        body.category_women = form.category_women;
        body.category_men = form.category_men;
      } else {
        body.category = form.category.trim();
        body.category_women = null;
        body.category_men = null;
      }

      const data = await api("/api/products", { method: "POST", token, body });
      const productId = data.id;

      const sizes = buildSizesPayload(form.sizesMode, form.sizesStock);
      await api(`/api/products/${productId}/sizes`, { method: "POST", token, body: { sizes } });

      const list = form.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (list.length) {
        await api(`/api/products/${productId}/images`, {
          method: "POST",
          token,
          body: { images: list },
        });
      }

      alert(`Товар создан ✅ (id=${productId})`);

      setForm({
        title: "",
        description: "",
        price: "",
        gender: "women",
        category: "",
        category_women: "",
        category_men: "",
        is_new: true,
        main_image: "",
        images: "",
        sizesMode: "multi",
        sizesStock: { XXS: 0, XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ONE: 0 },
      });

      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const startEdit = async (p) => {
    if (!canEditProduct) return;

    try {
      const full = await api(`/api/products/${p.id}`);

      const sizesStock = { XXS: 0, XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, ONE: 0 };
      const sizesArr = Array.isArray(full?.sizes) ? full.sizes : [];
      for (const s of sizesArr) {
        const key = String(s.size || "").trim();
        if (key in sizesStock) sizesStock[key] = Number(s.stock || 0);
      }
      const isOne = sizesArr.length === 1 && String(sizesArr[0].size) === "ONE";

      setEditingId(p.id);
      setEdit({
        title: full.title || "",
        description: full.description || "",
        gender: full.gender || "women",

        category: full.category || "",
        category_women: full.category_women || "",
        category_men: full.category_men || "",

        is_new: !!full.is_new,
        main_image: full.main_image || "",
        images: "",
        sizesMode: isOne ? "one" : "multi",
        sizesStock,
      });
    } catch (e) {
      console.error(e);
      alert("Не удалось открыть редактирование товара");
    }
  };

  const saveEdit = async () => {
    if (!canEditProduct) return;

    if (edit.gender === "unisex") {
      if (!edit.category_women || !edit.category_men) {
        alert("Для унисекс товара выберите категории: Женщины и Мужчины");
        return;
      }
    } else {
      if (!edit.category) {
        alert("Выберите категорию");
        return;
      }
    }

    try {
      const body = {
        title: edit.title,
        description: edit.description,
        gender: edit.gender,
        is_new: edit.is_new,
        main_image: edit.main_image || null,
      };

      if (edit.gender === "unisex") {
        body.category = null;
        body.category_women = edit.category_women;
        body.category_men = edit.category_men;
      } else {
        body.category = edit.category;
        body.category_women = null;
        body.category_men = null;
      }

      await api(`/api/products/${editingId}`, { method: "PATCH", token, body });

      const sizes = buildSizesPayload(edit.sizesMode, edit.sizesStock);
      await api(`/api/products/${editingId}/sizes`, { method: "POST", token, body: { sizes } });

      const list = (edit.images || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (list.length) {
        await api(`/api/products/${editingId}/images`, { method: "POST", token, body: { images: list } });
      }

      setEditingId(null);
      await load();
      alert("Изменения сохранены ✅");
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteProduct = async (id) => {
    if (!canEditProduct) return;

    const ok = confirm("Удалить товар? Если он уже есть в заказах — удаление может быть запрещено.");
    if (!ok) return;

    try {
      await api(`/api/products/${id}`, { method: "DELETE", token });
      await load();
      alert("Товар удалён ✅");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-top">
        <h1>Управление товарами</h1>
        <p>
          {loading ? "Загрузка…" : `${products.length} товаров`}
          {me?.role ? ` · роль: ${me.role}` : ""}
        </p>
      </div>

      {canEditProduct && (
        <div className="admin-create">
          <h2>Добавить новый товар</h2>

          <div className="admin-create-grid">
            <div className="field">
              <label>Название*</label>
              <input name="title" value={form.title} onChange={onChange} />
            </div>

            <div className="field">
              <label>Цена*</label>
              <input name="price" value={form.price} onChange={onChange} inputMode="numeric" />
            </div>

            <div className="field">
              <label>Пол</label>
              <select name="gender" value={form.gender} onChange={onChange}>
                <option value="women">Женщины</option>
                <option value="men">Мужчины</option>
                <option value="unisex">Унисекс</option>
              </select>
            </div>

            {form.gender !== "unisex" ? (
              <div className="field">
                <label>Категория</label>
                <select name="category" value={form.category} onChange={onChange}>
                  <option value="">— выберите —</option>
                  {(form.gender === "men" ? menCats : womenCats).map((c) => (
                    <option value={c} key={c}>{c}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Категория (Женщины)</label>
                  <select name="category_women" value={form.category_women} onChange={onChange}>
                    <option value="">— выберите —</option>
                    {womenCats.map((c) => (
                      <option value={c} key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Категория (Мужчины)</label>
                  <select name="category_men" value={form.category_men} onChange={onChange}>
                    <option value="">— выберите —</option>
                    {menCats.map((c) => (
                      <option value={c} key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="field">
              <label>Размерность</label>
              <select name="sizesMode" value={form.sizesMode} onChange={onChange}>
                <option value="multi">Одежда (XXS–XXL)</option>
                <option value="one">Аксессуар (ONE SIZE)</option>
              </select>
            </div>

            <div className="field wide">
              <label>Описание</label>
              <textarea name="description" value={form.description} onChange={onChange} />
            </div>

            <div className="field">
              <label>Главное фото</label>
              <input name="main_image" value={form.main_image} onChange={onChange} placeholder="product-10.jpg" />
              <div className="hint">Файл положи в frontend/public/images/</div>
            </div>

            <div className="field">
              <label>Доп. фото (через запятую)</label>
              <input name="images" value={form.images} onChange={onChange} placeholder="p10-1.jpg,p10-2.jpg" />
            </div>

            {form.sizesMode === "one" ? (
              <div className="field wide">
                <label>Остаток (ONE SIZE)</label>
                <input value={form.sizesStock.ONE} onChange={(e) => setStock("ONE", e.target.value)} inputMode="numeric" />
              </div>
            ) : (
              <>
                {SIZE_SET.map((sz) => (
                  <div className="field" key={sz}>
                    <label>Остаток {sz}</label>
                    <input value={form.sizesStock[sz]} onChange={(e) => setStock(sz, e.target.value)} inputMode="numeric" />
                  </div>
                ))}
              </>
            )}

            <label className="check wide">
              <input type="checkbox" name="is_new" checked={form.is_new} onChange={onChange} />
              Пометить как NEW
            </label>
          </div>

          <button className="admin-primary" onClick={createProduct}>
            Создать товар
          </button>
        </div>
      )}

      <div className="admin-products">
        <h2>Список товаров</h2>

        {products.map((p) => (
          <div className="admin-prod" key={p.id}>
            <div className="admin-prod-title">
              <b>{p.title}</b>
              <span>#{p.id}</span>
            </div>

            <div className="admin-prod-actions">
              {canEditPrice && (
                <label>
                  Цена:
                  <input defaultValue={p.price} onBlur={(e) => setPrice(p.id, e.target.value)} inputMode="numeric" />
                </label>
              )}

              {canEditProduct && (
                <>
                  <label className="check">
                    <input type="checkbox" checked={!!p.is_new} onChange={(e) => setNew(p.id, e.target.checked)} />
                    NEW
                  </label>

                  <div className="admin-prod-tools">
                    <button className="admin-btn" onClick={() => startEdit(p)}>Редактировать</button>
                    <button className="admin-btn danger" onClick={() => deleteProduct(p.id)}>Удалить</button>
                  </div>
                </>
              )}
            </div>

            {canEditProduct && editingId === p.id && (
              <div className="admin-edit">
                <div className="field">
                  <label>Название</label>
                  <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                </div>

                <div className="field">
                  <label>Пол</label>
                  <select value={edit.gender} onChange={(e) => setEdit({ ...edit, gender: e.target.value })}>
                    <option value="women">Женщины</option>
                    <option value="men">Мужчины</option>
                    <option value="unisex">Унисекс</option>
                  </select>
                </div>

                {edit.gender !== "unisex" ? (
                  <div className="field">
                    <label>Категория</label>
                    <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>
                      <option value="">— выберите —</option>
                      {(edit.gender === "men" ? menCats : womenCats).map((c) => (
                        <option value={c} key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="field">
                      <label>Категория (Женщины)</label>
                      <select
                        value={edit.category_women}
                        onChange={(e) => setEdit({ ...edit, category_women: e.target.value })}
                      >
                        <option value="">— выберите —</option>
                        {womenCats.map((c) => (
                          <option value={c} key={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>Категория (Мужчины)</label>
                      <select
                        value={edit.category_men}
                        onChange={(e) => setEdit({ ...edit, category_men: e.target.value })}
                      >
                        <option value="">— выберите —</option>
                        {menCats.map((c) => (
                          <option value={c} key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="field">
                  <label>Размерность</label>
                  <select value={edit.sizesMode} onChange={(e) => setEdit({ ...edit, sizesMode: e.target.value })}>
                    <option value="multi">Одежда (XXS–XXL)</option>
                    <option value="one">Аксессуар (ONE SIZE)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Главное фото</label>
                  <input value={edit.main_image} onChange={(e) => setEdit({ ...edit, main_image: e.target.value })} />
                </div>

                <div className="field">
                  <label>Галерея (перезаписать через запятую)</label>
                  <input value={edit.images} onChange={(e) => setEdit({ ...edit, images: e.target.value })} />
                  <div className="hint">Если пусто — галерея не меняется.</div>
                </div>

                <label className="check wide">
                  <input type="checkbox" checked={edit.is_new} onChange={(e) => setEdit({ ...edit, is_new: e.target.checked })} />
                  NEW
                </label>

                <div className="field wide">
                  <label>Описание</label>
                  <textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                </div>

                {edit.sizesMode === "one" ? (
                  <div className="field wide">
                    <label>Остаток (ONE SIZE)</label>
                    <input value={edit.sizesStock.ONE} onChange={(e) => setEditStock("ONE", e.target.value)} inputMode="numeric" />
                  </div>
                ) : (
                  <div className="admin-create-grid">
                    {SIZE_SET.map((sz) => (
                      <div className="field" key={sz}>
                        <label>Остаток {sz}</label>
                        <input value={edit.sizesStock[sz]} onChange={(e) => setEditStock(sz, e.target.value)} inputMode="numeric" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="admin-edit-actions">
                  <button className="admin-primary" onClick={saveEdit}>Сохранить</button>
                  <button className="admin-btn" onClick={() => setEditingId(null)}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}