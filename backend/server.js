
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Test the backend
app.get("/", (req, res) => {
  res.json({ message: "Attendance backend is running!" });
});

// Get all registered members, including their Staff IDs
app.get("/api/members", (req, res) => {
  const sql = `
    SELECT id, staff_id, name, created_at
    FROM members
    ORDER BY id DESC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Get members error:", error);
      return res.status(500).json({
        message: "Failed to get members.",
      });
    }

    res.json(results);
  });
});

// Register a member and assign a Staff ID
app.post("/api/members", (req, res) => {
  const { name } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Member name is required.",
    });
  }

  const cleanName = name.trim();

  // A temporary unique value allows us to obtain the new database ID.
  const temporaryStaffId = `P${Date.now()}`;

  db.query(
    "INSERT INTO members (staff_id, name) VALUES (?, ?)",
    [temporaryStaffId, cleanName],
    (error, result) => {
      if (error) {
        console.error("Register member error:", error);
        return res.status(500).json({
          message: "Failed to register member.",
        });
      }

      const memberId = result.insertId;
      const staffId = `STF${String(memberId).padStart(4, "0")}`;

      db.query(
        "UPDATE members SET staff_id = ? WHERE id = ?",
        [staffId, memberId],
        (updateError) => {
          if (updateError) {
            console.error("Staff ID assignment error:", updateError);

            return res.status(500).json({
              message:
                "Member was created, but Staff ID assignment failed. Contact the administrator.",
            });
          }

          res.status(201).json({
            message: "Member registered successfully.",
            id: memberId,
            staff_id: staffId,
            name: cleanName,
          });
        }
      );
    }
  );
});

// Edit a member's name. Their Staff ID stays the same.
app.put("/api/members/:id", (req, res) => {
  const memberId = req.params.id;
  const { name } = req.body;

  if (!/^\d+$/.test(memberId)) {
    return res.status(400).json({
      message: "Invalid member ID.",
    });
  }

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Member name is required.",
    });
  }

  db.query(
    "UPDATE members SET name = ? WHERE id = ?",
    [name.trim(), memberId],
    (error, result) => {
      if (error) {
        console.error("Edit member error:", error);
        return res.status(500).json({
          message: "Failed to update member.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Member not found.",
        });
      }

      res.json({
        message: "Member updated successfully.",
      });
    }
  );
});

// Delete a member and their attendance history
app.delete("/api/members/:id", (req, res) => {
  const memberId = req.params.id;

  if (!/^\d+$/.test(memberId)) {
    return res.status(400).json({
      message: "Invalid member ID.",
    });
  }

  db.query(
    "SELECT id FROM members WHERE id = ?",
    [memberId],
    (error, members) => {
      if (error) {
        console.error("Find member error:", error);
        return res.status(500).json({
          message: "Failed to find member.",
        });
      }

      if (members.length === 0) {
        return res.status(404).json({
          message: "Member not found.",
        });
      }

      db.query(
        "DELETE FROM attendance WHERE member_id = ?",
        [memberId],
        (attendanceError) => {
          if (attendanceError) {
            console.error("Delete attendance error:", attendanceError);
            return res.status(500).json({
              message: "Failed to delete attendance history.",
            });
          }

          db.query(
            "DELETE FROM members WHERE id = ?",
            [memberId],
            (deleteError) => {
              if (deleteError) {
                console.error("Delete member error:", deleteError);
                return res.status(500).json({
                  message: "Failed to delete member.",
                });
              }

              res.json({
                message: "Member and attendance history deleted successfully.",
              });
            }
          );
        }
      );
    }
  );
});

// Find a member using their Staff ID.
// The name option remains temporarily supported for older frontend code.
function findMember(identifier, callback) {
  if (typeof identifier !== "string" || !identifier.trim()) {
    return callback(null, []);
  }

  const value = identifier.trim();

  const sql = `
    SELECT id, staff_id, name
    FROM members
    WHERE staff_id = ? OR LOWER(name) = LOWER(?)
    LIMIT 1
  `;

  db.query(sql, [value, value], callback);
}

// Employee check-in
app.post("/api/attendance/check-in", (req, res) => {
  const identifier = req.body.staff_id || req.body.staffId || req.body.name;

  if (typeof identifier !== "string" || !identifier.trim()) {
    return res.status(400).json({
      message: "Please enter your Staff ID.",
    });
  }

  findMember(identifier, (error, members) => {
    if (error) {
      console.error("Find staff error:", error);
      return res.status(500).json({
        message: "Database error.",
      });
    }

    if (members.length === 0) {
      return res.status(404).json({
        message: "Staff ID not found. Please contact the administrator.",
      });
    }

    const member = members[0];

    db.query(
      `SELECT id, check_in
       FROM attendance
       WHERE member_id = ? AND date = CURDATE()
       LIMIT 1`,
      [member.id],
      (lookupError, records) => {
        if (lookupError) {
          console.error("Check-in lookup error:", lookupError);
          return res.status(500).json({
            message: "Database error.",
          });
        }

        if (records.length > 0 && records[0].check_in !== null) {
          return res.status(409).json({
            message: "You have already checked in today.",
          });
        }

        const saveCheckIn = (insertError) => {
          if (insertError) {
            console.error("Save check-in error:", insertError);
            return res.status(500).json({
              message: "Failed to record check-in.",
            });
          }

          db.query(
            `SELECT
               DATE_FORMAT(check_in, '%H:%i:%s') AS check_in,
               CASE
                 WHEN check_in > '09:00:00' THEN 'Late'
                 ELSE 'Present'
               END AS status
             FROM attendance
             WHERE member_id = ? AND date = CURDATE()
             LIMIT 1`,
            [member.id],
            (statusError, results) => {
              if (statusError) {
                console.error("Get status error:", statusError);
                return res.status(500).json({
                  message: "Check-in saved, but status could not be calculated.",
                });
              }

              res.status(201).json({
                message: `Check-in successful. Status: ${results[0].status}`,
                staff_id: member.staff_id,
                name: member.name,
                check_in: results[0].check_in,
                status: results[0].status,
              });
            }
          );
        };

        if (records.length > 0) {
          // Reuse today's row if it exists but has no check-in.
          db.query(
            `UPDATE attendance
             SET check_in = CURTIME()
             WHERE id = ? AND check_in IS NULL`,
            [records[0].id],
            (updateError, updateResult) => {
              if (updateError) return saveCheckIn(updateError);

              if (updateResult.affectedRows === 0) {
                return res.status(409).json({
                  message: "You have already checked in today.",
                });
              }

              saveCheckIn(null);
            }
          );
        } else {
          db.query(
            `INSERT INTO attendance (member_id, date, check_in)
             VALUES (?, CURDATE(), CURTIME())`,
            [member.id],
            saveCheckIn
          );
        }
      }
    );
  });
});

// Employee check-out
app.post("/api/attendance/check-out", (req, res) => {
  const identifier = req.body.staff_id || req.body.staffId || req.body.name;

  if (typeof identifier !== "string" || !identifier.trim()) {
    return res.status(400).json({
      message: "Please enter your Staff ID.",
    });
  }

  findMember(identifier, (error, members) => {
    if (error) {
      console.error("Find staff error:", error);
      return res.status(500).json({
        message: "Database error.",
      });
    }

    if (members.length === 0) {
      return res.status(404).json({
        message: "Staff ID not found.",
      });
    }

    const member = members[0];

    db.query(
      `UPDATE attendance
       SET check_out = CURTIME()
       WHERE member_id = ?
         AND date = CURDATE()
         AND check_in IS NOT NULL
         AND check_out IS NULL`,
      [member.id],
      (updateError, result) => {
        if (updateError) {
          console.error("Check-out error:", updateError);
          return res.status(500).json({
            message: "Failed to record check-out.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(400).json({
            message: "No active check-in found, or you have already checked out.",
          });
        }

        db.query(
          `SELECT TIME_FORMAT(check_out, '%H:%i:%s') AS check_out
           FROM attendance
           WHERE member_id = ? AND date = CURDATE()
           LIMIT 1`,
          [member.id],
          (timeError, records) => {
            if (timeError) {
              console.error("Get check-out time error:", timeError);
              return res.status(500).json({
                message: "Check-out saved, but time could not be retrieved.",
              });
            }

            res.json({
              message: "Check-out successful.",
              staff_id: member.staff_id,
              name: member.name,
              check_out: records[0].check_out,
            });
          }
        );
      }
    );
  });
});

// Today's attendance, including staff who have not checked in
app.get("/api/attendance/today", (req, res) => {
  const sql = `
    SELECT
      m.id AS member_id,
      m.staff_id,
      m.name,
      DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS date,
      TIME_FORMAT(a.check_in, '%H:%i:%s') AS check_in,
      TIME_FORMAT(a.check_out, '%H:%i:%s') AS check_out,
      CASE
        WHEN a.check_in IS NULL THEN
          CASE
            WHEN CURTIME() >= '12:00:00' THEN 'Absent'
            ELSE 'Not checked in'
          END
        WHEN a.check_in > '09:00:00' THEN 'Late'
        ELSE 'Present'
      END AS status
    FROM members m
    LEFT JOIN attendance a
      ON a.member_id = m.id
      AND a.date = CURDATE()
    ORDER BY m.name ASC
  `;

  db.query(sql, (error, results) => {
    if (error) {
      console.error("Today's attendance error:", error);
      return res.status(500).json({
        message: "Failed to retrieve today's attendance.",
      });
    }

    res.json(results);
  });
});

// Individual staff report for a selected date range
// Example:
// /api/reports/attendance?staff_id=STF0001&start_date=2026-10-01&end_date=2026-10-25
app.get("/api/reports/attendance", (req, res) => {
  const { staff_id, start_date, end_date } = req.query;

  if (!staff_id || !start_date || !end_date) {
    return res.status(400).json({
      message: "Staff ID, start date, and end date are required.",
    });
  }

  const validDate = /^\d{4}-\d{2}-\d{2}$/;

  if (!validDate.test(start_date) || !validDate.test(end_date)) {
    return res.status(400).json({
      message: "Dates must use YYYY-MM-DD format.",
    });
  }

  if (start_date > end_date) {
    return res.status(400).json({
      message: "Start date cannot be later than end date.",
    });
  }

  const sql = `
    SELECT
      m.id AS member_id,
      m.staff_id,
      m.name,
      DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
      TIME_FORMAT(a.check_in, '%H:%i:%s') AS check_in,
      TIME_FORMAT(a.check_out, '%H:%i:%s') AS check_out,
      CASE
        WHEN a.check_in IS NULL THEN 'Absent'
        WHEN a.check_in > '09:00:00' THEN 'Late'
        ELSE 'Present'
      END AS status
    FROM members m
    LEFT JOIN attendance a
      ON a.member_id = m.id
      AND a.date BETWEEN ? AND ?
    WHERE m.staff_id = ?
    ORDER BY a.date DESC
  `;

  db.query(sql, [start_date, end_date, staff_id], (error, results) => {
    if (error) {
      console.error("Staff report error:", error);
      return res.status(500).json({
        message: "Failed to generate staff report.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Staff ID not found.",
      });
    }

    res.json({
      staff: {
        staff_id: results[0].staff_id,
        name: results[0].name,
      },
      start_date,
      end_date,
      records: results.filter((record) => record.date !== null),
    });
  });
});

// Start the server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
