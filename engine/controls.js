// engine/world.js

const HighSpeedMathematicalNoiseMachine = {
    permutationLookupArray: new Uint8Array(512),
    initializationVectorCompleted: false,
    initializeNoiseGenerativeBuffers: function() {
        const intermediateFisherYatesArray = new Uint8Array(256);
        for (let i = 0; i < 256; i++) intermediateFisherYatesArray[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = intermediateFisherYatesArray[i];
            intermediateFisherYatesArray[i] = intermediateFisherYatesArray[j];
            intermediateFisherYatesArray[j] = temp;
        }
        for (let i = 0; i < 256; i++) {
            this.permutationLookupArray[i] = intermediateFisherYatesArray[i];
            this.permutationLookupArray[i + 256] = intermediateFisherYatesArray[i];
        }
        this.initializationVectorCompleted = true;
    },
    computeFadeSCurveValue: function(t) {
        return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    },
    computeLinearInterpolationValue: function(t, a, b) {
        return a + t * (b - a);
    },
    computeDotProductGradients: function(hash, x, z) {
        const h = hash & 7;
        const u = h < 4 ? x : z;
        const v = h < 4 ? z : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    },
    sampleNoiseGridCoordinates2D: function(x, z) {
        if (!this.initializationVectorCompleted) this.initializeNoiseGenerativeBuffers();
        const X = Math.floor(x) & 255;
        const Z = Math.floor(z) & 255;
        const fx = x - Math.floor(x);
        const fz = z - Math.floor(z);
        const u = this.computeFadeSCurveValue(fx);
        const v = this.computeFadeSCurveValue(fz);
        const aa = this.permutationLookupArray[this.permutationLookupArray[X] + Z];
        const ab = this.permutationLookupArray[this.permutationLookupArray[X] + Z + 1];
        const ba = this.permutationLookupArray[this.permutationLookupArray[X + 1] + Z];
        const bb = this.permutationLookupArray[this.permutationLookupArray[X + 1] + Z + 1];
        return this.computeLinearInterpolationValue(v,
            this.computeLinearInterpolationValue(u, this.computeDotProductGradients(aa, fx, fz), this.computeDotProductGradients(ba, fx - 1.0, fz)),
            this.computeLinearInterpolationValue(u, this.computeDotProductGradients(ab, fx, fz - 1.0), this.computeDotProductGradients(bb, fx - 1.0, fz - 1.0))
        );
    }
};

const SegmentedVoxelDatabaseMemoryManager = {
    allocatedWorldDataBlocksMap: {}, 
    compiledGraphicChunkModulesMap: {}, 

    generateGlobalKeyCoordinatesHash: function(x, y, z) {
        return `${x},${y},${z}`;
    },
    generateChunkValidationKeyFlag: function(cx, cz) {
        return `${cx},${cz}_allocated`;
    },
    allocateProceduralLandscapeMapDatabaseSegment: function(chunkCoordX, chunkCoordZ) {
        const trackingKeyFlag = this.generateChunkValidationKeyFlag(chunkCoordX, chunkCoordZ);
        if (this.allocatedWorldDataBlocksMap[trackingKeyFlag]) return;

        const baseCalculationOffsetX = chunkCoordX * SYSTEM_CONSTANTS.CHUNK_SIZE_X;
        const baseCalculationOffsetZ = chunkCoordZ * SYSTEM_CONSTANTS.CHUNK_SIZE_Z;

        for (let localX = 0; localX < SYSTEM_CONSTANTS.CHUNK_SIZE_X; localX++) {
            for (let localZ = 0; localZ < SYSTEM_CONSTANTS.CHUNK_SIZE_Z; localZ++) {
                const globalCoordinateX = baseCalculationOffsetX + localX;
                const globalCoordinateZ = baseCalculationOffsetZ + localZ;

                const sampledMacroNoiseValue = HighSpeedMathematicalNoiseMachine.sampleNoiseGridCoordinates2D(globalCoordinateX * 0.012, globalCoordinateZ * 0.012) * 22.0;
                const sampledMicroNoiseValue = HighSpeedMathematicalNoiseMachine.sampleNoiseGridCoordinates2D(globalCoordinateX * 0.065, globalCoordinateZ * 0.065) * 4.0;
                const finalEvaluatedHeightValue = Math.floor(sampledMacroNoiseValue + sampledMicroNoiseValue + 26.0);
                const safeClampedSurfaceHeightY = Math.max(2, Math.min(SYSTEM_CONSTANTS.TOTAL_WORLD_HEIGHT - 2, finalEvaluatedHeightValue));

                for (let physicalHeightY = 0; physicalHeightY < SYSTEM_CONSTANTS.TOTAL_WORLD_HEIGHT; physicalHeightY++) {
                    const storageStringIndexKey = this.generateGlobalKeyCoordinatesHash(globalCoordinateX, physicalHeightY, globalCoordinateZ);
                    if (physicalHeightY === 0) {
                        this.allocatedWorldDataBlocksMap[storageStringIndexKey] = 4; 
                    } else if (physicalHeightY === safeClampedSurfaceHeightY) {
                        this.allocatedWorldDataBlocksMap[storageStringIndexKey] = (physicalHeightY < 14) ? 8 : 1;
                    } else if (physicalHeightY < safeClampedSurfaceHeightY && physicalHeightY > safeClampedSurfaceHeightY - 4) {
                        this.allocatedWorldDataBlocksMap[storageStringIndexKey] = 2; 
                    } else if (physicalHeightY <= safeClampedSurfaceHeightY - 4) {
                        const rand = Math.random();
                        this.allocatedWorldDataBlocksMap[storageStringIndexKey] = (rand < 0.025) ? 13 : ((rand < 0.030) ? 11 : 3);
                    } else if (physicalHeightY <= 13 && !this.allocatedWorldDataBlocksMap[storageStringIndexKey]) {
                        this.allocatedWorldDataBlocksMap[storageStringIndexKey] = 9; 
                    }
                }

                if (localX === 5 && localZ === 9 && Math.random() > 0.45 && safeClampedSurfaceHeightY > 14) {
                    if (this.allocatedWorldDataBlocksMap[this.generateGlobalKeyCoordinatesHash(globalCoordinateX, safeClampedSurfaceHeightY, globalCoordinateZ)] === 1) {
                        this.deployProceduralTreeStructureObject(globalCoordinateX, safeClampedSurfaceHeightY + 1, globalCoordinateZ);
                    }
                }
            }
        }
        this.allocatedWorldDataBlocksMap[trackingKeyFlag] = true;
    },
    deployProceduralTreeStructureObject: function(bx, by, bz) {
        const th = 4 + Math.floor(Math.random() * 2);
        for (let i = 0; i < th; i++) {
            this.allocatedWorldDataBlocksMap[this.generateGlobalKeyCoordinatesHash(bx, by + i, bz)] = 5;
        }
        const lh = by + th - 1;
        for (let ox = -2; ox <= 2; ox++) {
            for (let oz = -2; oz <= 2; oz++) {
                for (let oy = -1; oy <= 2; oy++) {
                    const key = this.generateGlobalKeyCoordinatesHash(bx + ox, lh + oy, bz + oz);
                    if (!this.allocatedWorldDataBlocksMap[key]) {
                        if (Math.abs(ox) === 2 && Math.abs(oz) === 2 && Math.random() < 0.5) continue;
                        this.allocatedWorldDataBlocksMap[key] = 6;
                    }
                }
            }
        }
    }
};

