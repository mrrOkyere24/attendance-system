const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "attendance_system"
});

db.connect((error) => {

  if (error) {
    console.error("MySQL connection failed:", error);
    return;
  }

  console.log("MySQL database connected successfully!");

});

module.exports = db;