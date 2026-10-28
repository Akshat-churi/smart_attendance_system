import sys
import os
import datetime
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from werkzeug.security import generate_password_hash
from database.db import get_db_connection, init_db

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if already seeded
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] > 0:
        conn.close()
        return

    print("Seeding database with initial users, subjects, and sample attendance...")

    # Default password
    student_pw_hash = generate_password_hash("student123")
    teacher_pw_hash = generate_password_hash("teacher123")

    # 1. Insert Teachers
    teachers_data = [
        {
            "username": "prof.sharma@college.edu",
            "name": "Dr. Vikram Sharma",
            "email": "prof.sharma@college.edu",
            "code": "TCH001",
            "dept": "Computer Science & Engineering",
            "designation": "Associate Professor & HOD"
        },
        {
            "username": "prof.rao@college.edu",
            "name": "Prof. Sneha Rao",
            "email": "prof.rao@college.edu",
            "code": "TCH002",
            "dept": "Information Technology",
            "designation": "Assistant Professor"
        }
    ]

    teacher_ids = {}
    for t in teachers_data:
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, email) VALUES (?, ?, 'teacher', ?, ?)",
            (t["username"], teacher_pw_hash, t["name"], t["email"])
        )
        user_id = cursor.lastrowid
        cursor.execute(
            "INSERT INTO teachers (user_id, teacher_code, department, designation) VALUES (?, ?, ?, ?)",
            (user_id, t["code"], t["dept"], t["designation"])
        )
        teacher_ids[t["code"]] = cursor.lastrowid

    # 2. Insert Subjects
    subjects_data = [
        {"code": "CS301", "name": "Data Structures & Algorithms", "teacher": "TCH001", "total": 28, "schedule": "Mon, Wed 10:00 AM"},
        {"code": "CS302", "name": "Database Management Systems", "teacher": "TCH002", "total": 25, "schedule": "Tue, Thu 11:30 AM"},
        {"code": "CS303", "name": "Operating Systems", "teacher": "TCH001", "total": 26, "schedule": "Wed, Fri 02:00 PM"},
        {"code": "CS304", "name": "Computer Networks", "teacher": "TCH002", "total": 24, "schedule": "Mon, Thu 03:30 PM"},
    ]

    subject_ids = {}
    for s in subjects_data:
        cursor.execute(
            "INSERT INTO subjects (code, name, teacher_id, total_classes, schedule) VALUES (?, ?, ?, ?, ?)",
            (s["code"], s["name"], teacher_ids[s["teacher"]], s["total"], s["schedule"])
        )
        subject_ids[s["code"]] = cursor.lastrowid

    # 3. Insert Students
    students_data = [
        {"roll": "CS202601", "name": "Aarav Sharma", "email": "aarav.sharma@college.edu", "course": "B.Tech Computer Science", "semester": "Semester 5", "attendance_rate": 0.85},
        {"roll": "CS202602", "name": "Priya Patel", "email": "priya.patel@college.edu", "course": "B.Tech Computer Science", "semester": "Semester 5", "attendance_rate": 0.64}, # Warning case! < 75%
        {"roll": "CS202603", "name": "Rohan Gupta", "email": "rohan.gupta@college.edu", "course": "B.Tech Computer Science", "semester": "Semester 5", "attendance_rate": 0.77},
        {"roll": "CS202604", "name": "Ananya Singh", "email": "ananya.singh@college.edu", "course": "B.Tech Computer Science", "semester": "Semester 5", "attendance_rate": 0.92},
    ]

    student_records = []
    for st in students_data:
        cursor.execute(
            "INSERT INTO users (username, password_hash, role, full_name, email) VALUES (?, ?, 'student', ?, ?)",
            (st["roll"], student_pw_hash, st["name"], st["email"])
        )
        user_id = cursor.lastrowid
        cursor.execute(
            "INSERT INTO students (user_id, roll_number, course, semester, face_registered) VALUES (?, ?, ?, ?, 0)",
            (user_id, st["roll"], st["course"], st["semester"])
        )
        student_id = cursor.lastrowid
        student_records.append({"id": student_id, "roll": st["roll"], "name": st["name"], "rate": st["attendance_rate"]})

        # Enroll student in all 4 subjects
        for sub_id in subject_ids.values():
            cursor.execute(
                "INSERT INTO student_subjects (student_id, subject_id) VALUES (?, ?)",
                (student_id, sub_id)
            )

    # 4. Generate historical attendance records for the past 30 days
    today = datetime.date.today()
    
    # Generate past lecture dates (weekdays only, last 4 weeks)
    past_dates = []
    curr = today - datetime.timedelta(days=1)
    while len(past_dates) < 22:
        if curr.weekday() < 5: # Monday to Friday
            past_dates.append(curr)
        curr -= datetime.timedelta(days=1)
    past_dates.reverse()

    random.seed(42) # Deterministic for consistent demo

    for dt in past_dates:
        date_str = dt.strftime("%Y-%m-%d")
        for sub_code, sub_id in subject_ids.items():
            # Subject specific times
            if "301" in sub_code:
                time_str = "10:04:15"
            elif "302" in sub_code:
                time_str = "11:32:40"
            elif "303" in sub_code:
                time_str = "14:02:18"
            else:
                time_str = "15:31:05"

            for st in student_records:
                # Decide if student attended based on their target rate
                if random.random() < st["rate"]:
                    score = round(random.uniform(0.72, 0.96), 4)
                    cursor.execute(
                        """INSERT OR IGNORE INTO attendance 
                           (student_id, subject_id, date, time, status, verification_score, verification_method)
                           VALUES (?, ?, ?, ?, 'Present', ?, 'Face Recognition')""",
                        (st["id"], sub_id, date_str, time_str, score)
                    )

    conn.commit()
    conn.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
