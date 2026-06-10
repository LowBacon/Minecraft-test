export class SimpleControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.pitchObject = new THREE.Object3D().add(camera);
        this.yawObject = new THREE.Object3D();
        
        // Dynamic spawn height depending on terrain
        this.yawObject.position.set(16, 14, 16); 
        this.yawObject.add(this.pitchObject);

        this.initListeners();
    }

    initListeners() {
        const inst = document.getElementById('instructions');
        inst.addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            inst.style.display = document.pointerLockElement === this.domElement ? 'none' : 'block';
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== this.domElement) return;
            
            this.yawObject.rotation.y -= e.movementX * 0.0025;
            this.pitchObject.rotation.x -= e.movementY * 0.0025;
            
            // Prevent camera flipping upside down
            this.pitchObject.rotation.x = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, this.pitchObject.rotation.x));
        });

        const handleKey = (code, val) => {
            switch (code) {
                case 'KeyW': case 'ArrowUp': this.moveForward = val; break;
                case 'KeyS': case 'ArrowDown': this.moveBackward = val; break;
                case 'KeyA': case 'ArrowLeft': this.moveLeft = val; break;
                case 'KeyD': case 'ArrowRight': this.moveRight = val; break;
            }
        };

        document.addEventListener('keydown', (e) => handleKey(e.code, true));
        document.addEventListener('keyup', (e) => handleKey(e.code, false));
    }

    update(delta) {
        // Safe cap for frame lag spikes
        if (delta > 0.1) delta = 0.1;

        const damping = 10.0;
        this.velocity.x -= this.velocity.x * damping * delta;
        this.velocity.z -= this.velocity.z * damping * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        const speed = 60.0; // Total movement force acceleration
        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;

        this.yawObject.translateX(-this.velocity.x * delta);
        this.yawObject.translateZ(this.velocity.z * delta);
    }

    getObject() { return this.yawObject; }
}
