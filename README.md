# VHS Portfolio Simulator

## How to Run

### Option 1: Python HTTP Server
```bash
cd vhs-portfolio
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser

### Option 2: Node.js HTTP Server
```bash
cd vhs-portfolio
npx http-server -p 8000
```
Then open http://localhost:8000 in your browser

### Option 3: Live Server (VS Code)
- Install the Live Server extension in VS Code
- Right-click on `index.html`
- Select "Open with Live Server"

### Option 4: Direct File
- Simply double-click `index.html` to open in your browser
- Note: Some features may not work due to CORS restrictions

## Customization
Edit the `projects` array in `script.js` (lines 2-27) to add your own projects:
```javascript
const projects = [
    {
        id: 1,
        title: "YOUR PROJECT NAME",
        year: "2024",
        url: "https://your-project-url.com",
        description: "Project description"
    },
    // Add more projects...
];
```