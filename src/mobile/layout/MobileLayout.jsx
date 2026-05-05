import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, MessageCircle, Bell, CheckSquare, Users, FileText } from "lucide-react";
import logo from "../../assets/desktop/logo.svg";

// Simple mobile shell with a top bar and bottom navigation.
// Reuses existing pages; keeps desktop layouts untouched.
const MobileLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Default to home on initial load
    if (window.location.pathname === "/") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const navItems = [
    { to: "/home", label: "Home", icon: <Home size={20} /> },
    { to: "/attendance", label: "Attendance", icon: <CheckSquare size={20} /> },
    { to: "/conversations", label: "Chats", icon: <MessageCircle size={20} /> },
    { to: "/notes", label: "Notes", icon: <FileText size={20} /> },
    { to: "/notification", label: "Alerts", icon: <Bell size={20} /> },
    { to: "/employee", label: "Team", icon: <Users size={20} /> },
  ];
  const isConversationList = /^\/conversations(\/|$)/.test(location.pathname);
  const isChatThread = /^\/(chat|channelchat)(\/|$)/.test(location.pathname);
  const hideTopBar = isConversationList || isChatThread;
  const hideBottomNav = isChatThread;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!hideTopBar && (
        <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Digital Mitro" className="h-9 w-9" />
            <span className="text-sm font-semibold text-gray-800">Admin</span>
          </div>
        </header>
      )}

      {/* Page content */}
      <main
        className={`flex-1 overflow-y-auto ${
          isChatThread ? "px-0 pb-0" : isConversationList ? "px-0 pb-20" : "px-3 pb-20"
        }`}
      >
        <Outlet />
      </main>

      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm">
          <div className="grid grid-cols-6 text-[11px]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-w-0 flex-col items-center justify-center py-2 ${
                    isActive ? "text-orange-500" : "text-gray-600"
                  }`
                }
              >
                {item.icon}
                <span className="mt-1 truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default MobileLayout;
