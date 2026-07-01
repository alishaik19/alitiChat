import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route -> Login */}
        <Route path="/" element={<Login />} />

        {/* Register page */}
        <Route path="/register" element={<Register />} />

        {/* Chat page (REAL COMPONENT) */}
        <Route path="/chat" element={<Chat />} />

        {/* Unknown route redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
