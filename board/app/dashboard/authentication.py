from functools import wraps
from flask import session, jsonify


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("logged_in"):
            return jsonify({"success": False, "message": "Anmeldung erforderlich"}), 401
        return f(*args, **kwargs)

    return decorated_function
