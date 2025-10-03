// project/City Management Module
// handles project definitions, collision detection, and UI interactions

// projects/Cities data - will be placed in predefined city locations
const projects = [
    {
        id: 1,
        name: "MinCoins Calculator",
        desc: "Java Coin Change Algorithm",
        url: "mincoins",
        type: "code",
        x: 2,
        y: 5
    },
    {
        id: 2,
        name: "Pixel Keep",
        desc: "Retro Game Engine",
        url: "https://example.com/project2",
        x: 6,
        y: 4
    },
    {
        id: 3,
        name: "Quantum Monastery",
        desc: "Quantum Computing Simulator",
        url: "https://example.com/project3",
        x: 13,
        y: 7
    },
    {
        id: 4,
        name: "Castle Algorithms",
        desc: "Data Structure Visualizer",
        url: "https://example.com/project4",
        x: 11,
        y: 11
    },
    {
        id: 5,
        name: "Road Network",
        desc: "Graph Theory Explorer",
        url: "https://example.com/project5",
        x: 1,
        y: 10
    },
    {
        id: 6,
        name: "Field of Dreams",
        desc: "ML Crop Predictor",
        url: "https://example.com/project6",
        x: 10,
        y: 2
    },
    {
        id: 7,
        name: "Medieval Marketplace",
        desc: "E-commerce Platform",
        url: "https://example.com/project7",
        x: 4,
        y: 12
    },
    {
        id: 8,
        name: "City State Manager",
        desc: "Resource Allocation System",
        url: "https://example.com/project8",
        x: 9,
        y: 7
    }
];

// state management
let currentProject = null;
let markingMode = false;
let markedLocations = [];

// get DOM elements after page loads
let cityInfo = null;
let cityName = null;
let cityDesc = null;
let projectViewer = null;
let projectFrame = null;

// initialize DOM elements
function initProjectDOM() {
    cityInfo = document.getElementById('cityInfo');
    cityName = document.getElementById('cityName');
    cityDesc = document.getElementById('cityDesc');
    projectViewer = document.getElementById('projectViewer');
    projectFrame = document.getElementById('projectFrame');
}

// check if player is on a project tile
function checkProjectCollision(playerX, playerY, mapGrid, TILE_SIZE, GRID_SIZE) {
    const tileX = Math.floor(playerX / TILE_SIZE);
    const tileY = Math.floor(playerY / TILE_SIZE);
    
    if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
        const tile = mapGrid[tileY][tileX];
        if (tile && tile.project) {
            if (currentProject !== tile.project) {
                currentProject = tile.project;
                showCityInfo(currentProject);
            }
        } else if (currentProject) {
            currentProject = null;
            hideCityInfo();
        }
    }
}

// show city info UI
function showCityInfo(project) {
    if (!cityInfo || !cityName || !cityDesc) return;
    cityName.textContent = project.name;
    cityDesc.textContent = project.desc;
    cityInfo.classList.add('active');
}

// hide city info UI
function hideCityInfo() {
    if (!cityInfo) return;
    cityInfo.classList.remove('active');
}

// open project in viewer
function openProject(project) {
    if (!projectViewer || !projectFrame) return;
    console.log('Opening project:', project.name, 'Type:', project.type);
    
    if (project.type === 'code') {
        // open code viewer for code projects
        openCodeViewer(project);
    } else {
        // open iframe for regular projects
        projectFrame.src = project.url;
        projectViewer.classList.add('active');
    }
}

// close project viewer
function closeProject() {
    if (!projectViewer || !projectFrame) return;
    projectViewer.classList.remove('active');
    projectFrame.src = '';
}

// code viewer functions
function openCodeViewer(project) {
    console.log('Opening code viewer for:', project.name);
    
    // navigate to the code viewer page
    window.location.href = 'mincoins/mincoins-area.html?project=' + encodeURIComponent(project.name);
}

// marking mode functions for development
function toggleMarkingMode() {
    markingMode = !markingMode;
    console.log('Marking mode:', markingMode ? 'ON' : 'OFF');
    if (markingMode) {
        showMarkingInstructions();
    } else {
        hideMarkingInstructions();
    }
    return markingMode;
}

function showMarkingInstructions() {
    const instructions = document.createElement('div');
    instructions.id = 'markingInstructions';
    instructions.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
    `;
    instructions.innerHTML = `
        <h2>Marking Mode Active</h2>
        <p>Move to locations where projects should be displayed</p>
        <p>Press ENTER to mark a location</p>
        <p>Press E to export marked locations</p>
        <p>Press M again to exit marking mode</p>
    `;
    document.body.appendChild(instructions);
}

function hideMarkingInstructions() {
    const instructions = document.getElementById('markingInstructions');
    if (instructions) {
        instructions.remove();
    }
}

function markProjectLocation(playerX, playerY, TILE_SIZE) {
    const tileX = Math.floor(playerX / TILE_SIZE);
    const tileY = Math.floor(playerY / TILE_SIZE);
    
    // check if already marked
    const exists = markedLocations.find(loc => loc.x === tileX && loc.y === tileY);
    if (!exists) {
        markedLocations.push({ x: tileX, y: tileY });
        console.log(`Marked location at tile (${tileX}, ${tileY})`);
    }
}

function exportMarkedLocations() {
    console.log('Marked locations:', markedLocations);
    
    // create export window
    const exportWindow = window.open('', 'Export Locations', 'width=600,height=400');
    exportWindow.document.write(`
        <h2>Marked Project Locations</h2>
        <p>Copy this data to your projects array:</p>
        <pre>${JSON.stringify({
            projectLocations: markedLocations,
            note: "Add these to your projects array in script.js"
        }, null, 2)}</pre>
    `);
}

// export functions and data
window.closeProject = closeProject;

export {
    projects,
    currentProject,
    markingMode,
    initProjectDOM,
    checkProjectCollision,
    showCityInfo,
    hideCityInfo,
    openProject,
    closeProject,
    toggleMarkingMode,
    markProjectLocation,
    exportMarkedLocations
};