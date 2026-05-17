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
import { MdOutlineTaskAlt, MdOutlineTableChart } from "react-icons/md";
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
  const [pendingTasks, setPendingTasks] = useState(0);
  const [sidebarSearch, setSidebarSearch] = useState("");
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

    // Bubble channel to top instantly on new message (WhatsApp-style)
    const onNewChannelMessage = (msg) => {
      if (!msg?.channelId) return;
      setChannels((prev) => {
        const idx = prev.findIndex(
          (c) => c._id?.toString() === msg.channelId?.toString()
        );
        if (idx <= 0) return prev;
        const updated = [...prev];
        const [moved] = updated.splice(idx, 1);
        updated.unshift({ ...moved, lastMessageTime: new Date().toISOString() });
        return updated;
      });
    };
    socket.on("new-channel-message", onNewChannelMessage);
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

    const fetchPendingTasks = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_API}/channels/tasks/count`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setPendingTasks(data?.pendingCount || 0);
        }
      } catch (error) {
        // silent — leave previous count on transient failure
      }
    };
    fetchPendingTasks();
    const taskInterval = setInterval(fetchPendingTasks, 60_000);
    const onFocus = () => fetchPendingTasks();
    window.addEventListener("focus", onFocus);
    socket.on("soft-refresh", fetchPendingTasks);

    return () => {
      socket.off("updateUnread");
      socket.off("new-channel-message", onNewChannelMessage);
      socket.off("soft-refresh", fetchPendingConcerns);
      socket.off("soft-refresh", fetchPendingTasks);
      clearInterval(taskInterval);
      window.removeEventListener("focus", onFocus);
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
      <div className="relative h-[100dvh] bg-sidebar text-sidebar-text border-r border-sidebar-divider px-2 pt-2 flex flex-col items-stretch">
        {/* Navigation Links */}
        <nav className="flex flex-col gap-0.5 items-stretch">
          <Link to="/" className="flex flex-col items-center py-2 rounded-md">
            <img src={logo} alt="" className="h-[44px] w-[44px]" />
          </Link>
          <Link to="/" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <img src={home} alt="" className="h-[20px] w-[20px] invert" />
            <p className="text-[11px] font-semibold mt-0.5">Home</p>
          </Link>
          <Link to="/attendance" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <img src={attendence} alt="" className="h-[18px] w-[18px] invert" />
            <p className="text-[11px] font-semibold mt-0.5">Attendance</p>
          </Link>
          <Link to="/notes" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <img src={book} alt="" className="h-[18px] w-[18px] invert" />
            <p className="text-[11px] font-semibold mt-0.5">Notes</p>
          </Link>
          <Link to="/callbacklist" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <img src={calls} alt="" className="h-[20px] w-[20px] invert" />
            <p className="text-[11px] font-semibold mt-0.5">Callback</p>
          </Link>
          <Link to="/transferlist" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <img src={bidirection} alt="" className="h-[18px] w-[18px] invert" />
            <p className="text-[11px] font-semibold mt-0.5">Transfer</p>
          </Link>
          <Link to="/saleslist" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <img src={sales} alt="" className="h-[20px] w-[20px] invert" />
            <p className="text-[11px] font-semibold mt-0.5">Sales</p>
          </Link>
          <Link to="/employee" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <BiStreetView size={22} />
            <p className="text-[11px] font-semibold mt-0.5">Activity</p>
          </Link>
          <Link to="/concern" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white relative">
            <TbBrandDatabricks size={20} />
            <p className="text-[11px] font-semibold mt-0.5">Concern</p>
            {pendingConcerns > 0 && (
              <span className="absolute top-1 right-1 slack-unread">{pendingConcerns}</span>
            )}
          </Link>
          <Link to="/notification" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white relative">
            <img src={notes} alt="" className="h-[18px] w-[18px] invert" />
            <p className="text-[11px] font-semibold mt-0.5">Notifications</p>
          </Link>
          <Link to="/all-tasks" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white relative">
            <MdOutlineTaskAlt size={22} />
            <p className="text-[11px] font-semibold mt-0.5">Tasks</p>
            {pendingTasks > 0 && (
              <span className="absolute top-1 right-1 slack-unread">
                {pendingTasks > 99 ? "99+" : pendingTasks}
              </span>
            )}
          </Link>
          <Link to="/salary-sheet" className="flex flex-col items-center py-2 rounded-md hover:bg-sidebar-alt text-white">
            <MdOutlineTableChart size={22} />
            <p className="text-[11px] font-semibold mt-0.5">Salary</p>
          </Link>
        </nav>

        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -right-3 top-24 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-divider bg-sidebar-alt text-sidebar-text shadow hover:bg-sidebar"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
        </button>
      </div>

      <div
        className={`h-[100dvh] bg-sidebar text-sidebar-text border-r border-sidebar-divider flex min-h-0 flex-col overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? "w-0 p-0 opacity-0 border-l-0 border-r-0 pointer-events-none" : "w-[260px] py-3 opacity-100"
        }`}
      >
        {!isSidebarCollapsed && (
          <>
        {/* Workspace header — clickable area opens admin profile editor */}
        <div className="flex justify-between items-center px-3 pb-3 mb-1 border-b border-sidebar-divider">
          <button
            type="button"
            onClick={handleEditAdminOpen}
            className="flex items-center gap-2 text-left min-w-0"
            title="Edit profile"
          >
            <Avatar
              name={adminProfile?.name || "Admin"}
              src={adminProfile?.avatar || ""}
              size={32}
              rounded="rounded-md"
            />
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-white truncate">
                {adminProfile?.name || "Admin"}
              </span>
              <span className="block text-[11px] text-sidebar-muted truncate">
                Admin · workspace
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={handleEditAdminOpen}
            className="text-sidebar-muted hover:text-white"
            aria-label="Edit profile"
            title="Edit profile"
          >
            <img src={edit} alt="" className="w-[12px] h-[12px] invert opacity-70" />
          </button>
        </div>

        {/* Search input — filters channels and DMs inline */}
        <div className="px-3 mb-1">
          <input
            type="text"
            placeholder="Search channels or people..."
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            className="w-full text-[13px] px-2.5 py-1.5 rounded-md bg-sidebar-hover text-white placeholder-sidebar-muted border border-sidebar-divider focus:outline-none focus:border-sidebar-active"
          />
        </div>

        <div className="flex flex-col flex-1 min-h-0 px-1">
          {/* Channels Section — has its own scroll */}
          <div className="pt-1 flex flex-col min-h-0 flex-[0.95]">
            <div className="slack-section-header shrink-0">
              <span>Channels</span>
              {totalChannelUnread > 0 && (
                <span className="slack-unread !bg-red-500">{totalChannelUnread}</span>
              )}
            </div>
            <ul className="flex-1 min-h-0 overflow-y-auto slack-scroll slack-scroll-dark">
              {channels?.filter(ch =>
                !sidebarSearch || ch.name?.toLowerCase().includes(sidebarSearch.toLowerCase())
              ).map((channel) => {
                const isActive = location.pathname === `/channelchat/${channel._id}`;
                return (
                <li key={channel._id}>
                  <button
                    type="button"
                    className={`slack-row w-full justify-start text-left ${isActive ? "is-active" : ""}`}
                    onClick={() => handleChannelChat(channel.name, channel._id, channel.description)}
                  >
                    <Avatar
                      name={channel?.name}
                      src={channel?.image || ""}
                      size={18}
                      rounded="rounded-sm"
                      fontSize="10px"
                    />
                    <span className="truncate flex-1 min-w-0 font-medium text-white">
                      <span className="text-sidebar-muted mr-0.5">#</span>
                      {channel.name}
                    </span>
                    {channel?.unreadMessages > 0 && (
                      <span className="slack-unread">{channel.unreadMessages}</span>
                    )}
                  </button>
                </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="slack-row text-sidebar-text/60 hover:text-white w-full mt-1 shrink-0"
              onClick={handleChannel}
            >
              <span className="w-[18px] h-[18px] rounded-sm bg-sidebar-alt flex items-center justify-center text-sidebar-muted">+</span>
              <span>Add channel</span>
            </button>
          </div>

          {/* Messages Section — also scrolls independently */}
          <div className="flex flex-col min-h-0 flex-[1.15] mt-1">
            <div className="slack-section-header shrink-0">
              <span>Direct messages</span>
            </div>
            <ul className="flex-1 min-h-0 overflow-y-auto slack-scroll slack-scroll-dark">
              {employees?.filter(u =>
                !sidebarSearch || u.name?.toLowerCase().includes(sidebarSearch.toLowerCase())
              ).map((user, i) => {
                const isActive = location.pathname === `/chat/${user.id}`;
                return (
                <li key={user.id || i}>
                  <button
                    type="button"
                    onClick={() => handleChat(user.name, user.id)}
                    className={`slack-row w-full justify-start text-left ${isActive ? "is-active" : ""}`}
                  >
                    <Avatar
                      name={user?.name}
                      src={user?.avatar || ""}
                      size={18}
                      fontSize="10px"
                    />
                    <span className="truncate flex-1 min-w-0 font-medium text-white">{user.name}</span>
                    {unreadCounts[user.id] > 0 && openChatId !== user.id && (
                      <span className="slack-unread">{unreadCounts[user.id]}</span>
                    )}
                  </button>
                </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="slack-row text-sidebar-text/60 hover:text-white w-full mt-1 shrink-0"
              onClick={handleCowrokers}
            >
              <span className="w-[18px] h-[18px] rounded-sm bg-sidebar-alt flex items-center justify-center text-sidebar-muted">+</span>
              <span>Add coworker</span>
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
