# Cable Robot WebSocket Server Configuration
# Copy this file to config.py and modify as needed

# WebSocket Server Configuration
WEBSOCKET_HOST = "localhost"
WEBSOCKET_PORT = 8080

# Hardware Configuration
SERIAL_PORT = "COM3"  # Windows: COM3, Linux/Mac: /dev/ttyUSB0 or /dev/ttyACM0
BAUD_RATE = 115200

# Robot Physical Limits
WORKSPACE_LIMITS = {
    "x_min": -2.5,
    "x_max": 2.5,
    "y_min": -2.5,
    "y_max": 2.5,
    "z_min": 0.5,
    "z_max": 4.5
}

# Update Rates
POSITION_UPDATE_RATE = 10  # Hz
STATUS_UPDATE_RATE = 1     # Hz

# Hardware Communication Protocol
# Modify these according to your hardware's command format
HARDWARE_COMMANDS = {
    "move": "MOVE:{x:.3f},{y:.3f},{z:.3f}",
    "activate": "ACTIVATE",
    "deactivate": "DEACTIVATE", 
    "emergency_stop": "EMERGENCY_STOP",
    "home": "HOME",
    "calibrate": "CALIBRATE",
    "get_position": "GET_POS"
}

# Hardware Response Parsing
# Expected response formats from your hardware
HARDWARE_RESPONSES = {
    "position": "POS:",      # Example: "POS:1.5,2.0,3.0"
    "status": "STATUS:",     # Example: "STATUS:ACTIVE"
    "calibrated": "CALIBRATED",
    "error": "ERROR:"
}

# Logging Configuration
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR
LOG_FILE = "robot_server.log"
