import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { onSoftRefresh } from "../../utils/socket";
function TransferList() {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const lastSearchQueryRef = useRef("");
  const limit = 25;
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSoftRefresh((data) => {
      if (data.type === "Transfer_Employee") {
        fetchTransfers(currentPage, debouncedQuery);
      }
    });

    return () => unsubscribe();
  }, [currentPage, debouncedQuery]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery !== lastSearchQueryRef.current) {
      lastSearchQueryRef.current = debouncedQuery;
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }
    fetchTransfers(currentPage, debouncedQuery);
  }, [currentPage, debouncedQuery]);

  const fetchTransfers = async (page, query) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = query?.trim()
        ? `/search?q=${encodeURIComponent(query.trim())}&page=${page}&limit=${limit}&scope=all`
        : `/all?page=${page}&limit=${limit}`;
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/transfer${endpoint}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      setData(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const deleteCallBack = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/transfer/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setData((prevSales) => prevSales.filter((item) => item._id !== id));
      } else {
        console.error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };
  const handleView = (item) => {
    navigate("/transferview", {
      state: {
        item,
      },
    });
  };
  const handleDelete = (id) => {
    if (!id) return;
    deleteCallBack(id);
  };

  const summary = useMemo(
    () => ({
      total: data.length,
      matched: data.filter((item) => item?.domainName).length,
      query: debouncedQuery.trim(),
    }),
    [data, debouncedQuery]
  );

  return (
    <div className="min-h-[calc(100dvh-92px)] bg-[#f7f7f5] px-4 py-4 md:px-6 md:py-5">
      <div className="app-soft-panel overflow-hidden rounded-[28px]">
        <div className="border-b border-slate-200 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                Transfer Desk
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Transfer records</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Search across transfer records, review handoffs, and clean up stale requests from
                one streamlined list.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <input
                type="text"
                placeholder="Search by name, email, domain, or phone"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-6">
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible records</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">With domain</p>
            <p className="mt-3 text-2xl font-semibold text-orange-500">{summary.matched}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Search state</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {summary.query || "Showing all records"}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">Transfer list</h2>
              <p className="mt-1 text-xs text-slate-500">
                Search is debounced and paginated so the table stays responsive.
              </p>
            </div>

            <div className="max-h-[540px] overflow-auto">
              <table className="min-w-[860px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Created</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Name</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Email</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Phone</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Domain</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((item, index) => (
                      <tr key={item?._id || index} className="odd:bg-white even:bg-slate-50/60">
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {item?.createdAt ? moment(item.createdAt).format("MMM D, YYYY") : "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-700">
                          {item?.name || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {item?.email || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {item?.phone || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {item?.domainName || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-orange-200 text-orange-500 transition hover:border-orange-400 hover:bg-orange-50"
                              onClick={() => handleView(item)}
                              title="View transfer"
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:border-red-400 hover:bg-red-50"
                              onClick={() => handleDelete(item?._id)}
                              title="Delete transfer"
                            >
                              <MdDelete size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                        No transfer records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Refine the search box above to narrow results without leaving the page.
            </p>
            <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="px-2 text-xs font-semibold text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransferList;
