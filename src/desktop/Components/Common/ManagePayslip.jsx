import { useEffect, useState } from "react";
import moment from "moment";
import { downloadFile } from "../../../utils/helper";

/**
 * "Manage Payslip" section that admins use from inside the per-employee
 * dashboard. Lets the admin upload a payslip PDF for a specific (year, month)
 * and lists all uploaded payslips for that employee with a download link.
 *
 * Backend endpoints used:
 *   POST   /payslips         (multipart: file, employeeId, year, month, note)
 *   GET    /payslips/employee/:employeeId
 *   DELETE /payslips/:id
 */
const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ManagePayslip({ employeeId, employeeName }) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);

  const apiBase = import.meta.env.VITE_BACKEND_API;
  const token = () => localStorage.getItem("token");

  const fetchPayslips = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/payslips/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load");
      setPayslips(data?.payslips || []);
    } catch (err) {
      setError(err.message || "Could not load payslips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [employeeId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    setUploading(true);
    setError("");
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
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Upload failed");
      setFile(null);
      setNote("");
      await fetchPayslips();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payslip?")) return;
    try {
      const res = await fetch(`${apiBase}/payslips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success)
        throw new Error(data?.message || "Delete failed");
      await fetchPayslips();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  // Year options: a sensible window around today.
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="border rounded-md p-4 bg-white">
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        Manage Payslip{employeeName ? ` – ${employeeName}` : ""}
      </h2>

      <form
        onSubmit={handleUpload}
        className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end mb-4"
      >
        <div>
          <label className="block text-[11px] text-gray-600 mb-1">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-gray-600 mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
          >
            {monthOptions.map((label, idx) => (
              <option key={label} value={idx + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] text-gray-600 mb-1">
            File (PDF preferred)
          </label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full text-sm bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        <div className="md:col-span-5">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g., revised payslip after correction)"
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5"
          />
        </div>
      </form>

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      <div className="border-t pt-3">
        <h3 className="text-xs font-semibold text-gray-600 mb-2">Uploaded payslips</h3>
        {loading ? (
          <p className="text-xs text-gray-500">Loading...</p>
        ) : payslips.length === 0 ? (
          <p className="text-xs text-gray-500">No payslips uploaded yet.</p>
        ) : (
          <ul className="divide-y border rounded overflow-hidden">
            {payslips.map((p) => {
              const monthLabel = monthOptions[p.month - 1] || p.month;
              return (
                <li
                  key={p._id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">
                      {monthLabel} {p.year}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {p.fileName || "payslip"}
                      {p.note ? ` • ${p.note}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Uploaded {moment(p.createdAt).format("DD MMM YYYY, HH:mm")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadFile(p.fileUrl, p.fileName)}
                      className="px-2 py-1 rounded bg-slate-900 text-white"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p._id)}
                      className="px-2 py-1 rounded border border-red-300 text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
