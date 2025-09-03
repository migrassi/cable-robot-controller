// GUI Controls and Advanced Interface Features
class GUIControls {
    constructor() {
        this.gui = null;
        this.params = {
            // Robot parameters
            speed: 1.0,
            acceleration: 2.0,
            workspace: {
                x_min: -10, x_max: 10,
                y_min: -10, y_max: 10,
                z_min: -2.5, z_max: 7.5
            },
            // Visualization parameters
            showCables: true,
            showWorkspace: true,
            showGrid: true,
            cameraAutoRotate: true,
            // Safety parameters
            emergencyStopEnabled: true,
            calibrationRequired: true
        };
        
        this.init();
    }

    init() {
        this.setupDAT();
        this.setupAdvancedControls();
        this.setupKeyboardShortcuts();
        this.setupContextMenu();
    }

    setupDAT() {
        // Initialize DAT.GUI for advanced controls
        if (typeof dat !== 'undefined') {
            this.gui = new dat.GUI({ width: 300 });
            this.gui.domElement.style.position = 'fixed';
            this.gui.domElement.style.top = '80px';
            this.gui.domElement.style.right = '20px';
            this.gui.domElement.style.zIndex = '1000';
            
            // Robot Control folder
            const robotFolder = this.gui.addFolder('Robot Control');
            robotFolder.add(this.params, 'speed', 0.1, 5.0, 0.1)
                .name('Speed (m/s)')
                .onChange((value) => this.onSpeedChange(value));
            
            robotFolder.add(this.params, 'acceleration', 0.5, 10.0, 0.5)
                .name('Acceleration')
                .onChange((value) => this.onAccelerationChange(value));
            
            robotFolder.open();
            
            // Workspace folder
            const workspaceFolder = this.gui.addFolder('Workspace Bounds');
            workspaceFolder.add(this.params.workspace, 'x_min', -20, 0)
                .name('X Min')
                .onChange(() => this.updateWorkspace());
            workspaceFolder.add(this.params.workspace, 'x_max', 0, 20)
                .name('X Max')
                .onChange(() => this.updateWorkspace());
            workspaceFolder.add(this.params.workspace, 'y_min', -20, 0)
                .name('Y Min')
                .onChange(() => this.updateWorkspace());
            workspaceFolder.add(this.params.workspace, 'y_max', 0, 20)
                .name('Y Max')
                .onChange(() => this.updateWorkspace());
            workspaceFolder.add(this.params.workspace, 'z_min', -10, 0)
                .name('Z Min')
                .onChange(() => this.updateWorkspace());
            workspaceFolder.add(this.params.workspace, 'z_max', 0, 15)
                .name('Z Max')
                .onChange(() => this.updateWorkspace());
            
            // Visualization folder
            const vizFolder = this.gui.addFolder('Visualization');
            vizFolder.add(this.params, 'showCables')
                .name('Show Cables')
                .onChange((value) => this.toggleCables(value));
            vizFolder.add(this.params, 'showWorkspace')
                .name('Show Workspace')
                .onChange((value) => this.toggleWorkspace(value));
            vizFolder.add(this.params, 'showGrid')
                .name('Show Grid')
                .onChange((value) => this.toggleGrid(value));
            vizFolder.add(this.params, 'cameraAutoRotate')
                .name('Auto Rotate Camera')
                .onChange((value) => this.toggleAutoRotate(value));
            
            vizFolder.open();
            
            // Safety folder
            const safetyFolder = this.gui.addFolder('Safety');
            safetyFolder.add(this.params, 'emergencyStopEnabled')
                .name('Emergency Stop Enabled');
            safetyFolder.add(this.params, 'calibrationRequired')
                .name('Require Calibration');
            
            // Action buttons
            const actions = {
                saveConfiguration: () => this.saveConfiguration(),
                loadConfiguration: () => this.loadConfiguration(),
                resetToDefaults: () => this.resetToDefaults(),
                exportLog: () => this.exportLog()
            };
            
            const actionsFolder = this.gui.addFolder('Actions');
            actionsFolder.add(actions, 'saveConfiguration').name('Save Config');
            actionsFolder.add(actions, 'loadConfiguration').name('Load Config');
            actionsFolder.add(actions, 'resetToDefaults').name('Reset Defaults');
            actionsFolder.add(actions, 'exportLog').name('Export Log');
        }
    }

