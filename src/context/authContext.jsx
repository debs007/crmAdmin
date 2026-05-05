import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import socket from "../utils/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const initialToken = localStorage.getItem("token")
    const [userData, setUserData] = useState([]);
    const [token, setToken] = useState(initialToken);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
            } catch (error) {
                console.error("Invalid token:", error);
                setUserData(null);
            }
        } else {
            setUserData(null);
        }
    }, []);

    // Force-logout listener — fires when an admin soft-deletes this user
    // (feature #11) or otherwise revokes access. Clearing token + redirecting
    // ensures any open tab can't keep using the now-invalid JWT.
    useEffect(() => {
        const handleForceLogout = (payload) => {
            try {
                localStorage.removeItem("token");
                localStorage.removeItem("admin");
            } catch (e) {
                // ignore
            }
            setToken(null);
            setUserData(null);
            const reason =
                (payload && payload.reason) ||
                "Your session has been ended by an administrator.";
            try {
                alert(reason);
            } catch (e) {
                // ignore
            }
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        };
        socket.on("force-logout", handleForceLogout);
        return () => {
            socket.off("force-logout", handleForceLogout);
        };
    }, []);





    const allConcerns = async (arg) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/concern/user`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (response.ok) {
                const data = await response.json();
                const filteredConcerns = data?.concerns?.filter(concern => concern.concernType === arg);

                return filteredConcerns;
            } else {
                console.error("Failed to fetch concerns");
                return null;
            }
        } catch (error) {
            console.error("Error fetching data:", error.message);
            return null;
        }
    };


    const getAllUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/auth/all`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data?.users;
            }
        } catch (error) {
            console.error("Error fetching data:", error.message);
            return null;
        }
    }

       const getAllRecentUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/message/recentChats`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data?.users;
            }
        } catch (error) {
            console.error("Error fetching data:", error.message);
            return null;
        }
    }

    const fetchAttendance = async (range) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/attendance/user?range=${range}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error("Failed to fetch attendance data");
                return null;
            }
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            return null;
        }
    };

    const getChannels = async () => {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/all`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })
        if (response.ok) {
            const data = await response.json();
            return data
        }
    }

    // admin

    const allUsersAttendance = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/attendance/today`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data?.data;
            }
        } catch (error) {
            console.error("Error fetching data:", error.message);
            return null;
        }
    }

    const allUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/auth/`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error("Error fetching data:", error.message);
            return null;
        }
    }



    return (
        <AuthContext.Provider value={{ token, allUsers, allUsersAttendance,getAllRecentUsers, allConcerns, setToken, userData, getChannels, fetchAttendance, getAllUsers }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
