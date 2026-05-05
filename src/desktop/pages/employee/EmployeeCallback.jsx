import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function EmployeeCallback() {
  const { id } = useParams();
  const [callback, setCallback] = useState([]);
  const fetchUserCallbacks = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/callback/user/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
      
        setCallback(data?.callback);
      } else {
        console.error("Failed to fetch callbacks:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching user callbacks:", error);
    }
  };

  useEffect(() => {
    fetchUserCallbacks(id);
  }, []);

  return (
    <div className=" w-[1000px] h-[450px] overflow-auto mt-8 px-4">
      <table className="w-full border border-gray-300 shadow-md rounded-lg">
        <thead className="bg-orange-500 text-white text-[14px] sticky top-0">
          <tr className="text-[14px] ">
            <th className="px-2 border border-gray-300">Name</th>
            <th className="px-2 border border-gray-300">Email</th>
            <th className="px-2 border border-gray-300">Phone</th>
            <th className="px-2 border border-gray-300">Call Date</th>
            <th className="px-2 border border-gray-300">Domain Name</th>
            <th className="px-2 border border-gray-300">Country</th>
            <th className="px-2 border border-gray-300">Address</th>
            <th className="px-2 border border-gray-300">Comments</th>
            {/* <th className="px-2 border border-gray-300">Budget</th> */}
            <th className="px-2 border border-gray-300">Created Date</th>
            {/* <th className="px-2 border border-gray-300">Action</th> */}
          </tr>
        </thead>
        <tbody className="bg-gray-100 text-gray-700 text-[13px]  overflow-y-auto overflow-x-auto">
          {callback?.length > 0 ? (
            callback.map((data, i) => (
              <tr key={i} className="hover:bg-orange-100 transition-all duration-200 text-center">
                <td className="p-2 border border-gray-300">{data?.name || "N/A"}</td>
                <td className="p-2 border border-gray-300">{data?.email || "N/A"}</td>
                <td className="p-2 border border-gray-300">{data?.phone || "N/A"}</td>
                <td className="p-2 border border-gray-300">{data?.calldate || "N/A"}</td>
                <td className="p-2 border border-gray-300">{data?.domainName || "N/A"}</td>
                <td className="p-2 border border-gray-300">{data?.country || "N/A"}</td>
                <td className="p-2 border border-gray-300">{data?.address || "N/A"}</td>
                <td className="p-2 border border-gray-300">{data?.comments || "N/A"}</td>
                {/* <td className="p-2 border border-gray-300">{data?.buget || "N/A"}</td> */}
                <td className="p-2 border border-gray-300">
                  {data?.createdDate}
                </td>
                {/* <td className=" border border-gray-300">
                  <button className="bg-blue-500 text-white px-2 py-1 rounded">
                    Edit
                  </button>
                </td> */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12" className="text-center">
                No Data Available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeCallback;
