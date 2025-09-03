# Cable Robot Controller

Un sistema de control avanzado para robots por cables con visualización 3D en tiempo real, desarrollado con tecnologías web modernas.

## 🚀 Características

- **Visualización 3D en tiempo real** con Three.js
- **Control intuitivo** mediante interfaz web responsiva
- **Comunicación WebSocket** para control en tiempo real
- **Controles avanzados** con DAT.GUI
- **Sistema de seguridad** con parada de emergencia
- **Grabación y reproducción de trayectorias**
- **Controles por teclado** para operación rápida
- **Interfaz responsive** para dispositivos móviles

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Visualización 3D**: Three.js
- **Comunicación**: WebSocket
- **UI Avanzada**: DAT.GUI
- **Control**: Interfaz táctil y teclado

## 📁 Estructura del Proyecto

```
cable-robot-controller/
├── index.html              # Página principal
├── css/
│   └── style.css           # Estilos principales
├── js/
│   ├── three-setup.js      # Configuración de Three.js
│   ├── robot-controller.js # Lógica de control del robot
│   ├── websocket-client.js # Cliente WebSocket
│   └── gui-controls.js     # Controles avanzados
└── README.md               # Documentación
```

## 🚀 Instalación y Uso

### Opción 1: Servidor Local Simple

```bash
# Clonar el repositorio
git clone https://github.com/migrassi/cable-robot-controller.git
cd cable-robot-controller

# Servir con Python (Python 3)
python -m http.server 8000

# O con Node.js (si tienes http-server instalado)
npx http-server -p 8000

# Abrir en el navegador
open http://localhost:8000
```

### Opción 2: Live Server (VSCode)

1. Instalar la extensión "Live Server" en VSCode
2. Hacer clic derecho en `index.html`
3. Seleccionar "Open with Live Server"

## 🎮 Controles

### Controles por Teclado

| Tecla | Acción |
|-------|--------|
| `W` | Mover hacia adelante |
| `S` | Mover hacia atrás |
| `A` | Mover a la izquierda |
| `D` | Mover a la derecha |
| `Q` | Mover hacia arriba |
| `E` | Mover hacia abajo |
| `H` | Ir a posición home |
| `Espacio` | Parada de emergencia |
| `F1` | Mostrar ayuda |
| `F2` | Alternar GUI |
| `F3` | Pantalla completa |
| `Ctrl+R` | Resetear vista |
| `Ctrl+S` | Guardar configuración |

### Controles de Interfaz

- **Botones de movimiento**: Control directo por ejes
- **Sliders**: Control preciso de posición
- **Controles de velocidad**: Ajuste de velocidad en tiempo real
- **Panel de información**: Estado del robot en tiempo real

### Controles Avanzados (DAT.GUI)

- Ajuste de parámetros de movimiento
- Configuración del espacio de trabajo
- Opciones de visualización
- Gestión de configuraciones

## 🔧 Configuración

### Parámetros del Robot

```javascript
// Espacio de trabajo (metros)
workspace: {
    x: { min: -10, max: 10 },
    y: { min: -10, max: 10 },
    z: { min: -2.5, max: 