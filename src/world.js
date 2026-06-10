export class WorldGenerator {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 32;
        this.chunkHeight = 16;
        // 3D Matrix array database to map item types
        this.matrix = Array(this.chunkSize).fill(null).map(() => 
            Array(this.chunkHeight).fill(null).map(() => 
                Array(this.chunkSize).fill(0)
            )
        );
        
        this.BLOCK_TYPES = { AIR: 0, DIRT: 1, STONE: 2, GRASS: 3, WOOD: 4 };
    }

    generateData() {
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                // Procedural generation equations
                const heightValue = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 4 + 8;
                const surfaceY = Math.floor(heightValue);

                for (let y = 0; y < this.chunkHeight; y++) {
                    if (y > surfaceY) {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.AIR;
                    } else if (y === surfaceY) {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.GRASS;
                    } else if (y > surfaceY - 3) {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.DIRT;
                    } else {
                        this.matrix[x][y][z] = this.BLOCK_TYPES.STONE;
                    }
                }
            }
        }
    }

    // World Optimizer Engine: Skips rendering hidden faces completely
    buildOptimizedMesh(material) {
        const instancedGeo = new THREE.BoxGeometry(1, 1, 1);
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let y = 0; y < this.chunkHeight; y++) {
                for (let z = 0; z < this.chunkSize; z++) {
                    const blockType = this.matrix[x][y][z];
                    if (blockType === this.BLOCK_TYPES.AIR) continue;

                    // Face Culling Logic Check: Is the block completely surrounded?
                    const left  = x > 0 ? this.matrix[x-1][y][z] : 0;
                    const right = x < this.chunkSize-1 ? this.matrix[x+1][y][z] : 0;
                    const below = y > 0 ? this.matrix[x][y-1][z] : 0;
                    const above = y < this.chunkHeight-1 ? this.matrix[x][y+1][z] : 0;
                    const front = z < this.chunkSize-1 ? this.matrix[x][y][z+1] : 0;
                    const back  = z > 0 ? this.matrix[x][y][z-1] : 0;

                    // If it is covered completely on all 6 sides, don't waste performance rendering it
                    if (left && right && below && above && front && back) continue;

                    // Draw Optimized block
                    const mesh = new THREE.Mesh(instancedGeo, material);
                    mesh.position.set(x, y, z);
                    this.scene.add(mesh);
                }
            }
        }
    }
}
