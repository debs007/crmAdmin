import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";

function EmployeesActivity() {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();
  const [shift, setShift] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const { allUsers } = useAuth();
  const [createEmpOpen, setCreateEmpOpen] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");
  const [newEmp, setNewEmp] = useState({
    name: "",
    aliceName: "",
    email: "",
    phone: "",
    password: "",
    employeeType: "",
    type: "",
  });
  const allEmployees = async () => {
    const response = await allUsers();
    setEmployees(response);
    setFilteredEmployees(response);
  };
  useEffect(() => {
    allEmployees();
  }, []);

  const handleView = (id) => {
    navigate(`/employeeDashboard/${id}`);
    // navigate("/employeeDashboard/",{state:{id}});
  };

  const handleEmpDetailsView = (id) => {
    navigate(`/updateEmpDetails/${id}`);
  };

  const handleShift = (e) => {
    const changedShift = e.target.value;
    setShift(changedShift);
    if (changedShift === "") {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (emp) => emp.type?.toLowerCase() === changedShift
      );
      setFilteredEmployees(filtered);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${import.meta.env.VITE_BACKEND_API}/auth/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    allEmployees();
  };

  const filterSearch = filteredEmployees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );
  const handleCreate = () => {
    setCreateEmpOpen(true);
    setShowCreatePassword(false);
  };

  const handleClose = () => {
    setCreateEmpOpen(false);
    setShowCreatePassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEmp({ ...newEmp, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/auth/admin/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newEmp),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error: ${errorData.message || res.status}`);
      }

      await res.json();

      setNewEmp({
        name: "",
        aliceName: "",
        email: "",
        phone: "",
        password: "",
        employeeType: "",
        type: "",
      });

      setCreateEmpOpen(false);
      setShowCreatePassword(false);
      allEmployees();
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-92px)] bg-[#f7f7f5] px-4 py-4 md:px-6 md:py-5">
      <div className="app-soft-panel overflow-hidden rounded-[28px]">
      <div className="border-b border-slate-200 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
              Team Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Employee Activity</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Review team members, monitor productivity counts, and create new employee profiles from one place.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600"
          >
            Create employee
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 px-5 py-5 md:px-6">
      <div className="grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)_auto]">
        <div>
          <select
            name="shift"
            id="shift"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            onChange={handleShift}
            value={shift}
          >
            <option value="">All shifts</option>
            <option value="day">Day</option>
            <option value="night">Night</option>
          </select>
        </div>
        <div className="">
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search by employee name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {filterSearch.length} employees visible
        </div>
      </div>
      </div>
      <div className="px-5 py-5 md:px-6 md:py-6">
      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[520px] overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              {/* <th className="border border-gray-300 p-2">Alice Name</th> */}
              <th className="px-4 py-3">Employee Type</th>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">CallBack</th>
              <th className="px-4 py-3">Transfer</th>
              <th className="px-4 py-3">Sales</th>
              <th className="px-4 py-3">Message Action</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filterSearch.map((data, i) => (
              <tr key={i} className="text-sm text-slate-600 transition hover:bg-orange-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{data?.name}</td>
                {/* <td className="border border-gray-300 px-2">
                  {data?.aliceName}
                </td> */}
                <td className="px-4 py-3">
                  {data?.employeeType || "Full-Time"}
                </td>
                <td className="px-4 py-3">{data?.type}</td>
                <td className="px-4 py-3">{data?.email}</td>
                <td className="px-4 py-3">{data?.phone}</td>
                <td className="px-4 py-3">
                  {data?.callBackCount || 0}
                </td>
                <td className="px-4 py-3">
                  {data?.transferCount || 0}
                </td>
                <td className="px-4 py-3">
                  {data?.saleCount || 0}
                </td>
                <td className="px-4 py-3">
                  {data?.message || 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                  <button
                    className="rounded-full border border-orange-200 bg-orange-50 p-2 text-orange-500 transition hover:bg-orange-100"
                    onClick={() => handleView(data?._id)}
                  >
                    <FaEye />
                  </button>
                  <button
                    className="rounded-full border border-blue-200 bg-blue-50 p-2 text-blue-500 transition hover:bg-blue-100"
                    onClick={() => handleEmpDetailsView(data?._id)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="rounded-full border border-red-200 bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                    onClick={() => handleDelete(data?._id)}
                  >
                    <MdDelete />
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      </div>
      {/* sidebar to create employee */}
      {createEmpOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/55 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
              <button
                onClick={handleClose}
                className="rounded-full border border-slate-200 p-2 text-slate-500"
              >
                <RxCross2 size={20} />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                  New Employee
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  Create Employee Profile
                </h2>
              </div>
            </div>

            {/* Employee Form */}
            <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="mb-3 ">
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    <span className="text-red-500 ">*</span> Employee Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    value={newEmp.name}
                    onChange={handleChange}
                    placeholder="Enter Employee Name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    <span className="text-red-500">*</span> Employee Type
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    value={newEmp.employeeType || ""}
                    id="employeeType"
                    name="employeeType"
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  <span className="text-red-500">*</span> Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  placeholder="Enter Email"
                  value={newEmp.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  <span className="text-red-500">*</span> Shift
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  value={newEmp.type || ""}
                  id="type"
                  name="type"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Shift</option>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="mb-3 ">
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    <span className="text-red-500">*</span> Phone
                  </label>
                  <input
                    type="number"
                    name="phone"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    value={newEmp.phone}
                    onChange={handleChange}
                    placeholder="Enter Phone"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    <span className="text-red-500">*</span> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCreatePassword ? "text" : "password"}
                      name="password"
                      value={newEmp.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                      placeholder="Enter Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                      aria-label={showCreatePassword ? "Hide password" : "Show password"}
                      title={showCreatePassword ? "Hide password" : "Show password"}
                    >
                      {showCreatePassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default EmployeesActivity;
