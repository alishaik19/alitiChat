import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import PageNotFound from "./PageNotFound";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword"; // ✅ Yeh import add karna zaroori hai

// ✅ PROTECTED ROUTE: Sirf logged-in users ke liye
function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  return user && token ? children : <Navigate to="/" replace />;
}

// ✅ PUBLIC ROUTE: Logged-in users ko Login/Register se Chat par bhej dega
function PublicRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  return user && token ? <Navigate to="/chat" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        {/* Reset Password Route - Token based */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Chat page — only reachable when logged in */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* ✅ Catch-all route (404 Page) - Hamesha sabse niche */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      {/* Global Notifications */}
      <ToastContainer
        position="top-right"
        theme="dark"
        autoClose={2500}
        pauseOnHover={false}
      />
    </BrowserRouter>
  );
}

export default App;
