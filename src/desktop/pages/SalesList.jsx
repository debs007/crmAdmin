import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { onSoftRefresh } from "../../utils/socket";
function SalesList() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;
  const fetchSalesList = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/sale/all?page=${currentPage}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();

        setSales(data?.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onSoftRefresh((data) => {
      if (data.type === "Sale_Employee") {
        fetchSalesList();
      }
    });

    fetchSalesList();
    return () => unsubscribe();
  }, [currentPage]);

  const deleteCallBack = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/sale/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSales((prevSales) => prevSales.filter((item) => item._id !== id));
      } else {
        console.error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const handleView = (item) => {
    navigate("/salesview", {
      state: {
        item,
      },
    });
  };
  const handleDelete = (id) => {
    if (!id) return;
    deleteCallBack(id);
    fetchSalesList();
  };

  const summary = useMemo(
    () => ({
      total: sales.length,
      withDomain: sales.filter((item) => item?.domainName).length,
      withEmail: sales.filter((item) => item?.email).length,
    }),
    [sales]
  );

  return (
    <div className="min-h-[calc(100dvh-92px)] bg-[#f7f7f5] px-4 py-4 md:px-6 md:py-5">
      <div className="app-soft-panel overflow-hidden rounded-[28px]">
        <div className="border-b border-slate-200 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                Sales Pipeline
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sales records</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Keep sales entries readable, review lead details quickly, and move through pages
                without losing the overall view.
              </p>
            </div>
            <span className="app-stat-chip self-start rounded-full px-3 py-1 text-xs font-semibold">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-6">
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible records</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">With domain</p>
            <p className="mt-3 text-2xl font-semibold text-orange-500">{summary.withDomain}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">With email</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-600">{summary.withEmail}</p>
          </div>
        </div>

        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-800">Sales list</h2>
              <p className="mt-1 text-xs text-slate-500">
                Review records and use the actions column to open or remove entries.
              </p>
            </div>

            <div className="max-h-[540px] overflow-auto">
              <table className="min-w-[820px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Created</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Name</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Phone</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Email</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-semibold">Domain</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length > 0 ? (
                    sales.map((item, index) => (
                      <tr key={item?._id || index} className="odd:bg-white even:bg-slate-50/60">
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {item?.createdAt ? moment(item.createdAt).format("MMM D, YYYY") : "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-700">
                          {item?.name || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {item?.phone || "--"}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
                          {item?.email || "--"}
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
                              title="View sale"
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:border-red-400 hover:bg-red-50"
                              onClick={() => handleDelete(item?._id)}
                              title="Delete sale"
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
                        No sales records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Keep moving through the pipeline with the paginated navigation controls.
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

export default SalesList;
