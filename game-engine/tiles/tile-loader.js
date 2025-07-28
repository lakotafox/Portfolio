// Tile image loader for Carcassonne game
// Loads all tile images and flag image

export const tileImages = {};
export let flagImage = null;

const tilesToLoad = [
    'grass1.jpeg', 'grass2.jpeg', 'grass3.jpeg', 
    'CastleCenter0.png', 'CastleEdge0.png', 'CastleEdge1.png', 'CastleEdge2.png', 'CastleEdge3.png',
    'CastleWall0.png', 'CastleWall1.png', 'CastleWall2.png', 'CastleWall3.png',
    'CastleSides0.png', 'CastleSides1.png', 'CastleTube0.png', 'CastleTube1.png',
    'CastleEdgeRoad0.png', 'CastleEdgeRoad1.png', 'CastleEdgeRoad2.png', 'CastleEdgeRoad3.png',
    'CastleSidesEdge0.png', 'CastleSidesEdge1.png', 'CastleSidesEdge2.png', 'CastleSidesEdge3.png',
    'Monastery0.png', 'MonasteryRoad0.png', 'MonasteryRoad1.png', 'MonasteryRoad2.png', 'MonasteryRoad3.png',
    'Road0.png', 'Road1.png', 'RoadCurve0.png', 'RoadCurve1.png', 'RoadCurve2.png', 'RoadCurve3.png',
    'RoadJunctionLarge0.png', 'RoadJunctionSmall0.png', 'RoadJunctionSmall1.png', 'RoadJunctionSmall2.png', 'RoadJunctionSmall3.png',
    'Null0.png'
];

export function loadAllImages() {
    const imageLoadPromises = [];
    
    // Load tile images
    tilesToLoad.forEach(imageName => {
        const img = new Image();
        const promise = new Promise((resolve) => {
            img.onload = () => {
                tileImages[imageName] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load tile image: ${imageName}`);
                resolve();
            };
        });
        img.src = `../build-with-gui/carc-map-mkr/tiles/${imageName}`;
        imageLoadPromises.push(promise);
    });
    
    // Load flag image
    const flagImg = new Image();
    const flagPromise = new Promise((resolve) => {
        flagImg.onload = () => {
            flagImage = flagImg;
            resolve();
        };
        flagImg.onerror = () => {
            console.error('Failed to load flag image');
            resolve();
        };
    });
    flagImg.src = '../build-with-gui/carc-map-mkr/tiles/flag.png';
    imageLoadPromises.push(flagPromise);
    
    return Promise.all(imageLoadPromises);
}