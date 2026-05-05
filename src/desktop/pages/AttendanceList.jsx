import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { useAuth } from "../../context/authContext";
import { onSoftRefresh } from "../../utils/socket";

const statusTone = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("late")) return "text-rose-600";
  if (normalized.includes("on time")) return "text-emerald-600";
  if (normalized.includes("absent")) return "text-amber-700";
  return "text-slate-600";
};

function AttendanceList() {
  const [attendance, setAttendance] = useState([]);
  const { allUsersAttendance } = useAuth();

  const fetchAttendanceData = async () => {
    const response = await allUsersAttendance();
    setAttendance(Array.isArray(response) ? response : []);
  };

  useEffect(() => {
    const unsubscribe = onSoftRefresh((data) => {
      if (data.type === "Attendence") {
        fetchAttendanceData();
      }
    });

    fetchAttendanceData();
    return () => unsubscribe();
  }, []);

  const summary = useMemo(
    () => ({
      total: attendance.length,
      late: attendance.filter((entry) => entry?.status === "Late").length,
      absent: attendance.filter((entry) => entry?.workStatus === "Absent").length,
      complete: attendance.filter((entry) => entry?.punchOut).length,
    }),
    [attendance]
  );

  return (
    <div className="min-h-[calc(100dvh-92px)] bg-[#f7f7f5] px-4 py-4 md:px-6 md:py-5">
      <div className="app-soft-panel overflow-hidden rounded-[28px]">
        <div className="border-b border-slate-200 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                Team Attendance
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Attendance overview</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Review the latest punch-in activity, working hours, and attendance status across
                the team in one cleaner view.
              </p>
            </div>
            <span className="app-stat-chip self-start rounded-full px-3 py-1 text-xs font-semibold">
              {summary.total} records
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4 md:px-6">
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total entries</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Late arrivals</p>
            <p className="mt-3 text-2xl font-semibold text-rose-600">{summary.late}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Absent</p>
            <p className="mt-3 text-2xl font-semibold text-amber-700">{summary.absent}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Completed days</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-600">{summary.complete}</p>
          </div>
        </div>

        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">Attendance records</h2>
              <p className="mt-1 text-xs text-slate-500">
                The list refreshes automatically when new attendance entries are synced.
              </p>
            </div>

            <div className="max-h-[540px] overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">No</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Name</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Date</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                      Punch In
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                      Punch Out
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                      Production
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                      IP Address
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">
                      Work Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length > 0 ? (
                    attendance.map((entry, index) => (
                      <tr key={entry?._id || index} className="odd:bg-white even:bg-slate-50/60">
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-700">
                          {entry?.user_id?.name || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {entry?.date ? moment(entry.date).format("MMM D, YYYY") : "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {entry?.punchIn ? moment(entry.punchIn).format("HH:mm") : "Not done"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {entry?.punchOut ? moment(entry.punchOut).format("HH:mm") : "Not done"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {entry?.workingTime
                            ? moment.utc(entry.workingTime * 60 * 1000).format("H [hr] m [mins]")
                            : "0 hr 0 mins"}
                        </td>
                        <td
                          className={`border-b border-slate-100 px-4 py-3 font-medium ${statusTone(entry?.status)}`}
                        >
                          {entry?.status || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                          {entry?.ip || "--"}
                        </td>
                        <td
                          className={`border-b border-slate-100 px-4 py-3 font-medium ${statusTone(entry?.workStatus)}`}
                        >
                          {entry?.workStatus || "--"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                        No attendance records available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceList;
