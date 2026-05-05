import attendence from "../../assets/desktop/attendence.svg";
import calls from "../../assets/desktop/calls.svg";
import sales from "../../assets/desktop/saleshome.svg";
import transfer from "../../assets/desktop/transferhome.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useEffect, useState } from "react";
import moment from "moment";

function Home() {
  const [dates, setDates] = useState([]);
  const { fetchAttendance } = useAuth();
  const navigate = useNavigate();

  const handleAttendaneList = () => {
    navigate("/attendance");
  };
  const handleCallback = () => {
    navigate("/callbacklist");
  };
  const handleSales = () => {
    navigate("/saleslist");
  };
  const handleTransfer = () => {
    navigate("/transferlist");
  };

  const months = dates.map(items => moment(items?.currentDate).format("MMMM"));
  const activeMonth = months[0] || moment().format("MMMM");

  useEffect(() => {
    const getData = async () => {
      const data = await fetchAttendance("this_month");
      if (data) {
        setDates(data?.data);
      }
    };
    getData();
  }, []);

  const cards = [
    {
      title: "Attendance List",
      caption: activeMonth,
      description: "Review attendance summaries and monthly activity.",
      icon: attendence,
      action: handleAttendaneList,
    },
    {
      title: "All Callback",
      caption: "Follow-up queue",
      description: "Pick up pending callbacks and keep response times tight.",
      icon: calls,
      action: handleCallback,
    },
    {
      title: "All Sales",
      caption: "Pipeline overview",
      description: "Check active sales records, status changes, and outcomes.",
      icon: sales,
      action: handleSales,
    },
    {
      title: "All Transfer",
      caption: "Request handoffs",
      description: "Track transfer requests and move work between owners cleanly.",
      icon: transfer,
      action: handleTransfer,
    },
  ];

  return (
    <div className="w-full px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="app-soft-panel rounded-[28px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
              Control Center
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Admin overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Jump into the busiest work areas from one place. The cards below keep the core
              modules easy to reach on both desktop and mobile.
            </p>
          </div>
          <span className="app-stat-chip self-start rounded-full px-3 py-1 text-xs font-semibold">
            {activeMonth} dashboard
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            className="app-soft-panel rounded-[26px] p-5 text-left"
            onClick={card.action}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-2xl bg-orange-50 p-3 shadow-sm">
                <img src={card.icon} alt="" className="h-[34px] w-[34px] sm:h-[38px] sm:w-[38px]" />
              </div>
              <span className="app-stat-chip rounded-full px-3 py-1 text-[11px] font-semibold">
                {card.caption}
              </span>
            </div>
            <h2 className="mt-5 text-base font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Home;