    setupAdvancedControls() {
        // Add advanced control panel to the page
        const advancedPanel = document.createElement('div');
        advancedPanel.id = 'advanced-controls';
        advancedPanel.innerHTML = `
            <div class="advanced-panel">
                <h3>Advanced Controls</h3>
                <div class="control-group">
                    <label>Coordinate Input:</label>
                    <div class="coordinate-inputs">
                        <input type="number" id="coordX" placeholder="X" step="0.1">
                        <input type="number" id="coordY" placeholder="Y" step="0.1">
                        <input type="number" id="coordZ" placeholder="Z" step="0.1">
                        <button id="goToCoord">Go To</button>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Path Recording:</label>
                    <div class="path-controls">
                        <button id="recordPath">Record Path</button>
                        <button id="playPath">Play Path</button>
                        <button id="clearPath">Clear Path</button>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Presets:</label>
                    <div class="preset-controls">
                        <select id="presetSelect">
                            <option value="">Select Preset</option>
                            <option value="center">Center</option>
                            <option value="corners">Test Corners</option>
                            <option value="spiral">Spiral Pattern</option>
                        </select>
                        <button id="executePreset">Execute</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(advancedPanel);
        this.setupAdvancedEventListeners();
    }

    setupAdvancedEventListeners() {
        // Coordinate input
        document.getElementById('goToCoord')?.addEventListener('click', () => {
            const x = parseFloat(document.getElementById('coordX').value) || 0;
            const y = parseFloat(document.getElementById('coordY').value) || 0;
            const z = parseFloat(document.getElementById('coordZ').value) || 0;
            
            if (window.robotController) {
                window.robotController.moveToPosition(x, y, z);
            }
        });

        // Path recording
        document.getElementById('recordPath')?.addEventListener('click', () => {
            this.togglePathRecording();
        });
        
        document.getElementById('playPath')?.addEventListener('click', () => {
            this.playRecordedPath();
        });
        
        document.getElementById('clearPath')?.addEventListener('click', () => {
            this.clearRecordedPath();
        });

        // Presets
        document.getElementById('executePreset')?.addEventListener('click', () => {
            const preset = document.getElementById('presetSelect').value;
            this.executePreset(preset);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in input fields
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case 'F1':
                    e.preventDefault();
                    this.showHelp();
                    break;
                case 'F2':
                    e.preventDefault();
                    this.toggleGUI();
                    break;
                case 'F3':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'r':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.resetView();
                    }
                    break;
                case 's':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.saveConfiguration();
                    }
                    break;
            }
        });
    }

    setupContextMenu() {
        const viewport = document.getElementById('viewport');
        if (viewport) {
            viewport.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            });
        }
    }

    // Event handlers
    onSpeedChange(value) {
        if (window.robotController) {
            window.robotController.speed = value;
        }
    }

    onAccelerationChange(value) {
        if (window.robotController) {
            window.robotController.acceleration = value;
        }
    }

    updateWorkspace() {
        if (window.robotController) {
            window.robotController.setWorkspaceBounds({
                x: { min: this.params.workspace.x_min, max: this.params.workspace.x_max },
                y: { min: this.params.workspace.y_min, max: this.params.workspace.y_max },
                z: { min: this.params.workspace.z_min, max: this.params.workspace.z_max }
            });
        }
    }

    toggleCables(show) {
        if (window.robotVisualization) {
            window.robotVisualization.cables.forEach(cable => {
                cable.visible = show;
            });
        }
    }

    toggleWorkspace(show) {
        if (window.robotVisualization && window.robotVisualization.workspace) {
            window.robotVisualization.workspace.visible = show;
        }
    }

    toggleGrid(show) {
        // Implementation depends on how grid is stored in visualization
        console.log('Toggle grid:', show);
    }

    toggleAutoRotate(enabled) {
        // Implementation for auto-rotate camera
        console.log('Auto rotate:', enabled);
    }

    // Path recording functionality
    togglePathRecording() {
        if (!this.pathRecording) {
            this.pathRecording = true;
            this.recordedPath = [];
            document.getElementById('recordPath').textContent = 'Stop Recording';
            this.startPathRecording();
        } else {
            this.pathRecording = false;
            document.getElementById('recordPath').textContent = 'Record Path';
            this.showNotification(`Path recorded with ${this.recordedPath.length} points`, 'success');
        }
    }

    startPathRecording() {
        if (this.pathRecording && window.robotController) {
            const position = window.robotController.getCurrentPosition();
            this.recordedPath.push({
                ...position,
                timestamp: Date.now()
            });
            
            setTimeout(() => this.startPathRecording(), 100); // Record every 100ms
        }
    }

    playRecordedPath() {
        if (!this.recordedPath || this.recordedPath.length === 0) {
            this.showNotification('No path recorded', 'warning');
            return;
        }
        
        this.showNotification('Playing recorded path...', 'info');
        this.playPathIndex = 0;
        this.playNextPathPoint();
    }

    playNextPathPoint() {
        if (this.playPathIndex < this.recordedPath.length && window.robotController) {
            const point = this.recordedPath[this.playPathIndex];
            window.robotController.moveToPosition(point.x, point.y, point.z);
            
            this.playPathIndex++;
            setTimeout(() => this.playNextPathPoint(), 200); // Play every 200ms
        } else {
            this.showNotification('Path playback completed', 'success');
        }
    }

    clearRecordedPath() {
        this.recordedPath = [];
        this.showNotification('Path cleared', 'info');
    }

    // Preset movements
    executePreset(preset) {
        if (!window.robotController) return;
        
        switch(preset) {
            case 'center':
                window.robotController.goHome();
                break;
            case 'corners':
                this.testCorners();
                break;
            case 'spiral':
                this.spiralPattern();
                break;
        }
    }

    testCorners() {
        const corners = [
            [-8, -8, 2], [8, -8, 2], [8, 8, 2], [-8, 8, 2],
            [-8, -8, 5], [8, -8, 5], [8, 8, 5], [-8, 8, 5]
        ];
        
        let index = 0;
        const moveToNextCorner = () => {
            if (index < corners.length) {
                const [x, y, z] = corners[index];
                window.robotController.moveToPosition(x, y, z);
                index++;
                setTimeout(moveToNextCorner, 2000);
            }
        };
        
        moveToNextCorner();
    }

    spiralPattern() {
        const points = [];
        const radius = 5;
        const height = 3;
        
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 4;
            const r = radius * (1 - i / 50);
            points.push([
                r * Math.cos(angle),
                r * Math.sin(angle),
                height
            ]);
        }
        
        let index = 0;
        const moveToNextPoint = () => {
            if (index < points.length) {
                const [x, y, z] = points[index];
                window.robotController.moveToPosition(x, y, z);
                index++;
                setTimeout(moveToNextPoint, 100);
            }
        };
        
        moveToNextPoint();
    }

    // Configuration management
    saveConfiguration() {
        const config = {
            params: this.params,
            robotPosition: window.robotController ? window.robotController.getCurrentPosition() : null,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('robotConfig', JSON.stringify(config));
        this.showNotification('Configuration saved', 'success');
    }

    loadConfiguration() {
        const configStr = localStorage.getItem('robotConfig');
        if (configStr) {
            try {
                const config = JSON.parse(configStr);
                this.params = { ...this.params, ...config.params };
                this.updateGUIFromParams();
                this.showNotification('Configuration loaded', 'success');
            } catch (error) {
                this.showNotification('Error loading configuration', 'error');
            }
        } else {
            this.showNotification('No saved configuration found', 'warning');
        }
    }

    resetToDefaults() {
        // Reset parameters to default values
        this.params = {
            speed: 1.0,
            acceleration: 2.0,
            workspace: {
                x_min: -10, x_max: 10,
                y_min: -10, y_max: 10,
                z_min: -2.5, z_max: 7.5
            },
            showCables: true,
            showWorkspace: true,
            showGrid: true,
            cameraAutoRotate: true,
            emergencyStopEnabled: true,
            calibrationRequired: true
        };
        
        this.updateGUIFromParams();
        this.showNotification('Reset to defaults', 'info');
    }

    exportLog() {
        // Create and download log file
        const log = {
            timestamp: new Date().toISOString(),
            configuration: this.params,
            robotPosition: window.robotController ? window.robotController.getCurrentPosition() : null,
            recordedPath: this.recordedPath || []
        };
        
        const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `robot-log-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Log exported', 'success');
    }

