# Cable Robot WebSocket Server

Este servidor recibe comandos del controlador web y los envía al hardware del robot por cable.

## 🚀 Instalación Rápida

### 1. Instalar Python y dependencias

```bash
# Instalar Python 3.8 o superior
# Instalar dependencias
pip install websockets pyserial

# O usar el archivo requirements
pip install -r requirements.txt
```

### 2. Configurar el servidor

```bash
# Copiar configuración
cp config_template.py config.py

# Editar configuración según tu hardware
nano config.py
```

### 3. Ejecutar el servidor

```bash
python websocket_server.py
```

## ⚙️ Configuración del Hardware

### Conexión Serial

Edita `config.py` para configurar tu puerto serial:

```python
# Windows
SERIAL_PORT = "COM3"

# Linux/Mac
SERIAL_PORT = "/dev/ttyUSB0"  # o /dev/ttyACM0

BAUD_RATE = 115200
```

### Protocolo de Comandos

El servidor envía comandos en este formato al hardware:

```
MOVE:1.500,2.000,3.000    # Mover a posición X,Y,Z
ACTIVATE                  # Activar sistema
DEACTIVATE               # Desactivar sistema
EMERGENCY_STOP           # Parada de emergencia
HOME                     # Ir a posición inicial
CALIBRATE               # Calibrar robot
GET_POS                 # Obtener posición actual
```

### Respuestas del Hardware

El hardware debe responder en este formato:

```
POS:1.500,2.000,3.000    # Posición actual
STATUS:ACTIVE            # Estado del sistema
STATUS:EMERGENCY         # Estado de emergencia
CALIBRATED              # Calibración completada
ERROR:mensaje           # Error ocurrido
```

## 🌐 Protocolo WebSocket

### Mensajes del Cliente Web → Servidor

```json
{
  "id": "msg_123456789_abc",
  "type": "command",
  "command": "move",
  "data": {"x": 1.5, "y": 2.0, "z": 3.0},
  "timestamp": 1693747200000
}
```

### Respuestas del Servidor → Cliente Web

```json
{
  "id": "msg_123456789_abc",
  "success": true,
  "data": {"position": {"x": 1.5, "y": 2.0, "z": 3.0}},
  "error": null
}
```

### Actualizaciones Automáticas

```json
{
  "type": "position_update",
  "data": {"x": 1.5, "y": 2.0, "z": 3.0},
  "timestamp": 1693747200000
}

{
  "type": "status_update", 
  "data": {
    "position": {"x": 1.5, "y": 2.0, "z": 3.0},
    "is_connected": true,
    "is_calibrated": true,
    "emergency_stop": false,
    "system_active": true
  },
  "timestamp": 1693747200000
}
```

## 🔧 Comandos Soportados

| Comando | Descripción | Parámetros |
|---------|-------------|------------|
| `move` | Mover a posición | `x`, `y`, `z` |
| `activate` | Activar sistema | - |
| `deactivate` | Desactivar sistema | - |
| `emergency_stop` | Parada de emergencia | - |
| `home` | Ir a posición inicial | - |
| `calibrate` | Calibrar robot | - |
| `get_status` | Obtener estado | - |

## 🛠️ Integración con Hardware

### Arduino/ESP32

```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    handleCommand(command);
  }
}

void handleCommand(String cmd) {
  if (cmd.startsWith("MOVE:")) {
    // Parsear coordenadas y mover motores
    String coords = cmd.substring(5);
    // ... implementar movimiento
    Serial.println("POS:" + getCurrentPosition());
  }
  else if (cmd == "ACTIVATE") {
    systemActive = true;
    Serial.println("STATUS:ACTIVE");
  }
  // ... otros comandos
}
```

### Raspberry Pi

```python
import serial
import time

ser = serial.Serial('/dev/ttyUSB0', 115200)

def handle_command(command):
    if command.startswith("MOVE:"):
        coords = command[5:].split(',')
        x, y, z = map(float, coords)
        move_robot(x, y, z)
        send_response(f"POS:{x},{y},{z}")
    # ... otros comandos

while True:
    if ser.in_waiting > 0:
        command = ser.readline().decode().strip()
        handle_command(command)
```

## 🔍 Debugging

### Logs del Servidor

```bash
# Ver logs en tiempo real
tail -f robot_server.log

# Nivel de debug
LOG_LEVEL = "DEBUG"  # en config.py
```

### Testing sin Hardware

```python
# En websocket_server.py, cambiar:
class CableRobotController:
    def __init__(self, serial_port=None):  # None = modo simulación
        self.simulation_mode = (serial_port is None)
        # ... resto del código
```

## 📱 Uso con el Controlador Web

1. **Ejecutar servidor**: `python websocket_server.py`
2. **Abrir controlador web**: `index.html`
3. **Hacer click en "SIMULATION MODE"** para conectar al hardware
4. **Estado cambia a "HARDWARE CONNECTED"** si conecta exitosamente

## ⚠️ Solución de Problemas

### Error "Permission denied" en Linux

```bash
sudo usermod -a -G dialout $USER
# Reiniciar sesión
```

### Puerto COM no encontrado en Windows

```bash
# Ver puertos disponibles en Device Manager
# O usar:
python -c "import serial.tools.list_ports; [print(p) for p in serial.tools.list_ports.comports()]"
```

### WebSocket no conecta

```bash
# Verificar firewall
# Windows: Permitir Python en firewall
# Linux: sudo ufw allow 8080
```

## 🔄 Arquitectura del Sistema

```
┌─────────────────┐    WebSocket     ┌─────────────────┐    Serial    ┌─────────────────┐
│   Web Browser   │ ◄─────────────► │ Python Server   │ ◄─────────► │   Hardware      │
│   (Frontend)    │     Port 8080    │ (websocket_     │  115200 bps  │ (Arduino/RPi)   │
│                 │                  │  server.py)     │              │                 │
└─────────────────┘                  └─────────────────┘              └─────────────────┘
```

¡El servidor está listo para recibir comandos del controlador web y enviarlos a tu hardware! 🚀
