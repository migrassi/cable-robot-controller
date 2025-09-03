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
        this.motorHeight = 5.0; // Motors at 5m height (Y axis is UP)
        this.motorPositions = this.calculateMotorPositions();
        
        this.init();
        this.animate();
    }

    calculateMotorPositions() {
        // Three motors separated by 120 degrees - Y is UP (vertical)
        const positions = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i * 120) * Math.PI / 180; // Convert to radians
            const x = this.motorRadius * Math.cos(angle);
            const z = this.motorRadius * Math.sin(angle); // Z is horizontal depth
            const y = this.motorHeight; // Y is vertical (UP)
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
        // Position camera for good initial view - Y es vertical (arriba)
        this.camera.position.set(8, 6, 8);
        this.camera.lookAt(new THREE.Vector3(0, 2.5, 0)); // Mirar al centro del workspace

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
        // PLANO DEL PISO - Horizontal en Y=0 (XZ plane)
        const floorSize = 8; // 8x8 metros
        const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2; // Horizontal (XZ plane at Y=0)
        floor.position.set(0, 0, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Grid en el piso para referencia - GridHelper está por defecto en XZ (Y=0), perfecto
        const gridHelper = new THREE.GridHelper(floorSize, 16, 0x444444, 0x333333);
        gridHelper.position.set(0, 0, 0); // En el piso Y=0
        this.scene.add(gridHelper);

        // PLANO DE LOS MOTORES - Horizontal a altura Y=motorHeight
        const motorPlaneSize = this.motorRadius * 2.5;
        const motorPlaneGeometry = new THREE.PlaneGeometry(motorPlaneSize, motorPlaneSize);
        const motorPlaneMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        const motorPlane = new THREE.Mesh(motorPlaneGeometry, motorPlaneMaterial);
        motorPlane.rotation.x = -Math.PI / 2; // Horizontal (XZ plane at Y=motorHeight)
        motorPlane.position.set(0, this.motorHeight, 0);
        this.scene.add(motorPlane);

        // Círculo que muestra el radio de los motores - en plano XZ
        const motorCircleGeometry = new THREE.RingGeometry(this.motorRadius - 0.1, this.motorRadius + 0.1, 32);
        const motorCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444, // Color gris suave en lugar de verde brillante
            transparent: true,
            opacity: 0.3, // Más transparente
            side: THREE.DoubleSide
        });
        const motorCircle = new THREE.Mesh(motorCircleGeometry, motorCircleMaterial);
        motorCircle.rotation.x = -Math.PI / 2; // Horizontal
        motorCircle.position.set(0, this.motorHeight + 0.01, 0);
        this.scene.add(motorCircle);

        // Líneas verticales (paralelas al eje Y) que conectan los dos planos
        for (let i = 0; i < 3; i++) {
            const angle = (i * 120) * Math.PI / 180;
            const x = this.motorRadius * Math.cos(angle);
            const z = this.motorRadius * Math.sin(angle);
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x, 0, z),              // Desde el piso (Y=0)
                new THREE.Vector3(x, this.motorHeight, z) // Hasta los motores (Y=motorHeight)
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0x888888,
                transparent: true,
                opacity: 0.5
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(line);
        }

        // Área de trabajo cilíndrica (workspace del robot) - eje vertical Y
        const workspaceRadius = this.motorRadius * 0.8; // Más pequeño que el círculo de motores
        const workspaceHeight = this.motorHeight - 0.5;
        const workspaceGeometry = new THREE.CylinderGeometry(
            workspaceRadius, workspaceRadius, workspaceHeight, 32, 1, true
        );
        const workspaceMaterial = new THREE.MeshBasicMaterial({
            color: 0x0066ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        this.workspace = new THREE.Mesh(workspaceGeometry, workspaceMaterial);
        this.workspace.position.set(0, workspaceHeight / 2, 0); // Centrado verticalmente en Y
        this.scene.add(this.workspace);
    }

    createMotors() {
        // Create three motors positioned in a circle - MUCHO MÁS PEQUEÑOS
        this.motorPositions.forEach((pos, index) => {
            // Motor base/mount
            const motorGroup = new THREE.Group();
            
            // Motor housing - MÁS PEQUEÑO
            const motorGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.2, 12);
            const motorMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                metalness: 0.8,
                roughness: 0.2
            });
            const motor = new THREE.Mesh(motorGeometry, motorMaterial);
            motor.castShadow = true;
            motor.receiveShadow = true;
            motorGroup.add(motor);

            // Motor pulley/winch - MÁS PEQUEÑO
            const pulleyGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
            const pulleyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                metalness: 0.9,
                roughness: 0.1
            });
            const pulley = new THREE.Mesh(pulleyGeometry, pulleyMaterial);
            pulley.position.set(0, -0.12, 0);
            pulley.castShadow = true;
            motorGroup.add(pulley);

            // Motor support structure - MÁS PEQUEÑO
            const supportGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.3, 8);
            const supportMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                metalness: 0.6,
                roughness: 0.4
            });
            const support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(0, 0.25, 0);
            support.castShadow = true;
            motorGroup.add(support);

            // LED indicator - MÁS PEQUEÑO
            const ledGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const ledMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                emissive: 0x004400,
                emissiveIntensity: 0.5
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(0, 0.08, 0.1);
            motorGroup.add(led);

            // Position the motor group
            motorGroup.position.set(pos.x, pos.y, pos.z);
            
            // Rotate motor to face center - ajustado para Y-up
            const angle = Math.atan2(pos.z, pos.x);
            motorGroup.rotation.y = angle + Math.PI/2;
            
            this.scene.add(motorGroup);
            this.motors.push({ group: motorGroup, pulley: pulley, led: led, position: pos });

            // Add motor label - MÁS PEQUEÑO - ajustado para Y-up
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 128;
            context.font = 'Bold 40px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(`M${index + 1}`, 64, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(pos.x, pos.y + 0.3, pos.z);
            sprite.scale.set(0.3, 0.3, 0.3);
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

        // Set initial position (suspended in workspace) - Y es vertical
        this.robot.position.set(0, 2.5, 0); // X, Y(height), Z
        this.scene.add(this.robot);
    }

    createCables() {
        // Create three cables connecting robot to motors
        this.motorPositions.forEach((motorPos, index) => {
            const points = [
                new THREE.Vector3(motorPos.x, motorPos.y - 0.12, motorPos.z), // From pulley (Y adjusted for smaller size)
                this.robot.position.clone().add(new THREE.Vector3(0, 0.15, 0)) // To robot attachment point (Y offset)
            ];
            
            // Create thicker cable using TubeGeometry
            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.01, 8, false); // Cables más delgados
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
                this.cameraAngleX -= deltaMove.x * 0.01;
                this.cameraAngleY += deltaMove.y * 0.01;
                
                // Limit vertical rotation
                this.cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraAngleY));

                // Update camera position - Y es vertical
                this.camera.position.x = this.cameraRadius * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);
                this.camera.position.z = this.cameraRadius * Math.cos(this.cameraAngleY) * Math.sin(this.cameraAngleX);
                this.camera.position.y = this.cameraRadius * Math.sin(this.cameraAngleY) + 2.5; // Y es altura
                
                this.camera.lookAt(new THREE.Vector3(0, 2.5, 0)); // Mirar al centro del workspace
                
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
            
            this.cameraRadius += direction * zoomSpeed;
            this.cameraRadius = Math.max(5, Math.min(30, this.cameraRadius));
            
            // Update camera position - Y es vertical
            this.camera.position.x = this.cameraRadius * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);
            this.camera.position.z = this.cameraRadius * Math.cos(this.cameraAngleY) * Math.sin(this.cameraAngleX);
            this.camera.position.y = this.cameraRadius * Math.sin(this.cameraAngleY) + 2.5; // Y es altura
            
            event.preventDefault();
        });

        // Store angles for use in animation
        this.cameraAngleX = 0;
        this.cameraAngleY = 0;
        this.cameraRadius = 12;
        
        // Initialize camera position
        this.resetCameraView();
    }

    updateRobotPosition(x, y, z) {
        if (this.robot) {
            this.robot.position.set(x, z, y); // Mapear: x->x, y->z, z->y (porque Y es vertical)
            this.robotLight.position.copy(this.robot.position);
            this.updateCables();
        }
    }

    updateCables() {
        this.cables.forEach((cable, index) => {
            const motorPos = this.motorPositions[index];
            const points = [
                new THREE.Vector3(motorPos.x, motorPos.y - 0.12, motorPos.z), // From pulley (Y adjusted for smaller size)
                this.robot.position.clone().add(new THREE.Vector3(0, 0.15, 0)) // To robot attachment point (Y offset)
            ];
            
            // Update cable geometry
            const curve = new THREE.CatmullRomCurve3(points);
            const newGeometry = new THREE.TubeGeometry(curve, 20, 0.01, 8, false); // Cables más delgados
            
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
        
        // Subtle rotation of robot for visual feedback - Y es vertical
        if (this.robot) {
            this.robot.rotation.y += 0.002;
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
        if (this.robot) {
            // Mapear de vuelta: x->x, y->z, z->y (porque internamente Y es vertical)
            return { 
                x: this.robot.position.x, 
                y: this.robot.position.z, 
                z: this.robot.position.y 
            };
        }
        return { x: 0, y: 0, z: 0 };
    }

    // Camera view methods
    resetCameraView() {
        this.camera.position.set(8, 6, 8);
        this.camera.lookAt(new THREE.Vector3(0, 2.5, 0));
        
        // Reset stored camera angles
        this.cameraAngleX = Math.atan2(this.camera.position.z, this.camera.position.x);
        this.cameraAngleY = Math.asin(this.camera.position.y / this.cameraRadius);
        this.cameraRadius = 12;
    }

    setTopView() {
        this.camera.position.set(0, 12, 0);
        this.camera.lookAt(new THREE.Vector3(0, 2.5, 0));
        
        // Update stored camera angles for top view
        this.cameraAngleX = 0;
        this.cameraAngleY = Math.PI / 2 - 0.1; // Almost straight down
        this.cameraRadius = 12;
    }

    setSideView() {
        this.camera.position.set(12, 2.5, 0);
        this.camera.lookAt(new THREE.Vector3(0, 2.5, 0));
        
        // Update stored camera angles for side view
        this.cameraAngleX = 0;
        this.cameraAngleY = 0; // Horizontal view
        this.cameraRadius = 12;
    }

    setFrontView() {
        this.camera.position.set(0, 2.5, 12);
        this.camera.lookAt(new THREE.Vector3(0, 2.5, 0));
        
        // Update stored camera angles for front view
        this.cameraAngleX = Math.PI / 2;
        this.cameraAngleY = 0; // Horizontal view
        this.cameraRadius = 12;
    }
}

// Export for use in other files
window.RobotVisualization = RobotVisualization;