    // UI utilities
    showHelp() {
        const helpHTML = `
            <div class="help-modal">
                <h3>Keyboard Shortcuts</h3>
                <ul>
                    <li><strong>WASD:</strong> Move robot (Front/Back/Left/Right)</li>
                    <li><strong>Q/E:</strong> Move Up/Down</li>
                    <li><strong>H:</strong> Go to Home position</li>
                    <li><strong>Space:</strong> Emergency Stop</li>
                    <li><strong>F1:</strong> Show this help</li>
                    <li><strong>F2:</strong> Toggle GUI</li>
                    <li><strong>F3:</strong> Toggle Fullscreen</li>
                    <li><strong>Ctrl+R:</strong> Reset View</li>
                    <li><strong>Ctrl+S:</strong> Save Configuration</li>
                </ul>
                <button onclick="this.parentElement.remove()">Close</button>
            </div>
        `;
        
        const helpDiv = document.createElement('div');
        helpDiv.innerHTML = helpHTML;
        helpDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9); color: white; padding: 2rem;
            border-radius: 10px; z-index: 10000; max-width: 500px;
        `;
        document.body.appendChild(helpDiv);
    }

    toggleGUI() {
        if (this.gui) {
            this.gui.domElement.style.display = 
                this.gui.domElement.style.display === 'none' ? '' : 'none';
        }
        
        const advancedPanel = document.getElementById('advanced-controls');
        if (advancedPanel) {
            advancedPanel.style.display = 
                advancedPanel.style.display === 'none' ? '' : 'none';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    resetView() {
        if (window.robotVisualization) {
            // Reset camera position
            window.robotVisualization.camera.position.set(15, 15, 15);
            window.robotVisualization.camera.lookAt(0, 0, 0);
        }
    }

    showContextMenu(x, y) {
        // Remove existing context menu
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="moveHere">Move Here</div>
            <div class="menu-item" data-action="setTarget">Set as Target</div>
            <div class="menu-separator"></div>
            <div class="menu-item" data-action="resetView">Reset View</div>
            <div class="menu-item" data-action="centerView">Center View</div>
        `;
        
