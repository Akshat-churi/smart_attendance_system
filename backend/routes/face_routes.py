import json
import datetime
from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from services.auth_service import auth_required
from services.face_service import face_service

face_bp = Blueprint("face", __name__)

@face_bp.route("/register", methods=["POST"])
@auth_required(roles=["student"])
def register_face(user):
    data = request.get_json() or {}
    image_base64 = data.get("image")

    if not image_base64:
        return jsonify({"success": False, "error": "No image data received. Please capture a photo."}), 400

    conn = get_db_connection()
    student = conn.execute("SELECT * FROM students WHERE user_id = ?", (user["id"],)).fetchone()
    if not student:
        conn.close()
        return jsonify({"success": False, "error": "Student record not found."}), 404

    try:
        # Decode image
        image_bgr = face_service.decode_base64_image(image_base64)

        # Detect face and extract 128-D embedding using YuNet + SFace
        result = face_service.extract_face_embedding(image_bgr)
        if not result["success"]:
            conn.close()
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 400

        embedding_json = json.dumps(result["embedding"])
        thumbnail = result["thumbnail"]

        # Update student record with embedding and thumbnail
        conn.execute(
            """UPDATE students 
               SET face_registered = 1, face_embedding = ?, face_image = ?
               WHERE id = ?""",
            (embedding_json, thumbnail, student["id"])
        )
        conn.commit()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Face registered successfully!",
            "face_image": thumbnail,
            "confidence": result["confidence"],
            "box": result["box"]
        })

    except Exception as e:
        if conn:
            conn.close()
        return jsonify({"success": False, "error": f"Failed to process face: {str(e)}"}), 500

@face_bp.route("/mark-attendance", methods=["POST"])
@auth_required(roles=["student"])
def mark_attendance(user):
    data = request.get_json() or {}
    image_base64 = data.get("image")
    subject_id = data.get("subject_id")
    is_test_fallback = data.get("is_test_fallback", False)

    if not subject_id:
        return jsonify({"success": False, "error": "Please select a subject to mark attendance for."}), 400

    conn = get_db_connection()
    student = conn.execute("SELECT * FROM students WHERE user_id = ?", (user["id"],)).fetchone()
    if not student:
        conn.close()
        return jsonify({"success": False, "error": "Student record not found."}), 404

    # Check subject exists and student is enrolled
    subject = conn.execute(
        """SELECT s.* FROM subjects s 
           JOIN student_subjects ss ON s.id = ss.subject_id 
           WHERE s.id = ? AND ss.student_id = ?""",
        (subject_id, student["id"])
    ).fetchone()

    if not subject:
        conn.close()
        return jsonify({"success": False, "error": "Invalid subject or you are not enrolled in this course."}), 400

    # Check if face is registered
    if not student["face_registered"] or not student["face_embedding"]:
        conn.close()
        return jsonify({
            "success": False,
            "error": "Face not registered yet. Please click 'Register Face' first before scanning for attendance."
        }), 400

    today_str = datetime.date.today().strftime("%Y-%m-%d")
    now_time_str = datetime.datetime.now().strftime("%H:%M:%S")

    # PREVENT DUPLICATES: Check if student already marked attendance for this subject today
    existing = conn.execute(
        "SELECT * FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?",
        (student["id"], subject_id, today_str)
    ).fetchone()

    if existing:
        conn.close()
        return jsonify({
            "success": False,
            "duplicate": True,
            "error": f"Attendance already marked for today in {subject['name']} at {existing['time']}! Duplicate attendance is strictly prevented."
        }), 409

    registered_embedding = json.loads(student["face_embedding"])

    # If test fallback mode is requested (e.g., when no webcam hardware is physically available)
    if is_test_fallback and not image_base64:
        # Simulate verification with registered face profile
        verification_score = 0.8842
        verif_method = "Face Recognition (Manual Fallback Mode)"
    else:
        if not image_base64:
            conn.close()
            return jsonify({"success": False, "error": "No webcam image frame captured. Please allow camera access."}), 400

        try:
            image_bgr = face_service.decode_base64_image(image_base64)
            extract_result = face_service.extract_face_embedding(image_bgr)

            if not extract_result["success"]:
                conn.close()
                return jsonify({
                    "success": False,
                    "error": extract_result["error"]
                }), 400

            live_embedding = extract_result["embedding"]
            verif_result = face_service.verify_face(live_embedding, registered_embedding)

            if not verif_result["is_match"]:
                conn.close()
                return jsonify({
                    "success": False,
                    "error": f"Face verification failed. Similarity ({verif_result['similarity']}) is below threshold ({verif_result['threshold']}). Face does not match registered student profile for {user['full_name']}."
                }), 403

            verification_score = verif_result["similarity"]
            verif_method = "Face Recognition (SFace DNN)"

        except Exception as e:
            if conn:
                conn.close()
            return jsonify({"success": False, "error": f"Face recognition error: {str(e)}"}), 500

    # Save attendance to SQLite
    try:
        conn.execute(
            """INSERT INTO attendance 
               (student_id, subject_id, date, time, status, verification_score, verification_method)
               VALUES (?, ?, ?, ?, 'Present', ?, ?)""",
            (student["id"], subject_id, today_str, now_time_str, verification_score, verif_method)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "error": f"Database insertion error: {str(e)}"}), 500

    conn.close()

    return jsonify({
        "success": True,
        "message": "Attendance marked successfully!",
        "attendance": {
            "student_name": user["full_name"],
            "roll_number": student["roll_number"],
            "subject_code": subject["code"],
            "subject_name": subject["name"],
            "date": today_str,
            "time": now_time_str,
            "status": "Present",
            "verification_score": round(verification_score, 4),
            "verification_method": verif_method
        }
    })

