# Hardware Integration Examples
# Different configuration examples for various hardware setups

import time

# ==============================================================================
# EXAMPLE 1: Arduino Uno with CNC Shield
# ==============================================================================
ARDUINO_UNO_CONFIG = {
    'type': 'arduino',
    'port': 'COM3',  # Adjust for your system (Linux: /dev/ttyUSB0, Mac: /dev/cu.usbmodem...)
    'baudrate': 115200,
    'timeout': 1.0,
    
    # Motor configuration
    'motors': {
        'x_axis': {'step_pin': 2, 'dir_pin': 3, 'enable_pin': 8},
        'y_axis': {'step_pin': 4, 'dir_pin': 5, 'enable_pin': 8},
        'z_axis': {'step_pin': 6, 'dir_pin': 7, 'enable_pin': 8},
    },
    
    # Workspace limits (in meters)
    'workspace': {
        'x_min': -2.5, 'x_max': 2.5,
        'y_min': -2.5, 'y_max': 2.5,
        'z_min': 0.5, 'z_max': 4.5
    },
    
    # Communication protocol
    'commands': {
        'move': 'MOVE:{x:.3f},{y:.3f},{z:.3f}',
        'activate': 'ACTIVATE',
        'deactivate': 'DEACTIVATE',
        'home': 'HOME',
        'emergency_stop': 'EMERGENCY_STOP',
        'calibrate': 'CALIBRATE',
        'get_position': 'GET_POS',
        'reset_emergency': 'RESET_EMERGENCY'
    }
}

# ==============================================================================
# EXAMPLE 2: ESP32 with WiFi Communication
# ==============================================================================
ESP32_WIFI_CONFIG = {
    'type': 'esp32_wifi',
    'ip_address': '192.168.1.100',
    'port': 8080,
    'timeout': 2.0,
    
    # WiFi credentials (configure in ESP32)
    'wifi': {
        'ssid': 'YourWiFiNetwork',
        'password': 'YourWiFiPassword'
    },
    
    # Motor configuration
    'motors': {
        'x_axis': {'step_pin': 16, 'dir_pin': 17, 'enable_pin': 18},
        'y_axis': {'step_pin': 19, 'dir_pin': 21, 'enable_pin': 18},
        'z_axis': {'step_pin': 22, 'dir_pin': 23, 'enable_pin': 18},
    },
    
    # Enhanced workspace for larger robot
    'workspace': {
        'x_min': -5.0, 'x_max': 5.0,
        'y_min': -5.0, 'y_max': 5.0,
        'z_min': 0.5, 'z_max': 8.0
    },
    
    # HTTP-based commands for WiFi
    'commands': {
        'move': 'POST /move {{"x":{x:.3f},"y":{y:.3f},"z":{z:.3f}}}',
        'activate': 'POST /activate',
        'deactivate': 'POST /deactivate',
        'home': 'POST /home',
        'emergency_stop': 'POST /emergency',
        'status': 'GET /status'
    }
}

# ==============================================================================
# EXAMPLE 3: Raspberry Pi with GPIO Control
# ==============================================================================
RASPBERRY_PI_CONFIG = {
    'type': 'raspberry_pi',
    'connection': 'gpio',
    
    # Direct GPIO pin control
    'motors': {
        'x_axis': {'step_pin': 18, 'dir_pin': 19, 'enable_pin': 20},
        'y_axis': {'step_pin': 21, 'dir_pin': 22, 'enable_pin': 23},
        'z_axis': {'step_pin': 24, 'dir_pin': 25, 'enable_pin': 26},
    },
    
    # Sensor pins
    'sensors': {
        'emergency_stop': 27,
        'limit_switch_x': 28,
        'limit_switch_y': 29,
        'limit_switch_z': 30
    },
    
    # Motor timing (microseconds)
    'timing': {
        'step_pulse_width': 1,
        'step_interval': 100,
        'direction_setup_time': 1
    },
    
    'workspace': {
        'x_min': -3.0, 'x_max': 3.0,
        'y_min': -3.0, 'y_max': 3.0,
        'z_min': 0.5, 'z_max': 6.0
    }
}

