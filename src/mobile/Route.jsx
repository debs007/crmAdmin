import { Navigate, Route, Routes } from "react-router-dom";
import MobileLayout from "./layout/MobileLayout";
import Home from "../desktop/pages/Home";
import Attendance from "../desktop/pages/Attendance";
import Chat from "../desktop/pages/Chat";
import ChannelChat from "../desktop/pages/ChannelChat";
import NotificationSystem from "../desktop/pages/Notification";
import EmployeesActivity from "../desktop/pages/EmployeesActivity";
import AdminNotes from "../desktop/pages/AdminNotes";
import MobileConversations from "./pages/MobileConversations";
import CallbackList from "../desktop/pages/CallbackList";
import TransferList from "../desktop/pages/TransferList";
import SalesList from "../desktop/pages/SalesList";
import CallbackView from "../desktop/pages/CallBackView";
import TransferView from "../desktop/pages/TransferView";
import SalesView from "../desktop/pages/SalesView";
import Login from "../desktop/pages/Login";
import ProtectedRoute from "../desktop/ProtectedRoute";

// Mobile routes reuse existing pages; layout provides mobile nav/shell.
function MobileRouting() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MobileLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/conversations" element={<MobileConversations />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/channelchat/:id" element={<ChannelChat />} />
        <Route path="/notes" element={<AdminNotes />} />
        <Route path="/notification" element={<NotificationSystem />} />
        <Route path="/callbacklist" element={<CallbackList />} />
        <Route path="/transferlist" element={<TransferList />} />
        <Route path="/saleslist" element={<SalesList />} />
        <Route path="/callbackview" element={<CallbackView />} />
        <Route path="/transferview" element={<TransferView />} />
        <Route path="/salesview" element={<SalesView />} />
        <Route path="/employee" element={<EmployeesActivity />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default MobileRouting;
