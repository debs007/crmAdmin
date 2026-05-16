import { useEffect, useRef, useState } from "react";
import moment from "moment";
import { MdUploadFile, MdDeleteOutline, MdTableChart, MdCheckCircle } from "react-icons/md";
import { FiCalendar, FiDownload } from "react-icons/fi";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const FIELDS = [
  { key: "empId",        label: "Emp ID" },
  { key: "email",        label: "Email" },
  { key: "name",         label: "Name" },
  { key: "position",     label: "Position" },
  { key: "grossSalary",  label: "Gross Salary" },
  { key: "attendance",   label: "Attendance" },
  { key: "totalAbsent",  label: "Total Absent" },
  { key: "inHandSalary", label: "In Hand Salary" },
  { key: "ptax",         label: "P.Tax" },
  { key: "remarks",      label: "Remarks" },
];

export default function AdminSalarySheet() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const apiBase = import.meta.env.VITE_BACKEND_API;
  const authHeader = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const fetchSheets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/salary-sheet`, { headers: authHeader });
      const data = await res.json().catch(() => ({}));
      setSheets(data?.sheets || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSheets(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a CSV file."); return; }
    setUploading(true); setError(""); setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("month", month);
      fd.append("year", year);
      fd.append("title", title);
      const res = await fetch(`${apiBase}/salary-sheet/upload`, {
        method: "POST", headers: authHeader, body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Upload failed");
      setFile(null); setTitle("");
      setSuccess(`Salary sheet for ${MONTHS[month - 1]} ${year} uploaded — ${data.sheet?.rows?.length ?? 0} employees.`);
      await fetchSheets();
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this salary sheet?")) return;
    try {
      const res = await fetch(`${apiBase}/salary-sheet/${id}`, { method: "DELETE", headers: authHeader });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message || "Delete failed");
      if (selectedSheet?._id === id) setSelectedSheet(null);
      await fetchSheets();
    } catch (err) { alert(err.message || "Delete failed"); }
  };

  const downloadTemplate = () => {
    const header = "EmpId,Email,Name,Position,Gross Salary,Attendance,Total Absent,In Hand Salary,Ptax,Remarks";
    const sample = "EMP001,john@company.com,John Doe,Developer,50000,26,0,48000,200,";
    const blob = new Blob([header + "\n" + sample], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "salary_sheet_template.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Salary Sheets</h1>
            <p className="text-sm text-slate-500 mt-0.5">Upload monthly CSV salary data for employees</p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <FiDownload size={15} />
            Download template CSV
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
          {/* Upload panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-sidebar to-purple-800 px-5 py-4">
                <p className="text-white font-bold flex items-center gap-2">
                  <MdUploadFile size={20} /> Upload CSV
                </p>
              </div>
              <form onSubmit={handleUpload} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      <FiCalendar className="inline mr-1" />Month
                    </label>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sidebar-active">
                      {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      <FiCalendar className="inline mr-1" />Year
                    </label>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sidebar-active">
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional) — e.g. May 2026 Payroll"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sidebar-active" />

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors ${
                    dragOver ? "border-sidebar-active bg-purple-50"
                    : file ? "border-green-400 bg-green-50"
                    : "border-slate-200 hover:border-sidebar-active hover:bg-slate-50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <MdCheckCircle size={22} className="text-green-500" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="ml-auto text-slate-400 hover:text-red-500 text-lg">×</button>
                    </div>
                  ) : (
                    <>
                      <MdUploadFile size={28} className="mx-auto text-slate-300 mb-1" />
                      <p className="text-sm text-slate-500">Drop CSV here or <span className="text-sidebar font-semibold">click to browse</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">Only .csv files</p>
                    </>
                  )}
                </div>

                {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                {success && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

                <button type="submit" disabled={uploading || !file}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sidebar to-purple-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity">
                  <MdUploadFile size={17} />
                  {uploading ? "Uploading…" : `Upload for ${MONTHS[month - 1]} ${year}`}
                </button>
              </form>
            </div>

            {/* Uploaded sheets list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-700">Uploaded sheets ({sheets.length})</p>
              </div>
              {loading ? (
                <p className="text-sm text-slate-400 px-5 py-4">Loading…</p>
              ) : sheets.length === 0 ? (
                <p className="text-sm text-slate-400 px-5 py-4">No sheets uploaded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {sheets.map((s) => {
                    const isActive = selectedSheet?._id === s._id;
                    return (
                      <li key={s._id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-purple-50" : "hover:bg-slate-50"}`}
                        onClick={() => setSelectedSheet(isActive ? null : s)}>
                        <MdTableChart size={20} className={isActive ? "text-sidebar" : "text-slate-400"} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {s.title || `${MONTHS[s.month - 1]} ${s.year}`}
                          </p>
                          <p className="text-xs text-slate-400">{s.rows?.length ?? 0} employees · {moment(s.createdAt).format("DD MMM YYYY")}</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }}
                          className="text-slate-300 hover:text-red-500 transition-colors">
                          <MdDeleteOutline size={18} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Data table */}
          {selectedSheet ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-base font-bold text-slate-900">
                    {selectedSheet.title || `${MONTHS[selectedSheet.month - 1]} ${selectedSheet.year}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSheet.rows?.length ?? 0} employees</p>
                </div>
                <button type="button" onClick={() => setSelectedSheet(null)}
                  className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {FIELDS.map((f) => (
                        <th key={f.key} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(selectedSheet.rows || []).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        {FIELDS.map((f) => (
                          <td key={f.key} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {f.key === "empId" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold">
                                {row[f.key] || "—"}
                              </span>
                            ) : f.key === "inHandSalary" || f.key === "grossSalary" ? (
                              <span className="font-semibold text-slate-900">{row[f.key] || "—"}</span>
                            ) : (
                              row[f.key] || <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="hidden xl:flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <div className="text-center">
                <MdTableChart size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a sheet from the left to view data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
