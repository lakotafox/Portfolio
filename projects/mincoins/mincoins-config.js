// MinCoins Configuration
// All game constants and settings

export const MINCOINS_CONFIG = {
    // Player settings
    PLAYER_START_X: 400,
    PLAYER_START_Y: 300,
    PLAYER_SPEED: 5,
    PLAYER_WIDTH: 16,
    PLAYER_HEIGHT: 16,
    
    // Camera settings
    CAMERA_START_X: 400,
    CAMERA_START_Y: 300,
    ZOOM_MIN: 0.5,
    ZOOM_MAX: 2,
    ZOOM_SPEED: 0.1,
    
    // Interaction settings
    INTERACTION_DISTANCE: 50,
    
    // Code display settings
    LINE_HEIGHT: 20,
    FONT_SIZE: 14,
    PADDING: 40,
    CODE_WIDTH: 800,
    CODE_START_X: 50,
    CODE_START_Y: 50,
    
    // Terminal settings
    TERMINAL_LINE_HEIGHT: 14,
    TERMINAL_FONT: '12px monospace',
    TERMINAL_COLOR: '#00ff00',
    
    // Sprite files
    SPRITE_FILES: [
        { direction: 'down', file: '../../game-engine/player/sprites/player-down.png' },
        { direction: 'up', file: '../../game-engine/player/sprites/player-up.png' },
        { direction: 'right', file: '../../game-engine/player/sprites/player-right.png' }
    ],
    
    // NetBeans screenshot
    CODE_IMAGE_PATH: 'mincoins-netbeans.png'
};