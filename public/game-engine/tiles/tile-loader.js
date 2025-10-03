// tile image loader for Carcassonne game
// loads all tile images and flag image

export const tileImages = {};
export let flagPurpleImage = null; // purple flag for finished projects
export let flagRedImage = null; // red flag for placeholder projects

// define tile sets with their paths
const tileSets = [
    // grass tiles
    { folder: 'carcassonne_tiles_c3/', files: ['grass1.png', 'grass2.png', 'grass3.png', 'grass4.png', 'grass5.png'] },
    
    // c3 tiles
    { folder: 'carcassonne_tiles_c3/', files: [
        'tile_A.png', 'tile_B.png', 'tile_C.png', 'tile_D.png', 'tile_E.png',
        'tile_F.png', 'tile_G.png', 'tile_H.png', 'tile_I.png', 'tile_J.png',
        'tile_K.png', 'tile_M.png', 'tile_N.png', 'tile_O.png', 'tile_P.png',
        'tile_Q.png', 'tile_R.png', 'tile_S.png', 'tile_T.png', 'tile_U.png',
        'tile_V.png', 'tile_W.png', 'tile_X.png', 'tile_Y.png'
    ]},
    
    // water tiles
    { folder: 'water_tiles/', files: [
        'watertile_A.png', 'watertile_B.png', 'watertile_C.png', 'watertile_D.png',
        'watertile_E.png', 'watertile_F.png', 'watertile_G.png', 'watertile_H.png',
        'watertile_I.png', 'watertile_J.png', 'watertile_K.png', 'watertile_M.png',
        'watertile_N.png', 'watertile_O.png', 'watertile_P.png'
    ]}
];

export function loadAllImages() {
    const imageLoadPromises = [];
    
    // load tile images from each tile set
    tileSets.forEach(tileSet => {
        tileSet.files.forEach(fileName => {
            const img = new Image();
            const promise = new Promise((resolve) => {
                img.onload = () => {
                    tileImages[fileName] = img;
                    console.log(`Loaded tile: ${fileName}`);
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load tile image: ${fileName} from ${tileSet.folder}`);
                    resolve();
                };
            });
            img.src = `/tiles/${fileName}`;
            imageLoadPromises.push(promise);
        });
    });
    
    // load purple flag image (for finished projects)
    const flagPurpleImg = new Image();
    const flagPurplePromise = new Promise((resolve) => {
        flagPurpleImg.onload = () => {
            flagPurpleImage = flagPurpleImg;
            resolve();
        };
        flagPurpleImg.onerror = () => {
            console.error('Failed to load purple flag image');
            resolve();
        };
    });
    flagPurpleImg.src = '/tiles/flag purple.png';
    imageLoadPromises.push(flagPurplePromise);

    // load red flag image (for placeholder projects)
    const flagRedImg = new Image();
    const flagRedPromise = new Promise((resolve) => {
        flagRedImg.onload = () => {
            flagRedImage = flagRedImg;
            resolve();
        };
        flagRedImg.onerror = () => {
            console.error('Failed to load red flag image');
            resolve();
        };
    });
    flagRedImg.src = '/tiles/flag.png';
    imageLoadPromises.push(flagRedPromise);
    
    return Promise.all(imageLoadPromises);
}