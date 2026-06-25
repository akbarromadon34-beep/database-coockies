const STORAGE_KEYS = {
  apiUrl: "cookieVaultApiUrl",
  apiToken: "cookieVaultApiToken"
};

const CATEGORY_META = {
  netflix: { label: "Netflix", icon: "N", className: "icon-netflix" },
  youtube: { label: "YouTube", icon: "▶", className: "icon-youtube" },
  spotify: { label: "Spotify", icon: "♪", className: "icon-spotify" },
  disney: { label: "Disney+", icon: "D+", className: "icon-disney" },
  prime: { label: "Prime Video", icon: "P", className: "icon-prime" },
  hbo: { label: "HBO Max", icon: "H", className: "icon-hbo" },
  tiktok: { label: "TikTok", icon: "♬", className: "icon-tiktok" },
  other: { label: "Lainnya", icon: "TXT", className: "icon-other" }
};

let entries = [];
let currentView = null;

const el = (id) => document.getElementById(id);

const apiUrlInput = el("apiUrlInput");
const apiTokenInput = el("apiTokenInput");
const passphraseInput = el("passphraseInput");
const categoryInput = el("categoryInput");
const fileInput = el("fileInput");
const fileHint = el("fileHint");
const progressText = el("progressText");
const cardsGrid = el("cardsGrid");
const emptyState = el("emptyState");
const searchInput = el("searchInput");
const filterInput = el("filterInput");
const settingsModal = el("settingsModal");
const viewModal = el("viewModal");

function init() {
  apiUrlInput.value = localStorage.getItem(STORAGE_KEYS.apiUrl) || "";
  apiTokenInput.value = localStorage.getItem(STORAGE_KEYS.apiToken) || "";

  el("openSettings").addEventListener("click", () => settingsModal.showModal());
  el("saveSettings").addEventListener("click", saveSettings);
  el("refreshBtn").addEventListener("click", loadEntries);
  el("refreshHero").addEventListener("click", loadEntries);
  el("uploadForm").addEventListener("submit", handleBulkUpload);
  fileInput.addEventListener("change", updateFileHint);
  searchInput.addEventListener("input", renderEntries);
  filterInput.addEventListener("change", renderEntries);

  el("closeViewModal").addEventListener("click", () => viewModal.close());
  el("copyContent").addEventListener("click", copyCurrentContent);
  el("downloadContent").addEventListener("click", downloadCurrentContent);

  if (!apiUrlInput.value || !apiTokenInput.value) {
    settingsModal.showModal();
  } else {
    loadEntries();
  }
}

function saveSettings(event) {
  event.preventDefault();
  const url = apiUrlInput.value.trim();
  const token = apiTokenInput.value.trim();

  if (!url || !token) {
    alert("Web App URL dan API Token wajib diisi.");
    return;
  }

  localStorage.setItem(STORAGE_KEYS.apiUrl, url);
  localStorage.setItem(STORAGE_KEYS.apiToken, token);
  settingsModal.close();
  loadEntries();
}

async function fetchApi(payload) {
  const apiUrl = localStorage.getItem(STORAGE_KEYS.apiUrl);
  const token = localStorage.getItem(STORAGE_KEYS.apiToken);

  if (!apiUrl || !token) {
    settingsModal.showModal();
    throw new Error("API belum disiapkan.");
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    body: JSON.stringify({ ...payload, token })
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "API error.");
  return data;
}

async function loadEntries() {
  try {
    progressText.textContent = "Memuat data...";
    const data = await fetchApi({ action: "list" });
    entries = Array.isArray(data.entries) ? data.entries : [];
    progressText.textContent = "Data berhasil dimuat.";
    renderEntries();
    updateStats();
  } catch (err) {
    progressText.textContent = "";
    alert(err.message);
  }
}

function updateFileHint() {
  const count = fileInput.files.length;
  fileHint.textContent = count ? `${count} file dipilih` : "Belum ada file dipilih";
}

