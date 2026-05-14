import { useEffect, useRef, useState } from "react";
import moment from "moment";
import { MdOutlineUploadFile, MdDeleteOutline, MdDownload, MdPictureAsPdf, MdInsertDriveFile } from "react-icons/md";
import { FiCalendar, FiPaperclip } from "react-icons/fi";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

function FileIcon({ fileName }) {
  const ext = (fileName || "").split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <MdPictureAsPdf size={28} className="text-red-500" />;
  return <MdInsertDriveFile size={28} className="text-gray-400" />;
}

export default function ManagePayslip({ employeeId, employeeName }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const apiBase = import.meta.env.VITE_BACKEND_API;
  const token = () => localStorage.getItem("token");

  const downloadPayslip = async (id, fileName) => {
    try {
      const res = await fetch(`${apiBase}/payslips/download/${id}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) { alert("Download failed."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "payslip.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Download failed."); }
  };

  const fetchPayslips = async () => {
    if (!employeeId) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(`${apiBase}/payslips/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load");
      setPayslips(data?.payslips || []);
    } catch (err) {
      setError(err.message || "Could not load payslips");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayslips(); }, [employeeId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please choose a file."); return; }
    setUploading(true); setError(""); setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("employeeId", employeeId);
      fd.append("year", String(year));
      fd.append("month", String(month));
      if (note) fd.append("note", note);
      const res = await fetch(`${apiBase}/payslips`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Upload failed");
      setFile(null); setNote("");
      setSuccess(`Payslip for ${MONTHS[month - 1]} ${year} uploaded.`);
      await fetchPayslips();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete payslip "${label}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/payslips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Delete failed");
      await fetchPayslips();
    } catch (err) { alert(err.message || "Delete failed"); }
  };

  return (
    <div className="rounded-xl border border-surface-divider bg-white shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 bg-sidebar px-4 py-3">
        <MdOutlineUploadFile size={20} className="text-white opacity-80 shrink-0" />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight">Manage Payslips</p>
          {employeeName && (
            <p className="text-[11px] text-sidebar-muted truncate">{employeeName}</p>
          )}
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleUpload} className="space-y-3">
          {/* Period selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted mb-1 uppercase tracking-wide">
                <FiCalendar className="inline mr-1" />Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-sm border border-surface-divider rounded-md px-2.5 py-1.5 text-ink focus:outline-none focus:border-sidebar-active"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted mb-1 uppercase tracking-wide">
                <FiCalendar className="inline mr-1" />Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full text-sm border border-surface-divider rounded-md px-2.5 py-1.5 text-ink focus:outline-none focus:border-sidebar-active"
              >
                {MONTHS.map((label, idx) => (
                  <option key={label} value={idx + 1}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag-and-drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg px-4 py-5 text-center cursor-pointer transition-colors ${
              dragOver ? "border-sidebar-active bg-green-50"
              : file ? "border-confirm-500 bg-confirm-50"
              : "border-surface-divider hover:border-sidebar-active hover:bg-surface-subtle"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) setFile(dropped);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileIcon fileName={file.name} />
                <div className="text-left min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate max-w-[180px]">{file.name}</p>
                  <p className="text-[11px] text-ink-muted">{(file.size / 1024).toFixed(0)} KB · click to change</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-auto text-ink-faint hover:text-red-500 text-lg leading-none"
                >×</button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <FiPaperclip size={22} className="text-ink-muted" />
                <p className="text-[13px] font-medium text-ink-muted">
                  Drop a PDF here, or{" "}
                  <span className="text-sidebar-active font-semibold">click to browse</span>
                </p>
                <p className="text-[11px] text-ink-faint">PDF or image · up to 50 MB</p>
              </div>
            )}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional) — e.g. Revised payslip after correction"
            className="w-full text-[13px] border border-surface-divider rounded-md px-3 py-2 text-ink placeholder-ink-faint focus:outline-none focus:border-sidebar-active"
          />

          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-1.5">{error}</p>
          )}
          {success && (
            <p className="text-[12px] text-confirm-700 bg-confirm-50 border border-confirm-100 rounded px-3 py-1.5">{success}</p>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 rounded-md bg-sidebar text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <MdOutlineUploadFile size={18} />
            {uploading ? "Uploading…" : `Upload for ${MONTHS[month - 1]} ${year}`}
          </button>
        </form>

        {/* Payslip list */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wide mb-2">
            Uploaded payslips
          </p>
          {loading ? (
            <p className="text-[13px] text-ink-muted py-4 text-center">Loading…</p>
          ) : payslips.length === 0 ? (
            <p className="text-[13px] text-ink-muted py-4 text-center">No payslips uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {payslips.map((p) => {
                const monthLabel = MONTHS[p.month - 1] || p.month;
                return (
                  <li
                    key={p._id}
                    className="flex items-center gap-3 bg-surface-subtle rounded-lg border border-surface-divider px-3 py-2.5 hover:bg-surface-muted transition-colors"
                  >
                    <FileIcon fileName={p.fileName} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        {monthLabel} {p.year}
                        {p.note && (
                          <span className="ml-1 text-[11px] font-normal text-ink-muted">· {p.note}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-ink-faint truncate">{p.fileName}</p>
                      <p className="text-[10px] text-ink-faint">
                        {moment(p.createdAt).format("DD MMM YYYY, HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadPayslip(p._id, p.fileName)}
                        className="p-1.5 rounded-md hover:bg-white border border-transparent hover:border-surface-divider text-confirm-600"
                        title="Download"
                      >
                        <MdDownload size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p._id, `${monthLabel} ${p.year}`)}
                        className="p-1.5 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <MdDeleteOutline size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
