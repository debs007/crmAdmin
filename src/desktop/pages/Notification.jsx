import { useEffect, useState } from "react";

export default function NotificationSystem() {
  const [emp, setEmp] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [message, setMessage] = useState({
    title: "",
    description: "",
  });

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/auth/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmp(data);
      }
    } catch (error) {
      //(error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]); 
    } else {
      setSelectedEmployees(["ALL"]); 
    }
    setSelectAll(!selectAll);
  };

  const handleIndividualSelect = (id) => {
    let updatedSelection = [...selectedEmployees];

    if (updatedSelection.includes(id)) {
      updatedSelection = updatedSelection.filter((empId) => empId !== id);
    } else {
      updatedSelection.push(id);
    }

 
    if (updatedSelection.length === emp.length) {
      setSelectedEmployees(["ALL"]);
      setSelectAll(true);
    } else {
      setSelectedEmployees(updatedSelection);
      setSelectAll(false);
    }
  };

  const handleChange = (e) => {
    let name = e.target.name;
    let value = e.target.value;
    if (!name) return;
    setMessage({
      ...message,
      [name]: value,
    });
  };

  const sendNotification = async () => {
    if (selectedEmployees.length === 0) {
      alert("Please select employees and enter a message.");
      return;
    }
  
    const token = localStorage.getItem("token");
    
   
  
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/notification/send-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...message,
            userId: selectedEmployees, 
          }),
        }
      );
  
      const data = await response.json();
  
  
      if (response.ok) {
        alert("Notification sent successfully!");
        setMessage({ title: "", description: "" });
        setSelectedEmployees([]);
        setSelectAll(false);
      }
    } catch (error) {
      //("Error sending notification:", error);
    }
  };
  

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:gap-6 lg:p-6">
      {/* Employee List */}
      <div className="w-full rounded-2xl border border-gray-300 bg-white p-4 shadow-md lg:w-1/3"> 
        <h2 className="mb-3 text-[16px] font-semibold font-serif">Employees</h2>
        <div className="max-h-[280px] overflow-auto lg:h-[430px]">
        <label className="mb-2 flex items-center gap-2 cursor-pointer text-[14px] text-gray-600">
          <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
          Select All
        </label>
        {emp.map((employee, i) => (
          <label key={i} className="mb-2 flex items-start gap-2 cursor-pointer text-[14px] text-gray-600">
            <input
              type="checkbox"
              checked={selectedEmployees.includes(employee._id) || selectedEmployees.includes("ALL")}
              onChange={() => handleIndividualSelect(employee._id)}
              className="mt-1"
            />
            <span className="break-words">{employee.name}</span>
          </label>
        ))}
        </div>
      </div>

      {/* Push Notification System */}
      <div className="w-full rounded-2xl border border-gray-300 bg-white p-4 shadow-md lg:w-2/3">
        <h2 className="text-[15px] font-serif font-semibold mb-2">Notification</h2>
        <div className="flex flex-col mt-4">
          <label htmlFor="title" className="text-[15px] font-medium font-serif">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            className="w-full p-2 border rounded mb-4 outline-none border-gray-300 text-gray-700"
            placeholder="Give a Title"
            onChange={handleChange}
            value={message?.title}
            required
          />
        </div>
        <label htmlFor="description" className="text-[15px] font-medium font-serif">
          Description
        </label>
        <textarea
          className="w-full p-2 border rounded mb-4 outline-none border-gray-300 text-gray-700"
          name="description"
          placeholder="Enter your message..."
          value={message?.description}
          onChange={handleChange}
          required
        />
        <div className="flex justify-end">
          <button onClick={sendNotification} className="rounded border border-orange-500 px-3 py-1.5 text-sm text-orange-500">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
