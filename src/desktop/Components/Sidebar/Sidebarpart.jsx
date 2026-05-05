import { Link, useLocation, useNavigate } from "react-router-dom";
import home from "../../../assets/desktop/home.svg";
import attendence from "../../../assets/desktop/attendence.svg";
import bidirection from "../../../assets/desktop/bidirection.svg";
import book from "../../../assets/desktop/book.svg";
import calls from "../../../assets/desktop/calls.svg";
import notes from "../../../assets/desktop/notes.svg";
import sales from "../../../assets/desktop/sales.svg";
import arrow from "../../../assets/desktop/arrow.svg";
import edit from "../../../assets/desktop/edit.svg";
import logo from "../../../assets/desktop/logo.svg";
import { TbBrandDatabricks } from "react-icons/tb";
import { BiStreetView } from "react-icons/bi";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAuth } from "../../../context/authContext";
import { useEffect, useState } from "react";
import socket from "../../../utils/socket";
import axios from "axios";
import Avatar from "../Common/Avatar";
import ProfilePictureUploader from "../Common/ProfilePictureUploader";

const getStableColor = (text = "DM") => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // Convert to 32bit integer
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 40%)`;
};
function Sidebarpart() {
  const SIDEBAR_PREF_KEY = "dm_admin_desktop_sidebar_collapsed";
  const { getChannels } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [employees, setEmployees] = useState([]);
  const [channels, setChannels] = useState([]);
  const { getAllRecentUsers } = useAuth();
  const [openChatId, setOpenChatId] = useState(null);
  const [pendingConcerns, setPendingConcerns] = useState(0);
  const [adminProfile, setAdminProfile] = useState(() => {
    const stored = localStorage.getItem("admin");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (error) {
      return null;
    }
  });
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_PREF_KEY) === "1";
    } catch (error) {
      return false;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();
  const totalChannelUnread = channels.reduce(
    (sum, channel) => sum + (channel?.unreadMessages || 0),
    0
  );

  const channel = async () => {
    const data = await getChannels();
    setChannels(data);
  };
  const allUsers = async () => {
    const users = (await getAllRecentUsers()) || [];
    const unreadCounts = {};
    users.forEach((user) => {
      unreadCounts[user.id] = user.unreadMessages || 0;
    });
    setUnreadCounts(unreadCounts);
    setEmployees(users);
  };

  const loadAdminProfile = async () => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      try {
        setAdminProfile(JSON.parse(stored));
      } catch (error) {
        setAdminProfile(null);
      }
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/auth/admin/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.admin) {
          setAdminProfile(data.admin);
          localStorage.setItem("admin", JSON.stringify(data.admin));
        }
      }
    } catch (error) {
      //(error);
    }
  };

  useEffect(() => {
    channel();
    allUsers();
    loadAdminProfile();
    socket.on("updateUnread", async () => {
      allUsers();
      channel();
    });
    const fetchPendingConcerns = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/concern/pending-count`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setPendingConcerns(data?.count || 0);
        }
      } catch (error) {
        //(error);
      }
    };
    fetchPendingConcerns();
    socket.on("soft-refresh", fetchPendingConcerns);

    return () => {
      socket.off("updateUnread");
      socket.off("soft-refresh", fetchPendingConcerns);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const chatState = location.state;
    if (chatState && chatState.id) {
      setOpenChatId(chatState.id);
    } else {
      setOpenChatId(null);
    }
  }, [location.state]);

  const handleCowrokers = () => {
    navigate("/addCoworker");
  };
  const handleChat = async (name, id) => {

    //(id);
    setOpenChatId(id);
    setUnreadCounts(prev => ({
      ...prev,
      [id]: 0
    }));
    navigate("/chat", {
      state: {
        name,
        id,
      },
    });
    await axios.post(
      `${import.meta.env.VITE_BACKEND_API}/message/messages/mark-as-read`,
      { senderId: id },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
  };
  const handleChannel = () => {
    navigate("/create-channel");
  };
  const handleChannelChat = (name, id, description) => {
    setChannels((prev) =>
      prev.map((channel) =>
        channel?._id?.toString() === id?.toString()
          ? { ...channel, unreadMessages: 0 }
          : channel
      )
    );
    navigate(`/channelchat/${id}`, {
      state: {
        name,
        description,
        id,
      },
    });
  };

  const handleEditAdminOpen = () => {
    setAdminError("");
    setAdminForm({
      name: adminProfile?.name || "",
      email: adminProfile?.email || "",
      phone: adminProfile?.phone || "",
      password: "",
    });
    setIsEditAdminOpen(true);
  };

  const handleEditAdminClose = () => {
    setIsEditAdminOpen(false);
    setAdminError("");
  };

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminSave = async () => {
    if (adminSaving) return;
    setAdminSaving(true);
    setAdminError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setAdminError("Please log in again.");
      setAdminSaving(false);
      return;
    }

    const payload = {
      name: adminForm.name,
      email: adminForm.email,
      phone: adminForm.phone,
    };
    if (adminForm.password) {
      payload.password = adminForm.password;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/auth/admin/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setAdminError(data?.message || "Unable to update profile.");
        setAdminSaving(false);
        return;
      }
      const data = await response.json();
      const updated = data?.admin || null;
      if (updated) {
        setAdminProfile(updated);
        localStorage.setItem("admin", JSON.stringify(updated));
      }
      setIsEditAdminOpen(false);
    } catch (error) {
      setAdminError("Unable to update profile.");
    } finally {
      setAdminSaving(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_PREF_KEY, next ? "1" : "0");
      return next;
    });
  };

  //(employees);

  return (
    <div className="sticky top-0 flex h-[100dvh] shrink-0 overflow-hidden">
      <div
        className="relative h-[100dvh] border border-orange-400 px-3 pt-2"
      >
        {/* Navigation Links */}
        <nav className="flex flex-col gap-1  items-center">
          <Link to="/" className="flex items-center">
            <div className="flex flex-col items-center">
              <img src={logo} alt="" className="h-[70px] w-[70px]" />
            </div>
          </Link>
          <Link to="/" className="flex items-center gap-2 p-2 ">
            <div className="flex flex-col  items-center">
              <img src={home} alt="" className="h-[25px] w-[25px]" />
              <p className="text-[12px] font-semibold">Home</p>
            </div>
          </Link>
          <Link to="/attendance" className="flex items-center gap-2 p-2 ">
            <div className="flex flex-col   items-center">
              <img src={attendence} alt="" className="h-[20px] w-[20px]" />
              <p className="text-[12px] font-semibold">Attendance</p>
            </div>
          </Link>
          <Link to="/notes" className="flex items-center gap-2 p-2 ">
            <div className="flex flex-col  items-center">
              <img src={book} alt="" className="h-[20px] w-[20px]" />
              <p className="text-[12px] font-semibold">Notes</p>
            </div>
          </Link>
          <Link to="/callbacklist" className="flex items-center gap-2 p-2 ">
            <div className="flex flex-col items-center">
              <img src={calls} alt="" className="h-[25px] w-[25px]" />
              <p className="text-[12px] font-semibold">Callback</p>
            </div>
          </Link>
          <Link to="/transferlist" className="flex items-center gap-2 p-2">
            <div className="flex flex-col  items-center">
              <img src={bidirection} alt="" className="h-[20px] w-[20px]" />
              <p className="text-[12px] font-semibold">Transfer</p>
            </div>
          </Link>
          <Link to="/saleslist" className="flex items-center gap-2 p-2">
            <div className="flex flex-col  items-center">
              <img src={sales} alt="" className="h-[25px] w-[25px]" />
              <p className="text-[12px] font-semibold">Sales</p>
            </div>
          </Link>
          <Link to="/employee" className="flex items-center gap-2 p-2 ">
            <div className="flex space-x-2 flex-col   items-center">
              <BiStreetView size={28} />
              <p className="text-[12px] font-semibold text-center">Activity </p>
            </div>
          </Link>
          <Link to="/concern" className="flex items-center gap-2 p-2 ">
            <div className="flex space-x-2 flex-col   items-center">
              <TbBrandDatabricks size={23} />
              <div className="relative">
                <p className="text-[12px] font-semibold">Concern</p>
                {pendingConcerns > 0 && (
                  <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {pendingConcerns}
                  </span>
                )}
              </div>
            </div>
          </Link>
          <Link to="/notification" className="flex items-center gap-2 p-2">
            <div className="flex space-x-2  flex-col items-center">
              <img src={notes} alt="" className="h-[20px] w-[20px]" />
              <p className="text-[12px] font-semibold">Notifications </p>
            </div>
          </Link>


        </nav>

        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -right-3 top-24 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-orange-300 bg-white text-gray-700 shadow-sm hover:bg-orange-50"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
        </button>
      </div>

      <div
        className={`h-[100dvh] bg-gray-200 border border-orange-400 flex min-h-0 flex-col overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? "w-0 p-0 opacity-0 border-l-0 border-r-0 pointer-events-none" : "w-[260px] px-3 py-4 opacity-100"
        }`}
      >
        {!isSidebarCollapsed && (
          <>
        <div className="flex justify-between items-center pt-3 mb-3">
          <h2 className="text-[18px] font-medium flex items-center gap-2">
            <Avatar
              name={adminProfile?.name || "Admin"}
              src={adminProfile?.avatar || ""}
              size={28}
            />
            {adminProfile?.name || "Admin"}
            <img src={arrow} alt="" className="w-[8px] pt-1" />
          </h2>
          <button type="button" onClick={handleEditAdminOpen}>
            <img src={edit} alt="Edit admin profile" className="w-[10px] h-[10px]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* Channels Section */}
          <div className="pt-2 flex flex-col min-h-0 flex-[0.95]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold text-gray-600 flex gap-2">
                Channels <img src={arrow} alt="" className="w-[8px] pt-1" />
              </h3>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                totalChannelUnread > 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-white text-gray-500"
              }`}>
                {totalChannelUnread > 0 ? totalChannelUnread : channels?.length || 0}
              </span>
            </div>
            <ul className="mt-2 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
              {channels?.map((channel) => (
                <li key={channel._id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-gray-700 font-medium text-[13px] hover:bg-white/70"
                    onClick={() => handleChannelChat(channel.name, channel._id, channel.description)}
                  >
                    <Avatar
                      name={channel?.name}
                      src={channel?.image || ""}
                      size={20}
                      rounded="rounded"
                      fontSize="11px"
                    />
                    <span className="truncate flex-1 min-w-0">{channel.name}</span>
                    {channel?.unreadMessages > 0 && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-green-600">
                        {channel.unreadMessages}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-1 rounded-xl px-2 py-1.5 text-left text-gray-700 text-[13px] hover:bg-white/70"
              onClick={handleChannel}
            >
              + Add Channels
            </button>
          </div>

          {/* Messages Section */}
          <div className="flex flex-col min-h-0 flex-[1.15]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold text-gray-600 flex gap-2">
                Messages <img src={arrow} alt="" className="w-[8px] pt-1" />
              </h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {employees?.length || 0}
              </span>
            </div>
            <ul className="mt-2 flex-1 min-h-0 overflow-y-auto pr-1 hide-scrollbar">
              {employees?.map((user, i) => (
                <li
                  key={user.id || i}
                  className="rounded-xl hover:bg-white/70"
                  onClick={() => handleChat(user.name, user.id)}
                >
                  <p className="flex items-center gap-2 px-2 py-1.5 text-gray-700 text-[13px] font-medium cursor-pointer">
                    <Avatar
                      name={user?.name}
                      src={user?.avatar || ""}
                      size={20}
                      fontSize="11px"
                    />
                    <span className="truncate flex-1 min-w-0">{user.name}</span>
                    {unreadCounts[user.id] > 0 && openChatId !== user.id && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-bold text-green-600">
                        {unreadCounts[user.id]}
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-1 rounded-xl px-2 py-1.5 text-left text-gray-700 text-[13px] hover:bg-white/70"
              onClick={handleCowrokers}
            >
              + Add Coworker
            </button>
          </div>

        </div>
          </>
        )}
      </div>

      {isEditAdminOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold">Edit Admin Profile</h3>
              <button type="button" onClick={handleEditAdminClose} className="text-gray-500">
                &times;
              </button>
            </div>
            {adminError && (
              <p className="text-xs text-red-500 mt-2">{adminError}</p>
            )}
            <div className="mt-3">
              <ProfilePictureUploader
                name={adminProfile?.name || ""}
                currentAvatar={adminProfile?.avatar || ""}
                onUpdated={(profile) => {
                  if (!profile) return;
                  setAdminProfile((prev) => ({
                    ...(prev || {}),
                    ...profile,
                  }));
                  try {
                    const stored = JSON.parse(
                      localStorage.getItem("admin") || "null"
                    );
                    localStorage.setItem(
                      "admin",
                      JSON.stringify({ ...(stored || {}), ...profile })
                    );
                  } catch (e) {
                    // ignore
                  }
                }}
              />
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input
                  name="name"
                  type="text"
                  value={adminForm.name}
                  onChange={handleAdminInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={adminForm.email}
                  onChange={handleAdminInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone</label>
                <input
                  name="phone"
                  type="text"
                  value={adminForm.phone}
                  onChange={handleAdminInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={adminForm.password}
                  onChange={handleAdminInputChange}
                  placeholder="Leave blank to keep current"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleEditAdminClose}
                className="px-3 py-2 text-sm border border-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminSave}
                className="px-3 py-2 text-sm bg-orange-500 text-white rounded"
                disabled={adminSaving}
              >
                {adminSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebarpart;
