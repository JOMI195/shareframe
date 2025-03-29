import logging
import random
import secrets
from flask import Flask, request, jsonify, session
from flask_cors import CORS

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
CORS(
    app,
    supports_credentials=True,
    origins=["http://127.0.0.1:3000"],
    resources={
        r"/api/*": {"origins": ["http://127.0.0.1:3000", "http://localhost:3000"]}
    },
)

# Mock data and configurations
PROTECTED_NETWORK = "preconfigured"
PROTECTED_NETWORK_ALIAS = "VOREINGESTELLT"
MOCK_SAVED_NETWORKS = ["HomeWiFi", "CafeNet", "OfficeWiFi"]
MOCK_SERIAL_NUMBER = "EB3IB-5EL99-0RAPY-8V7X0-IA84H"
MOCK_VERSION = "1.0.0"

# Simulated service state
service_active = False


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
        return jsonify({"success": True, "message": "Login erfolgreich"}), 200
    else:
        return jsonify({"success": False, "message": "Ungültiges OTP"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def mock_auth_logout():
    session.pop("logged_in", None)
    return jsonify({"success": True, "message": "Logged out successfully"})


@app.route("/api/auth/check-auth", methods=["GET"])
def mock_auth_check():
    return jsonify({"authenticated": session.get("logged_in", False)})


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


@app.route("/api/frame/infos", methods=["GET"])
def mock_frame_infos():

    return jsonify(
        {
            "success": True,
            "message": "Allgemeine Geräteinformationen erfolgreich abgerufen",
            "data": {
                "public_serial_number": MOCK_SERIAL_NUMBER,
                "version": MOCK_VERSION,
                "display_refresh_interval_mins": 5,
            },
        }
    )


@app.route("/api/frame/updates/latest", methods=["GET"])
def mock_frame_updates_latest():
    return jsonify(
        {
            "success": True,
            "message": "Latest update retrieved successfully",
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


@app.route("/api/pi/check-connection", methods=["GET"])
def mock_pi_check_connection():
    return jsonify(
        {
            "success": True,
            "connected": True,
            "message": "Pi connection verified successfully",
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
