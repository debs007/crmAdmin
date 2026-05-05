import { useEffect, useState } from "react";
import moment from "moment";
import { useAuth } from "../../context/authContext";
import { onSoftRefresh } from "../../utils/socket";

function Attendance() {
  const { allUsersAttendance } = useAuth();
  const [attendance, setAttendance] = useState([]);

  const fetchAttendanceData = async () => {
    const response = await allUsersAttendance();

    setAttendance(response);
  };

  useEffect(() => {

    const unsubscribe = onSoftRefresh((data) => {
      if (data.type === "Attendence") {
        fetchAttendanceData();
      }

    });

    fetchAttendanceData();
    return () => unsubscribe(); // Cleanup on unmount

  }, []);

  return (
    <div className="mt-6 lg:mt-10 px-2 lg:px-4">
      <div className="overflow-auto border border-gray-300 shadow-lg rounded-lg max-h-full lg:max-h-[450px]">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead className="bg-orange-500 text-white text-[14px] sticky top-0 z-10">
            <tr>
              {[
                "NO",
                "Name",
                "Date",
                "Punch In",
                "Punch Out",
                "Production",
                "Status",
                "IP Address",
                "Work Status",
              ].map((heading, index) => (
                <th
                  key={index}
                  className="border border-gray-400 px-4 py-3 font-semibold"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="text-gray-700 text-[13px]">
            {attendance?.map((user, i) => (
              <tr
                key={i}
                className={`text-center ${i % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-orange-100 transition-all duration-200`}
              >
                <td className="border border-gray-300 px-3 py-2">{i + 1}</td>
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {user?.user_id?.name || "N/A"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {moment(user.date).format("MMM Do, YYYY")}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {user.punchIn
                    ? moment(user.firstPunchIn).format("HH:mm")
                    : "Clock In Not Done"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {user.punchOut
                    ? moment(user.punchOut).format("HH:mm")
                    : " Clock Out Not Done"}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {user.workingTime
                    ? moment
                      .utc(user.workingTime * 60 * 1000)
                      .format("H [hr] m [mins]")
                    : "0 hr 0 mins"}
                </td>
                <td
                  className={`border border-gray-300 px-3 py-2 font-medium ${user.status === "Present"
                    ? "text-green-600"
                    : user.status === "Absent"
                      ? "text-red-600"
                      : "text-gray-600"
                    }`}
                >
                  {user.status}
                </td>
                <td className="border border-gray-300 px-3 py-2">{user.ip}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {user.workStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Attendance;
