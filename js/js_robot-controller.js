// Robot Controller - Main control logic for cable robot
class RobotController {
    constructor() {
        this.position = { x: 0, y: 0, z: 2.5 };
        this.targetPosition = { x: 0, y: 0, z: 2.5 };
        this.speed = 1.0; // m/s
        this.isMoving = false;
        this.isCalibrated = false;
        this.emergencyStop = false;
        this.visualization = null; // Reference to 3D visualization
        
        // Workspace boundaries (in meters)
        this.workspace = {
            x: { min: -2.5, max: 2.5 },  // Reduced to fit within motor circle
            y: { min: -2.5, max: 2.5 },
            z: { min: 0.5, max: 4.5 }    // Reasonable height range
        };
        
        // Movement constraints
        this.maxSpeed = 5.0; // m/s
        this.acceleration = 2.0; // m/s²
        this.stepSize = 0.1; // meters per step
        
        this.init();
    }

    setVisualization(visualization) {
        this.visualization = visualization;
        // Update visualization with current position
        if (this.visualization) {
            this.visualization.setRobotPosition(this.position.x, this.position.y, this.position.z);
        }
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.startUpdateLoop();
    }

    setupEventListeners() {
        // Movement buttons
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('mousedown', (e) => this.startMovement(e));
            btn.addEventListener('mouseup', () => this.stopMovement());
            btn.addEventListener('mouseleave', () => this.stopMovement());
        });

        // Speed control buttons
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setSpeed(e));
        });

        // Axis sliders
        document.getElementById('xSlider')?.addEventListener('input', (e) => {
            this.moveToPosition(parseFloat(e.target.value), this.position.y, this.position.z);
        });
        
        document.getElementById('ySlider')?.addEventListener('input', (e) => {
            this.moveToPosition(this.position.x, parseFloat(e.target.value), this.position.z);
        });
        
        document.getElementById('zSlider')?.addEventListener('input', (e) => {
            this.moveToPosition(this.position.x, this.position.y, parseFloat(e.target.value));
        });

        // Action buttons
        document.getElementById('homeBtn')?.addEventListener('click', () => this.goHome());
        document.getElementById('calibrateBtn')?.addEventListener('click', () => this.calibrate());
        document.getElementById('emergencyStop')?.addEventListener('click', () => this.triggerEmergencyStop());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.addEventListener('keyup', (e) => this.handleKeyRelease(e));
    }

    startMovement(event) {
        if (this.emergencyStop) return;
        
        const axis = event.target.dataset.axis;
        const direction = parseFloat(event.target.dataset.direction);
        
        this.moveDirection = { axis, direction };
        this.isMoving = true;
        
        // Visual feedback
        event.target.style.background = 'linear-gradient(135deg, #00ff88, #00d4ff)';
    }

    stopMovement() {
        this.isMoving = false;
        this.moveDirection = null;
        
        // Reset button styles
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.style.background = '';
        });
    }

    moveToPosition(x, y, z) {
        if (this.emergencyStop) return;
        
        // Check workspace boundaries
        x = Math.max(this.workspace.x.min, Math.min(this.workspace.x.max, x));
        y = Math.max(this.workspace.y.min, Math.min(this.workspace.y.max, y));
        z = Math.max(this.workspace.z.min, Math.min(this.workspace.z.max, z));
        
        this.targetPosition = { x, y, z };
        
        // Send command to robot (via WebSocket)
        if (window.websocketClient && window.websocketClient.isConnected()) {
            window.websocketClient.sendMoveCommand(x, y, z);
        }
        
        // Update position (smooth interpolation handled in update loop)
        this.updatePosition();
    }

    updatePosition() {
        const speed = this.speed * 0.016; // Convert to per-frame speed (assuming 60fps)
        
        // Smooth interpolation to target position
        const dx = this.targetPosition.x - this.position.x;
        const dy = this.targetPosition.y - this.position.y;
        const dz = this.targetPosition.z - this.position.z;
        
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distance > 0.01) { // Only move if distance is significant
            const moveDistance = Math.min(speed, distance);
            const ratio = moveDistance / distance;
            
            this.position.x += dx * ratio;
            this.position.y += dy * ratio;
            this.position.z += dz * ratio;
            
            // Update 3D visualization
            if (window.robotVisualization) {
                window.robotVisualization.setRobotPosition(
                    this.position.x, 
                    this.position.y, 
                    this.position.z
                );
            }
            
            this.updateDisplay();
        }
    }

    setSpeed(event) {
        const speedValue = parseFloat(event.target.dataset.speed);
        this.speed = speedValue;
        
        // Update active speed button
        document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        this.showNotification(`Speed set to ${speedValue} m/s`, 'success');
    }

    goHome() {
        if (this.emergencyStop) return;
        
        this.showNotification('Moving to home position...', 'info');
        this.moveToPosition(0, 0, 2.5);
    }

    calibrate() {
        if (this.emergencyStop) return;
        
        this.showNotification('Starting calibration sequence...', 'info');
        
        // Calibration sequence
        setTimeout(() => {
            this.isCalibrated = true;
            this.showNotification('Calibration completed successfully!', 'success');
            this.updateInfoPanel();
        }, 3000);
    }

    triggerEmergencyStop() {
        this.emergencyStop = !this.emergencyStop;
        this.isMoving = false;
        
        const btn = document.getElementById('emergencyStop');
        const statusSpan = document.querySelector('.connection-status span');
        
        if (this.emergencyStop) {
            btn.textContent = 'RESET SYSTEM';
            btn.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
            statusSpan.textContent = 'EMERGENCY STOP';
            this.showNotification('EMERGENCY STOP ACTIVATED!', 'error');
        } else {
            btn.textContent = 'EMERGENCY STOP';
            btn.style.background = '';
            statusSpan.textContent = 'Connected';
            this.showNotification('System reset - ready to operate', 'success');
        }
    }

    handleKeyPress(event) {
        if (this.emergencyStop) return;
        
        const key = event.key.toLowerCase();
        const moveDistance = this.stepSize;
        
        switch(key) {
            case 'w': // Forward
                this.moveToPosition(this.position.x, this.position.y + moveDistance, this.position.z);
                break;
            case 's': // Backward
                this.moveToPosition(this.position.x, this.position.y - moveDistance, this.position.z);
                break;
            case 'a': // Left
                this.moveToPosition(this.position.x - moveDistance, this.position.y, this.position.z);
                break;
            case 'd': // Right
                this.moveToPosition(this.position.x + moveDistance, this.position.y, this.position.z);
                break;
            case 'q': // Up
                this.moveToPosition(this.position.x, this.position.y, this.position.z + moveDistance);
                break;
            case 'e': // Down
                this.moveToPosition(this.position.x, this.position.y, this.position.z - moveDistance);
                break;
            case 'h': // Home
                this.goHome();
                break;
            case ' ': // Emergency stop
                event.preventDefault();
                this.triggerEmergencyStop();
                break;
        }
    }

    handleKeyRelease(event) {
        // Handle continuous movement stop if needed
    }

    updateDisplay() {
        // Update position display
        document.getElementById('posX').textContent = this.position.x.toFixed(2);
        document.getElementById('posY').textContent = this.position.y.toFixed(2);
        document.getElementById('posZ').textContent = this.position.z.toFixed(2);
        
        // Update sliders
        const xSlider = document.getElementById('xSlider');
        const ySlider = document.getElementById('ySlider');
        const zSlider = document.getElementById('zSlider');
        
        if (xSlider) xSlider.value = this.position.x;
        if (ySlider) ySlider.value = this.position.y;
        if (zSlider) zSlider.value = this.position.z;
        
        // Update 3D visualization
        if (this.visualization) {
            this.visualization.setRobotPosition(this.position.x, this.position.y, this.position.z);
        }
        
        this.updateInfoPanel();
    }

    updateInfoPanel() {
        const infoPanel = document.querySelector('.info-panel');
        if (!infoPanel) return;
        
        infoPanel.innerHTML = `
            <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">${this.emergencyStop ? 'STOPPED' : 'READY'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Speed:</span>
                <span class="info-value">${this.speed.toFixed(1)} m/s</span>
            </div>
            <div class="info-item">
                <span class="info-label">Calibrated:</span>
                <span class="info-value">${this.isCalibrated ? 'YES' : 'NO'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Moving:</span>
                <span class="info-value">${this.isMoving ? 'YES' : 'NO'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Distance to Target:</span>
                <span class="info-value">${this.getDistanceToTarget().toFixed(2)} m</span>
            </div>
        `;
    }

    getDistanceToTarget() {
        const dx = this.targetPosition.x - this.position.x;
        const dy = this.targetPosition.y - this.position.y;
        const dz = this.targetPosition.z - this.position.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    startUpdateLoop() {
        const update = () => {
            // Continuous movement for held buttons
            if (this.isMoving && this.moveDirection) {
                const { axis, direction } = this.moveDirection;
                const moveDistance = this.speed * 0.016 * direction; // 60fps assumed
                
                const newPos = { ...this.position };
                newPos[axis] += moveDistance;
                
                this.moveToPosition(newPos.x, newPos.y, newPos.z);
            }
            
            // Update position interpolation
            this.updatePosition();
            
            requestAnimationFrame(update);
        };
        
        update();
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Public API methods
    getCurrentPosition() {
        return { ...this.position };
    }

    getWorkspaceBounds() {
        return { ...this.workspace };
    }

    setWorkspaceBounds(bounds) {
        this.workspace = { ...bounds };
    }

    isInWorkspace(x, y, z) {
        return (
            x >= this.workspace.x.min && x <= this.workspace.x.max &&
            y >= this.workspace.y.min && y <= this.workspace.y.max &&
            z >= this.workspace.z.min && z <= this.workspace.z.max
        );
    }
}

// Initialize robot controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.robotController = new RobotController();
});