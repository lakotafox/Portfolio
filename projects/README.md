# Portfolio Projects

This folder contains all the individual project areas that are displayed in the Carcassonne portfolio.

## Structure

Each project has its own folder with all necessary files:

```
projects/
├── mincoins/          # MinCoins Calculator project
│   ├── mincoins-area.html
│   ├── mincoins-styles.css
│   ├── mincoins-init.js
│   └── modules/
├── project2/          # Future project
├── project3/          # Future project
└── README.md
```

## Adding New Projects

To add a new project:

1. Create a new folder under `projects/`
2. Add your project files (HTML, CSS, JS, assets)
3. Update the project data in `/game-engine/projects/projects-global.js`
4. Set the correct URL path (e.g., `projects/yourproject/index.html`)

## Project Types

- **code**: Opens in the MinCoins-style code viewer
- **iframe**: Opens in a standard iframe (for web projects)

## Current Projects

1. **MinCoins Calculator** - A Java coin change algorithm demonstration with interactive terminal