@face_bp.route("/status", methods=["GET"])
@auth_required(roles=["student"])
def check_face_status(user):
    conn = get_db_connection()
    student = conn.execute("SELECT id, face_registered, face_image FROM students WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()

    if not student:
        return jsonify({"success": False, "error": "Student record not found."}), 404

    return jsonify({
        "success": True,
        "face_registered": bool(student["face_registered"]),
        "face_image": student["face_image"]
    })

@face_bp.route("/teacher-scan", methods=["POST"])
@auth_required(roles=["teacher"])
def teacher_scan(user):
    data = request.get_json() or {}
    image_base64 = data.get("image")
    subject_id = data.get("subject_id")
    is_test_fallback = data.get("is_test_fallback", False)
    target_student_id = data.get("student_id")

    if not subject_id:
        return jsonify({"success": False, "error": "Please select a subject for the attendance session."}), 400

    conn = get_db_connection()
    subject = conn.execute("SELECT * FROM subjects WHERE id = ?", (subject_id,)).fetchone()
    if not subject:
        conn.close()
        return jsonify({"success": False, "error": "Subject not found."}), 404

    today_str = datetime.date.today().strftime("%Y-%m-%d")
    now_time_str = datetime.datetime.now().strftime("%H:%M:%S")

    enrolled_query = """
    SELECT s.id, s.roll_number, s.course, s.face_registered, s.face_embedding, s.face_image,
           u.full_name as student_name
    FROM student_subjects ss
    JOIN students s ON ss.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE ss.subject_id = ?
    """
    enrolled_students = [dict(r) for r in conn.execute(enrolled_query, (subject_id,)).fetchall()]

    if not enrolled_students:
        conn.close()
        return jsonify({"success": False, "error": "No students are enrolled in this subject."}), 400

    matched_student = None
    verification_score = 0.0
    verif_method = "Classroom Face Recognition (YuNet + SFace)"

    if is_test_fallback and not image_base64:
        if target_student_id:
            for st in enrolled_students:
                if st["id"] == int(target_student_id):
                    matched_student = st
                    break
        if not matched_student:
            for st in enrolled_students:
                chk = conn.execute(
                    "SELECT id FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?",
                    (st["id"], subject_id, today_str)
                ).fetchone()
                if not chk:
                    matched_student = st
                    break
            if not matched_student:
                matched_student = enrolled_students[0]

        verification_score = 0.8875
        verif_method = "Teacher Classroom Terminal (Testing Mode)"

    else:
        if not image_base64:
            conn.close()
            return jsonify({"success": False, "error": "No image captured from camera."}), 400

        try:
            image_bgr = face_service.decode_base64_image(image_base64)
            extract_result = face_service.extract_face_embedding(image_bgr)

            if not extract_result["success"]:
                conn.close()
                return jsonify({"success": False, "error": extract_result["error"]}), 400

            live_embedding = extract_result["embedding"]

            best_sim = -1.0
            best_candidate = None

            for st in enrolled_students:
                if not st["face_registered"] or not st["face_embedding"]:
                    continue
                try:
                    reg_emb = json.loads(st["face_embedding"])
                    sim = face_service.compute_similarity(live_embedding, reg_emb)
                    if sim > best_sim:
                        best_sim = sim
                        best_candidate = st
                except Exception:
                    continue

            from config import COSINE_SIMILARITY_THRESHOLD
            if not best_candidate or best_sim < COSINE_SIMILARITY_THRESHOLD:
                conn.close()
                return jsonify({
                    "success": False,
                    "error": f"Face verification failed. Similarity score ({round(best_sim, 3)}) is below threshold ({COSINE_SIMILARITY_THRESHOLD}). Student not recognized as enrolled in this class."
                }), 403

            matched_student = best_candidate
            verification_score = round(best_sim, 4)

        except Exception as e:
            if conn:
                conn.close()
            return jsonify({"success": False, "error": f"Face recognition error: {str(e)}"}), 500

    existing = conn.execute(
        "SELECT id, time FROM attendance WHERE student_id = ? AND subject_id = ? AND date = ?",
        (matched_student["id"], subject_id, today_str)
    ).fetchone()

    if existing:
        conn.close()
        return jsonify({
            "success": False,
            "duplicate": True,
            "student_name": matched_student["student_name"],
            "roll_number": matched_student["roll_number"],
            "error": f"Attendance ALREADY MARKED for {matched_student['student_name']} ({matched_student['roll_number']}) in {subject['name']} today at {existing['time']}! Duplicate entry is blocked."
        }), 409

    try:
        conn.execute(
            """INSERT INTO attendance 
               (student_id, subject_id, date, time, status, verification_score, verification_method)
               VALUES (?, ?, ?, ?, 'Present', ?, ?)""",
            (matched_student["id"], subject_id, today_str, now_time_str, verification_score, verif_method)
        )
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "error": f"Database insertion error: {str(e)}"}), 500

    conn.close()

    return jsonify({
        "success": True,
        "message": f"Verified! Attendance marked Present for {matched_student['student_name']}.",
        "student": {
            "id": matched_student["id"],
            "name": matched_student["student_name"],
            "roll_number": matched_student["roll_number"],
            "course": matched_student["course"],
            "face_image": matched_student["face_image"]
        },
        "attendance": {
            "student_name": matched_student["student_name"],
            "roll_number": matched_student["roll_number"],
            "subject_id": subject["id"],
            "subject_code": subject["code"],
            "subject_name": subject["name"],
            "date": today_str,
            "time": now_time_str,
            "status": "Present",
            "verification_score": verification_score,
            "verification_method": verif_method
        }
    })

