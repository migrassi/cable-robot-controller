// WebSocket Client for Robot Communication
class WebSocketClient {
    constructor(url = 'ws://localhost:8080') {
        this.url = url;
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // ms
        
        this.messageQueue = [];
        this.callbacks = {};
        
        this.init();
    }

    init() {
        this.connect();
        this.updateConnectionStatus();
    }

    connect() {
        try {
            this.socket = new WebSocket(this.url);
            this.setupEventListeners();
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleConnectionError();
        }
    }

    setupEventListeners() {
        this.socket.onopen = (event) => {
            console.log('WebSocket connected successfully');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus();
            this.processMessageQueue();
            this.onConnected();
        };

        this.socket.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            this.isConnected = false;
            this.updateConnectionStatus();
            this.handleDisconnection();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleConnectionError();
        };
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('Received message:', message);
            
            switch (message.type) {
                case 'position_update':
                    this.handlePositionUpdate(message.data);
                    break;
                case 'status_update':
                    this.handleStatusUpdate(message.data);
                    break;
                case 'calibration_result':
                    this.handleCalibrationResult(message.data);
                    break;
                case 'error':
                    this.handleError(message.data);
                    break;
                case 'response':
                    this.handleResponse(message);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    handlePositionUpdate(data) {
        if (window.robotController) {
            // Update robot controller with actual position from hardware
            window.robotController.position = {
                x: data.x,
                y: data.y,
                z: data.z
            };
            window.robotController.updateDisplay();
        }
        
        if (window.robotVisualization) {
            window.robotVisualization.setRobotPosition(data.x, data.y, data.z);
        }
    }

    handleStatusUpdate(data) {
        console.log('Robot status update:', data);
        
        // Update UI based on robot status
        if (data.emergency_stop !== undefined) {
            if (window.robotController) {
                window.robotController.emergencyStop = data.emergency_stop;
            }
        }
        
        if (data.calibrated !== undefined) {
            if (window.robotController) {
                window.robotController.isCalibrated = data.calibrated;
                window.robotController.updateInfoPanel();
            }
        }
    }

    handleCalibrationResult(data) {
        if (window.robotController) {
            if (data.success) {
                window.robotController.isCalibrated = true;
                window.robotController.showNotification('Calibration completed successfully!', 'success');
            } else {
                window.robotController.showNotification('Calibration failed: ' + data.error, 'error');
            }
            window.robotController.updateInfoPanel();
        }
    }

    handleError(data) {
        console.error('Robot error:', data);
        if (window.robotController) {
            window.robotController.showNotification('Robot error: ' + data.message, 'error');
        }
    }

    handleResponse(message) {
        const { id, success, data, error } = message;
        if (this.callbacks[id]) {
            if (success) {
                this.callbacks[id].resolve(data);
            } else {
                this.callbacks[id].reject(new Error(error || 'Unknown error'));
            }
            delete this.callbacks[id];
        }
    }

    onConnected() {
        // Request initial robot status
        this.sendCommand('get_status');
        
        if (window.robotController) {
            window.robotController.showNotification('Connected to robot successfully!', 'success');
        }
    }

    handleDisconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            if (window.robotController) {
                window.robotController.showNotification('Connection lost - please check robot', 'error');
            }
        }
    }

    handleConnectionError() {
        this.isConnected = false;
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        // This function is disabled - UI is handled by the main application
        // to prevent conflicts with the new button-based interface
        return;
    }

    // Public API methods
    sendMoveCommand(x, y, z) {
        return this.sendCommand('move', { x, y, z });
    }

    sendHomeCommand() {
        return this.sendCommand('home');
    }

    sendCalibrateCommand() {
        return this.sendCommand('calibrate');
    }

    sendEmergencyStopCommand() {
        return this.sendCommand('emergency_stop');
    }

    sendResetCommand() {
        return this.sendCommand('reset');
    }

    sendCommand(command, data = {}) {
        const message = {
            id: this.generateMessageId(),
            type: 'command',
            command: command,
            data: data,
            timestamp: Date.now()
        };

        return new Promise((resolve, reject) => {
            this.callbacks[message.id] = { resolve, reject };
            
            // Set timeout for command
            setTimeout(() => {
                if (this.callbacks[message.id]) {
                    this.callbacks[message.id].reject(new Error('Command timeout'));
                    delete this.callbacks[message.id];
                }
            }, 10000); // 10 second timeout
            
            this.send(message);
        });
    }

    send(message) {
        const messageStr = JSON.stringify(message);
        
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(messageStr);
            console.log('Sent message:', message);
        } else {
            console.log('Queuing message (not connected):', message);
            this.messageQueue.push(messageStr);
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.socket.send(message);
            console.log('Sent queued message:', JSON.parse(message));
        }
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Connection management
    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    reconnect() {
        this.disconnect();
        setTimeout(() => this.connect(), 1000);
    }

    isConnectedToRobot() {
        return this.isConnected;
    }

    // Configuration
    setUrl(url) {
        this.url = url;
    }

    setReconnectOptions(maxAttempts, delay) {
        this.maxReconnectAttempts = maxAttempts;
        this.reconnectDelay = delay;
    }
}

// Initialize WebSocket client when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.websocketClient = new WebSocketClient();
});