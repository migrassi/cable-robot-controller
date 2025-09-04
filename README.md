El presente software fue desarrollado completamente en la Universidad Nacional de Tres de Febrero en el marco del proyecto de Investigación "Desarrollo de un robot de 3+ GDL, suspendido por cables, para aplicaciones artísticas", código SIGEVA 80120240200030TF, Disciplina OCDE Humanidades y artes, dirigido por el Dr. Miguel Grassi.

# Cable Robot Controller - Sistema de Control Avanzado

Un sistema de control completo y robusto para robots suspendidos por cables, con visualización 3D en tiempo real, comunicación hardware bidireccional y capacidades tanto de simulación como de control físico real.

## Descripción General

El Cable Robot Controller es una plataforma integral que combina una interfaz web moderna con un sistema de comunicación hardware robusto para el control de robots por cables (cable-driven parallel robots). El sistema ofrece tanto capacidades de simulación avanzada como control de hardware real, proporcionando una solución completa para investigación, desarrollo y operación de robots por cables.

### **Características Principales**

#### **Visualización y Simulación 3D**
- **Motor 3D avanzado** basado en Three.js r128 con renderizado WebGL
- **Simulación física realista** del comportamiento del robot por cables
- **Visualización del espacio de trabajo** con límites configurables
- **Representación 3D del robot** con estructura triangular de motores
- **Sistema de coordenadas Y-up** estándar para aplicaciones industriales
- **Cámara orbital interactiva** con controles intuitivos de zoom y rotación
- **Superposición de coordenadas** en tiempo real para referencia espacial

#### **Interfaz de Usuario Avanzada**
- **Diseño responsivo** optimizado para escritorio, tablet y móvil
- **Controles duales**: modo simulación y modo hardware con alternancia fluida
- **Panel de control unificado** con botones de movimiento direccional
- **Sistema de seguridad integrado** con parada de emergencia prominente
- **Indicadores de estado** en tiempo real del sistema y comunicación
- **Integración de webcam** para monitoreo visual del workspace físico
- **Controles de velocidad** ajustables para diferentes modos de operación

#### **Sistema de Comunicación Hardware**
- **Protocolo WebSocket** bidireccional para comunicación en tiempo real
- **Servidor WebSocket asíncrono** con capacidad multi-cliente
- **Comunicación serial robusta** con manejo de errores y reconexión automática
- **Sistema de comandos estructurado** con validación y confirmación
- **Actualización de posición** en tiempo real desde el hardware
- **Manejo de estados** completo (inactivo, activo, emergencia, error)

#### **Compatibilidad de Hardware Extensa**
- **Arduino Uno/Mega** con CNC Shield y drivers de motor paso a paso
- **ESP32** con comunicación WiFi y control de motores integrado  
- **Raspberry Pi** con control GPIO directo para aplicaciones embebidas
- **Controladores GRBL** compatibles con G-code estándar
- **Sistemas personalizados** mediante configuración flexible

## Arquitectura del Sistema

### **Componentes Frontend**
```
Web Interface (Browser)
├── Three.js 3D Engine
├── WebSocket Client
├── Camera Integration
├── UI Controls
└── Safety Systems
```

### **Componentes Backend**
```
WebSocket Server (Python)
├── Hardware Communication
├── Command Processing  
├── Position Tracking
├── Safety Monitoring
└── Multi-client Support
```

### **Hardware Layer**
```
Physical Robot
├── Stepper Motors (3x)
├── Controller Board
├── Emergency Stop
├── Limit Switches
└── Position Feedback
```

## Estructura del Proyecto

```
cable-robot-controller/
├── index.html                    # Interfaz principal híbrida
├── test-3d.html                  # Vista de prueba 3D standalone
├── CSS/
│   ├── css_style_Version3.css    # Estilos optimizados del sistema
│   └── style.css                 # Estilos base
├── js/
│   ├── three-setup.js            # Motor 3D y visualización
│   ├── js_robot-controller.js    # Lógica de control del robot
│   ├── js_websocket-client.js    # Cliente WebSocket
│   └── js_gui-controls.js        # Controles avanzados
├── hardware/                     # Sistema de comunicación hardware
│   ├── websocket_server.py       # Servidor WebSocket principal
│   ├── arduino_controller.ino    # Firmware para Arduino/ESP32
│   ├── hardware_configs.py       # Configuraciones de hardware
│   ├── test_hardware.py          # Suite de pruebas
│   ├── config_template.py        # Plantilla de configuración
│   ├── requirements.txt          # Dependencias Python
│   └── README.md                 # Documentación de hardware
└── README.md                     # Este archivo
```

## �️ **Tecnologías y Dependencias**

### **Frontend**
- **HTML5/CSS3**: Interfaz moderna y responsiva
- **JavaScript ES6+**: Lógica de aplicación moderna
- **Three.js r128**: Renderizado 3D avanzado con WebGL
- **WebSocket API**: Comunicación bidireccional en tiempo real
- **MediaDevices API**: Integración de webcam

