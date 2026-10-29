import { Routes, Route, Navigate } from "react-router-dom";
import EmployeeAttendance from "./components/EmployeeAttendance";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route
        path="/employee"
        element={<EmployeeAttendance />}
      />

      <Route
        path="/admin"
        element={<AdminDashboard />}
      />

      <Route
        path="*"
        element={<Navigate to="/employee" replace />}
      />
    </Routes>
  );
}

export default App;