# ==============================================================================
# EXAMPLE 4: GRBL Controller (CNC-style)
# ==============================================================================
GRBL_CONFIG = {
    'type': 'grbl',
    'port': 'COM4',
    'baudrate': 115200,
    'timeout': 1.0,
    
    # GRBL-specific settings
    'grbl_settings': {
        '$0': '10',    # Step pulse time (microseconds)
        '$1': '25',    # Step idle delay (milliseconds)
        '$2': '0',     # Step pulse invert mask
        '$3': '0',     # Direction port invert mask
        '$4': '0',     # Step enable invert (boolean)
        '$5': '0',     # Limit pins invert (boolean)
        '$100': '80',  # X-axis steps per mm
        '$101': '80',  # Y-axis steps per mm
        '$102': '80',  # Z-axis steps per mm
        '$110': '1000', # X-axis maximum rate (mm/min)
        '$111': '1000', # Y-axis maximum rate (mm/min)
        '$112': '500',  # Z-axis maximum rate (mm/min)
    },
    
    'workspace': {
        'x_min': -2.0, 'x_max': 2.0,
        'y_min': -2.0, 'y_max': 2.0,
        'z_min': 0.5, 'z_max': 4.0
    },
    
    # GRBL G-code commands
    'commands': {
        'move': 'G1 X{x:.3f} Y{y:.3f} Z{z:.3f} F1000',
        'rapid_move': 'G0 X{x:.3f} Y{y:.3f} Z{z:.3f}',
        'home': 'G28',
        'reset': '\x18',  # Ctrl-X soft reset
        'emergency_stop': '!',  # Feed hold
        'resume': '~',
        'get_position': '?'
    }
}

# ==============================================================================
# Usage Example in websocket_server.py
# ==============================================================================
"""
To use these configurations, modify your websocket_server.py:

1. Import the configuration:
   from hardware_configs import ARDUINO_UNO_CONFIG

2. Update the config in websocket_server.py:
   config = ARDUINO_UNO_CONFIG

3. Or create a config selector:
   def select_hardware_config(hardware_type):
       configs = {
           'arduino_uno': ARDUINO_UNO_CONFIG,
           'esp32_wifi': ESP32_WIFI_CONFIG,
           'raspberry_pi': RASPBERRY_PI_CONFIG,
           'grbl': GRBL_CONFIG
       }
       return configs.get(hardware_type, ARDUINO_UNO_CONFIG)

4. Command line usage:
   python websocket_server.py --hardware arduino_uno
   python websocket_server.py --hardware esp32_wifi
"""

# ==============================================================================
# Hardware-Specific Connection Classes
# ==============================================================================

class ArduinoController:
    """Direct serial communication with Arduino"""
    def __init__(self, config):
        self.config = config
        self.serial = None
    
    def connect(self):
        import serial
        self.serial = serial.Serial(
            port=self.config['port'],
            baudrate=self.config['baudrate'],
            timeout=self.config['timeout']
        )
        return self.serial.is_open
    
    def send_command(self, command):
        if self.serial and self.serial.is_open:
            self.serial.write((command + '\n').encode())
            return self.serial.readline().decode().strip()
        return None

class ESP32WiFiController:
    """HTTP communication with ESP32 over WiFi"""
    def __init__(self, config):
        self.config = config
        self.base_url = f"http://{config['ip_address']}:{config['port']}"
    
    def connect(self):
        import requests
        try:
            response = requests.get(f"{self.base_url}/status", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def send_command(self, endpoint, data=None):
        import requests
        try:
            if data:
                response = requests.post(f"{self.base_url}{endpoint}", json=data)
            else:
                response = requests.get(f"{self.base_url}{endpoint}")
            return response.json()
        except:
            return None

class GRBLController:
    """GRBL-compatible G-code controller"""
    def __init__(self, config):
        self.config = config
        self.serial = None
    
    def connect(self):
        import serial
        self.serial = serial.Serial(
            port=self.config['port'],
            baudrate=self.config['baudrate'],
            timeout=self.config['timeout']
        )
        # Wait for GRBL initialization
        time.sleep(2)
        self.serial.flushInput()
        return True
    
    def send_gcode(self, gcode):
        if self.serial and self.serial.is_open:
            self.serial.write((gcode + '\n').encode())
            return self.serial.readline().decode().strip()
        return None
