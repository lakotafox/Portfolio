# Project Marker Tool

Simple tool for marking city tile locations where projects should appear.

## How to Use

1. **Open the Tool**
   - Open `input/project-marker.html` in a web browser
   - Marked tiles show a flag and X marker
   - Any tile can be marked
   - A window opens with the marked coordinates
   - Copy the data and add project details manually

## Controls

- **Arrow Keys / WASD**: Move player
- **ENTER**: Mark/unmark current tile



## Data Flow

1. Mark tiles with ENTER key
2. Export with E key → Opens window with code
3. Copy the code and save to `build-with-gui/project-marker/output/marked-locations.js`
4. Next time you open the tool, it loads your saved marks