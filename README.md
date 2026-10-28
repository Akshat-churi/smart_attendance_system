# AttendSmart - Student Attendance Monitoring System with Face Recognition

A functional, modern **Student Attendance Monitoring System** powered by **OpenCV Deep Neural Network Face Recognition (YuNet + SFace)**, **React.js**, **Python Flask**, and **SQLite**.

---

## 🌟 Key Features

1. **Dual Role Authentication:**
   - **Student Portal:** Face ID registration, real-time webcam face scanning to mark attendance, overall attendance percentage gauge, subject-wise breakdown, recent attendance history, and mandatory `< 75%` attendance shortage alerts.
   - **Teacher Portal:** Real-time stats (Total Students, Today's Attendance, Total Classes, Batch Average Attendance), filterable attendance logs (search by student name/roll, subject, date, status), student performance overview with shortage indicators, and CSV export.

2. **Real Deep Learning Face Recognition:**
   - Powered by **OpenCV DNN FaceDetectorYN (YuNet)** for multi-scale face detection & landmark alignment.
   - Powered by **OpenCV DNN FaceRecognizerSF (SFace)** for 128-dimensional biometric facial embedding extraction and Cosine Similarity verification.
   - **No simple button-clicking or mock timers:** Performs actual mathematical cosine similarity comparisons against registered facial embeddings.

3. **Strict Duplicate Prevention:**
   - Database-level and application-level constraints prevent any student from marking attendance more than once for the same subject on the same calendar day (returns `409 Conflict`).

4. **Webcam Support with Manual Testing Fallback:**
   - Live camera stream with visual oval face guide.
   - Built-in test fallback modes for camera-restricted or hardware-less environments.

5. **LocalStorage + SQLite Architecture:**
   - Browser `localStorage` retains user demo sessions, cached attendance data for instant rendering, and last selected role.
   - SQLite database serves as the source of truth, updated on all verification events.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Python Flask, Flask-CORS, PyJWT, Werkzeug Security |
| **Face AI** | OpenCV 5.0 DNN (`FaceDetectorYN` + `FaceRecognizerSF`) |
| **Database** | SQLite3 (`attendance.db`) with automatic schema initialization & seeding |
| **Storage** | Browser `localStorage` (cache) + SQLite (source of truth) |

---

## 🚀 Quick Startup Guide

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm

---

### Step 1: Start the Flask Backend

Open a terminal in the project root:

```bash
# Navigate to backend directory
cd backend

# Install dependencies
python -m pip install -r requirements.txt

# Start the Flask API server (runs on port 5000)
python app.py
```

The SQLite database (`backend/database/attendance.db`) and demo data are initialized and seeded automatically upon startup.

*Backend URL:* `http://localhost:5000`  
*Health Check:* `http://localhost:5000/api/health`

---

### Step 2: Start the React Frontend

Open a second terminal in the project root:

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages (if not already installed)
npm install

# Start Vite dev server (runs on port 3000)
npm run dev -- --port 3000
```

*Frontend URL:* `http://localhost:3000`

---

## 👥 Demo Test Accounts

The login page provides **1-click autofill buttons** for instant testing:

### 🎓 Students

| Name | Roll Number / Username | Password | Notes |
|---|---|---|---|
| **Aarav Sharma** | `CS202601` | `student123` | High attendance (76.7%), ready for Face ID registration & scan |
| **Priya Patel** | `CS202602` | `student123` | **Low attendance (59.2%)** &rarr; Demonstrates `< 75%` Warning Banner |
| **Rohan Gupta** | `CS202603` | `student123` | Regular student (77.0%) |
| **Ananya Singh** | `CS202604` | `student123` | Top attendance (92.0%) |

### 👨‍🏫 Teachers

| Name | Username / Email | Password | Department / Role |
|---|---|---|---|
| **Dr. Vikram Sharma** | `prof.sharma@college.edu` | `teacher123` | HOD & Associate Professor (CSE) |
| **Prof. Sneha Rao** | `prof.rao@college.edu` | `teacher123` | Assistant Professor (IT) |

---

## 📋 Recommended Testing Workflow

1. **Open `http://localhost:3000`** in your browser.
2. Click **"Aarav Sharma"** in the 1-click test accounts to log in as a student.
3. Click **"Register Face ID"** &rarr; Capture your webcam photo or click **"Use Test Face"** &rarr; Click **"Confirm & Register"**.
4. Click **"Scan Face to Mark Attendance"** &rarr; Select a subject (e.g., `CS301 - Data Structures & Algorithms`) &rarr; Click **"Scan & Mark Present"**.
5. Observe the verification result:
   - Green confirmation dialog displaying student name, subject, date, time, and biometric match score.
   - The attendance percentage and attendance activity log immediately update in real time.
6. Try scanning attendance for the **same subject again** to test **duplicate prevention** &rarr; The system warns: *"Attendance already marked for today in Data Structures & Algorithms... Duplicate attendance is strictly prevented."*
7. Click **"⚠️ Priya (<75% Warning)"** in the left sidebar demo switcher &rarr; Notice the prominent red **Attendance Shortage Warning Banner** informing the student of semester exam detention risks.
8. Click **"👨‍🏫 Dr. Sharma (Teacher)"** in the sidebar demo switcher &rarr; The Faculty Dashboard displays today's attendance count, real-time student records, subject breakdown, and CSV export.

---

## 📂 Project Structure

```
HMI/
├── backend/
│   ├── app.py                      # Flask entry point, blueprints & CORS setup
│   ├── config.py                   # Paths, thresholds & JWT configuration
│   ├── requirements.txt            # Python dependencies
│   ├── models/                     # Deep Neural Network ONNX models
│   │   ├── face_detection_yunet_2023mar.onnx
│   │   └── face_recognition_sface_2021dec.onnx
│   ├── database/
│   │   ├── db.py                   # SQLite connection & schema DDL
│   │   ├── seed_data.py            # Sample students, teachers, subjects & records
│   │   └── attendance.db           # SQLite database file
│   ├── services/
│   │   ├── auth_service.py         # JWT tokens & RBAC decorators
│   │   └── face_service.py         # YuNet detection + SFace embedding extraction
│   └── routes/
│       ├── auth_routes.py          # /api/auth/login, /api/auth/me, demo accounts
│       ├── student_routes.py       # /api/student/dashboard
│       ├── teacher_routes.py       # /api/teacher/dashboard, logs, summaries
│       └── face_routes.py          # /api/face/register, /api/face/mark-attendance
├── frontend/
│   ├── package.json
│   ├── vite.config.js              # Vite server & API proxy
│   ├── src/
│   │   ├── App.jsx                 # Main state, routing, and role views
│   │   ├── index.css               # College dashboard styling & design system
│   │   ├── main.jsx
│   │   ├── services/
│   │   │   ├── api.js              # Fetch client with Bearer auth
│   │   │   └── storage.js          # localStorage caching service
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header with user profile & logout
│   │   │   ├── Sidebar.jsx         # Role navigation & demo switcher
│   │   │   ├── AttendanceGauge.jsx # Circular attendance percentage meter
│   │   │   ├── WarningBanner.jsx   # <75% attendance alert banner
│   │   │   ├── StatusBadge.jsx     # Status pill badges
│   │   │   ├── AttendanceModal.jsx # Webcam face scanner modal
│   │   │   └── FaceRegisterModal.jsx # Webcam face registration modal
│   │   └── pages/
│   │       ├── LoginPage.jsx       # Tabbed role login & demo accounts
│   │       ├── StudentDashboard.jsx# Student attendance overview
│   │       └── TeacherDashboard.jsx# Teacher analytics & log filters
└── README.md
```
