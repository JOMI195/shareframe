from datetime import datetime, timedelta
from enum import Enum
import logging
from pathlib import Path
from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
env_serial_path = parent_dir / ".env.secrets"

load_dotenv(current_dir / ".env")
load_dotenv(env_serial_path, override=True)

from display.display import clear_display
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import subprocess
import os
import secrets
import requests
import re

from dashboard.authentication import login_required
from dashboard.middleware import TokenAuthMiddleware
from common.frame_auth_requests import frame_auth_token_request
from service.service import ServiceManager
from common.frame_token import TokenManager
from common.securePayload import SecurePayload
from config import settings
from config.logger import setup_logging

# shareframe.de not ready for ipv6 yet
requests.packages.urllib3.util.connection.HAS_IPV6 = False


class ServiceType(Enum):
    APPLICATION = "application"
    DASHBOARD = "dashboard"
    UPDATE = "update"
    HEARTBEAT = "heartbeat"


setup_logging(log_file_path=settings.DASHBOARD_LOGGING_FULL_FILE_PATH)
logger = logging.getLogger(__name__)

logger.info(f"Setup services")

application_service_manager = ServiceManager(settings.APPLICATION_SERVICE_NAME)
update_service_manager = ServiceManager(settings.UPDATE_SERVICE_NAME)
TokenManager.initialize()

logger.info(f"Startup dashboard app")

app = Flask(__name__, static_folder="dashboard/frontend", static_url_path="")
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)
CORS(app, supports_credentials=True)

# Set a secret key for session management
app.secret_key = secrets.token_hex(16)

# Initialize middleware
TokenAuthMiddleware(app)

# Define the protected network name
PROTECTED_NETWORKS = ["preconfigured", "Jomi"]
PROTECTED_NETWORK_ALIAS = "VOREINGESTELLT"

logger.info(f"Dashboard started")


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

    logger.info(f"Verifying OTP with server")

    INVALID_OTP_RESPONSE = (
        jsonify({"success": False, "message": "Ungültiges OTP"}),
        401,
    )
    try:
        response = frame_auth_token_request(
            url=settings.DASHBOARD_HTTP_VERIFY_OTP_URL,
            method="post",
            json={"otp": otp},
            timeout=600,
        )

        if response.status_code != 200:
            logger.info("Authentication failed with denied OTP")
            return INVALID_OTP_RESPONSE

        response_data = response.json()

        logger.info(f"server otp verify secure payload response: {response_data}")

        secure_payload = response_data.get("secure_payload")

        if not secure_payload:
            logger.info("No secure payload received")
            return INVALID_OTP_RESPONSE

        payload = SecurePayload.decrypt(
            payload=secure_payload, secret=settings.FRAME_AUTH_SECRET_KEY
        )

        logger.info(f"server otp verify decrypted payload: {payload}")

        if not payload.get("valid", False):
            logger.info("Invalid payload")
            return INVALID_OTP_RESPONSE

        logger.info("Authentication successful")
        session["logged_in"] = True
        return jsonify({"success": True, "message": "Login erfolgreich"}), 200

    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        return (
            jsonify({"success": False, "message": "Authentifizierung fehlgeschlagen"}),
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
    logger.info(f"Verifying if frontend user is authenticated")
    if session.get("logged_in"):
        logger.info(f"Frontend user is authenticated")
        return jsonify({"authenticated": True})
    logger.warning(f"Frontend user not is authenticated")
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
                if current in PROTECTED_NETWORKS:
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
            if conn_name in PROTECTED_NETWORKS:
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
    if ssid in PROTECTED_NETWORKS:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Das Netzwerk '{PROTECTED_NETWORKS}' kann nicht verändert werden.",
                }
            ),
            403,
        )

    if not ssid or not password:
        return (
            jsonify({"success": False, "message": "SSID and password are required"}),
            400,
        )

    try:
        # Check if network name already exists
        saved_connections_result = subprocess.run(
            ["nmcli", "-t", "-f", "NAME", "connection", "show"],
            capture_output=True,
            text=True,
            check=True,
        )
        saved_connections = saved_connections_result.stdout.strip().split("\n")

        if ssid in saved_connections:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"A network with the name '{ssid}' already exists. Please choose a different name or forget the existing network first.",
                    }
                ),
                409,  # Conflict status code
            )

        escaped_ssid = re.sub(r'([\\"])', r"\\\1", ssid)

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
    if ssid in PROTECTED_NETWORKS:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"The network '{PROTECTED_NETWORKS}' cannot be removed.",
                }
            ),
            403,
        )

    if not ssid:
        return jsonify({"success": False, "message": "SSID is required"}), 400

    # Check if the network is currently active before deleting
    try:
        result = subprocess.run(
            ["nmcli", "-t", "-f", "NAME,DEVICE", "connection", "show", "--active"],
            capture_output=True,
            text=True,
            check=True,
        )
        active_connections = result.stdout.strip().split("\n")

        for conn in active_connections:
            if "wlan0" in conn:
                active_network = conn.split(":")[0]
                if active_network == ssid:
                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": f"Cannot remove the currently connected network. Please connect to another network first.",
                            }
                        ),
                        403,
                    )
                break

        # Delete the connection if it's not active
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


