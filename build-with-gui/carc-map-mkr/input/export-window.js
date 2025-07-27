

// Export the current map to compact format
function exportMap() {
    // Convert to compact format
    const compactMap = mapGrid.map(row => 
        row.map(cell => {
            if (!cell || !cell.tile) return 'g1'; // default to grass1
            
            const tileId = TILE_ID_MAP[cell.tile.file] || 'g1';
            
            // Only include rotation if it's not 0
            if (cell.rotation && cell.rotation !== 0) {
                return [tileId, cell.rotation];
            }
            return tileId;
        })
    );
    
    // NOTE: This JavaScript code generates JavaScript code as a string! HAHAHAHAHAHAHAH!
   
    // We're using template literals to build formatted JS arrays that will be
    // shown to the user and can be copied into their game files HAHAHA


    const mapCode = `// Map data exported from Map Maker
const MAP = [
${compactMap.map((row, i) => 
    `  // Row ${i}\n  [${row.map(cell => 
        Array.isArray(cell) ? `['${cell[0]}',${cell[1]}]` : `'${cell}'`
    ).join(', ')}]`
).join(',\n')}
];`;
    
    // Open export window
    const exportWindow = window.open('', 'Export Map', 'width=800,height=600');
    exportWindow.document.write(`
        <html>
        <head>
            <title>Export Map Data</title>
            <style>
                body { 
                    font-family: monospace; 
                    padding: 20px; 
                    background: #1a1a1a; 
                    color: #fff; 
                }
                pre { 
                    background: #2a2a2a; 
                    padding: 20px; 
                    border-radius: 5px; 
                    overflow: auto; 
                }
                button { 
                    background: #3498db; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    margin: 10px 5px; 
                    cursor: pointer; 
                    border-radius: 5px; 
                }
                button:hover { 
                    background: #2980b9; 
                }
                .info { 
                    color: #f39c12; 
                    margin-bottom: 20px; 
                }
            </style>
        </head>
        <body>
            <h2>Map Data Export</h2>
            <div class="info">
                <p>Map exported in compact format (90% smaller!)</p>
                <p>Copy this data to: build-with-gui/carc-map-mkr/output/exported-map-compact.js</p>
            </div>
            <button onclick="navigator.clipboard.writeText(document.getElementById('mapData').textContent).then(() => alert('Copied to clipboard!'))">
                Copy to Clipboard
            </button>
            <button onclick="window.close()">Close</button>
            <pre id="mapData">${mapCode}</pre>
        </body>
        </html>
    `);
}

