// engine/config.js

const SYSTEM_CONSTANTS = {
    CHUNK_SIZE_X: 16,
    CHUNK_SIZE_Z: 16,
    CHUNK_SIZE_Y: 16,
    WORLD_MAX_CHUNKS_Y: 4, 
    TOTAL_WORLD_HEIGHT: 64,
    PLAYER_COLLISION_RADIUS: 0.26,
    PLAYER_PHYSICAL_HEIGHT: 1.60,
    PHYSICAL_GRAVITY_ACCEL: 24.0,
    PHYSICAL_TERMINAL_VELOCITY: 55.0,
    PLAYER_HORIZONTAL_WALK_SPEED: 6.8,
    PLAYER_VERTICAL_JUMP_VELOCITY: 7.8,
    MAX_RAYCAST_REACH_LIMIT: 7.0
};

const EngineGlobalVoxelRegistry = {
    1:  { id: 1,  name: "Grass Cover Voxel",    color: 0x4caf50, isSolid: true,  opacity: 1.0 },
    2:  { id: 2,  name: "Topsoil Dirt Voxel",    color: 0x795548, isSolid: true,  opacity: 1.0 },
    3:  { id: 3,  name: "Subsurface Hardstone",  color: 0x9e9e9e, isSolid: true,  opacity: 1.0 },
    4:  { id: 4,  name: "Bedrock Foundation",    color: 0x212121, isSolid: true,  opacity: 1.0 },
    5:  { id: 5,  name: "Structural Oak Log",    color: 0x5d4037, isSolid: true,  opacity: 1.0 },
    6:  { id: 6,  name: "Dense Canopy Leaves",   color: 0x2e7d32, isSolid: true,  opacity: 0.85 },
    7:  { id: 7,  name: "Refinement Timber Plank",color: 0xd7ccc8, isSolid: true,  opacity: 1.0 },
    8:  { id: 8,  name: "Coastal Sand Deposits", color: 0xfff59d, isSolid: true,  opacity: 1.0 },
    9:  { id: 9,  name: "Liquid Water Element",  color: 0x2196f3, isSolid: false, opacity: 0.60 },
    10: { id: 10, name: "Industrial Kiln Brick", color: 0xe53935, isSolid: true,  opacity: 1.0 },
    11: { id: 11, name: "Solid Matrix Gold Block",color: 0xffd54f, isSolid: true,  opacity: 1.0 },
    12: { id: 12, name: "Obsidian Core Volcanic", color: 0x120c1f, isSolid: true,  opacity: 1.0 },
    13: { id: 13, name: "Subterranean Coal Ore",  color: 0x37474f, isSolid: true,  opacity: 1.0 },
    14: { id: 14, name: "Luminous Glowstone",    color: 0xffb74d, isSolid: true,  opacity: 1.0 },
    15: { id: 15, name: "Laboratory Glass Pane", color: 0xe0f7fa, isSolid: true,  opacity: 0.40 }
};

const RuntimeEngineGlobalStateVariables = {
    viewportDomContainerRef: null,
    threeJsSceneInstance: null,
    threeJsMainCameraInstance: null,
    threeJsRendererInstance: null,
    pointerLockControlsInstance: null,
    isCreativeCatalogPanelActive: false,
    isSettingsControlPanelActive: false,
    currentActiveHotbarArray: [1, 2, 3, 5, 15],
    currentActiveHotbarSelectionIdx: 0,
    rollingFrameCounterMetric: 0,
    lastFrameMetricsCollectionTimestamp: 0,
    cachedTotalRenderedVoxelsCount: 0,
    cachedCulledModulesCount: 0,
    systemConfigRadiusRenderDistance: 2,
    systemConfigAggressiveCullingActive: true,
    deviceThreadResolutionScaleFactor: 1.0
};

const ActorKineticTranslationalState = {
    keyStateForwardActive: false,
    keyStateBackwardActive: false,
    keyStateLeftActive: false,
    keyStateRightActive: false,
    actorIsOnGroundAnchor: false,
    actorCurrentVelocityVector: new THREE.Vector3(),
    frameDeltaClockInstance: new THREE.Clock()
};
