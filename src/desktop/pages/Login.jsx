import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import logo from "../../assets/desktop/logo.svg";
import axios from "axios";
import { toast } from "react-toastify";

function Login() {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/auth/loginadmin`,
        { email, password },
        { withCredentials: true }
      );
      

      if (response?.data.success === true) {
        setOtpSent(true);
        toast.success("OTP sent to your email.");
      } else if (response?.data.token) {
        const token = response?.data.token;
        setToken(token);
        localStorage.setItem("admin", JSON.stringify(response?.data.user));
        localStorage.setItem("token", token);
        toast.success("Login successful");

        setTimeout(() => {
          navigate("/");
        }, 1200);
      }
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/auth/verify-otp`,
        { email, otp },
        { withCredentials: true }
      );
    
      const token = response?.data.token;
      setToken(token);
      localStorage.setItem("admin", JSON.stringify(response?.data.user));
      localStorage.setItem("token", token);
      toast.success(response?.data.status);

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (error) {
      console.error("OTP verification failed", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">
        <div className="flex justify-center">
          <img src={logo} alt="Logo" className="h-50" />
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {!otpSent ? (
          <form onSubmit={handleSubmmit}>
            <div className="relative mb-4">
              <div className="absolute left-4 top-4 text-gray-500">
                <FaEnvelope />
              </div>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full bg-gray-100 focus:outline-none"
                required
              />
            </div>

            <div className="relative mb-6">
              <FaLock className="absolute left-4 top-4 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-full bg-gray-100 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-full bg-gray-100 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              disabled={loading}
            >
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
