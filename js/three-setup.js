// Three.js Setup for Cable Robot 3D Visualization
class RobotVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.robot = null;
        this.cables = [];
        this.motors = [];
        this.workspace = null;
        
        // Cable robot configuration
        this.motorRadius = 3.0; // 3 meters radius
        this.motorHeight = 5.0; // Motors at 5m height
        this.motorPositions = this.calculateMotorPositions();
        
        this.init();
        this.animate();
    }

    calculateMotorPositions() {
        // Three motors separated by 120 degrees
        const positions = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i * 120) * Math.PI / 180; // Convert to radians
            const x = this.motorRadius * Math.cos(angle);
            const y = this.motorRadius * Math.sin(angle);
            const z = this.motorHeight;
            positions.push({ x, y, z });
        }
        return positions;
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        // Position camera for good initial view
        this.camera.position.set(10, 10, 8);
        this.camera.lookAt(new THREE.Vector3(0, 0, 2.5));

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Create workspace boundaries
        this.createWorkspace();

        // Create motor system
        this.createMotors();

        // Create robot head/end-effector
        this.createRobot();

        // Create cables
        this.createCables();

        // Controls
        this.setupControls();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('3D Visualization initialized successfully');
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point light on robot
        const robotLight = new THREE.PointLight(0x00ff00, 0.5, 10);
        robotLight.position.set(0, 0, 0);
        this.scene.add(robotLight);
        this.robotLight = robotLight;
    }

    createWorkspace() {
        // Create circular workspace boundary at ground level
        const workspaceRadius = this.motorRadius + 1; // Slightly larger than motor circle
        const workspaceGeometry = new THREE.CylinderGeometry(workspaceRadius, workspaceRadius, 0.1, 32);
        const workspaceMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });
        this.workspace = new THREE.Mesh(workspaceGeometry, workspaceMaterial);
        this.workspace.position.set(0, 0, 0);
        this.scene.add(this.workspace);

        // Add circular grid
        const gridRadius = workspaceRadius;
        const gridSegments = 16;
        const gridGeometry = new THREE.RingGeometry(0.1, gridRadius, gridSegments, 8);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            side: THREE.DoubleSide,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = 0.05;
        this.scene.add(grid);

        // Add vertical reference lines to show workspace height
        for (let i = 0; i < 4; i++) {
            const angle = (i * 90) * Math.PI / 180;
            const x = gridRadius * 0.8 * Math.cos(angle);
            const y = gridRadius * 0.8 * Math.sin(angle);
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, y, 0),
                new THREE.Vector3(x, y, this.motorHeight)
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0x666666,
                transparent: true,
                opacity: 0.3
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(line);
        }
    }

    createMotors() {
        // Create three motors positioned in a circle
        this.motorPositions.forEach((pos, index) => {
            // Motor base/mount
            const motorGroup = new THREE.Group();
            
            // Motor housing
            const motorGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16);
            const motorMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                metalness: 0.8,
                roughness: 0.2
            });
            const motor = new THREE.Mesh(motorGeometry, motorMaterial);
            motor.castShadow = true;
            motor.receiveShadow = true;
            motorGroup.add(motor);

            // Motor pulley/winch
            const pulleyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
            const pulleyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                metalness: 0.9,
                roughness: 0.1
            });
            const pulley = new THREE.Mesh(pulleyGeometry, pulleyMaterial);
            pulley.position.set(0, -0.45, 0);
            pulley.castShadow = true;
            motorGroup.add(pulley);

            // Motor support structure
            const supportGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.0, 8);
            const supportMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                metalness: 0.6,
                roughness: 0.4
            });
            const support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(0, 0.9, 0);
            support.castShadow = true;
            motorGroup.add(support);

            // LED indicator
            const ledGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const ledMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                emissive: 0x004400,
                emissiveIntensity: 0.5
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(0, 0.3, 0.35);
            motorGroup.add(led);

            // Position the motor group
            motorGroup.position.set(pos.x, pos.y, pos.z);
            
            // Rotate motor to face center
            const angle = Math.atan2(pos.y, pos.x);
            motorGroup.rotation.z = angle + Math.PI/2;
            
            this.scene.add(motorGroup);
            this.motors.push({ group: motorGroup, pulley: pulley, led: led, position: pos });

            // Add motor label
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 256;
            context.font = 'Bold 60px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(`M${index + 1}`, 128, 128);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(pos.x, pos.y, pos.z + 1);
            sprite.scale.set(0.5, 0.5, 0.5);
            this.scene.add(sprite);
        });
    }

    createRobot() {
        // Create robot head/end-effector group
        this.robot = new THREE.Group();

        // Main body/head
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0066cc,
            metalness: 0.5,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        this.robot.add(body);

        // Camera mount
        const cameraGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16);
        const cameraMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.set(0, 0, -0.25);
        camera.castShadow = true;
        this.robot.add(camera);

        // Cable attachment points
        const attachmentPoints = [
            { x: 0.2, y: 0.2, z: 0.15 },
            { x: -0.2, y: 0.2, z: 0.15 },
            { x: 0, y: -0.3, z: 0.15 }
        ];

        attachmentPoints.forEach((point, index) => {
            const attachGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const attachMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffaa00,
                metalness: 0.9,
                roughness: 0.1
            });
            const attachment = new THREE.Mesh(attachGeometry, attachMaterial);
            attachment.position.set(point.x, point.y, point.z);
            this.robot.add(attachment);
        });

        // Status LED indicators
        for (let i = 0; i < 4; i++) {
            const ledGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const ledMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                emissive: 0x002200,
                emissiveIntensity: 0.3
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            const angle = (i / 4) * Math.PI * 2;
            led.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0.18);
            this.robot.add(led);
        }

        // Set initial position (suspended in workspace)
        this.robot.position.set(0, 0, 2.5);
        this.scene.add(this.robot);
    }

    createCables() {
        // Create three cables connecting robot to motors
        this.motorPositions.forEach((motorPos, index) => {
            const points = [
                new THREE.Vector3(motorPos.x, motorPos.y, motorPos.z - 0.4), // From pulley
                this.robot.position.clone().add(new THREE.Vector3(0, 0, 0.15)) // To robot attachment point
            ];
            
            // Create thicker cable using TubeGeometry
            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
            const cableMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffaa00,
                metalness: 0.3,
                roughness: 0.7
            });
            const cable = new THREE.Mesh(tubeGeometry, cableMaterial);
            cable.castShadow = true;
            this.scene.add(cable);
            this.cables.push(cable);
        });
    }

    setupControls() {
        // Simplified mouse controls for camera
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let cameraRadius = 12;
        let cameraAngleX = 0;
        let cameraAngleY = 0;

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
            event.preventDefault();
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                };

                // Update camera angles
                cameraAngleX -= deltaMove.x * 0.01;
                cameraAngleY += deltaMove.y * 0.01;
                
                // Limit vertical rotation
                cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraAngleY));

                // Update camera position
                this.camera.position.x = cameraRadius * Math.cos(cameraAngleY) * Math.cos(cameraAngleX);
                this.camera.position.y = cameraRadius * Math.cos(cameraAngleY) * Math.sin(cameraAngleX);
                this.camera.position.z = cameraRadius * Math.sin(cameraAngleY) + 2.5;
                
                this.camera.lookAt(new THREE.Vector3(0, 0, 2.5));
                
                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Zoom control
        this.renderer.domElement.addEventListener('wheel', (event) => {
            const zoomSpeed = 0.5;
            const direction = event.deltaY > 0 ? 1 : -1;
            
            cameraRadius += direction * zoomSpeed;
            cameraRadius = Math.max(5, Math.min(30, cameraRadius));
            
            // Update camera position
            this.camera.position.x = cameraRadius * Math.cos(cameraAngleY) * Math.cos(cameraAngleX);
            this.camera.position.y = cameraRadius * Math.cos(cameraAngleY) * Math.sin(cameraAngleX);
            this.camera.position.z = cameraRadius * Math.sin(cameraAngleY) + 2.5;
            
            event.preventDefault();
        });

        // Store angles for use in animation
        this.cameraAngleX = cameraAngleX;
        this.cameraAngleY = cameraAngleY;
        this.cameraRadius = cameraRadius;
    }

    updateRobotPosition(x, y, z) {
        if (this.robot) {
            this.robot.position.set(x, y, z);
            this.robotLight.position.copy(this.robot.position);
            this.updateCables();
        }
    }

    updateCables() {
        this.cables.forEach((cable, index) => {
            const motorPos = this.motorPositions[index];
            const points = [
                new THREE.Vector3(motorPos.x, motorPos.y, motorPos.z - 0.4), // From pulley
                this.robot.position.clone().add(new THREE.Vector3(0, 0, 0.15)) // To robot attachment point
            ];
            
            // Update cable geometry
            const curve = new THREE.CatmullRomCurve3(points);
            const newGeometry = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
            
            // Replace the old geometry
            cable.geometry.dispose();
            cable.geometry = newGeometry;
        });
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Subtle rotation of robot for visual feedback
        if (this.robot) {
            this.robot.rotation.z += 0.002;
        }

        // Animate motor pulleys
        this.motors.forEach((motor, index) => {
            if (motor.pulley) {
                motor.pulley.rotation.y += 0.03;
            }
        });

        // Keep camera looking at robot level (don't auto-orbit)
        // Only update if we're not manually controlling
        // this.camera.lookAt(new THREE.Vector3(0, 0, 2.5));

        this.renderer.render(this.scene, this.camera);
    }

    // Public methods for external control
    setRobotPosition(x, y, z) {
        this.updateRobotPosition(x, y, z);
    }

    toggleLight(enabled) {
        this.robotLight.visible = enabled;
    }

    getRobotPosition() {
        return this.robot ? this.robot.position.clone() : new THREE.Vector3(0, 0, 0);
    }
}

// Export for use in other files
window.RobotVisualization = RobotVisualization;
