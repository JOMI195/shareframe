import logging
from pathlib import Path

from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
env_serial_path = parent_dir / ".env.serial-number"

load_dotenv(current_dir / ".env")
load_dotenv(env_serial_path, override=True)

from display.display import clear_display
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import subprocess
import os
import secrets
import requests


from dashboard.authentication import login_required
from service.service import ServiceManager
from common.http_auth import HTTPAuth
from config import settings
from config.logger import setup_logging

setup_logging(log_file_path=settings.DASHBOARD_LOGGING_FULL_FILE_PATH)
logger = logging.getLogger(__name__)

service_manager = ServiceManager(settings.SERVICE_NAME)

app = Flask(__name__, static_folder="dashboard/frontend", static_url_path="")
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
CORS(app, supports_credentials=True)

# Set a secret key for session management
app.secret_key = secrets.token_hex(16)

# Define the protected network name
PROTECTED_NETWORK = "preconfigured"
PROTECTED_NETWORK_ALIAS = "VOREINGESTELLT"


# Serve React frontend
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


# --------------------- API Routes -------------------------
# -------- AUTHENTICATION
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json()
    otp = data.get("otp")

    if not otp:
        logger.error(f"Authentication failed with no OTP provided")
        return (
            jsonify({"success": False, "message": "Authentication OTP is required."}),
            400,
        )

    logger.info(f"Authentication attempt with OTP: {otp}")

    headers = HTTPAuth.get_http_auth_headers()

    logger.info(f"Verifying OTP with server")
    try:
        response = requests.post(
            settings.DASHBOARD_HTTP_VERIFY_OTP_URL,
            headers=headers,
            json={"otp": otp},
            timeout=600,
        )

        if response.status_code == 200 and response.json().get("valid"):
            logger.info(f"Authentication successful")
            session["logged_in"] = True
            return jsonify({"success": True, "message": "Login erfolgreich"})
        else:
            logger.info(f"Authentication failed with denied OTP")
            return jsonify({"success": False, "message": "Ungültiges OTP"}), 401

    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        return (
            jsonify({"success": False, "message": f"Authentifizierung fehlgeschlagen"}),
            500,
        )

    # data = request.get_json()
    # otp = data.get("password")

    # if not otp:
    #     return jsonify({"success": False, "message": "Password is required"}), 400

    # # Local password verification instead of external server
    # if otp == TEST_PASSWORD:
    #     session["logged_in"] = True
    #     return jsonify({"success": True, "message": "Login successful"})
    # else:
    #     return jsonify({"success": False, "message": "Invalid password"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    logger.info(f"Logged out")
    session.pop("logged_in", None)
    return jsonify({"success": True, "message": "Logged out successfully"})


@app.route("/api/auth/check-auth", methods=["GET"])
def auth_check_auth():
    logger.info(f"Verifying frontend user is authenticated")
    if session.get("logged_in"):
        return jsonify({"authenticated": True})
    return jsonify({"authenticated": False})


# -------- WIFI


@app.route("/api/connection/current-connection", methods=["GET"])
@login_required
def connection_current_connection():

    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "NAME,DEVICE", "connection", "show", "--active"],
            capture_output=True,
            text=True,
            check=True,
        )
        connections = result.stdout.strip().split("\n")
        current = "Zu keinem Netzwerk verbunden"

        for conn in connections:
            if "wlan0" in conn:
                current = conn.split(":")[0]
                if current == PROTECTED_NETWORK:
                    current = PROTECTED_NETWORK_ALIAS
                break

        return jsonify({"success": True, "connection": current})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/connection/saved-networks", methods=["GET"])
@login_required
def connectionsaved_networks():

    try:
        # Get a list of all saved connections with their types and names
        result = subprocess.run(
            ["nmcli", "-t", "-f", "TYPE,NAME", "connection", "show"],
            capture_output=True,
            text=True,
            check=True,
        )
        connections = result.stdout.strip().split("\n")
        wifi_connections = []

        for conn in connections:
            # Split each line into TYPE and NAME
            conn_type, conn_name = conn.split(":")

            # Skip the protected network
            if conn_name == PROTECTED_NETWORK:
                continue

            # Check if this is a Wi-Fi connection (matching '802-11-wireless')
            if conn_type == "802-11-wireless" and conn_name != "preconfigured":
                wifi_connections.append(conn_name)

        return jsonify({"success": True, "networks": wifi_connections})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/connection/connect", methods=["POST"])
