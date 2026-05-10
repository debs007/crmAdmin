import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Sidebarpart from "./Components/Sidebar/Sidebarpart";
import Attendance from "./pages/Attendance";
import Searchbar from "./Components/search/Searchbar";
import Chat from "./pages/Chat";
import CreateChannel from "./pages/CreateChannel";
import AddChannelPeople from "./pages/AddChannelPeople";
import AttendanceList from "./pages/AttendanceList";
import CallbackList from "./pages/CallbackList";
import TransferList from "./pages/TransferList";
import SalesList from "./pages/SalesList";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import AddCoworkers from "./pages/AddCoworkers";
import ChannelChat from "./pages/ChannelChat";
import CallbackView from "./pages/CallBackView";
import SalesView from "./pages/SalesView";
import TransferView from "./pages/TransferView";
import EmployeesActivity from "./pages/EmployeesActivity";
import CreateEmployee from "./pages/CreateEmployee";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeAttendance from "../desktop/pages/employee/EmployeeAttendance"
import EmployeeCallback from "./pages/employee/EmployeeCallback"
import EmployeeSales from "./pages/employee/EmployeeSales"
import EmployeeTransfer from "./pages/employee/EmployeeTransfer"
import Concern from "./pages/Concern";
import UpdateEmpDetails from "./pages/employee/UpdateEmpDetails";
import NotificationSystem from "./pages/Notification";
import AdminNotes from "./pages/AdminNotes";
import AllTasks from "./pages/AllTasks";
import { useSocketSetup } from "../hooks/useSocketSetup";
import { useGlobalNotification } from "../hooks/useGlobalNotifcation";
import { onSoftRefresh } from "../utils/socket";


function DesktopRouting() {
   useSocketSetup();
   useGlobalNotification(); 

   
  return (
    
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="*"
            element={
              <div className="flex min-w-0">
                <Sidebarpart />
                <div className="min-w-0 flex-1 border border-orange-400 min-h-screen">
                  <Searchbar />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/create-channel" element={<CreateChannel />} />
                    <Route path="/addpeople-channel" element={<AddChannelPeople />} />
                    <Route path="/attendance-list" element={<AttendanceList />} />
                    <Route path="/callbacklist" element={<CallbackList />} />
                    <Route path="/transferlist" element={<TransferList />} />
                    <Route path="/saleslist" element={<SalesList />} /> 
                    <Route path="/concern" element={<Concern />} /> 
                    <Route path="/notes" element={ <AdminNotes/> } /> 
                    <Route path="/all-tasks" element={<AllTasks />} />

                    <Route path="/notification" element={<NotificationSystem/>}/>
                    <Route path="/addCoworker" element={<AddCoworkers/>}/>
                    <Route path="/addCoworker" element={<CreateChannel/>}/>
                    <Route path="/channelchat/:id" element={<ChannelChat/>}/>
                    <Route path="/callbackview" element={<CallbackView/>}/>
                    <Route path="/salesview" element={<SalesView/>}/>
                    <Route path="/transferview" element={<TransferView/>}/>
                    <Route path="/employee" element={<EmployeesActivity/>}/>
                    <Route path="/createEmployee" element={<CreateEmployee/>}/>
                    <Route path="/employeeDashboard/:id" element={<EmployeeDashboard/>}/>
                    <Route path="/employeeAttendance/:id" element={<EmployeeAttendance/>}/>
                    <Route path="/employeeCallback/:id" element={<EmployeeCallback/>}/>
                    <Route path="/employeeSales/:id" element={<EmployeeSales/>}/>
                    <Route path="/employeeTransfer/:id" element={<EmployeeTransfer/>}/>
                    <Route path="/updateEmpDetails/:id" element={<UpdateEmpDetails/>}/>
                  </Routes>
                </div>
              </div>
            }
          />
        </Route>

        {/* Redirect all unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    
  );
}

export default DesktopRouting;