@app.route("/api/connection/rename", methods=["POST"])
@login_required
def connection_rename():
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
    if old_name in PROTECTED_NETWORKS:
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
    if new_name in PROTECTED_NETWORKS:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Cannot rename to '{new_name}' as it is a protected network name.",
                }
            ),
            403,
        )

    try:
        # Check if new name already exists among saved connections
        saved_connections_result = subprocess.run(
            ["nmcli", "-t", "-f", "NAME", "connection", "show"],
            capture_output=True,
            text=True,
            check=True,
        )
        saved_connections = saved_connections_result.stdout.strip().split("\n")

        # If new name already exists (and it's not the one we're renaming)
        if new_name in saved_connections and new_name != old_name:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"A network with the name '{new_name}' already exists. Please choose a different name.",
                    }
                ),
                409,  # Conflict status code
            )

        # Use nmcli to modify the connection name
        subprocess.run(
            [
                "sudo",
                "nmcli",
                "connection",
                "modify",
                old_name,
                "connection.id",
                new_name,
            ],
            check=True,
        )

        return jsonify(
            {
                "success": True,
                "message": f"Successfully renamed network from '{old_name}' to '{new_name}'",
            }
        )
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to rename network: {str(e)}")
        return (
            jsonify(
                {"success": False, "message": f"Failed to rename network: {str(e)}"}
            ),
            500,
        )


# -------- FRAME SLIDESHOW
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
            success = application_service_manager.start()
        else:
            success = application_service_manager.stop()

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
        is_active = application_service_manager.is_active()

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


@app.route("/api/frame/slideshow/skip-slideshow-image", methods=["POST"])
@login_required
def frame_slideshow_skip_slideshow_image():

    try:
        subprocess.run(
            [
                "sudo",
                "systemctl",
                "kill",
                "-s",
                "SIGUSR1",
                settings.APPLICATION_SERVICE_NAME,
            ],
            check=True,
        )
        return jsonify(
            {
                "success": True,
                "message": f"Successfully skipped image in slideshow",
            }
        )
    except subprocess.CalledProcessError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Skipping the image in slideshow failed: {str(e)}",
                }
            ),
            500,
        )