### **Backend**
- **Python 3.8+**: Lenguaje de servidor robusto y flexible
- **websockets 11.0.3**: Servidor WebSocket asíncrono
- **pyserial 3.5**: Comunicación serial confiable
- **asyncio**: Programación asíncrona para alta concurrencia
- **requests**: Cliente HTTP para comunicación con ESP32

### **Hardware**
- **Arduino IDE**: Desarrollo de firmware
- **AccelStepper Library**: Control avanzado de motores paso a paso
- **PlatformIO** (opcional): Desarrollo embebido profesional

## Instalación y Configuración

### **1. Configuración del Entorno Web**

```bash
# Clonar el repositorio
git clone https://github.com/migrassi/cable-robot-controller.git
cd cable-robot-controller

# Servir la aplicación web
python -m http.server 8000
# O usar Live Server en VSCode
```

### **2. Configuración del Sistema Hardware**

```bash
# Navegar al directorio de hardware
cd hardware

# Instalar dependencias Python
pip install -r requirements.txt

# Copiar y configurar
cp config_template.py config.py
# Editar config.py con los parámetros de tu hardware
```

### **3. Configuración del Hardware Físico**

#### **Para Arduino Uno/Mega:**
```cpp
// Subir arduino_controller.ino
// Configurar pines según tu CNC shield
#define MOTOR_X_STEP 2
#define MOTOR_X_DIR  3
// ... más configuración en el archivo .ino
```

#### **Para ESP32 WiFi:**
```cpp
// Configurar credenciales WiFi
const char* ssid = "TuRedWiFi";
const char* password = "TuPassword";
```

### **4. Inicialización del Sistema**

```bash
# Terminal 1: Iniciar servidor hardware
cd hardware
python websocket_server.py

# Terminal 2: Probar comunicación
python test_hardware.py

# Terminal 3: Servir interfaz web
python -m http.server 8000
```

## Guía de Uso

### **Modo Simulación**
1. Abrir `http://localhost:8000` en el navegador
2. El sistema inicia automáticamente en modo simulación
3. Usar controles de movimiento para mover el robot virtual
4. Observar la visualización 3D en tiempo real

### **Modo Hardware**
1. Conectar y configurar el hardware físico
2. Iniciar el servidor WebSocket: `python websocket_server.py`
3. En la interfaz web, activar "Modo Hardware"
4. Calibrar el sistema usando el botón "Calibrar"
5. Activar el sistema y comenzar operación

### **Controles Principales**

| Control | Función |
|---------|---------|
| **Botones Direccionales** | Movimiento por ejes (±X, ±Y, ±Z) |
| **Home** | Retorno a posición central |
| **Parada de Emergencia** | Detención inmediata de todos los movimientos |
| **Calibrar** | Inicialización del sistema de referencia |
| **Activar/Desactivar** | Control de estado del sistema |
| **Velocidad** | Ajuste de velocidad de movimiento |

## Configuración Avanzada

### **Parámetros del Workspace**
```python
# En config.py
WORKSPACE_LIMITS = {
    'x_min': -2.5, 'x_max': 2.5,    # Metros
    'y_min': -2.5, 'y_max': 2.5,    # Metros  
    'z_min': 0.5,  'z_max': 4.5     # Metros
}
```

### **Configuración de Motores**
```python
# Motor parameters
STEPS_PER_MM = 80        # Pasos por milímetro
MAX_SPEED = 1000         # Pasos por segundo
ACCELERATION = 500       # Pasos por segundo²
```

### **Comunicación Serial**
```python
# Serial settings
SERIAL_CONFIG = {
    'port': 'COM3',          # Windows: COMx, Linux: /dev/ttyUSBx
    'baudrate': 115200,
    'timeout': 1.0
}
```

## Características de Seguridad

### **Sistema de Seguridad Multi-Nivel**
- **Parada de emergencia por hardware**: Botón físico conectado al microcontrolador
- **Parada de emergencia por software**: Botón en la interfaz web con prioridad
- **Límites de workspace**: Validación automática de coordenadas
- **Timeout de comunicación**: Detección de pérdida de conexión
- **Validación de comandos**: Verificación de sintaxis y rangos
- **Estado de sistema**: Monitoreo continuo del estado del hardware

### **Manejo de Errores Robusto**
- **Reconexión automática**: WebSocket y comunicación serial
- **Recuperación de estado**: Restauración automática después de errores
- **Logging detallado**: Registro completo de eventos para diagnóstico
- **Modo degradado**: Operación en simulación cuando hardware no disponible

## Especificaciones Técnicas

### **Rendimiento**
- **Frecuencia de actualización**: 10 Hz posición, 60 Hz visualización
- **Latencia de comunicación**: < 50ms (WebSocket + Serial)
- **Precisión de posicionamiento**: ±0.1mm (dependiente del hardware)
- **Velocidad máxima**: Configurable, típicamente 1000 pasos/segundo

### **Compatibilidad de Navegadores**
- Chrome 90+: Rendimiento óptimo
- Firefox 88+: Completamente compatible  
- Safari 14+: Compatible con limitaciones de WebSocket
- Edge 90+: Rendimiento óptimo

