// tile definitions for Carcassonne map maker
// all available tiles organized by category

// define tile sets
const TILE_SETS = {
    c3: 'Carcassonne C3',
    water: 'Water Tiles'
};

// current active tile sets
let activeTileSets = ['c3', 'water'];

// all tiles organized by set
const ALL_TILES = {
    c3: [
        // c3 tiles from carcassonne_tiles_c3 folder
        { name: 'C3 Tile A', file: 'tile_A.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile B', file: 'tile_B.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile C', file: 'tile_C.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile D', file: 'tile_D.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile E', file: 'tile_E.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile F', file: 'tile_F.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile G', file: 'tile_G.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile H', file: 'tile_H.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile I', file: 'tile_I.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile J', file: 'tile_J.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile K', file: 'tile_K.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile M', file: 'tile_M.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile N', file: 'tile_N.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile O', file: 'tile_O.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile P', file: 'tile_P.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile Q', file: 'tile_Q.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile R', file: 'tile_R.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile S', file: 'tile_S.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile T', file: 'tile_T.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile U', file: 'tile_U.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile V', file: 'tile_V.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile W', file: 'tile_W.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile X', file: 'tile_X.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'C3 Tile Y', file: 'tile_Y.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        
        // grass tiles
        { name: 'Grass 1', file: 'grass1.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'Grass 2', file: 'grass2.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'Grass 3', file: 'grass3.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'Grass 4', file: 'grass4.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' },
        { name: 'Grass 5', file: 'grass5.png', type: 'c3', folder: '../../../carcassonne_tiles_c3/' }
    ],
    
    water: [
        // water tiles from water_tiles folder
        { name: 'Water Tile A', file: 'watertile_A.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile B', file: 'watertile_B.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile C', file: 'watertile_C.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile D', file: 'watertile_D.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile E', file: 'watertile_E.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile F', file: 'watertile_F.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile G', file: 'watertile_G.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile H', file: 'watertile_H.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile I', file: 'watertile_I.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile J', file: 'watertile_J.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile K', file: 'watertile_K.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile M', file: 'watertile_M.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile N', file: 'watertile_N.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile O', file: 'watertile_O.png', type: 'water', folder: '../../../water_tiles/' },
        { name: 'Water Tile P', file: 'watertile_P.png', type: 'water', folder: '../../../water_tiles/' }
    ]
};

// get active tiles based on selected sets
function getActiveTiles() {
    let tiles = [];
    activeTileSets.forEach(setName => {
        if (ALL_TILES[setName]) {
            tiles = tiles.concat(ALL_TILES[setName]);
        }
    });
    return tiles;
}

// for backward compatibility
let TILE_TYPES = getActiveTiles();

// tile ID mapping for compact export format
const TILE_ID_MAP = {
    // c3 tiles
    'tile_A.png': 'c3A',
    'tile_B.png': 'c3B',
    'tile_C.png': 'c3C',
    'tile_D.png': 'c3D',
    'tile_E.png': 'c3E',
    'tile_F.png': 'c3F',
    'tile_G.png': 'c3G',
    'tile_H.png': 'c3H',
    'tile_I.png': 'c3I',
    'tile_J.png': 'c3J',
    'tile_K.png': 'c3K',
    'tile_M.png': 'c3M',
    'tile_N.png': 'c3N',
    'tile_O.png': 'c3O',
    'tile_P.png': 'c3P',
    'tile_Q.png': 'c3Q',
    'tile_R.png': 'c3R',
    'tile_S.png': 'c3S',
    'tile_T.png': 'c3T',
    'tile_U.png': 'c3U',
    'tile_V.png': 'c3V',
    'tile_W.png': 'c3W',
    'tile_X.png': 'c3X',
    'tile_Y.png': 'c3Y',
    
    // water tiles
    'watertile_A.png': 'waterA',
    'watertile_B.png': 'waterB',
    'watertile_C.png': 'waterC',
    'watertile_D.png': 'waterD',
    'watertile_E.png': 'waterE',
    'watertile_F.png': 'waterF',
    'watertile_G.png': 'waterG',
    'watertile_H.png': 'waterH',
    'watertile_I.png': 'waterI',
    'watertile_J.png': 'waterJ',
    'watertile_K.png': 'waterK',
    'watertile_M.png': 'waterM',
    'watertile_N.png': 'waterN',
    'watertile_O.png': 'waterO',
    'watertile_P.png': 'waterP'
};