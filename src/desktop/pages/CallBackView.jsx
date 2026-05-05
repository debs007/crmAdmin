import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CallbackView() {
  const navigate = useNavigate();
  const location = useLocation();
  const callbackdata = location?.state?.item;
  const [callback, setCallback] = useState({
    name: callbackdata?.name || "",
    email: callbackdata?.email || "",
    phone: callbackdata?.phone || "",
    calldate: callbackdata?.calldate || "",
    domainName: callbackdata?.domainName || "",
    buget: callbackdata?.buget || "",
    country: callbackdata?.country || "",
    address: callbackdata?.address || "",
    comments: callbackdata?.comments || "",
  });

  const fieldClassName =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCallback((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/callback/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(callback),
      });

      if (response.ok) {
        navigate("/callbacklist");
      } else {
        console.error("Failed to update callback");
      }
      navigate("/callbacklist");
    } catch (error) {
      console.error("Error updating callback:", error);
    }
  };

  if (!callbackdata) {
    return (
      <div className="min-h-[calc(100dvh-92px)] bg-[#f7f7f5] px-4 py-4 md:px-6 md:py-5">
        <div className="app-soft-panel rounded-[28px] px-6 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">Callback details</h1>
          <p className="mt-3 text-sm text-slate-500">
            No callback data was provided for this screen.
          </p>
          <button
            type="button"
            onClick={() => navigate("/callbacklist")}
            className="mt-6 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600"
          >
            Back to callback list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-92px)] bg-[#f7f7f5] px-4 py-4 md:px-6 md:py-5">
      <div className="app-soft-panel overflow-hidden rounded-[28px]">
        <div className="border-b border-slate-200 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                Callback Details
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Update callback record
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Keep the callback record accurate before it moves further into follow-up or sales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/callbacklist")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-orange-300 hover:text-orange-500"
            >
              Back to list
            </button>
          </div>
        </div>

        <form className="px-5 py-5 md:px-6 md:py-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-600">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className={fieldClassName}
                onChange={handleChange}
                value={callback.name}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-600">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleChange}
                value={callback.email}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-600">
                Phone Number
              </label>
              <input
                type="number"
                name="phone"
                id="phone"
                onChange={handleChange}
                value={callback.phone}
                className={fieldClassName}
              />
            </div>
            <div>
              <label
                htmlFor="domainName"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Domain Name
              </label>
              <input
                type="text"
                name="domainName"
                id="domainName"
                onChange={handleChange}
                value={callback.domainName}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-600">
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                onChange={handleChange}
                value={callback.address}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="country" className="mb-2 block text-sm font-medium text-slate-600">
                Country
              </label>
              <input
                type="text"
                name="country"
                id="country"
                onChange={handleChange}
                value={callback.country}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="calldate" className="mb-2 block text-sm font-medium text-slate-600">
                Call Date
              </label>
              <input
                type="date"
                name="calldate"
                id="calldate"
                onChange={handleChange}
                value={callback.calldate}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="buget" className="mb-2 block text-sm font-medium text-slate-600">
                Budget
              </label>
              <input
                type="text"
                name="buget"
                id="buget"
                value={callback.buget}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="comment" className="mb-2 block text-sm font-medium text-slate-600">
              Comments
            </label>
            <textarea
              name="comments"
              id="comment"
              onChange={handleChange}
              value={callback.comments}
              rows={5}
              className={`${fieldClassName} min-h-[160px] resize-none`}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600"
              onClick={() => handleEdit(callbackdata?._id)}
            >
              Save callback details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CallbackView;
