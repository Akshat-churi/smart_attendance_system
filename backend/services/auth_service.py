import datetime
import jwt
from functools import wraps
from flask import request, jsonify
from config import SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS
from database.db import get_db_connection

def generate_token(user_id, username, role, full_name):
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "full_name": full_name,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user():
    """Extract and verify user from Bearer token in Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        return None

    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, username, role, full_name, email FROM users WHERE id = ?",
        (payload["user_id"],)
    ).fetchone()
    conn.close()
    if not user:
        return None
    return dict(user)

def auth_required(roles=None):
    """
    Decorator for authentication and optional role-based authorization.
    Usage:
        @auth_required()
        def my_view(current_user): ...

        @auth_required(roles=["student"])
        def student_view(current_user): ...
    """
    if isinstance(roles, str):
        roles = [roles]

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({
                    "success": False,
                    "error": "Authentication token is missing, invalid, or expired."
                }), 401

            if roles and user["role"] not in roles:
                return jsonify({
                    "success": False,
                    "error": f"Access denied. Requires role: {', '.join(roles)}."
                }), 403

            return f(user, *args, **kwargs)
        return decorated
    return decorator

# Convenience shortcuts
def token_required(f):
    return auth_required()(f)