        menu.style.cssText = `
            position: fixed; left: ${x}px; top: ${y}px;
            background: rgba(0,0,0,0.9); color: white;
            border-radius: 5px; padding: 5px 0; z-index: 10000;
            min-width: 150px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        `;
        
        document.body.appendChild(menu);
        
        // Handle menu clicks
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleContextMenuAction(action, x, y);
                menu.remove();
            }
        });
        
        // Remove menu when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    handleContextMenuAction(action, x, y) {
        switch(action) {
            case 'moveHere':
                // Convert screen coordinates to 3D coordinates (simplified)
                console.log('Move to screen position:', x, y);
                break;
            case 'setTarget':
                console.log('Set target at:', x, y);
                break;
            case 'resetView':
                this.resetView();
                break;
            case 'centerView':
                if (window.robotVisualization) {
                    window.robotVisualization.camera.lookAt(0, 0, 0);
                }
                break;
        }
    }

    updateGUIFromParams() {
        if (this.gui) {
            // Update all GUI controllers with current parameter values
            this.gui.__controllers.forEach(controller => {
                if (controller.object && controller.property) {
                    controller.updateDisplay();
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        if (window.robotController) {
            window.robotController.showNotification(message, type);
        }
    }
}

// Initialize GUI controls when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.guiControls = new GUIControls();
});