// project/City Management Module (Global version)
// handles project definitions, collision detection, and UI interactions

// create a global ProjectManager object
const ProjectManager = {
    // projects/Cities data - will be placed in predefined city locations
    projects: [
        {
            id: 1,
            name: "FoxBuilt Office Furniture",
            desc: "Next.js 15 Lead Generation Platform",
            url: "https://foxbuiltstore.com",
            x: 4,
            y: 8
        },
        {
            id: 2,
            name: "Sam Watts Fitness",
            desc: "Fitness Coaching Website",
            url: "https://thesamwatts.com",
            x: 3,
            y: 6
        },
        {
            id: 3,
            name: "Really Cool Hair",
            desc: "Creative Hair Salon Website",
            url: "https://reallycoolhair.com",
            x: 12,
            y: 7
        },
        {
            id: 4,
            name: "MinCoins Calculator",
            desc: "Java Coin Change Algorithm",
            url: "projects/mincoins/mincoins-area.html",
            type: "code",
            x: 11,
            y: 1
        },
        {
            id: 5,
            name: "AI: A Scalpel Not A Hammer",
            desc: "Precision AI Development Philosophy",
            url: "projects/road-network/index.html",
            x: 5,
            y: 11
        },
        {
            id: 6,
            name: "Puddl3",
            desc: "Real-Time Payroll Platform",
            url: "https://puddl3.com",
            x: 8,
            y: 5
        },
        {
            id: 7,
            name: "Grandma's Sudoku Robot",
            desc: "Python Sudoku Generator Gift",
            url: "https://github.com/lakotafox/smith_sudoku_robot",
            x: 2,
            y: 2
        }
    ],

    // state management
    currentProject: null,
    markingMode: false,
    markedLocations: [],

    // dOM elements (will be initialized later)
    cityInfo: null,
    cityName: null,
    cityDesc: null,
    projectViewer: null,
    projectFrame: null,

    // initialize DOM elements
    initDOM: function() {
        this.cityInfo = document.getElementById('cityInfo');
        this.cityName = document.getElementById('cityName');
        this.cityDesc = document.getElementById('cityDesc');
        this.projectViewer = document.getElementById('projectViewer');
        this.projectFrame = document.getElementById('projectFrame');
    },

    // check if player is on a project tile
    checkCollision: function(playerX, playerY, mapGrid, TILE_SIZE, GRID_SIZE) {
        const tileX = Math.floor(playerX / TILE_SIZE);
        const tileY = Math.floor(playerY / TILE_SIZE);
        
        if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
            const tile = mapGrid[tileY][tileX];
            if (tile && tile.project) {
                if (this.currentProject !== tile.project) {
                    this.currentProject = tile.project;
                    this.showCityInfo(this.currentProject);
                }
            } else if (this.currentProject) {
                this.currentProject = null;
                this.hideCityInfo();
            }
        }
    },

    // show city info UI
    showCityInfo: function(project) {
        if (!this.cityInfo || !this.cityName || !this.cityDesc) return;
        this.cityName.textContent = project.name;
        this.cityDesc.textContent = project.desc;
        this.cityInfo.classList.add('active');
    },

    // hide city info UI
    hideCityInfo: function() {
        if (!this.cityInfo) return;
        this.cityInfo.classList.remove('active');
    },

    // open project in viewer
    openProject: function(project) {
        console.log('Opening project:', project.name, 'Type:', project.type);

        // AI Scalpel project uses iframe to preserve music
        if (project.name === 'AI: A Scalpel Not A Hammer') {
            if (!this.projectViewer || !this.projectFrame) return;
            this.projectFrame.src = project.url;
            this.projectViewer.classList.add('active');
        } else {
            // All other projects open in new tab
            window.open(project.url, '_blank');
        }
    },

    // close project viewer
    closeProject: function() {
        if (!this.projectViewer || !this.projectFrame) return;
        this.projectViewer.classList.remove('active');
        this.projectFrame.src = '';
    },

    // code viewer functions
    openCodeViewer: function(project) {
        console.log('Opening code viewer for:', project.name);
        
        // navigate to the code viewer page
        window.location.href = 'projects/mincoins/mincoins-area.html?project=' + encodeURIComponent(project.name);
    },

    // marking mode functions for development
    toggleMarkingMode: function() {
        this.markingMode = !this.markingMode;
        console.log('Marking mode:', this.markingMode ? 'ON' : 'OFF');
        if (this.markingMode) {
            this.showMarkingInstructions();
        } else {
            this.hideMarkingInstructions();
        }
        return this.markingMode;
    },

    showMarkingInstructions: function() {
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
    },

    hideMarkingInstructions: function() {
        const instructions = document.getElementById('markingInstructions');
        if (instructions) {
            instructions.remove();
        }
    },

    markLocation: function(playerX, playerY, TILE_SIZE) {
        const tileX = Math.floor(playerX / TILE_SIZE);
        const tileY = Math.floor(playerY / TILE_SIZE);
        
        // check if already marked
        const exists = this.markedLocations.find(loc => loc.x === tileX && loc.y === tileY);
        if (!exists) {
            this.markedLocations.push({ x: tileX, y: tileY });
            console.log(`Marked location at tile (${tileX}, ${tileY})`);
        }
    },

    exportMarkedLocations: function() {
        console.log('Marked locations:', this.markedLocations);
        
        // create export window
        const exportWindow = window.open('', 'Export Locations', 'width=600,height=400');
        exportWindow.document.write(`
            <h2>Marked Project Locations</h2>
            <p>Copy this data to your projects array:</p>
            <pre>${JSON.stringify({
                projectLocations: this.markedLocations,
                note: "Add these to your projects array"
            }, null, 2)}</pre>
        `);
    }
};

// make closeProject available globally for the HTML onclick
window.closeProject = function() {
    ProjectManager.closeProject();
};