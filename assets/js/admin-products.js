// Admin product CRUD using localStorage as working copy

const ADMIN_PRODUCTS_KEY = "3dprint_admin_products_draft";

async function loadBaseProductsForAdmin() {
  try {
    const res = await fetch("../data/products.json");
    if (!res.ok) throw new Error("products.json okunamadı");
    const data = await res.json();
    return Array.isArray(data.products) ? data.products : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function getAdminProducts() {
  const draft = localStorage.getItem(ADMIN_PRODUCTS_KEY);
  if (draft) {
    try {
      const parsed = JSON.parse(draft);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return await loadBaseProductsForAdmin();
}

async function saveAdminProducts(products) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
}

function generateProductCode(lastNumericId) {
  const num = String(lastNumericId).padStart(6, "0");
  return `FD-${num}`;
}

async function renderAdminProductsSection() {
  const root = document.getElementById("adminProductsRoot");
  if (!root) return;

  const products = await getAdminProducts();

  const wrapper = document.createElement("div");
  const count = products.length;
  wrapper.innerHTML = `
    <div class="small muted">
      Toplam ürün: <strong>${count}</strong> (Değişiklikler şu an yalnızca bu tarayıcıda tutuluyor)
    </div>
    <div style="margin-top:0.7rem;display:flex;flex-wrap:wrap;gap:0.6rem;align-items:center;">
      <button type="button" class="btn primary small" id="addProductBtn">Yeni Ürün Ekle</button>
      <button type="button" class="btn ghost small" id="resetProductsBtn">Taslakları Sıfırla</button>
    </div>
    <table class="admin-products-table">
      <thead>
        <tr>
          <th>Kod</th>
          <th>İsim</th>
          <th>Kategori</th>
          <th>Fiyat</th>
          <th>Stok</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="adminProductsTbody"></tbody>
    </table>
  `;

  root.innerHTML = "";
  root.appendChild(wrapper);

  const tbody = document.getElementById("adminProductsTbody");
  products.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.code || ""}</td>
      <td>${p.name || ""}</td>
      <td>${p.category || ""}</td>
      <td>${p.price || ""}</td>
      <td>${p.stockStatus || ""}</td>
      <td>
        <button type="button" class="btn ghost small" data-action="edit" data-idx="${idx}">Düzenle</button>
        <button type="button" class="btn ghost small" data-action="delete" data-idx="${idx}">Sil</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    const idxStr = target.getAttribute("data-idx");
    if (!action || idxStr == null) return;
    const index = Number(idxStr);
    if (Number.isNaN(index)) return;

    let list = await getAdminProducts();

    if (action === "delete") {
      if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
      list.splice(index, 1);
      await saveAdminProducts(list);
      renderAdminProductsSection();
    } else if (action === "edit") {
      const current = list[index];
      const newName = prompt("Ürün adı:", current.name || "");
      if (newName === null) return;
      current.name = newName;
      await saveAdminProducts(list);
      renderAdminProductsSection();
    }
  });

  document
    .getElementById("addProductBtn")
    ?.addEventListener("click", async () => {
      let list = await getAdminProducts();
      const lastId = list.reduce(
        (max, p) => Math.max(max, Number(p.id) || 0),
        0
      );
      const newId = lastId + 1;
      const name = prompt("Yeni ürün adı:");
      if (!name) return;
      const priceStr = prompt("Fiyat (TRY):", "0");
      const price = Number(priceStr || "0");
      const now = new Date().toISOString();
      const product = {
        id: String(newId),
        code: generateProductCode(newId),
        name,
        description: "",
        usageNotes: "",
        category: "Genel",
        price: price || 0,
        currency: "TRY",
        filamentType: "PLA",
        colorOptions: [],
        estimatedPrintTime: "",
        stockStatus: "made_to_order",
        imagePath: "",
        whatsAppTemplate: `Merhaba, ${generateProductCode(
          newId
        )} kodlu *${name}* ürününü 3D baskı olarak sipariş etmek istiyorum.`,
        createdAt: now,
        updatedAt: now,
      };
      list.push(product);
      await saveAdminProducts(list);
      renderAdminProductsSection();
    });

  document
    .getElementById("resetProductsBtn")
    ?.addEventListener("click", async () => {
      if (
        !confirm(
          "Taslak ürünleri sıfırlamak istediğinize emin misiniz? (products.json yeniden yüklenecek)"
        )
      )
        return;
      localStorage.removeItem(ADMIN_PRODUCTS_KEY);
      renderAdminProductsSection();
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");
  if (page === "admin-dashboard") {
    renderAdminProductsSection();
  }
});


