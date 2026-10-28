import datetime
from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from services.auth_service import auth_required

teacher_bp = Blueprint("teacher", __name__)

@teacher_bp.route("/dashboard", methods=["GET"])
@auth_required(roles=["teacher"])
def get_teacher_dashboard(user):
    conn = get_db_connection()
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    # 1. Teacher profile
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE user_id = ?", (user["id"],)
    ).fetchone()

    # 2. Total registered students
    total_students_row = conn.execute("SELECT COUNT(*) as count FROM students").fetchone()
    total_students = total_students_row["count"] if total_students_row else 0

    # 3. Total registered faces
    registered_faces_row = conn.execute("SELECT COUNT(*) as count FROM students WHERE face_registered = 1").fetchone()
    registered_faces = registered_faces_row["count"] if registered_faces_row else 0

    # 4. Total subjects
    total_subjects_row = conn.execute("SELECT COUNT(*) as count FROM subjects").fetchone()
    total_subjects = total_subjects_row["count"] if total_subjects_row else 0

    # 5. Today's attendance count
    today_attendance_row = conn.execute(
        "SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'Present'",
        (today_str,)
    ).fetchone()
    today_attendance_count = today_attendance_row["count"] if today_attendance_row else 0

    # 6. Total historical classes conducted across subjects
    total_classes_row = conn.execute("SELECT SUM(total_classes) as total FROM subjects").fetchone()
    total_classes_conducted = total_classes_row["total"] if total_classes_row and total_classes_row["total"] else 0

    # 7. List of subjects for filtering
    subjects_query = """
    SELECT s.id, s.code, s.name, s.total_classes, u.full_name as teacher_name
    FROM subjects s
    LEFT JOIN teachers t ON s.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY s.code ASC
    """
    subjects_list = [dict(r) for r in conn.execute(subjects_query).fetchall()]

    # 8. Student summary list with overall attendance percentage
    students_query = """
    SELECT 
        s.id, s.roll_number, s.course, s.semester, s.face_registered, s.face_image,
        u.full_name, u.email
    FROM students s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.roll_number ASC
    """
    all_students = [dict(r) for r in conn.execute(students_query).fetchall()]
    
    student_summaries = []
    total_pct_sum = 0
    for st in all_students:
        st_id = st["id"]
        # Attended count
        att_c = conn.execute(
            "SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'Present'",
            (st_id,)
        ).fetchone()["count"]

        # Expected classes
        exp_c = total_classes_conducted if total_classes_conducted > 0 else 1
        pct = round((att_c / exp_c * 100), 1)
        total_pct_sum += pct

        student_summaries.append({
            "id": st_id,
            "roll_number": st["roll_number"],
            "name": st["full_name"],
            "email": st["email"],
            "course": st["course"],
            "semester": st["semester"],
            "face_registered": bool(st["face_registered"]),
            "face_image": st["face_image"],
            "attended_classes": att_c,
            "total_classes": exp_c,
            "attendance_percentage": pct,
            "is_shortage": pct < 75.0
        })

    average_attendance_rate = (
        round(total_pct_sum / len(student_summaries), 1)
        if student_summaries else 0.0
    )

    conn.close()

    return jsonify({
        "success": True,
        "teacher": {
            "name": user["full_name"],
            "email": user["email"],
            "department": teacher["department"] if teacher else "Faculty",
            "designation": teacher["designation"] if teacher else "Professor"
        },
        "stats": {
            "total_students": total_students,
            "registered_faces": registered_faces,
            "total_subjects": total_subjects,
            "today_attendance": today_attendance_count,
            "total_classes": total_classes_conducted,
            "average_attendance": average_attendance_rate,
            "today_date": today_str
        },
        "subjects": subjects_list,
        "students": student_summaries
    })

@teacher_bp.route("/attendance-records", methods=["GET"])
@auth_required(roles=["teacher"])
def get_attendance_records(user):
    conn = get_db_connection()

    # Query params for filters
    search = request.args.get("search", "").strip()
    subject_id = request.args.get("subject_id", "").strip()
    date_filter = request.args.get("date", "").strip()
    status_filter = request.args.get("status", "").strip()
    limit = int(request.args.get("limit", 100))

    query = """
    SELECT 
        a.id, a.date, a.time, a.status, a.verification_score, a.verification_method,
        s.roll_number, u.full_name as student_name, s.course,
        sub.id as subject_id, sub.code as subject_code, sub.name as subject_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN subjects sub ON a.subject_id = sub.id
    WHERE 1=1
    """
    params = []

    if search:
        query += " AND (u.full_name LIKE ? OR s.roll_number LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term])

    if subject_id and subject_id != "all":
        query += " AND a.subject_id = ?"
        params.append(subject_id)

    if date_filter:
        query += " AND a.date = ?"
        params.append(date_filter)

    if status_filter and status_filter != "all":
        query += " AND a.status = ?"
        params.append(status_filter)

    query += " ORDER BY a.date DESC, a.time DESC LIMIT ?"
    params.append(limit)

    records = [dict(r) for r in conn.execute(query, tuple(params)).fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(records),
        "records": records
    })

