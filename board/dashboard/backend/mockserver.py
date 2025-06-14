from datetime import datetime, timedelta
from functools import wraps
import logging
import random
import secrets
import time
from flask import Flask, request, jsonify, session
from flask_cors import CORS

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=1)
CORS(app, supports_credentials=True)
app.secret_key = secrets.token_hex(16)
# CORS(
#     app,
#     supports_credentials=True,
#     origins=["http://127.0.0.1:3000"],
#     resources={
#         r"/api/*": {"origins": ["http://127.0.0.1:3000", "http://localhost:3000"]}
#     },
# )

# Mock data and configurations
PROTECTED_NETWORK = "preconfigured"
PROTECTED_NETWORK_ALIAS = "VOREINGESTELLT"
MOCK_SAVED_NETWORKS = ["HomeWiFi", "CafeNet", "OfficeWiFi"]
MOCK_SERIAL_NUMBER = "EB3IB-5EL99-0RAPY-8V7X0-IA84H"
MOCK_VERSION = "1.0.0"

# Simulated service state
service_active = True
mock_interval_seconds = 300  # Default 5 minutes


# -------- DELAY DECORATOR --------
def delayResponse(seconds=2):
    """
    Decorator to add a delay to Flask route handlers.

    Args: seconds (int/float): Number of seconds to delay (default: 2)
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            time.sleep(seconds)
            return f(*args, **kwargs)

        return decorated_function

    return decorator


# -------- AUTHENTICATION
@app.route("/api/auth/login", methods=["POST"])
def mock_auth_login():
    data = request.get_json()
    otp = data.get("otp")

    # Simulate OTP verification
    if not otp:
        return (
            jsonify({"success": False, "message": "Authentication OTP is required."}),
            400,
        )

    # Mock OTP validation (let's say OTP is valid if it's a 6-digit number)
    if len(otp) == 6 and otp.isdigit():
        session["logged_in"] = True
        session.permanent = True
        return jsonify({"success": True, "message": "Login erfolgreich"}), 200
    else:
        return jsonify({"success": False, "message": "Ungültiges OTP"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def mock_auth_logout():
    session.pop("logged_in", None)
    return jsonify({"success": True, "message": "Logged out successfully"})


@app.route("/api/auth/check-auth", methods=["GET"])
def mock_auth_check():
    return jsonify({"authenticated": session.get("logged_in", True)})


# -------- WIFI CONNECTION
@app.route("/api/connection/current-connection", methods=["GET"])
def mock_current_connection():
    # Simulate current network connection
    current = random.choice(
        ["HomeWiFi", PROTECTED_NETWORK_ALIAS, "Zu keinem Netzwerk verbunden"]
    )
    return jsonify({"success": True, "connection": current})


@app.route("/api/connection/saved-networks", methods=["GET"])
def mock_saved_networks():
    return jsonify({"success": True, "networks": MOCK_SAVED_NETWORKS})


@app.route("/api/connection/connect", methods=["POST"])
def mock_connection_connect():
    data = request.get_json()
    ssid = data.get("ssid")
    password = data.get("password")

    if not ssid or not password:
        return (
            jsonify({"success": False, "message": "SSID and password are required"}),
            400,
        )

    if ssid == PROTECTED_NETWORK:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Das Netzwerk '{PROTECTED_NETWORK}' kann nicht verändert werden.",
                }
            ),
            403,
        )

    # Check if network already exists
    if ssid in MOCK_SAVED_NETWORKS:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"A network with the name '{ssid}' already exists. Please choose a different name or forget the existing network first.",
                }
            ),
            409,
        )

    # Simulate successful connection
    MOCK_SAVED_NETWORKS.append(ssid)
    return jsonify({"success": True, "message": f"Erfolgreich {ssid} hinzugefügt"})


@app.route("/api/connection/forget", methods=["POST"])
def mock_connection_forget():
    data = request.get_json()
    ssid = data.get("ssid")

    if not ssid:
        return jsonify({"success": False, "message": "SSID is required"}), 400

    if ssid == PROTECTED_NETWORK:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"The network '{PROTECTED_NETWORK}' cannot be removed.",
                }
            ),
            403,
        )

    if ssid in MOCK_SAVED_NETWORKS:
        MOCK_SAVED_NETWORKS.remove(ssid)
        return jsonify(
            {
                "success": True,
                "message": f"Successfully removed {ssid} from saved networks",
            }
        )
    else:
        return jsonify({"success": False, "message": "Network not found"}), 404


@app.route("/api/connection/rename", methods=["POST"])
def mock_connection_rename():
    data = request.get_json()
    old_name = data.get("oldName")
    new_name = data.get("newName")

    # Validate input parameters
    if not old_name or not new_name:
        return (
            jsonify(
                {"success": False, "message": "Old and new network names are required"}
            ),
            400,
        )

    # Prevent renaming protected networks
    if old_name == PROTECTED_NETWORK:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"The network '{old_name}' cannot be modified.",
                }
            ),
            403,
        )

    # Prevent naming to a protected network name
    if new_name == PROTECTED_NETWORK:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Cannot rename to '{new_name}' as it is a protected network name.",
                }
            ),
            403,
        )

    # Check if new name already exists
    if new_name in MOCK_SAVED_NETWORKS and new_name != old_name:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"A network with the name '{new_name}' already exists. Please choose a different name.",
                }
            ),
            409,
        )

    # Check if old name exists
    if old_name not in MOCK_SAVED_NETWORKS:
        return jsonify({"success": False, "message": "Network not found"}), 404

    # Perform rename
    index = MOCK_SAVED_NETWORKS.index(old_name)
    MOCK_SAVED_NETWORKS[index] = new_name

    return jsonify(
        {
            "success": True,
            "message": f"Successfully renamed network from '{old_name}' to '{new_name}'",
        }
    )


# -------- FRAME SLIDESHOW
@app.route("/api/frame/slideshow", methods=["POST"])
def mock_frame_slideshow():
    global service_active
    data = request.get_json()
    action = data.get("action")

    if not action or action not in ["start", "stop"]:
        return (
            jsonify({"success": False, "message": "Action must be 'start' or 'stop'"}),
            400,
        )

    service_active = action == "start"
    return jsonify(
        {"success": True, "message": f"Slideshow service successfully {action}ed"}
    )


@app.route("/api/frame/slideshow/is-active", methods=["GET"])
def mock_slideshow_is_active():
    return jsonify({"success": True, "isActive": service_active})


@app.route("/api/frame/clear", methods=["POST"])
def mock_frame_clear():
    return jsonify({"success": True, "message": "Bildschirm leeren erfolgreich"})


@app.route("/api/frame/slideshow/skip-slideshow-image", methods=["POST"])
def mock_skip_slideshow_image():
    return jsonify(
        {
            "success": True,
            "message": "Successfully skipped image in slideshow",
        }
    )


@app.route("/api/frame/slideshow/display-images-loop-interval", methods=["POST"])
def mock_update_display_images_loop_interval():
    global mock_interval_seconds

    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400

        interval_seconds = data.get("interval_seconds")

        if interval_seconds is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "interval_seconds parameter is required",
                    }
                ),
                400,
            )

        # Validate interval
        try:
            interval_seconds = int(interval_seconds)
            if interval_seconds <= 0:
                raise ValueError("Interval must be positive")
        except (ValueError, TypeError):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "interval_seconds must be a positive integer",
                    }
                ),
                400,
            )

        # Set reasonable bounds
        if interval_seconds < 300:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Interval must be at least 300 seconds (5 mins)",
                    }
                ),
                400,
            )

        if interval_seconds > 86400:  # 24 hours
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Interval cannot exceed 24 hours (86400 seconds)",
                    }
                ),
                400,
            )

        # Update the mock interval
        mock_interval_seconds = interval_seconds

        return jsonify(
            {
                "success": True,
                "message": f"Successfully updated slideshow interval to {interval_seconds} seconds",
                "interval_seconds": interval_seconds,
            }
        )

    except Exception as e:
        return (
            jsonify(
                {"success": False, "message": f"Unexpected error occurred: {str(e)}"}
            ),
            500,
        )


@app.route("/api/frame/slideshow/display-images-loop-interval", methods=["GET"])
def mock_get_display_images_loop_interval():
    return jsonify(
        {
            "success": True,
            "interval_seconds": mock_interval_seconds,
            "message": f"Current interval is {mock_interval_seconds} seconds",
        }
    )


# -------- FRAME INFOS
@app.route("/api/frame/infos", methods=["GET"])
def mock_frame_infos():
    return jsonify(
        {
            "success": True,
            "message": "Allgemeine Geräteinformationen erfolgreich abgerufen",
            "data": {
                "public_serial_number": MOCK_SERIAL_NUMBER,
                "version": MOCK_VERSION,
            },
        }
    )


# -------- FRAME UPDATES
@app.route("/api/frame/updates/latest", methods=["GET"])
@delayResponse(3)
def mock_frame_updates_latest():
    return jsonify(
        {
            "success": True,
            "message": "Allgemeine Geräteinformationen erfolgreich abgerufen",
            "data": {
                "version": "1.0.1",
                "download_url": "http://example.com/download",
                "checksum": "abcdef1234567890",
                "release_notes": "Bug fixes and performance improvements",
                "release_date": "2025-03-29T12:00:00Z",
                "criticality": "PATCH",
            },
        }
    )


@app.route("/api/frame/updates/perform-update", methods=["POST"])
def mock_frame_updates_perform_update():
    try:
        success = True

        if success:
            return jsonify(
                {
                    "success": True,
                    "message": "Updateprozess gestartet",
                }
            )
        return jsonify(
            {
                "success": False,
                "message": "Starten des Updateprozesses fehlgeschlagen",
            }
        )

    except Exception as e:
        logger.error(f"Starten des Updateprozesses fehlgeschlagen: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Starten des Updateprozesses fehlgeschlagen: {str(e)}",
                }
            ),
            500,
        )


# -------- PI MANAGEMENT
@app.route("/api/pi/check-connection", methods=["GET"])
def mock_pi_check_connection():
    return jsonify(
        {
            "success": True,
            "connected": True,
            "message": "Pi connection verified successfully",
        }
    )


@app.route("/api/pi/restart", methods=["POST"])
def mock_pi_restart():
    # Simulate logout on restart
    session.pop("logged_in", None)

    return jsonify(
        {
            "success": True,
            "message": "Restart command sent successfully. The Raspberry Pi is now rebooting.",
        }
    )


@app.route("/api/pi/shutdown", methods=["POST"])
def mock_pi_shutdown():
    # Simulate logout on shutdown
    session.pop("logged_in", None)

    return jsonify(
        {
            "success": True,
            "message": "Shutdown command sent successfully. The Raspberry Pi is now powering off.",
        }
    )


# -------- LOGS
@app.route("/api/logs", methods=["GET"])
def mock_get_service_logs():
    service_name = request.args.get("service_name")
    if not service_name:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Missing service_name parameter",
                }
            ),
            400,
        )

    service_name = service_name.lower()
    valid_services = ["application", "dashboard", "update", "heartbeat"]

    if service_name not in valid_services:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Invalid service type. Valid options are: {', '.join(valid_services)}",
                }
            ),
            400,
        )

    since_timestamp = request.args.get("since_timestamp")
    if not since_timestamp:
        since_timestamp = (datetime.now() - timedelta(hours=24)).isoformat()

    lines_str = request.args.get("lines", "1000")
    try:
        lines = int(lines_str)
        if lines <= 0:
            raise ValueError("Lines must be positive")
        lines = min(lines, 5000)
    except ValueError:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Lines parameter must be a positive integer",
                }
            ),
            400,
        )

    # Generate mock log lines
    now = datetime.now()
    mock_logs = []

    for i in range(min(lines, 50)):  # Generate up to 50 mock log lines
        timestamp = now - timedelta(minutes=i * 5)
        log_level = random.choice(["INFO", "WARNING", "ERROR", "DEBUG"])
        messages = [
            f"Service {service_name} is running normally",
            f"Processing request for {service_name}",
            f"Configuration loaded for {service_name}",
            f"Heartbeat received from {service_name}",
            f"Status check completed for {service_name}",
        ]
        message = random.choice(messages)

        log_line = f"{timestamp.strftime('%b %d %H:%M:%S')} raspberrypi systemd[1]: [{log_level}] {message}"
        mock_logs.append(log_line)

    # Calculate period description
    try:
        since_dt = (
            datetime.fromisoformat(since_timestamp.replace("Z", "+00:00"))
            if "Z" in since_timestamp
            else datetime.fromisoformat(since_timestamp)
        )
        diff = now - since_dt

        if diff.days > 0:
            period = f"Since {since_dt.strftime('%Y-%m-%d %H:%M')} ({diff.days} days, {diff.seconds // 3600} hours ago)"
        elif diff.seconds // 3600 > 0:
            period = f"Since {since_dt.strftime('%Y-%m-%d %H:%M')} ({diff.seconds // 3600} hours, {(diff.seconds % 3600) // 60} minutes ago)"
        else:
            period = f"Since {since_dt.strftime('%Y-%m-%d %H:%M')} ({(diff.seconds % 3600) // 60} minutes ago)"
    except (ValueError, TypeError):
        period = f"Since {since_timestamp}"

    service_name_map = {
        "application": "frame-application.service",
        "dashboard": "frame-dashboard.service",
        "update": "frame-update.service",
        "heartbeat": "frame-heartbeat.service",
    }

    return jsonify(
        {
            "success": True,
            "service": service_name_map.get(service_name, f"{service_name}.service"),
            "period": period,
            "timestamp": datetime.now().isoformat(),
            "log_count": len(mock_logs),
            "logs": mock_logs,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