@app.route("/api/frame/slideshow/display-images-loop-interval", methods=["POST"])
@login_required
def frame_slideshow_update_display_images_loop_interval():
    """
    Update the display images loop interval for the slideshow.

    Expected JSON payload:
    {
        "interval_seconds": 300
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "No JSON data provided"}), 400

        # Extract interval from request
        interval_seconds = data.get("interval_seconds")

        # Validate interval
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

        # Ensure interval is a positive integer
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

        # Set reasonable bounds (e.g., minimum 5 mins (300 seconds), maximum 24 hours)
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

        # Call the update script
        subprocess.run(
            [
                str(settings.DISPLAY_UPDATE_IMAGES_LOOP_INTERVAL_FILE_PATH),
                str(interval_seconds),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        return jsonify(
            {
                "success": True,
                "message": f"Successfully updated slideshow interval to {interval_seconds} seconds",
                "interval_seconds": interval_seconds,
            }
        )

    except subprocess.CalledProcessError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"Failed to update slideshow interval: {str(e)}",
                    "stderr": e.stderr if hasattr(e, "stderr") else None,
                }
            ),
            500,
        )

    except Exception as e:
        return (
            jsonify(
                {"success": False, "message": f"Unexpected error occurred: {str(e)}"}
            ),
            500,
        )


@app.route("/api/frame/slideshow/display-images-loop-interval", methods=["GET"])
@login_required
def frame_slideshow_get_display_images_loop_interval():
    """
    Get the current display images loop interval from the control file.
    """
    try:
        import json

        display_images_loop_interval_file = (
            settings.DISPLAY_IMAGES_LOOP_INTERVAL_FILE_PATH
        )

        if not display_images_loop_interval_file.exists():
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Display images loop interval file not found",
                    }
                ),
                404,
            )

        with open(display_images_loop_interval_file, "r") as f:
            control_data = json.load(f)

        interval_seconds = control_data.get("interval_secs")

        if interval_seconds is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No interval found in display images loop interval file",
                    }
                ),
                404,
            )

        return jsonify(
            {
                "success": True,
                "interval_seconds": interval_seconds,
                "message": f"Current interval is {interval_seconds} seconds",
            }
        )

    except json.JSONDecodeError:
        return (
            jsonify({"success": False, "message": "Invalid JSON in control file"}),
            500,
        )

    except Exception as e:
        return (
            jsonify({"success": False, "message": f"Error reading interval: {str(e)}"}),
            500,
        )


# -------- FRAME INFOS
@app.route("/api/frame/infos", methods=["GET"])
@login_required
def frame_infos():
    try:
        return jsonify(
            {
                "success": True,
                "message": "Allgemeine Geräteinformationen erfolgreich abgerufen",
                "data": {
                    "public_serial_number": settings.PUBLIC_SERIAL_NUMBER,
                    "version": settings.VERSION,
                },
            }
        )

    except Exception as e:
        logger.error(f"Error checking slideshow service status: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# -------- FRAME UPDATES
@app.route("/api/frame/updates/latest", methods=["GET"])
@login_required
def frame_updates_latest():
    logger.info(f"Getting latest updates")

    ERROR_RESPONSE = (
        jsonify(
            {"success": False, "message": "Laden des neusten Updates fehlgeschlagen"}
        ),
        500,
    )
    try:
        response = frame_auth_token_request(
            url=settings.HTTP_UPDATE_LATEST_URL,
            timeout=600,
        )

        if response.status_code != 200:
            logger.info("Server update request failed")
            return ERROR_RESPONSE

        return jsonify(
            {
                "success": True,
                "message": "Allgemeine Geräteinformationen erfolgreich abgerufen",
                "data": response.json(),
            }
        )

    except Exception as e:
        logger.error(f"Server update request failed failed: {e}")
        return ERROR_RESPONSE


@app.route("/api/frame/updates/perform-update", methods=["POST"])
@login_required
def frame_updates_perform_update():
    try:
        success = update_service_manager.start()

        if success:
            return jsonify(
                {
                    "success": True,
                    "message": f"Updateprozess gestartet",
                }
            )
        return jsonify(
            {
                "success": True,
                "message": f"Starten des Updateprozesses fehlgeschlagen",
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


@app.route("/api/pi/restart", methods=["POST"])
@login_required
def pi_restart():
    try:
        result = subprocess.run(
            ["sudo", "systemctl", "reboot"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )

        if result.returncode == 0:
            session.pop("logged_in", None)

            return jsonify(
                {
                    "success": True,
                    "message": "Restart command sent successfully. The Raspberry Pi is now rebooting.",
                }
            )
        else:
            logger.error(
                f"Restart command failed with return code {result.returncode}. Output: {result.stderr}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Failed to restart. Error: {result.stderr}",
                    }
                ),
                500,
            )

    except subprocess.TimeoutExpired:
        logger.error("Pi restart command timed out")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "The restart command timed out. The Raspberry Pi may be unresponsive or experiencing connectivity issues.",
                }
            ),
            500,
        )

    except Exception as e:
        logger.error(f"Unexpected error in Pi restart: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"An unexpected error occurred while attempting to restart the Raspberry Pi: {str(e)}",
                }
            ),
            500,
        )


@app.route("/api/pi/shutdown", methods=["POST"])
@login_required
def pi_shutdown():
    try:
        result = subprocess.run(
            ["sudo", "shutdown"], capture_output=True, text=True, timeout=5, check=False
        )

        if result.returncode == 0:
            session.pop("logged_in", None)

            return jsonify(
                {
                    "success": True,
                    "message": "Shutdown command sent successfully. The Raspberry Pi is now powering off.",
                }
            )
        else:
            logger.error(
                f"Shutdown command failed with return code {result.returncode}. Output: {result.stderr}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Failed to shut down. Error: {result.stderr}",
                    }
                ),
                500,
            )

    except subprocess.TimeoutExpired:
        logger.error("Pi shutdown command timed out")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "The shutdown command timed out. The Raspberry Pi may be unresponsive or experiencing connectivity issues.",
                }
            ),
            500,
        )

    except Exception as e:
        logger.error(f"Unexpected error in Pi shutdown: {str(e)}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": f"An unexpected error occurred while attempting to shut down the Raspberry Pi: {str(e)}",
                }
            ),
            500,
        )


@app.route("/api/logs", methods=["GET"])
@login_required
def get_service_logs():
    try:
        service_type = request.args.get("service_name")
        if not service_type:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Missing service_name parameter",
                    }
                ),
                400,
            )

        service_type = service_type.lower()

        try:
            service = ServiceType(service_type)
        except ValueError:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Invalid service type. Valid options are: {', '.join([s.value for s in ServiceType])}",
                    }
                ),
                400,
            )

        service_name_map = {
            ServiceType.APPLICATION: settings.APPLICATION_SERVICE_NAME,
            ServiceType.DASHBOARD: settings.DASHBOARD_SERVICE_NAME,
            ServiceType.UPDATE: settings.UPDATE_SERVICE_NAME,
            ServiceType.HEARTBEAT: settings.HEARTBEAT_SERVICE_NAME,
        }

        service_name = service_name_map[service]

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

        cmd = [
            "sudo",
            "journalctl",
            "-u",
            service_name,
            "--since",
            since_timestamp,
            "--no-pager",
            "-n",
            str(lines),
            "--output=short",
        ]

        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=60, check=False
        )

        if result.returncode == 0:
            log_lines = result.stdout.strip().split("\n")

            if len(log_lines) > lines:
                log_lines = log_lines[-lines:]
                truncation_message = f"Showing only the last {lines} lines of logs"
                log_lines.insert(0, truncation_message)

            try:
                since_dt = (
                    datetime.fromisoformat(since_timestamp.replace("Z", "+00:00"))
                    if "Z" in since_timestamp
                    else datetime.fromisoformat(since_timestamp)
                )
                now = datetime.now()
                diff = now - since_dt

                if diff.days > 0:
                    period = f"Since {since_dt.strftime('%Y-%m-%d %H:%M')} ({diff.days} days, {diff.seconds // 3600} hours ago)"
                elif diff.seconds // 3600 > 0:
                    period = f"Since {since_dt.strftime('%Y-%m-%d %H:%M')} ({diff.seconds // 3600} hours, {(diff.seconds % 3600) // 60} minutes ago)"
                else:
                    period = f"Since {since_dt.strftime('%Y-%m-%d %H:%M')} ({(diff.seconds % 3600) // 60} minutes ago)"
            except (ValueError, TypeError):
                period = f"Since {since_timestamp}"

            return jsonify(
                {
                    "success": True,
                    "service": service_name,
                    "period": period,
                    "timestamp": datetime.now().isoformat(),
                    "log_count": len(log_lines),
                    "logs": log_lines,
                }
            )
        else:
            logger.error(
                f"Log retrieval failed with code {result.returncode}. Error: {result.stderr}"
            )
            return (
                jsonify(
                    {
                        "success": False,
                        "message": f"Failed to retrieve logs. Error: {result.stderr}",
                    }
                ),
                500,
            )

    except subprocess.TimeoutExpired:
        logger.error(f"Log retrieval timed out for service {service_type}")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Log retrieval timed out. Try requesting a more recent timestamp or fewer lines.",
                }
            ),
            500,
        )

    except Exception as e:
        logger.error(f"Unexpected error in log retrieval: {str(e)}")
        return (
            jsonify(
                {"success": False, "message": f"An unexpected error occurred: {str(e)}"}
            ),
            500,
        )
