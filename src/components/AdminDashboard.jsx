import { useEffect, useState } from "react";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5000/api";

function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [memberName, setMemberName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load registered members
  const loadMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/members`);

      if (!response.ok) {
        throw new Error("Could not load members.");
      }

      const data = await response.json();
      setMembers(Array.isArray(data) ? data : data.members || []);
    } catch (error) {
      console.error("Members error:", error);
    }
  };

  // Load today's attendance
  const loadAttendance = async () => {
    try {
      const response = await fetch(`${API_URL}/attendance/today`);

      if (!response.ok) {
        throw new Error("Could not load attendance.");
      }

      const data = await response.json();
      setAttendance(Array.isArray(data) ? data : data.attendance || []);
    } catch (error) {
      console.error("Attendance error:", error);
    }
  };

  // Load dashboard data when the page opens
  const refreshDashboard = async () => {
    setLoading(true);
    await Promise.all([loadMembers(), loadAttendance()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshDashboard();

    const interval = setInterval(() => {
      loadMembers();
      loadAttendance();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Register a new member
  const handleAddMember = async (event) => {
    event.preventDefault();

    const name = memberName.trim();

    if (!name) {
      alert("Please enter the member's name.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register member.");
      }

      setMemberName("");
      await loadMembers();
      await loadAttendance();

      alert("Member registered successfully.");
    } catch (error) {
      alert(error.message || "Could not connect to the backend.");
    } finally {
      setSaving(false);
    }
  };

  // Edit an existing member
  const handleEditMember = async (member) => {
    const newName = window.prompt(
      "Enter the updated name:",
      member.name
    );

    if (newName === null) return;

    const trimmedName = newName.trim();

    if (!trimmedName) {
      alert("The member's name cannot be empty.");
      return;
    }

    if (trimmedName === member.name) return;

    try {
      const response = await fetch(
        `${API_URL}/members/${member.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update member.");
      }

      await loadMembers();
      await loadAttendance();

      alert("Member updated successfully.");
    } catch (error) {
      console.error("Edit error:", error);
      alert(
        error.message ||
          "Could not update the member. Check your backend."
      );
    }
  };

  // Delete a member
  const handleDeleteMember = async (member) => {
    const confirmed = window.confirm(
      `Delete ${member.name}? This will also delete their attendance history.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/members/${member.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete member.");
      }

      await loadMembers();
      await loadAttendance();

      alert("Member deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error.message ||
          "Could not delete the member. Check your backend."
      );
    }
  };

  // Filter registered members
  const filteredMembers = members.filter((member) =>
    (member.name || "")
      .toLowerCase()
      .includes(memberSearch.toLowerCase())
  );

  // Filter attendance records
  const filteredAttendance = attendance.filter((employee) =>
    (employee.name || "")
      .toLowerCase()
      .includes(attendanceSearch.toLowerCase())
  );

  // Dashboard statistics
  const presentCount = attendance.filter(
    (employee) => employee.status === "Present"
  ).length;

  const lateCount = attendance.filter(
    (employee) => employee.status === "Late"
  ).length;

  const absentCount = attendance.filter(
    (employee) => employee.status === "Absent"
  ).length;

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10);
    }

    return date.toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return "—";
    return String(value).slice(0, 8);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Attendance</h2>
        <p className="sidebar-subtitle">Admin Panel</p>

        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#attendance">Attendance</a>
          <a href="#employees">Employees</a>
          <a href="#reports">Reports</a>
        </nav>

        <button
          className="logout-button"
          onClick={() => {
            window.location.href = "/employee";
          }}
        >
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header" id="dashboard">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage employees and monitor daily attendance.</p>
          </div>

          <button onClick={refreshDashboard}>
            Refresh Dashboard
          </button>
        </header>

        {loading && <p>Loading dashboard...</p>}

        <section className="stats-grid">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <p>{members.length}</p>
          </div>

          <div className="stat-card">
            <h3>Present</h3>
            <p>{presentCount}</p>
          </div>

          <div className="stat-card">
            <h3>Late</h3>
            <p>{lateCount}</p>
          </div>

          <div className="stat-card">
            <h3>Absent</h3>
            <p>{absentCount}</p>
          </div>
        </section>

        <section className="admin-section" id="employees">
          <h2>Registered Members</h2>

          <form
            className="add-member-form"
            onSubmit={handleAddMember}
          >
            <input
              type="text"
              placeholder="Enter employee's full name"
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              required
            />

            <button type="submit" disabled={saving}>
              {saving ? "Registering..." : "Add Member"}
            </button>
          </form>

          <input
            className="search-input"
            type="search"
            placeholder="Search registered members..."
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
          />

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Date Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member, index) => (
                    <tr key={member.id}>
                      <td>{member.staff_id || "Not assigned"}</td>
                      <td>{member.name}</td>
                      <td>{formatDate(member.created_at)}</td>
                      <td className="action-buttons">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEditMember(member)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDeleteMember(member)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      No registered members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="admin-section"
          id="attendance"
        >
          <h2>Today's Attendance</h2>

          <input
            className="search-input"
            type="search"
            placeholder="Search attendance by name..."
            value={attendanceSearch}
            onChange={(event) =>
              setAttendanceSearch(event.target.value)
            }
          />

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.length > 0 ? (
                  filteredAttendance.map((employee, index) => (
                    <tr
                      key={
                        employee.member_id ??
                        employee.id ??
                        `${employee.name}-${index}`
                      }
                    >
                      <td>{employee.staff_id || "Not assigned"}</td>
                      <td>{employee.name}</td>
                      <td>{formatDate(employee.date)}</td>
                      <td>{formatTime(employee.check_in)}</td>
                      <td>{formatTime(employee.check_out)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            (employee.status || "")
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                          }`}
                        >
                          {employee.status || "Not checked in"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-section" id="reports">
          <h2>Attendance Summary</h2>
          <p>Total registered employees: {members.length}</p>
          <p>Present today: {presentCount}</p>
          <p>Late today: {lateCount}</p>
          <p>Absent today: {absentCount}</p>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;