### **Requisitos del Sistema**
- **RAM**: Mínimo 4GB, recomendado 8GB
- **GPU**: Compatible con WebGL (integrada suficiente)
- **Python**: 3.8 o superior
- **Puertos**: USB para comunicación serial

## Hardware Soportado

### **Microcontroladores**
| Plataforma | Comunicación | Pines I/O | Memoria | Estado |
|------------|--------------|-----------|---------|---------|
| **Arduino Uno** | USB Serial | 14 Digital | 32KB Flash | Completo |
| **Arduino Mega** | USB Serial | 54 Digital | 256KB Flash | Completo |
| **ESP32** | WiFi/Bluetooth | 30+ GPIO | 4MB Flash | Completo |
| **Raspberry Pi** | GPIO/USB | 40 GPIO | 1GB+ RAM | Completo |

### **Drivers de Motor**
- **A4988**: Microstepping hasta 1/16
- **DRV8825**: Microstepping hasta 1/32  
- **TMC2208**: Control silencioso con UART
- **TB6600**: Drivers externos de alta corriente

### **Configuraciones Probadas**
1. **Setup Básico**: Arduino Uno + CNC Shield + A4988 + Motores NEMA17
2. **Setup Avanzado**: ESP32 + Drivers TMC2208 + Motores NEMA23  
3. **Setup Profesional**: Raspberry Pi + Drivers TB6600 + Servomotores

## Ventajas del Sistema

### **Flexibilidad y Escalabilidad**
- **Arquitectura modular**: Componentes intercambiables e independientes
- **Múltiples plataformas**: Web, móvil, escritorio a través del navegador
- **Hardware agnóstico**: Soporte para múltiples tipos de controladores
- **Protocolo extensible**: Fácil adición de nuevos comandos y funciones

### **Robustez y Confiabilidad**
- **Manejo de errores completo**: Recuperación automática de fallos
- **Comunicación redundante**: Múltiples canales de comunicación
- **Validación exhaustiva**: Verificación en múltiples capas
- **Modo de operación seguro**: Sistemas de seguridad redundantes

### **Facilidad de Uso**
- **Interfaz intuitiva**: Diseño centrado en el usuario
- **Configuración visual**: Parámetros ajustables en tiempo real
- **Documentación completa**: Guías detalladas y ejemplos
- **Comunidad activa**: Soporte y ejemplos de la comunidad

### **Capacidades Avanzadas**
- **Visualización en tiempo real**: Feedback visual inmediato
- **Control híbrido**: Simulación y hardware en una sola interfaz
- **Monitoreo con cámara**: Integración de video en tiempo real
- **Análisis de rendimiento**: Métricas y logging detallado

## Casos de Uso

### **Investigación y Desarrollo**
- Prototipado rápido de algoritmos de control
- Validación de modelos cinemáticos y dinámicos
- Desarrollo de nuevas configuraciones de robot
- Simulación de escenarios operacionales

### **Educación**
- Enseñanza de robótica paralela y control
- Laboratorios virtuales y remotos
- Demostraciones interactivas
- Proyectos estudiantiles

### **Aplicaciones Industriales**
- Control de grúas y sistemas de manipulación
- Sistemas de posicionamiento de precisión
- Automatización de almacenes
- Aplicaciones de pick-and-place

### **Investigación Académica**
- Validación experimental de algoritmos
- Recolección de datos operacionales
- Desarrollo de nuevas metodologías de control
- Publicación de resultados reproducibles

## � **Desarrollo Futuro**

### **Características Planificadas**
- **Control de trayectorias**: Planificación y ejecución de paths complejos
- **Machine Learning**: Integración de algoritmos de aprendizaje
- **Realidad Aumentada**: Overlays AR para operación
- **APIs REST**: Interfaces de programación para integración

### **Mejoras en Desarrollo**
- **Optimización de rendimiento**: Algoritmos más eficientes
- **Nuevos sensores**: Integración de feedback adicional
- **Protocolos avanzados**: Comunicación más robusta
- **Interface móvil**: App nativa para dispositivos móviles

## 🤝 **Contribución**

El proyecto es open-source y acepta contribuciones de la comunidad:

```bash
# Fork del repositorio
git clone https://github.com/tuusuario/cable-robot-controller.git

# Crear rama de feature
git checkout -b nueva-caracteristica

# Realizar cambios y commit
git commit -am "Añadir nueva característica"

# Push y crear Pull Request
git push origin nueva-caracteristica
```

## 📞 **Soporte y Comunidad**

- **Issues**: Reportar bugs y solicitar features en GitHub
- **Discusiones**: Foro de la comunidad para preguntas
- **Wiki**: Documentación extendida y tutoriales
- **Ejemplos**: Repositorio de configuraciones y casos de uso

## 📄 **Licencia**

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

**Desarrollado con ❤️ para la comunidad de robótica**

*Cable Robot Controller - Donde la simulación encuentra la realidad* 