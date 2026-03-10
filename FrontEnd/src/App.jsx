import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";
import Congratulations from "./pages/congratulations.jsx";
import TasksPage from "./pages/Tasks.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppLayout from "../layout/AppLayout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/CONGRATULATIONS" element={<Congratulations />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
