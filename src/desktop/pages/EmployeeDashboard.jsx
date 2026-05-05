import attendence from "../../assets/desktop/attendence.svg";
import calls from "../../assets/desktop/calls.svg";
import sales from "../../assets/desktop/saleshome.svg";
import project from "../../assets/desktop/projectshome.svg";
import transfer from "../../assets/desktop/transferhome.svg";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useEffect, useState } from "react";
import ManagePayslip from "../Components/Common/ManagePayslip";

function EmployeeDashboard() {
  const [dates, setDates] = useState([]);
  const [employee, setEmployee] = useState(null);
  const { fetchAttendance } = useAuth();
  const { id } = useParams();

  const navigate = useNavigate(id);
  const handleAttendaneList = () => {
    navigate(`/employeeAttendance/${id}`);
  };
  const handleCallback = () => {
    navigate(`/employeeCallback/${id}`);
  };
  const handleSales = () => {
    navigate(`/employeeSales/${id}`);
  };
  const handleTransfer = () => {
    navigate(`/employeeTransfer/${id}`);
  };

  const singleEmployee = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/attendance/employeesdashboard/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDates(data);
      }
    } catch (err) {
      // ignore
    }
  };

  // Fetch the employee record so we can show their name in the Payslip section.
  const fetchEmployeeRecord = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_API}/auth/${id}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    singleEmployee();
    fetchEmployeeRecord();
  }, [id]);

  return (
    <div className="w-full">
      {/* Card Grid */}
      <div className="grid grid-cols-3 gap-8 w-full p-6">
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleAttendaneList}
        >
          <img src={attendence} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">
            Attendee List: {dates?.attendance}
          </p>
        </div>
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleCallback}
        >
          <img src={calls} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">
            All Callback: {dates?.callback}
          </p>
        </div>
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleSales}
        >
          <img src={sales} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">All Sales: {dates?.sale}</p>
        </div>
        <div
          className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer"
          onClick={handleTransfer}
        >
          <img src={transfer} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]">
            {" "}
            All Transfer: {dates?.transfer}
          </p>
        </div>
        <div className="p-4 border rounded-md text-center h-[150px] w-full flex flex-col justify-center items-center cursor-pointer">
          <img src={project} alt="" className="w-[50px] h-[50px]" />
          <p className="flex flex-col p-2 text-[12px]"> Projects</p>
        </div>
      </div>

      {/* Manage Payslip section (feature #2) */}
      <div className="px-6 pb-8">
        <ManagePayslip employeeId={id} employeeName={employee?.name} />
      </div>
    </div>
  );
}

export default EmployeeDashboard;