async function handleBulkUpload(event) {
  event.preventDefault();

  const files = Array.from(fileInput.files || []);
  const passphrase = passphraseInput.value;

  if (!files.length) {
    alert("Pilih minimal 1 file .txt.");
    return;
  }
  if (!passphrase || passphrase.length < 8) {
    alert("Passphrase minimal 8 karakter.");
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.name.toLowerCase().endsWith(".txt")) {
      progressText.textContent = `Lewati ${file.name}. File harus .txt.`;
      continue;
    }

    progressText.textContent = `Mengupload ${i + 1}/${files.length}: ${file.name}`;
    const rawText = await readFileText(file);
    const category = categoryInput.value === "auto" ? detectCategory(file.name, rawText) : categoryInput.value;
    const encrypted = await encryptText(rawText, passphrase);

    await fetchApi({
      action: "add",
      entry: {
        category,
        title: cleanTitle(file.name),
        fileName: file.name,
        sizeBytes: file.size,
        encryptedText: encrypted.ciphertext,
        iv: encrypted.iv,
        salt: encrypted.salt
      }
    });
  }

  progressText.textContent = "Upload selesai.";
  fileInput.value = "";
  updateFileHint();
  await loadEntries();
}

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function detectCategory(fileName, content) {
  const text = `${fileName} ${content.slice(0, 500)}`.toLowerCase();
  if (text.includes("netflix")) return "netflix";
  if (text.includes("youtube") || text.includes("google")) return "youtube";
  if (text.includes("spotify")) return "spotify";
  if (text.includes("disney")) return "disney";
  if (text.includes("prime") || text.includes("amazon")) return "prime";
  if (text.includes("hbo") || text.includes("max.com")) return "hbo";
  if (text.includes("tiktok")) return "tiktok";
  return "other";
}

function cleanTitle(fileName) {
  return fileName.replace(/\.txt$/i, "").replace(/[_-]+/g, " ").trim() || fileName;
}

function renderEntries() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = filterInput.value;
  const template = el("cardTemplate");
  cardsGrid.innerHTML = "";

  const filtered = entries.filter((entry) => {
    const meta = CATEGORY_META[entry.category] || CATEGORY_META.other;
    const searchable = `${entry.title} ${entry.fileName} ${meta.label} ${entry.category}`.toLowerCase();
    const matchQuery = !query || searchable.includes(query);
    const matchFilter = filter === "all" || entry.category === filter;
    return matchQuery && matchFilter;
  });

  emptyState.style.display = filtered.length ? "none" : "grid";

  filtered.forEach((entry) => {
    const meta = CATEGORY_META[entry.category] || CATEGORY_META.other;
    const node = template.content.cloneNode(true);
    const icon = node.querySelector(".service-icon");
    icon.textContent = meta.icon;
    icon.classList.add(meta.className);
    node.querySelector(".card-title").textContent = entry.title || "Tanpa Judul";
    node.querySelector(".category-badge").textContent = meta.label;
    node.querySelector(".upload-date").textContent = formatDate(entry.uploadDate);
    node.querySelector(".file-name").textContent = entry.fileName || "-";
    node.querySelector(".file-size").textContent = formatSize(Number(entry.sizeBytes || 0));
    node.querySelector(".view-btn").addEventListener("click", () => viewEntry(entry));
    node.querySelector(".delete-btn").addEventListener("click", () => deleteEntry(entry));
    cardsGrid.appendChild(node);
  });
}

function updateStats() {
  el("totalCount").textContent = entries.length;
  el("categoryCount").textContent = new Set(entries.map((e) => e.category)).size;

  const latest = [...entries]
    .filter((e) => e.uploadDate)
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0];
  el("latestUpload").textContent = latest ? formatDate(latest.uploadDate) : "-";
}

async function viewEntry(entry) {
  const passphrase = passphraseInput.value;
  if (!passphrase) {
    alert("Masukkan passphrase enkripsi terlebih dahulu.");
    passphraseInput.focus();
    return;
  }

  try {
    const content = await decryptText(entry.encryptedText, entry.iv, entry.salt, passphrase);
    currentView = { entry, content };
    el("viewTitle").textContent = entry.title || "Isi Data";
    el("viewContent").textContent = content;
    viewModal.showModal();
  } catch (err) {
    alert("Gagal membuka data. Passphrase salah atau data rusak.");
  }
}

async function deleteEntry(entry) {
  const ok = confirm(`Hapus data "${entry.title}"?`);
  if (!ok) return;

  try {
    progressText.textContent = "Menghapus data...";
    await fetchApi({ action: "delete", id: entry.id });
    entries = entries.filter((item) => item.id !== entry.id);
    renderEntries();
    updateStats();
    progressText.textContent = "Data berhasil dihapus.";
  } catch (err) {
    alert(err.message);
  }
}

function copyCurrentContent() {
  if (!currentView) return;
  navigator.clipboard.writeText(currentView.content);
  alert("Isi data berhasil disalin.");
}

function downloadCurrentContent() {
  if (!currentView) return;
  const blob = new Blob([currentView.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentView.entry.title || "data"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function deriveKey(passphrase, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 150000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(text, passphrase) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );

  return {
    ciphertext: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt)
  };
}

async function decryptText(ciphertext, ivBase64, saltBase64, passphrase) {
  const decoder = new TextDecoder();
  const salt = base64ToUint8Array(saltBase64);
  const iv = base64ToUint8Array(ivBase64);
  const key = await deriveKey(passphrase, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToUint8Array(ciphertext)
  );
  return decoder.decode(plainBuffer);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

init();
