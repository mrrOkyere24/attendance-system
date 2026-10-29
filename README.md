# Attendance Management System

A web-based attendance management system built with React, Node.js, Express, and MySQL. The application allows administrators to manage employees and monitor attendance, while employees can check in and check out using their registered names.

## Features

### Admin Dashboard
- View attendance statistics and employee records.
- Add, edit, and delete employee records.
- Search for employees.
- Monitor employee attendance status.
- View attendance information and reports.

### Employee Attendance
- Enter a name to access attendance.
- Verify employees against registered member records.
- Check in and check out.
- Track attendance status based on check-in time.

### Attendance Rules
- **Work start time:** 9:00 AM.
- **Present:** Check in at or before 9:00 AM.
- **Late:** Check in after 9:00 AM.
- **Absent:** Employees who have not checked in by 12:00 PM.

## Technologies Used

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js

**Database**
- MySQL

**Development Tools**
- Visual Studio Code
- Git and GitHub
- XAMPP / phpMyAdmin

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MySQL, or XAMPP with MySQL
- A web browser

### 1. Clone the Repository

```bash
git clone https://github.com/mrrOkyere24/attendance-system.git
cd attendance-system
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up the Database

1. Start MySQL using XAMPP or your installed MySQL service.
2. Open phpMyAdmin.
3. Create a database named `attendance_system`.
4. Ensure the required `members` and `attendance` tables exist.

The database tables must match the queries used in the backend. Database table creation scripts can be added to this repository to make setup easier.

### 4. Configure the Backend

Navigate to the backend folder:

```bash
cd backend
npm install
```

Check `config/db.js` and update the database connection settings if your MySQL username, password, host, or database name differs from your local configuration.

### 5. Start the Backend

From the `backend` directory, run:

```bash
node server.js
```

The backend server runs at:

```text
http://localhost:5000
```

### 6. Start the Frontend

Open another terminal in the main project directory and run:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Important Notes

- The frontend and backend must both be running for database-backed features to work.
- MySQL must be running before the backend connects.
- The database connection settings must match your local MySQL configuration.
- `localhost` is intended for local development; deployment requires a hosted backend and database configuration.
- Never commit database passwords, API keys, or other sensitive credentials to a public repository.

## Future Improvements

- Secure administrator authentication and authorization.
- Improved attendance reports and date filtering.
- Export attendance reports to CSV or PDF.
- Better validation and error handling.
- Deployment to a production hosting environment.

## Author

**GitHub:** [@mrrOkyere24](https://github.com/mrrOkyere24)

---

This project was developed to simplify employee attendance tracking and make attendance records easier to manage.

