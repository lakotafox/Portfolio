// Simple tile image loader for the portfolio
// Just loads tile images, no game rules needed

export const tileImages = {};

export function loadTileImages() {
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

    const promises = tilesToLoad.map(imageName => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                tileImages[imageName] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load tile image: ${imageName}`);
                resolve();
            };
            img.src = `build-with-gui/carc-map-mkr/tiles/${imageName}`;
        });
    });

    return Promise.all(promises);
}