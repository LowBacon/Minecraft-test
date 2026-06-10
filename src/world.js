export class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 32; 
        this.chunkHeight = 24;
        
        this.matrix = Array(this.chunkSize).fill(null).map(() => 
            Array(this.chunkHeight).fill(null).map(() => 
                Array(this.chunkSize).fill(0)
            )
        );
        
        this.BLOCK_TYPES = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4 };

        // Color fallback engine definitions to prevent black blocks if texture drops
        this.materials = {
            1: new THREE.MeshLambertMaterial({ color: 0x5c8e32 }), // Grass
            2: new THREE.MeshLambertMaterial({ color: 0x866043 }), // Dirt
            3: new THREE.MeshLambertMaterial({ color: 0x737373 }), // Stone
            4: new THREE.MeshLambertMaterial({ color: 0xa0764c })  // Wood
        };
    }

    generateData() {
        // High-speed mathematical wave generation loop
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                
                // Advanced combined wave structure simulating organic terrain noise variations
                let n1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 5;
                let n2 = Math.sin(x * 0.3) * Math.sin(z * 0.3) * 2;
                let heightValue = n1 + n2 + 10;
                
                let surfaceY = Math.floor(heightValue);

                for (let y = 0; y < this.chunkHeight; y++) {
                    if (y > surfaceY) {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.AIR;
                    } else if (y === surfaceY) {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.GRASS;
                    } else if (y > surfaceY - 4) {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.DIRT;
                    } else {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.STONE;
                    }
                }
            }
        }
    }

    buildOptimizedMesh(textureMaterial) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        
        // Loop over 3D Matrix space boundaries
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.chunkHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    
                    const type = this.matrix[x][y][z];
                    if (type === this.BLOCK_TYPES.AIR) continue;

                    // Compute occlusion borders across surrounding neighbor blocks
                    const left   = x > 0 ? this.matrix[x-1][y][z] : 0;
                    const right  = x < this.chunkSize-1 ? this.matrix[x+1][y][z] : 0;
                    const bottom = y > 0 ? this.matrix[x][y-1][z] : 0;
                    const top    = y < this.chunkHeight-1 ? this.matrix[x][y+1][z] : 0;
                    const front  = z < this.chunkSize-1 ? this.matrix[x][y][z+1] : 0;
                    const back   = z > 0 ? this.matrix[x][y][z-1] : 0;

                    // Culling check: bypass generation loops for buried nodes entirely
                    if (left && right && bottom && top && front && back) continue;

                    // Fallback configuration selection logic 
                    let blockMat = textureMaterial ? textureMaterial : this.materials[type];

                    const blockMesh = new THREE.Mesh(geo, blockMat);
                    blockMesh.position.set(x, y, z);
                    
                    // Optimization flag adjustments
                    blockMesh.matrixAutoUpdate = false;
                    blockMesh.updateMatrix();
                    
                    this.scene.add(blockMesh);
                }
            }
        }
    }
}
