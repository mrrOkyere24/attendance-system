
import { useEffect, useState } from "react";
import "./EmployeeAttendance.css";

function EmployeeAttendance() {
  const [name, setName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatDate = (date) =>
    date.toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const handleCheckIn = async () => {
    if (!name.trim()) {
      alert("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/attendance/check-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: name.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to check in.");
        return;
      }

      setName(data.name);
      setCheckInTime(data.check_in);
      setStatus(data.status);
      setCheckedIn(true);
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Cannot connect to the server. Make sure the backend and MySQL are running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/attendance/check-out",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to check out.");
        return;
      }

      setCheckOutTime(data.check_out);
    } catch (error) {
      console.error("Check-out error:", error);
      alert("Cannot connect to the server. Make sure the backend and MySQL are running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-page">
      <div className="attendance-card">
        <div className="attendance-header">
          <div className="logo-circle">✓</div>
          <h1>Attendance</h1>
          <p>Mark your attendance for today</p>
        </div>

        <div className="date-time">
          <h2>{formatTime(currentTime)}</h2>
          <p>{formatDate(currentTime)}</p>
        </div>

        {!checkedIn ? (
          <div className="attendance-form">
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your registered full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
            />

            <button
              className="check-in-button"
              onClick={handleCheckIn}
              disabled={loading}
            >
              {loading ? "Please wait..." : "Check In"}
            </button>
          </div>
        ) : (
          <div className="attendance-success">
            <div className="success-icon">✓</div>

            <h2>You're checked in!</h2>
            <p className="employee-name">{name}</p>

            <div className="attendance-info">
              <div>
                <span>Check-in time</span>
                <strong>{checkInTime}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong
                  className={status.toLowerCase().replace(/\s+/g, "-")}
                >
                  {status}
                </strong>
              </div>
            </div>

            {!checkOutTime ? (
              <button
                className="check-out-button"
                onClick={handleCheckOut}
                disabled={loading}
              >
                {loading ? "Please wait..." : "Check Out"}
              </button>
            ) : (
              <div className="checked-out">
                <span>Check-out time</span>
                <strong>{checkOutTime}</strong>
                <p>Attendance completed for today.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="footer-text">Company Attendance System</p>
    </div>
  );
}

export default EmployeeAttendance;
