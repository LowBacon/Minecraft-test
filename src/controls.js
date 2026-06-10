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
        this.yawObject.position.set(16, 20, 16); // Spawn point safely high up
        this.yawObject.add(this.pitchObject);

        this.initListeners();
    }

    initListeners() {
        document.getElementById('instructions').addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            document.getElementById('instructions').style.display = 
                document.pointerLockElement === this.domElement ? 'none' : 'block';
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement !== this.domElement) return;
            this.yawObject.rotation.y -= e.movementX * 0.0025;
            this.pitchObject.rotation.x -= e.movementY * 0.0025;
            this.pitchObject.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitchObject.rotation.x));
        });

        const toggleKey = (code, isDown) => {
            switch (code) {
                case 'KeyW': this.moveForward = isDown; break;
                case 'KeyS': this.moveBackward = isDown; break;
                case 'KeyA': this.moveLeft = isDown; break;
                case 'KeyD': this.moveRight = isDown; break;
            }
        };

        document.addEventListener('keydown', (e) => toggleKey(e.code, true));
        document.addEventListener('keyup', (e) => toggleKey(e.code, false));
    }

    update(delta) {
        if (document.pointerLockElement !== this.domElement) return;

        const speed = 14.0;
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;

        this.yawObject.translateX(-this.velocity.x * delta);
        this.yawObject.translateZ(this.velocity.z * delta);
    }

    getObject() { return this.yawObject; }
}