@teacher_bp.route("/subject-summary/<int:subject_id>", methods=["GET"])
@auth_required(roles=["teacher"])
def get_subject_attendance_summary(user, subject_id):
    conn = get_db_connection()

    subject = conn.execute("SELECT * FROM subjects WHERE id = ?", (subject_id,)).fetchone()
    if not subject:
        conn.close()
        return jsonify({"success": False, "error": "Subject not found."}), 404

    # Enrolled students for this subject
    enrolled_query = """
    SELECT 
        s.id as student_id, s.roll_number, u.full_name as student_name, s.course,
        (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND subject_id = ? AND status = 'Present') as attended_classes
    FROM student_subjects ss
    JOIN students s ON ss.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE ss.subject_id = ?
    ORDER BY s.roll_number ASC
    """
    students_data = []
    total_classes = subject["total_classes"]

    for r in conn.execute(enrolled_query, (subject_id, subject_id)).fetchall():
        attended = r["attended_classes"]
        pct = round((attended / total_classes * 100), 1) if total_classes > 0 else 0.0
        students_data.append({
            "student_id": r["student_id"],
            "roll_number": r["roll_number"],
            "name": r["student_name"],
            "course": r["course"],
            "attended_classes": attended,
            "total_classes": total_classes,
            "percentage": pct,
            "is_shortage": pct < 75.0
        })

    conn.close()

    return jsonify({
        "success": True,
        "subject": dict(subject),
        "enrolled_count": len(students_data),
        "students": students_data
    })

@teacher_bp.route("/mark-manual-attendance", methods=["POST"])
@auth_required(roles=["teacher"])
def mark_manual_attendance(user):
    data = request.get_json() or {}
    student_id = data.get("student_id")
    subject_id = data.get("subject_id")
    date_str = data.get("date") or datetime.date.today().strftime("%Y-%m-%d")
    status = data.get("status", "Present")
    notes = data.get("notes", "Faculty Manual Entry")

    if not student_id or not subject_id:
        return jsonify({"success": False, "error": "student_id and subject_id are required"}), 400

    conn = get_db_connection()
    now_time = datetime.datetime.now().strftime("%H:%M:%S")

    existing = conn.execute(
        "SELECT id FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?",
        (student_id, subject_id, date_str)
    ).fetchone()

    if existing:
        conn.execute(
            """UPDATE attendance 
               SET status = ?, time = ?, verification_method = ?, verification_score = 1.0 
               WHERE id = ?""",
            (status, now_time, f"Manual Override: {notes}", existing["id"])
        )
        msg = f"Attendance record updated to '{status}' for {date_str}."
    else:
        conn.execute(
            """INSERT INTO attendance 
               (student_id, subject_id, date, time, status, verification_score, verification_method)
               VALUES (?, ?, ?, ?, ?, 1.0, ?)""",
            (student_id, subject_id, date_str, now_time, status, f"Manual Override: {notes}")
        )
        msg = f"Attendance successfully marked as '{status}' for {date_str}."

    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": msg})

@teacher_bp.route("/student-detail/<int:student_id>", methods=["GET"])
@auth_required(roles=["teacher"])
def get_student_detail(user, student_id):
    conn = get_db_connection()
    student = conn.execute(
        """SELECT s.*, u.full_name, u.email 
           FROM students s 
           JOIN users u ON s.user_id = u.id 
           WHERE s.id = ?""",
        (student_id,)
    ).fetchone()

    if not student:
        conn.close()
        return jsonify({"success": False, "error": "Student not found"}), 404

    subs = conn.execute(
        """SELECT s.id, s.code, s.name, s.total_classes,
                  (SELECT COUNT(*) FROM attendance WHERE student_id = ? AND subject_id = s.id AND status = 'Present') as attended
           FROM student_subjects ss
           JOIN subjects s ON ss.subject_id = s.id
           WHERE ss.student_id = ?""",
        (student_id, student_id)
    ).fetchall()

    subject_breakdown = []
    tot_attended = 0
    tot_classes = 0
    for sub in subs:
        att = sub["attended"]
        tot = sub["total_classes"]
        pct = round(att / tot * 100, 1) if tot > 0 else 0.0
        tot_attended += att
        tot_classes += tot
        subject_breakdown.append({
            "subject_id": sub["id"],
            "code": sub["code"],
            "name": sub["name"],
            "attended": att,
            "total": tot,
            "percentage": pct,
            "is_shortage": pct < 75.0
        })

    overall_pct = round(tot_attended / tot_classes * 100, 1) if tot_classes > 0 else 0.0

    records = conn.execute(
        """SELECT a.id, a.date, a.time, a.status, a.verification_score, a.verification_method,
                  sub.code as subject_code, sub.name as subject_name
           FROM attendance a
           JOIN subjects sub ON a.subject_id = sub.id
           WHERE a.student_id = ?
           ORDER BY a.date DESC, a.time DESC LIMIT 30""",
        (student_id,)
    ).fetchall()

    conn.close()

    return jsonify({
        "success": True,
        "student": {
            "id": student["id"],
            "roll_number": student["roll_number"],
            "name": student["full_name"],
            "email": student["email"],
            "course": student["course"],
            "semester": student["semester"],
            "face_registered": bool(student["face_registered"]),
            "face_image": student["face_image"],
            "overall_percentage": overall_pct,
            "total_attended": tot_attended,
            "total_classes": tot_classes,
            "is_shortage": overall_pct < 75.0
        },
        "subjects": subject_breakdown,
        "records": [dict(r) for r in records]
    })

@teacher_bp.route("/delete-attendance/<int:attendance_id>", methods=["DELETE"])
@auth_required(roles=["teacher"])
def delete_attendance(user, attendance_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM attendance WHERE id = ?", (attendance_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Attendance record deleted."})

