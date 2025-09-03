// Three.js Setup for Cable Robot 3D Visualization
class RobotVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.robot = null;
        this.cables = [];
        this.anchors = [];
        this.workspace = null;
        
        this.init();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(15, 15, 15);

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

        // Create cable anchors
        this.createAnchors();

        // Create robot
        this.createRobot();

        // Create cables
        this.createCables();

        // Controls
        this.setupControls();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
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
        // Create workspace boundaries (10x10x5 meters)
        const workspaceGeometry = new THREE.BoxGeometry(20, 20, 10);
        const workspaceMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.workspace = new THREE.Mesh(workspaceGeometry, workspaceMaterial);
        this.workspace.position.set(0, 0, 2.5);
        this.scene.add(this.workspace);

        // Add grid
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
        gridHelper.position.y = -2.5;
        this.scene.add(gridHelper);
    }

    createAnchors() {
        // Create 8 anchor points for cables (corners of workspace)
        const positions = [
            [-10, -10, 7.5], [10, -10, 7.5], [10, 10, 7.5], [-10, 10, 7.5],  // Top corners
            [-10, -10, -2.5], [10, -10, -2.5], [10, 10, -2.5], [-10, 10, -2.5]  // Bottom corners
        ];

        positions.forEach((pos, index) => {
            const anchorGeometry = new THREE.SphereGeometry(0.3, 16, 16);
            const anchorMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff4444,
                metalness: 0.7,
                roughness: 0.3
            });
            const anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
            anchor.position.set(pos[0], pos[1], pos[2]);
            anchor.castShadow = true;
            this.scene.add(anchor);
            this.anchors.push(anchor);
        });
    }

    createRobot() {
        // Create robot group
        this.robot = new THREE.Group();

        // Main body
        const bodyGeometry = new THREE.BoxGeometry(1, 1, 0.5);
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
        const cameraGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
        const cameraMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.position.set(0, 0, 0.4);
        camera.castShadow = true;
        this.robot.add(camera);

        // LED indicators
        for (let i = 0; i < 4; i++) {
            const ledGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const ledMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                emissive: 0x002200
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            const angle = (i / 4) * Math.PI * 2;
            led.position.set(Math.cos(angle) * 0.6, Math.sin(angle) * 0.6, 0.3);
            this.robot.add(led);
        }

        // Set initial position
        this.robot.position.set(0, 0, 2.5);
        this.scene.add(this.robot);
    }

    createCables() {
        // Create cables connecting robot to anchors
        this.anchors.forEach((anchor, index) => {
            const points = [
                anchor.position.clone(),
                this.robot.position.clone()
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
                color: 0xffaa00,
                linewidth: 3
            });
            const cable = new THREE.Line(geometry, material);
            this.scene.add(cable);
            this.cables.push(cable);
        });
    }

    setupControls() {
        // Mouse controls for camera
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (event) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                };

                const deltaRotationQuaternion = new THREE.Quaternion()
                    .setFromEuler(new THREE.Euler(
                        deltaMove.y * 0.01,
                        deltaMove.x * 0.01,
                        0,
                        'XYZ'
                    ));

                this.camera.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.camera.quaternion);
                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Zoom control
        this.renderer.domElement.addEventListener('wheel', (event) => {
            const zoomSpeed = 0.1;
            const direction = event.deltaY > 0 ? 1 : -1;
            
            this.camera.position.multiplyScalar(1 + direction * zoomSpeed);
            event.preventDefault();
        });
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
            const points = [
                this.anchors[index].position.clone(),
                this.robot.position.clone()
            ];
            cable.geometry.setFromPoints(points);
        });
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate robot slightly for visual effect
        if (this.robot) {
            this.robot.rotation.z += 0.001;
        }

        // Make camera orbit around the center
        const time = Date.now() * 0.0005;
        this.camera.position.x = Math.cos(time) * 20;
        this.camera.position.z = Math.sin(time) * 20 + 10;
        this.camera.lookAt(this.scene.position);

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