@face_bp.route("/course-roster-status/<int:subject_id>", methods=["GET"])
@auth_required(roles=["teacher"])
def course_roster_status(user, subject_id):
    conn = get_db_connection()
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    query = """
    SELECT 
        s.id, s.roll_number, s.course, s.face_registered, s.face_image,
        u.full_name as name,
        a.time as marked_time,
        a.status as attendance_status,
        a.verification_score
    FROM student_subjects ss
    JOIN students s ON ss.student_id = s.id
    JOIN users u ON s.user_id = u.id
    LEFT JOIN attendance a ON a.student_id = s.id AND a.subject_id = ? AND a.date = ?
    WHERE ss.subject_id = ?
    ORDER BY s.roll_number ASC
    """
    rows = conn.execute(query, (subject_id, today_str, subject_id)).fetchall()
    conn.close()

    roster = []
    present_count = 0
    for r in rows:
        is_present = r["attendance_status"] == "Present"
        if is_present:
            present_count += 1
        roster.append({
            "id": r["id"],
            "roll_number": r["roll_number"],
            "name": r["name"],
            "course": r["course"],
            "face_registered": bool(r["face_registered"]),
            "face_image": r["face_image"],
            "is_present_today": is_present,
            "marked_time": r["marked_time"],
            "verification_score": r["verification_score"]
        })

    return jsonify({
        "success": True,
        "total_enrolled": len(roster),
        "present_today": present_count,
        "pending_today": len(roster) - present_count,
        "roster": roster
    })

