from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from database.db import get_db_connection
from services.auth_service import generate_token, token_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    selected_role = data.get("role", "").strip().lower()

    if not username or not password:
        return jsonify({"success": False, "error": "Username/Roll number and password are required."}), 400

    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"success": False, "error": "Invalid credentials. Please check your username and password."}), 401

    if selected_role and user["role"] != selected_role:
        conn.close()
        return jsonify({
            "success": False,
            "error": f"Role mismatch. Account '{username}' is registered as a {user['role']}, not {selected_role}."
        }), 403

    user_info = {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "full_name": user["full_name"],
        "email": user["email"]
    }

    if user["role"] == "student":
        student = conn.execute("SELECT * FROM students WHERE user_id = ?", (user["id"],)).fetchone()
        if student:
            user_info["student_id"] = student["id"]
            user_info["roll_number"] = student["roll_number"]
            user_info["course"] = student["course"]
            user_info["semester"] = student["semester"]
            user_info["face_registered"] = bool(student["face_registered"])
            user_info["face_image"] = student["face_image"]
    elif user["role"] == "teacher":
        teacher = conn.execute("SELECT * FROM teachers WHERE user_id = ?", (user["id"],)).fetchone()
        if teacher:
            user_info["teacher_id"] = teacher["id"]
            user_info["teacher_code"] = teacher["teacher_code"]
            user_info["department"] = teacher["department"]
            user_info["designation"] = teacher["designation"]

    conn.close()

    token = generate_token(user["id"], user["username"], user["role"], user["full_name"])

    return jsonify({
        "success": True,
        "token": token,
        "user": user_info
    })

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user_profile(user):
    conn = get_db_connection()
    user_info = dict(user)

    if user["role"] == "student":
        student = conn.execute("SELECT * FROM students WHERE user_id = ?", (user["id"],)).fetchone()
        if student:
            user_info["student_id"] = student["id"]
            user_info["roll_number"] = student["roll_number"]
            user_info["course"] = student["course"]
            user_info["semester"] = student["semester"]
            user_info["face_registered"] = bool(student["face_registered"])
            user_info["face_image"] = student["face_image"]
    elif user["role"] == "teacher":
        teacher = conn.execute("SELECT * FROM teachers WHERE user_id = ?", (user["id"],)).fetchone()
        if teacher:
            user_info["teacher_id"] = teacher["id"]
            user_info["teacher_code"] = teacher["teacher_code"]
            user_info["department"] = teacher["department"]
            user_info["designation"] = teacher["designation"]

    conn.close()
    return jsonify({"success": True, "user": user_info})

@auth_bp.route("/demo-accounts", methods=["GET"])
def get_demo_accounts():
    """Return pre-configured sample credentials for testing convenience."""
    return jsonify({
        "success": True,
        "students": [
            {
                "username": "CS202601",
                "password": "student123",
                "name": "Aarav Sharma",
                "note": "Normal attendance (85%), Face ready for registration"
            },
            {
                "username": "CS202602",
                "password": "student123",
                "name": "Priya Patel",
                "note": "Low attendance (64%) - Demonstrates <75% warning banner"
            },
            {
                "username": "CS202603",
                "password": "student123",
                "name": "Rohan Gupta",
                "note": "Average attendance (77%)"
            },
            {
                "username": "CS202604",
                "password": "student123",
                "name": "Ananya Singh",
                "note": "High attendance (92%)"
            }
        ],
        "teachers": [
            {
                "username": "prof.sharma@college.edu",
                "password": "teacher123",
                "name": "Dr. Vikram Sharma",
                "note": "HOD & Associate Professor (CSE)"
            },
            {
                "username": "prof.rao@college.edu",
                "password": "teacher123",
                "name": "Prof. Sneha Rao",
                "note": "Assistant Professor (IT)"
            }
        ]
    })
