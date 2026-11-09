import { useState, useMemo } from "react";
import {
  ExternalLink,
  LoaderCircle,
  Plus,
  RotateCw,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Edit2,
  Globe2,
  Check,
  X,
} from "lucide-react";
import { validateTargetUrl } from "./api.js";

function formatTime(value) {
  if (!value) return "Data tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SiteModal({
  open,
  editingSite,
  onClose,
  onSave,
  busy,
  error,
}) {
  const [name, setName] = useState(editingSite?.name || "");
  const [url, setUrl] = useState(editingSite?.url || "");
  const [status, setStatus] = useState(editingSite?.status || "active");
  const [maxDepth, setMaxDepth] = useState(
    editingSite?.maxDepth !== undefined ? String(editingSite.maxDepth) : "1",
  );
  const [maxPages, setMaxPages] = useState(
    editingSite?.maxPages !== undefined ? String(editingSite.maxPages) : "20",
  );
  const [baselineHtml, setBaselineHtml] = useState(
    editingSite?.baselineHtml || "",
  );
  const [formError, setFormError] = useState("");

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Nama instansi wajib diisi.");
      return;
    }

    let normalizedUrl;
    try {
      normalizedUrl = validateTargetUrl(url);
    } catch (err) {
      setFormError(err.message || "URL situs tidak valid.");
      return;
    }

    const payload = {
      name: trimmedName,
      url: normalizedUrl,
      status,
      maxDepth: Number(maxDepth),
      maxPages: Number(maxPages),
      baselineHtml: baselineHtml.trim() ? baselineHtml.trim() : null,
    };

    try {
      await onSave(payload);
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan data situs.");
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget && !busy) {
      onClose();
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="site-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 id="site-modal-title" className="modal-title">
              {editingSite ? "Edit Situs" : "Tambah Situs Baru"}
            </h2>
            <p className="modal-subtitle">
              {editingSite
                ? "Perbarui konfigurasi dan target pemantauan situs."
                : "Daftarkan situs web yang akan dipantau."}
            </p>
          </div>
          <button
            type="button"
            className="icon-button modal-close-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="modal-form">
          <div className="modal-body">
            {/* Field 1: Nama Instansi */}
            <div className="modal-field-group">
              <label className="field-label" htmlFor="site-name-input">
                Nama instansi
              </label>
              <input
                id="site-name-input"
                className="modal-input"
                type="text"
                placeholder="Contoh: Dinas Kominfo Kabupaten Sumbawa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={busy}
              />
            </div>

            {/* Field 2: URL Situs */}
            <div className="modal-field-group">
              <label className="field-label" htmlFor="site-url-input">
                URL situs
              </label>
              <input
                id="site-url-input"
                className="modal-input"
                type="url"
                placeholder="https://contoh.go.id/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={busy}
              />
            </div>

            {/* Field 3: Grid 2 Kolom (Status situs & Kedalaman crawling) */}
            <div className="modal-form-grid modal-grid-2">
              <div className="modal-field-group">
                <label className="field-label" htmlFor="site-status-select">
                  Status situs
                </label>
                <select
                  id="site-status-select"
                  className="modal-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={busy}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="modal-field-group">
                <label className="field-label" htmlFor="site-depth-select">
                  Kedalaman crawling
                </label>
                <select
                  id="site-depth-select"
                  className="modal-select"
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(e.target.value)}
                  disabled={busy}
                >
                  <option value="0">0 (Halaman awal saja)</option>
                  <option value="1">1 (Tautan langsung)</option>
                  <option value="2">2 (Dua tingkat)</option>
                  <option value="3">3 (Tiga tingkat)</option>
                </select>
              </div>
            </div>

            {/* Field 4: Batas halaman */}
            <div className="modal-field-group">
              <label className="field-label" htmlFor="site-pages-select">
                Batas halaman
              </label>
              <select
                id="site-pages-select"
                className="modal-select"
                value={maxPages}
                onChange={(e) => setMaxPages(e.target.value)}
                disabled={busy}
              >
                <option value="5">5 halaman</option>
                <option value="10">10 halaman</option>
                <option value="20">20 halaman</option>
                <option value="50">50 halaman</option>
                <option value="100">100 halaman</option>
              </select>
            </div>

            {/* Field 5: Baseline perubahan halaman (Defacement) */}
            <div className="modal-field-group">
              <details className="baseline-field">
                <summary>
                  <span>Baseline perubahan halaman (Defacement)</span>
                  <span className="baseline-tag">Opsional</span>
                </summary>
                <div className="baseline-body">
                  <label className="visually-hidden" htmlFor="site-baseline-html">
                    HTML baseline
                  </label>
                  <textarea
                    id="site-baseline-html"
                    className="modal-textarea"
                    rows="4"
                    placeholder="Tempel HTML baseline untuk URL ini..."
                    value={baselineHtml}
                    onChange={(e) => setBaselineHtml(e.target.value)}
                    disabled={busy}
                  />
                </div>
              </details>
            </div>

            {(formError || error) && (
              <div className="field-error modal-error" role="alert">
                <TriangleAlert size={16} className="error-icon" />
                <span>{formError || error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary modal-btn-cancel"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary modal-btn-submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={16} /> Menyimpan...
                </>
              ) : (
                <>
                  <Check size={16} /> Simpan Situs
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SiteManagement({
  sites = [],
  loading = false,
  error = "",
  onRefresh,
  onCreateSite,
  onUpdateSite,
  onDeleteSite,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionInProgressId, setActionInProgressId] = useState("");

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      if (!site) return false;
      const matchesSearch =
        searchQuery.trim() === "" ||
        (site.name && site.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (site.url && site.url.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || site.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sites, searchQuery, statusFilter]);

  function handleOpenAdd() {
    setEditingSite(null);
    setModalError("");
    setModalOpen(true);
  }

  function handleOpenEdit(site) {
    setEditingSite(site);
    setModalError("");
    setModalOpen(true);
  }

  async function handleSaveSite(payload) {
    setModalBusy(true);
    setModalError("");
    try {
      if (editingSite) {
        await onUpdateSite(editingSite.id, payload);
      } else {
        await onCreateSite(payload);
      }
      setModalOpen(false);
      setEditingSite(null);
    } catch (err) {
      setModalError(err.message || "Gagal menyimpan situs.");
      throw err;
    } finally {
      setModalBusy(false);
    }
  }

  async function handleToggleStatus(site) {
    const nextStatus = site.status === "active" ? "inactive" : "active";
    setActionError("");
    setActionInProgressId(site.id);
    try {
      await onUpdateSite(site.id, {
        ...site,
        status: nextStatus,
      });
    } catch (err) {
      setActionError(err.message || "Gagal mengubah status situs.");
    } finally {
      setActionInProgressId("");
    }
  }

  async function handleDelete(site) {
    if (!window.confirm(`Hapus situs "${site.name}" (${site.url})?`)) {
      return;
    }
    setActionError("");
    setActionInProgressId(site.id);
    try {
      await onDeleteSite(site.id);
    } catch (err) {
      setActionError(err.message || "Gagal menghapus situs.");
    } finally {
      setActionInProgressId("");
    }
  }

  return (
    <section className="sites-section" id="situs" aria-label="Manajemen Situs">
      <div className="section-heading-row">
        <div className="section-heading-text">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> MANAJEMEN SITUS
          </p>
          <h2 className="page-title">Daftar situs pemantauan</h2>
          <p className="intro-copy">
            Kelola daftar situs web Pemerintah Kabupaten Sumbawa yang terdaftar
            dalam basis data pemantauan.
          </p>
        </div>
        <div className="section-heading-actions">
          <button
            type="button"
            className="icon-button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Muat ulang daftar situs"
            title="Muat ulang daftar situs"
          >
            <RotateCw size={16} className={loading ? "spin" : ""} />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-add-site"
            onClick={handleOpenAdd}
          >
            <Plus size={16} /> <span>Tambah Situs</span>
          </button>
        </div>
      </div>

      <div className="sites-toolbar">
        <div className="sites-search-wrap">
          <Search size={18} className="sites-search-icon" />
          <input
            type="search"
            className="sites-search-input"
            placeholder="Cari nama instansi atau URL situs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari situs"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Hapus pencarian situs"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="sites-filter-wrap">
          <label htmlFor="filter-status-select" className="filter-label">
            Filter status:
          </label>
          <div className="sites-filter-pills" role="group" aria-label="Pilihan filter status">
            <button
              type="button"
              className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
              aria-pressed={statusFilter === "all"}
            >
              Semua <span className="pill-badge">{sites.length}</span>
            </button>
            <button
              type="button"
              className={`filter-pill filter-pill-active ${statusFilter === "active" ? "active" : ""}`}
              onClick={() => setStatusFilter("active")}
              aria-pressed={statusFilter === "active"}
            >
              <span className="filter-pill-dot dot-active" />
              Aktif <span className="pill-badge">{sites.filter((s) => s.status === "active").length}</span>
            </button>
            <button
              type="button"
              className={`filter-pill filter-pill-inactive ${statusFilter === "inactive" ? "active" : ""}`}
              onClick={() => setStatusFilter("inactive")}
              aria-pressed={statusFilter === "inactive"}
            >
              <span className="filter-pill-dot dot-inactive" />
              Nonaktif <span className="pill-badge">{sites.filter((s) => s.status === "inactive").length}</span>
            </button>
          </div>
          <select
            id="filter-status-select"
            className="filter-select sites-filter-select-hidden"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status:"
          >
            <option value="all">Semua ({sites.length})</option>
            <option value="active">
              Aktif ({sites.filter((s) => s.status === "active").length})
            </option>
            <option value="inactive">
              Nonaktif ({sites.filter((s) => s.status === "inactive").length})
            </option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="history-notice" role="alert">
          <TriangleAlert size={16} /> {actionError}
        </div>
      )}

      {error ? (
        <div className="history-notice" role="alert">
          <TriangleAlert size={16} /> {error}
        </div>
      ) : loading && sites.length === 0 ? (
        <div className="history-notice">
          <LoaderCircle className="spin" size={16} /> Memuat daftar situs...
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="history-empty">
          <Globe2 size={20} />
          <span>
            {searchQuery || statusFilter !== "all"
              ? "Tidak ada situs yang cocok dengan kriteria pencarian/filter."
              : "Belum ada situs terdaftar. Klik 'Tambah Situs' untuk menambahkan."}
          </span>
        </div>
      ) : (
        <div className="sites-table-card">
          <div className="sites-table-wrap">
            <table className="sites-table">
              <thead>
                <tr>
                  <th className="col-name">Nama Instansi</th>
                  <th className="col-url">URL Situs</th>
                  <th className="col-status text-center">Status</th>
                  <th className="col-meta text-center">Kedalaman</th>
                  <th className="col-meta text-center">Maks. Hal</th>
                  <th className="col-time">Waktu Pendaftaran</th>
                  <th className="col-actions text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr key={site.id}>
                    <td className="col-name">
                      <div className="site-name-wrap">
                        <strong className="site-name-title">{site.name}</strong>
                        {site.allowedHost && (
                          <span className="site-name-sub">{site.allowedHost}</span>
                        )}
                      </div>
                    </td>
                    <td className="col-url">
                      <div className="site-url-box" title={site.url}>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noreferrer"
                          className="page-url site-url-link"
                        >
                          <span className="site-url-text-truncate">{site.url}</span>
                          <ExternalLink size={12} className="site-url-ext-icon" />
                        </a>
                      </div>
                    </td>
                    <td className="col-status text-center">
                      <span
                        className={`status-badge ${
                          site.status === "active" ? "status-good" : "status-muted"
                        }`}
                      >
                        <span className={`status-dot ${site.status === "active" ? "dot-good" : "dot-muted"}`} />
                        {site.status === "active" ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td className="col-meta text-center">
                      <span className="site-param-badge">{site.maxDepth}</span>
                    </td>
                    <td className="col-meta text-center">
                      <span className="site-param-badge">{site.maxPages}</span>
                    </td>
                    <td className="col-time">
                      <span className="site-time-text">{formatTime(site.createdAt)}</span>
                    </td>
                    <td className="col-actions text-right">
                      <div className="site-row-actions">
                        <button
                          type="button"
                          className={`btn-toggle-status ${
                            site.status === "active" ? "btn-deactivate" : "btn-activate"
                          }`}
                          onClick={() => handleToggleStatus(site)}
                          disabled={actionInProgressId === site.id}
                          title={
                            site.status === "active"
                              ? "Nonaktifkan situs"
                              : "Aktifkan situs"
                          }
                        >
                          {actionInProgressId === site.id ? (
                            <LoaderCircle size={13} className="spin" />
                          ) : site.status === "active" ? (
                            "Nonaktifkan"
                          ) : (
                            "Aktifkan"
                          )}
                        </button>

                        <button
                          type="button"
                          className="view-button site-action-edit"
                          onClick={() => handleOpenEdit(site)}
                          disabled={actionInProgressId === site.id}
                          aria-label={`Edit ${site.name}`}
                        >
                          <Edit2 size={13} /> Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button site-action-delete"
                          onClick={() => handleDelete(site)}
                          disabled={actionInProgressId === site.id}
                          aria-label={`Hapus ${site.name}`}
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <SiteModal
          open={modalOpen}
          editingSite={editingSite}
          onClose={() => {
            if (!modalBusy) {
              setModalOpen(false);
              setEditingSite(null);
            }
          }}
          onSave={handleSaveSite}
          busy={modalBusy}
          error={modalError}
        />
      )}
    </section>
  );
}