@login_required
def connection_connect():

    data = request.get_json()
    ssid = data.get("ssid")
    password = data.get("password")

    # Prevent modifying the protected network
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

    if not ssid or not password:
        return (
            jsonify({"success": False, "message": "SSID and password are required"}),
            400,
        )

    escaped_ssid = re.sub(r'([\\"])', r"\\\1", ssid)

    # Attempt to add the connection permanently
    try:
        # Add the connection permanently using nmcli connection add
        subprocess.run(
            [
                "sudo",
                "nmcli",
                "connection",
                "add",
                "type",
                "wifi",
                "con-name",
                ssid,
                "ifname",
                "wlan0",
                "ssid",
                escaped_ssid,
                "wifi-sec.key-mgmt",
                "wpa-psk",
                "wifi-sec.psk",
                password,
            ],
            check=True,
        )
        return jsonify(
            {
                "success": True,
                "message": f"Erfolgreich {ssid} hinzugefügt",
            }
        )
    except subprocess.CalledProcessError as e:
        return (
            jsonify(
                {"success": False, "message": f"Failed to add connection: {str(e)}"}
            ),
            500,
        )


@app.route("/api/connection/forget", methods=["POST"])
@login_required
def connection_forget():

    data = request.get_json()
    ssid = data.get("ssid")

    # Prevent deleting the protected network
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

    if not ssid:
        return jsonify({"success": False, "message": "SSID is required"}), 400

    try:
        # Delete the connection
        subprocess.run(["sudo", "nmcli", "connection", "delete", ssid], check=True)
        return jsonify(
            {
                "success": True,
                "message": f"Successfully removed {ssid} from saved networks",
            }
        )
    except subprocess.CalledProcessError as e:
        return (
            jsonify({"success": False, "message": f"Operation failed: {str(e)}"}),
            500,
        )


# -------- FRAME
@app.route("/api/frame/slideshow", methods=["POST"])
@login_required
def frame_slideshow():

    data = request.get_json()
    action = data.get("action")  # Expecting "start" or "stop"

    if not action or action not in ["start", "stop"]:
        return (
            jsonify({"success": False, "message": "Action must be 'start' or 'stop'"}),
            400,
        )

    try:
        if action == "start":
            success = service_manager.start()
        else:
            success = service_manager.stop()

        if success:
            return jsonify(
                {
                    "success": True,
                    "message": f"Slideshow service successfully {action}ed",
                }
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Failed to {action} slideshow service",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error managing slideshow service: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/api/frame/slideshow/is-active", methods=["GET"])
@login_required
def frame_slideshow_is_active():

    try:
        is_active = service_manager.is_active()

        return jsonify({"success": True, "isActive": is_active})

    except Exception as e:
        logger.error(f"Error checking slideshow service status: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@app.route("/api/frame/clear", methods=["POST"])
@login_required
def frame_clear():

    try:
        success = clear_display()

        if success:
            return jsonify(
                {
                    "success": True,
                    "message": f"Bildschirm leeren erfolgreich",
                }
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Bildschirm leeren fehgeschlagen",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error managing slideshow service: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# -------- PI
@app.route("/api/pi/check-connection", methods=["GET"])
def pi_check_connection():
    try:
        subprocess.run(
            ["ping", "-c", "4", "localhost"],
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )

        return jsonify(
            {
                "success": True,
                "connected": True,
                "message": "Pi connection verified successfully",
            }
        )

    except subprocess.CalledProcessError as e:
        logger.error(f"Pi connection check failed: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "connected": False,
                    "message": f"Connection check failed: {str(e)}",
                }
            ),
            500,
        )

    except subprocess.TimeoutExpired:
        logger.error("Pi connection check timed out")
        return (
            jsonify(
                {
                    "success": False,
                    "connected": False,
                    "message": "Connection check timed out",
                }
            ),
            500,
        )

    except Exception as e:
        logger.error(f"Unexpected error in Pi connection check: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "connected": False,
                    "message": f"Unexpected error: {str(e)}",
                }
            ),
            500,
        )
