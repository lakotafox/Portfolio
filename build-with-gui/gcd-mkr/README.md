# MinCoins Builder

Visual tool for creating MinCoins interactive programming environments.

## How to Use

1. **Open the Tool**
   - Open `input/mincoins-mkr.html` in a web browser
   - The item palette appears at the bottom

2. **Place Items**
   - Drag items from palette:
     - Signs: Display text/instructions
     - Terminal: Shows program output
     - Buttons: Run button and number keys (0-9)
   - Single click to delete items
   - Click and hold to drag items
   - Drag corners to resize
   - Double-click signs to edit text

3. **Navigate**
   - Use WASD keys or arrow keys to move around
   - The view scrolls to follow movement

4. **Export Layout**
   - Click "Export JSON" button
   - Copy the generated items array
   - Paste into the `layoutItems` array in MinCoins area HTML

## Controls

- **Drag from Palette**: Add new item
- **Single Click**: Delete item
- **Click & Hold**: Move item
- **Drag Corners**: Resize item
- **Double Click**: Edit sign text
- **WASD/Arrows**: Navigate view

## Notes

- The builder uses absolute positioning for precise layouts
- All items can be resized and repositioned
- The export format matches what MinCoins area expects