const CompactBufferGeometryCompilerPipeline = {
    executeSubChunkGeometryMeshCompilation: function(chunkVectorX, chunkVectorY, chunkVectorZ) {
        const compositionMeshLookupId = `${chunkVectorX},${chunkVectorY},${chunkVectorZ}`;
        const targetedActiveScene = RuntimeEngineGlobalStateVariables.threeJsSceneInstance;

        if (SegmentedVoxelDatabaseMemoryManager.compiledGraphicChunkModulesMap[compositionMeshLookupId]) {
            targetedActiveScene.remove(SegmentedVoxelDatabaseMemoryManager.compiledGraphicChunkModulesMap[compositionMeshLookupId]);
            SegmentedVoxelDatabaseMemoryManager.compiledGraphicChunkModulesMap[compositionMeshLookupId].geometry.dispose();
            delete SegmentedVoxelDatabaseMemoryManager.compiledGraphicChunkModulesMap[compositionMeshLookupId];
        }

        SegmentedVoxelDatabaseMemoryManager.allocateProceduralLandscapeMapDatabaseSegment(chunkVectorX, chunkVectorZ);

        const dynamicPositionVerticesVectorBuffer = [];
        const dynamicColorVerticesVectorBuffer = [];

        const coordinateCalculatedStartX = chunkVectorX * SYSTEM_CONSTANTS.CHUNK_SIZE_X;
        const coordinateCalculatedStartY = chunkVectorY * SYSTEM_CONSTANTS.CHUNK_SIZE_Y;
        const coordinateCalculatedStartZ = chunkVectorZ * SYSTEM_CONSTANTS.CHUNK_SIZE_Z;

        const modular3DBoxFacesDefinitions = [
            { normalDirectionVector: [0, 0, 1], verticesLayoutMatrix: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]] },
            { normalDirectionVector: [0, 0,-1], verticesLayoutMatrix: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]] },
            { normalDirectionVector: [0, 1, 0], verticesLayoutMatrix: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]] },
            { normalDirectionVector: [0,-1, 0], verticesLayoutMatrix: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]] },
            { normalDirectionVector: [1, 0, 0], verticesLayoutMatrix: [[ 0.5,-0.5, 0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5]] },
            { normalDirectionVector: [-1, 0, 0], verticesLayoutMatrix: [[-0.5,-0.5,-0.5],[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5]] }
        ];

        for (let indexX = 0; indexX < SYSTEM_CONSTANTS.CHUNK_SIZE_X; indexX++) {
            for (let indexZ = 0; indexZ < SYSTEM_CONSTANTS.CHUNK_SIZE_Z; indexZ++) {
                for (let indexY = 0; indexY < SYSTEM_CONSTANTS.CHUNK_SIZE_Y; indexY++) {

                    const actualAbsolutePositionX = coordinateCalculatedStartX + indexX;
                    const actualAbsolutePositionY = coordinateCalculatedStartY + indexY;
                    const actualAbsolutePositionZ = coordinateCalculatedStartZ + indexZ;

                    const elementLookupStorageKey = SegmentedVoxelDatabaseMemoryManager.generateGlobalKeyCoordinatesHash(actualAbsolutePositionX, actualAbsolutePositionY, actualAbsolutePositionZ);
                    const currentRegisteredVoxelId = SegmentedVoxelDatabaseMemoryManager.allocatedWorldDataBlocksMap[elementLookupStorageKey];

                    if (!currentRegisteredVoxelId) continue;

                    const voxelSpecificationMetadata = EngineGlobalVoxelRegistry[currentRegisteredVoxelId];
                    const baseThreeColorFormat = new THREE.Color(voxelSpecificationMetadata.color);

                    for (let faceIdx = 0; faceIdx < modular3DBoxFacesDefinitions.length; faceIdx++) {
                        const currentFaceObjectData = modular3DBoxFacesDefinitions[faceIdx];
                        
                        const neighborBlockCoordX = actualAbsolutePositionX + currentFaceObjectData.normalDirectionVector[0];
                        const neighborBlockCoordY = actualAbsolutePositionY + currentFaceObjectData.normalDirectionVector[1];
                        const neighborBlockCoordZ = actualAbsolutePositionZ + currentFaceObjectData.normalDirectionVector[2];

                        if (neighborBlockCoordY >= 0 && neighborBlockCoordY < SYSTEM_CONSTANTS.TOTAL_WORLD_HEIGHT) {
                            const neighborVoxelLookupKey = SegmentedVoxelDatabaseMemoryManager.generateGlobalKeyCoordinatesHash(neighborBlockCoordX, neighborBlockCoordY, neighborBlockCoordZ);
                            const neighborRegisteredVoxelId = SegmentedVoxelDatabaseMemoryManager.allocatedWorldDataBlocksMap[neighborVoxelLookupKey];

                            if (RuntimeEngineGlobalStateVariables.systemConfigAggressiveCullingActive && neighborRegisteredVoxelId) {
                                if (EngineGlobalVoxelRegistry[neighborRegisteredVoxelId].isSolid && EngineGlobalVoxelRegistry[neighborRegisteredVoxelId].opacity === 1.0) {
                                    continue; 
                                }
                            }
                        }

                        for (let vertexLayoutIdx = 0; vertexLayoutIdx < currentFaceObjectData.verticesLayoutMatrix.length; vertexLayoutIdx++) {
                            const currentVertexVectorArray = currentFaceObjectData.verticesLayoutMatrix[vertexLayoutIdx];
                            
                            dynamicPositionVerticesVectorBuffer.push(
                                currentVertexVectorArray[0] + actualAbsolutePositionX,
                                currentVertexVectorArray[1] + actualAbsolutePositionY,
                                currentVertexVectorArray[2] + actualAbsolutePositionZ
                            );

                            let softShadingFactor = 1.0;
                            if (currentFaceObjectData.normalDirectionVector[1] === -1) softShadingFactor = 0.65; 
                            if (Math.abs(currentFaceObjectData.normalDirectionVector[0]) === 1) softShadingFactor = 0.82;
                            if (Math.abs(currentFaceObjectData.normalDirectionVector[2]) === 1) softShadingFactor = 0.90;

                            dynamicColorVerticesVectorBuffer.push(
                                baseThreeColorFormat.r * softShadingFactor,
                                baseThreeColorFormat.g * softShadingFactor,
                                baseThreeColorFormat.b * softShadingFactor
                            );
                        }
                    }
                }
            }
        }

        if (dynamicPositionVerticesVectorBuffer.length === 0) return;

        const processedHardwareBufferGeometry = new THREE.BufferGeometry();
        processedHardwareBufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dynamicPositionVerticesVectorBuffer, 3));
        processedHardwareBufferGeometry.setAttribute('color', new THREE.Float32BufferAttribute(dynamicColorVerticesVectorBuffer, 3));
        processedHardwareBufferGeometry.computeVertexNormals();

        const targetMeshMaterialNode = new THREE.MeshLambertMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 1.0
        });

        const completeSynthesizedChunkMeshNode = new THREE.Mesh(processedHardwareBufferGeometry, targetMeshMaterialNode);
        targetedActiveScene.add(completeSynthesizedChunkMeshNode);
        SegmentedVoxelDatabaseMemoryManager.compiledGraphicChunkModulesMap[compositionMeshLookupId] = completeSynthesizedChunkMeshNode;
    }
};
