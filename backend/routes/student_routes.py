from flask import Blueprint, jsonify
from database.db import get_db_connection
from services.auth_service import auth_required

student_bp = Blueprint("student", __name__)

@student_bp.route("/dashboard", methods=["GET"])
@auth_required(roles=["student"])
def get_student_dashboard(user):
    conn = get_db_connection()
    student = conn.execute(
        "SELECT * FROM students WHERE user_id = ?", (user["id"],)
    ).fetchone()

    if not student:
        conn.close()
        return jsonify({"success": False, "error": "Student profile not found."}), 404

    student_id = student["id"]

    # 1. Fetch enrolled subjects with teacher info
    subjects_query = """
    SELECT 
        s.id, s.code, s.name, s.total_classes, s.schedule,
        u.full_name as teacher_name, t.department as teacher_dept
    FROM student_subjects ss
    JOIN subjects s ON ss.subject_id = s.id
    LEFT JOIN teachers t ON s.teacher_id = t.id
    LEFT JOIN users u ON t.user_id = u.id
    WHERE ss.student_id = ?
    ORDER BY s.code ASC
    """
    enrolled_subjects = [dict(row) for row in conn.execute(subjects_query, (student_id,)).fetchall()]

    # 2. Compute subject-wise attendance and overall stats
    subject_stats = []
    total_conducted_classes = 0
    total_attended_classes = 0

    for sub in enrolled_subjects:
        sub_id = sub["id"]
        # Count classes attended by this student for this subject
        att_row = conn.execute(
            """SELECT COUNT(*) as attended FROM attendance 
               WHERE student_id = ? AND subject_id = ? AND status = 'Present'""",
            (student_id, sub_id)
        ).fetchone()
        attended = att_row["attended"] if att_row else 0
        total_classes = sub["total_classes"]

        pct = round((attended / total_classes * 100), 1) if total_classes > 0 else 0.0

        total_conducted_classes += total_classes
        total_attended_classes += attended

        subject_stats.append({
            "subject_id": sub_id,
            "code": sub["code"],
            "name": sub["name"],
            "teacher_name": sub["teacher_name"] or "Faculty Assigned",
            "schedule": sub["schedule"],
            "total_classes": total_classes,
            "attended_classes": attended,
            "missed_classes": max(0, total_classes - attended),
            "percentage": pct,
            "is_shortage": pct < 75.0
        })

    overall_percentage = (
        round((total_attended_classes / total_conducted_classes * 100), 1)
        if total_conducted_classes > 0 else 0.0
    )
    total_missed_classes = max(0, total_conducted_classes - total_attended_classes)

    # 3. Fetch recent attendance history (latest 20 records)
    history_query = """
    SELECT 
        a.id, a.date, a.time, a.status, a.verification_score, a.verification_method,
        s.code as subject_code, s.name as subject_name
    FROM attendance a
    JOIN subjects s ON a.subject_id = s.id
    WHERE a.student_id = ?
    ORDER BY a.date DESC, a.time DESC
    LIMIT 25
    """
    recent_history = [dict(row) for row in conn.execute(history_query, (student_id,)).fetchall()]

    # 4. Check today's marked attendance
    import datetime
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    today_records = conn.execute(
        """SELECT a.subject_id, s.code, s.name, a.time 
           FROM attendance a
           JOIN subjects s ON a.subject_id = s.id
           WHERE a.student_id = ? AND a.date = ?""",
        (student_id, today_str)
    ).fetchall()
    today_marked_subject_ids = [r["subject_id"] for r in today_records]

    conn.close()

    return jsonify({
        "success": True,
        "profile": {
            "student_id": student["id"],
            "roll_number": student["roll_number"],
            "name": user["full_name"],
            "email": user["email"],
            "course": student["course"],
            "semester": student["semester"],
            "face_registered": bool(student["face_registered"]),
            "face_image": student["face_image"]
        },
        "stats": {
            "overall_percentage": overall_percentage,
            "total_classes": total_conducted_classes,
            "attended_classes": total_attended_classes,
            "missed_classes": total_missed_classes,
            "is_warning": overall_percentage < 75.0,
            "warning_message": (
                f"Attendance Alert: Overall attendance is {overall_percentage}%, which is below the required 75%. Please attend upcoming classes to avoid detention."
                if overall_percentage < 75.0 else None
            )
        },
        "subject_wise": subject_stats,
        "recent_history": recent_history,
        "today_marked_subject_ids": today_marked_subject_ids,
        "today_date": today_str
    })
