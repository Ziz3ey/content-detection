import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Edit2,
  Trash2,
  RotateCw,
  LoaderCircle,
  X,
  Check,
  TriangleAlert,
  Globe2,
  CheckCheck,
} from "lucide-react";
import { formatTime } from "./formatters.js";

const DAYS_OF_WEEK = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 0, label: "Minggu" },
];

function ScheduleModal({
  isOpen,
  editingSchedule,
  sites = [],
  onClose,
  onSave,
  busy,
  error,
}) {
  const [name, setName] = useState(editingSchedule ? editingSchedule.name : "");
  const [targetType, setTargetType] = useState(
    editingSchedule ? editingSchedule.targetType : "all_active"
  );
  const [selectedSiteIds, setSelectedSiteIds] = useState(
    editingSchedule && Array.isArray(editingSchedule.siteIds)
      ? editingSchedule.siteIds
      : []
  );
  const [frequency, setFrequency] = useState(
    editingSchedule ? editingSchedule.frequency : "daily"
  );
  const [timeOfDay, setTimeOfDay] = useState(
    editingSchedule ? editingSchedule.timeOfDay : "02:00"
  );
  const [dayOfWeek, setDayOfWeek] = useState(
    editingSchedule && editingSchedule.dayOfWeek !== null
      ? String(editingSchedule.dayOfWeek)
      : "1"
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    editingSchedule && editingSchedule.dayOfMonth !== null
      ? String(editingSchedule.dayOfMonth)
      : "1"
  );
  const [status, setStatus] = useState(
    editingSchedule ? editingSchedule.status : "active"
  );
  const [formError, setFormError] = useState("");

  const activeSites = useMemo(
    () => sites.filter((site) => site.status === "active"),
    [sites]
  );

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Nama jadwal wajib diisi.");
      return;
    }

    if (targetType === "custom" && selectedSiteIds.length === 0) {
      setFormError("Pilih minimal satu situs untuk jadwal target tertentu.");
      return;
    }

    onSave({
      name: name.trim(),
      targetType,
      siteIds: targetType === "custom" ? selectedSiteIds : [],
      frequency,
      timeOfDay,
      dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : null,
      dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : null,
      timezone: "Asia/Makassar",
      status,
    });
  }

  const allActiveSelected =
    activeSites.length > 0 &&
    activeSites.every((site) => selectedSiteIds.includes(site.id));

  function toggleAllSites() {
    if (allActiveSelected) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(activeSites.map((s) => s.id));
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
      aria-labelledby="schedule-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="site-modal schedule-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 id="schedule-modal-title" className="modal-title">
              {editingSchedule ? "Edit Jadwal Pemeriksaan" : "Buat Jadwal Pemeriksaan Baru"}
            </h2>
            <p className="modal-subtitle">
              {editingSchedule
                ? "Perbarui frekuensi dan konfigurasi target jadwal pemindaian."
                : "Atur jadwal pemindaian otomatis berkala untuk situs web terpilih."}
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

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <label className="field-label" htmlFor="schedule-name-input">
              Nama jadwal
            </label>
            <input
              id="schedule-name-input"
              className="login-input"
              type="text"
              placeholder="Contoh: Pemantauan Rutin Harian OPD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <fieldset className="schedule-target-fieldset">
              <legend className="field-label">Target website</legend>
              <div className="schedule-radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="targetType"
                    value="all_active"
                    checked={targetType === "all_active"}
                    onChange={() => setTargetType("all_active")}
                  />
                  <span>Semua website aktif ({activeSites.length} situs)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="targetType"
                    value="custom"
                    checked={targetType === "custom"}
                    onChange={() => setTargetType("custom")}
                  />
                  <span>Website tertentu saja</span>
                </label>
              </div>

              {targetType === "custom" && (
                <div className="schedule-custom-sites-box">
                  <div className="schedule-sites-header">
                    <span>Pilih situs:</span>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={toggleAllSites}
                    >
                      {allActiveSelected ? "Batal pilih semua" : "Pilih semua"}
                    </button>
                  </div>
                  {activeSites.length === 0 ? (
                    <p className="field-hint">Belum ada situs aktif terdaftar.</p>
                  ) : (
                    <div className="schedule-sites-list">
                      {activeSites.map((site) => (
                        <label className="schedule-site-item" key={site.id}>
                          <input
                            type="checkbox"
                            checked={selectedSiteIds.includes(site.id)}
                            onChange={() =>
                              setSelectedSiteIds((current) =>
                                current.includes(site.id)
                                  ? current.filter((id) => id !== site.id)
                                  : [...current, site.id]
                              )
                            }
                          />
                          <span className="site-name-text">{site.name}</span>
                          <span className="site-url-text">{site.url}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </fieldset>

            <div className="form-row">
              <div>
                <label className="field-label" htmlFor="schedule-frequency-select">
                  Frekuensi
                </label>
                <select
                  id="schedule-frequency-select"
                  className="modal-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="daily">Setiap hari (Daily)</option>
                  <option value="weekly">Setiap minggu (Weekly)</option>
                  <option value="monthly">Setiap bulan (Monthly)</option>
                </select>
              </div>

              {frequency === "weekly" && (
                <div>
                  <label className="field-label" htmlFor="schedule-day-select">
                    Hari pemeriksaan
                  </label>
                  <select
                    id="schedule-day-select"
                    className="modal-select"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={String(day.value)}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {frequency === "monthly" && (
                <div>
                  <label className="field-label" htmlFor="schedule-date-select">
                    Tanggal setiap bulan
                  </label>
                  <select
                    id="schedule-date-select"
                    className="modal-select"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        Tanggal {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="schedule-time-input">
                  Jam pemeriksaan (WITA)
                </label>
                <input
                  id="schedule-time-input"
                  className="login-input"
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  required
                />
              </div>
            </div>

            <p className="field-hint">
              Zona waktu: <strong>Asia/Makassar (WITA / UTC+8)</strong>
            </p>

            <div className="form-row" style={{ marginTop: "1rem" }}>
              <div>
                <label className="field-label" htmlFor="schedule-status-select">
                  Status jadwal
                </label>
                <select
                  id="schedule-status-select"
                  className="modal-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            {(formError || error) && (
              <p className="field-error modal-error" role="alert">
                {formError || error}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={15} /> Menyimpan...
                </>
              ) : (
                "Simpan Jadwal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getFrequencyLabel(schedule) {
  if (schedule.frequency === "daily") {
    return "Setiap hari";
  }
  if (schedule.frequency === "weekly") {
    const dayObj = DAYS_OF_WEEK.find((d) => d.value === schedule.dayOfWeek);
    return `Setiap ${dayObj ? dayObj.label : "Senin"}`;
  }
  if (schedule.frequency === "monthly") {
    return `Setiap tgl ${schedule.dayOfMonth || 1}`;
  }
  return schedule.frequency || "Harian";
}

function formatFrequencyDisplay(schedule) {
  const time = `${schedule.timeOfDay} WITA`;
  if (schedule.frequency === "daily") {
    return `Setiap hari, pukul ${time}`;
  }
  if (schedule.frequency === "weekly") {
    const dayObj = DAYS_OF_WEEK.find((d) => d.value === schedule.dayOfWeek);
    return `Setiap ${dayObj ? dayObj.label : "Senin"}, pukul ${time}`;
  }
  if (schedule.frequency === "monthly") {
    return `Setiap tgl ${schedule.dayOfMonth || 1}, pukul ${time}`;
  }
  return `${schedule.frequency} - ${time}`;
}

export default function ScheduleManagement({
  schedules = [],
  sites = [],
  loading = false,
  error = "",
  onRefresh,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onRunNow,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [actionInProgressId, setActionInProgressId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  function handleOpenAdd() {
    setEditingSchedule(null);
    setModalError("");
    setModalOpen(true);
  }

  function handleOpenEdit(schedule) {
    setEditingSchedule(schedule);
    setModalError("");
    setModalOpen(true);
  }

  async function handleSaveSchedule(payload) {
    setModalBusy(true);
    setModalError("");
    try {
      if (editingSchedule) {
        await onUpdateSchedule(editingSchedule.id, payload);
      } else {
        await onCreateSchedule(payload);
      }
      setModalOpen(false);
      setEditingSchedule(null);
    } catch (err) {
      setModalError(err.message || "Gagal menyimpan jadwal.");
      throw err;
    } finally {
      setModalBusy(false);
    }
  }

  async function handleToggleStatus(schedule) {
    const nextStatus = schedule.status === "active" ? "inactive" : "active";
    setActionInProgressId(schedule.id);
    setActionMessage("");
    try {
      await onUpdateSchedule(schedule.id, { status: nextStatus });
    } catch (err) {
      setActionMessage(err.message || "Gagal mengubah status jadwal.");
    } finally {
      setActionInProgressId("");
    }
  }

  async function handleDelete(schedule) {
    if (!window.confirm(`Hapus jadwal pemeriksaan "${schedule.name}"?`)) {
      return;
    }
    setActionInProgressId(schedule.id);
    setActionMessage("");
    try {
      await onDeleteSchedule(schedule.id);
    } catch (err) {
      setActionMessage(err.message || "Gagal menghapus jadwal.");
    } finally {
      setActionInProgressId("");
    }
  }

  async function handleRunNow(schedule) {
    setActionInProgressId(schedule.id);
    setActionMessage(`Memulai pemeriksaan otomatis untuk "${schedule.name}"...`);
    try {
      const res = await onRunNow(schedule.id);
      setActionMessage(
        `Pemeriksaan selesai: ${res?.summary || "Jadwal berhasil dijalankan."}`
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionMessage(`Gagal menjalankan jadwal: ${err.message}`);
    } finally {
      setActionInProgressId("");
    }
  }

  return (
    <section className="sites-section" id="jadwal" aria-label="Jadwal pemeriksaan otomatis">
      <div className="section-heading-row">
        <div className="section-heading-text">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> JADWAL PEMINDAIAN
          </p>
          <h2 className="page-title">Jadwal Pemeriksaan Otomatis</h2>
          <p className="intro-copy">
            Atur frekuensi dan waktu pemeriksaan website Pemerintah Kabupaten Sumbawa secara otomatis (WITA / UTC+8).
          </p>
        </div>
        <div className="section-heading-actions">
          <button
            type="button"
            className="icon-button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Muat ulang jadwal"
            title="Muat ulang jadwal"
          >
            <RotateCw size={16} className={loading ? "spin" : ""} />
          </button>
          <button
            type="button"
            className="btn btn-primary btn-add-site"
            onClick={handleOpenAdd}
          >
            <Plus size={16} /> <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="history-notice" role="status" style={{ marginBottom: "1.25rem" }}>
          <Check size={16} /> {actionMessage}
        </div>
      )}

      {error && (
        <div className="history-notice" role="alert" style={{ marginBottom: "1.25rem" }}>
          <TriangleAlert size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="history-notice">
          <LoaderCircle className="spin" size={16} /> Memuat jadwal pemeriksaan...
        </div>
      ) : schedules.length === 0 ? (
        <div className="history-empty">
          <Calendar size={22} />
          <span>Belum ada jadwal pemeriksaan otomatis. Klik "Tambah Jadwal" untuk membuat baru.</span>
        </div>
      ) : (
        <div className="sites-table-card">
          <div className="sites-table-wrap">
            <table className="sites-table schedule-table">
              <thead>
                <tr>
                  <th className="col-sched-name">Nama Jadwal</th>
                  <th className="col-sched-target">Target Website</th>
                  <th className="col-sched-freq">Frekuensi & Jam</th>
                  <th className="col-sched-last">Pemeriksaan Terakhir</th>
                  <th className="col-sched-next">Jadwal Berikutnya</th>
                  <th className="col-sched-status text-center">Status</th>
                  <th className="col-sched-actions text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    {/* 1. Nama Jadwal */}
                    <td className="col-sched-name">
                      <div className="schedule-name-wrap">
                        <strong className="schedule-name-title">{schedule.name}</strong>
                        {Boolean(schedule.isRunning) && (
                          <span className="schedule-running-badge">
                            <LoaderCircle size={12} className="spin" /> Sedang berjalan...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Target Website */}
                    <td className="col-sched-target">
                      {schedule.targetType === "all_active" ? (
                        <span className="badge-target badge-target-all">
                          <Globe2 size={12} className="target-icon" />
                          <span>Semua situs aktif</span>
                        </span>
                      ) : (
                        <span className="badge-target badge-target-custom">
                          <Globe2 size={12} className="target-icon" />
                          <span>{Array.isArray(schedule.siteIds) ? schedule.siteIds.length : 0} situs terpilih</span>
                        </span>
                      )}
                    </td>

                    {/* 3. Frekuensi & Jam */}
                    <td className="col-sched-freq">
                      <div className="schedule-freq-box">
                        <span className="schedule-freq-text">
                          <Calendar size={13} />
                          <span>{getFrequencyLabel(schedule)}</span>
                        </span>
                        <span className="schedule-time-pill">
                          <Clock size={11} />
                          <span>pukul {schedule.timeOfDay || "00:00"} WITA</span>
                        </span>
                      </div>
                    </td>

                    {/* 4. Pemeriksaan Terakhir */}
                    <td className="col-sched-last">
                      {schedule.lastRunAt ? (
                        <div className="schedule-last-run-wrap">
                          <span className="schedule-last-date">{formatTime(schedule.lastRunAt)}</span>
                          <div className="schedule-last-result-row">
                            <span
                              className={`status-badge ${
                                schedule.lastRunStatus === "success"
                                  ? "status-good"
                                  : schedule.lastRunStatus === "partial"
                                    ? "status-warning"
                                    : "status-bad"
                              }`}
                            >
                              <span
                                className={`status-dot ${
                                  schedule.lastRunStatus === "success"
                                    ? "dot-good"
                                    : schedule.lastRunStatus === "partial"
                                      ? "dot-warning"
                                      : "dot-bad"
                                }`}
                              />
                              {schedule.lastRunStatus === "success"
                                ? "BERHASIL"
                                : schedule.lastRunStatus === "partial"
                                  ? "SEBAGIAN"
                                  : "GAGAL"}
                            </span>
                            {schedule.lastRunMessage && (
                              <span className="schedule-last-msg-text" title={schedule.lastRunMessage}>
                                {schedule.lastRunMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="status-badge status-muted">
                          <span className="status-dot dot-muted" />
                          BELUM PERNAH DIJALANKAN
                        </span>
                      )}
                    </td>

                    {/* 5. Jadwal Berikutnya */}
                    <td className="col-sched-next">
                      {schedule.nextRunAt ? (
                        <div className="schedule-next-box">
                          <Clock size={13} className="schedule-next-icon" />
                          <span className="schedule-next-time">{formatTime(schedule.nextRunAt)}</span>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* 6. Status */}
                    <td className="col-sched-status text-center">
                      <span
                        className={`status-badge ${
                          schedule.status === "active" ? "status-good" : "status-muted"
                        }`}
                      >
                        <span className={`status-dot ${schedule.status === "active" ? "dot-good" : "dot-muted"}`} />
                        {schedule.status === "active" ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>

                    {/* 7. Aksi */}
                    <td className="col-sched-actions text-right">
                      <div className="site-row-actions">
                        <button
                          type="button"
                          className="btn-run-now"
                          onClick={() => handleRunNow(schedule)}
                          disabled={actionInProgressId === schedule.id || Boolean(schedule.isRunning)}
                          title="Jalankan pemeriksaan jadwal ini sekarang"
                        >
                          {actionInProgressId === schedule.id ? (
                            <LoaderCircle size={13} className="spin" />
                          ) : (
                            <Play size={13} />
                          )}
                          <span>Jalankan</span>
                        </button>

                        <button
                          type="button"
                          className={`btn-toggle-status ${
                            schedule.status === "active" ? "btn-deactivate" : "btn-activate"
                          }`}
                          onClick={() => handleToggleStatus(schedule)}
                          disabled={actionInProgressId === schedule.id}
                        >
                          {schedule.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button
                          type="button"
                          className="view-button site-action-edit"
                          onClick={() => handleOpenEdit(schedule)}
                          disabled={actionInProgressId === schedule.id}
                          aria-label={`Edit ${schedule.name}`}
                        >
                          <Edit2 size={13} /> <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="delete-button site-action-delete"
                          onClick={() => handleDelete(schedule)}
                          disabled={actionInProgressId === schedule.id}
                          aria-label={`Hapus ${schedule.name}`}
                        >
                          <Trash2 size={13} /> <span>Hapus</span>
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

      <ScheduleModal
        isOpen={modalOpen}
        editingSchedule={editingSchedule}
        sites={sites}
        onClose={() => {
          setModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        busy={modalBusy}
        error={modalError}
      />
    </section>
  );
}

