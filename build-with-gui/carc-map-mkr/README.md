# Carcassonne Map Maker

Visual tool for creating Carcassonne tile maps.

## How to Use

1. **Open the Tool**
   - Open `input/map-maker.html` in a web browser (original)
   - Or try `input/map-maker-refactored.html` (modular version)
   - The tile palette appears on the left side

2. **Place Tiles**
   - Drag tiles from the palette onto the grid
   - Click rotate button to rotate them (0°, 90°, 180°, 270°)
   
3. **Export Map**
   - Click "Export Map" button
   - Copy the generated compact map data
   - Save to `output/exported-map-compact.js`

## Output

The updated tool generates map data that is 90% smaller 
The exported data is used by the main Carcassonne portfolio game.