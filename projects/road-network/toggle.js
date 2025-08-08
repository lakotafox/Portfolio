// Toggle functionality for Human/AI versions
const toggle = document.getElementById('versionToggle');
const humanVersion = document.getElementById('humanVersion');
const aiVersion = document.getElementById('aiVersion');

// Load content on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load both content files
    await loadContent();
    
    // Check saved preference
    const savedVersion = localStorage.getItem('versionPreference');
    if (savedVersion === 'ai') {
        showAIVersion();
    }
});

// Load content from separate files
async function loadContent() {
    try {
        // Load human version
        const humanResponse = await fetch('human-content.html');
        const humanHTML = await humanResponse.text();
        humanVersion.innerHTML = humanHTML;
        
        // Load AI version
        const aiResponse = await fetch('ai-content.html');
        const aiHTML = await aiResponse.text();
        aiVersion.innerHTML = aiHTML;
    } catch (error) {
        console.error('Error loading content:', error);
        // Fallback content if files don't load
        humanVersion.innerHTML = '<div class="human-paper"><h1>Error Loading Content</h1><p>Please refresh the page.</p></div>';
        aiVersion.innerHTML = '<div class="section-card"><h2>Error Loading Content</h2><p>Please refresh the page.</p></div>';
    }
}

// Toggle click handler
toggle.addEventListener('click', () => {
    if (toggle.classList.contains('active')) {
        showHumanVersion();
    } else {
        showAIVersion();
    }
});

// Show human version
function showHumanVersion() {
    toggle.classList.remove('active');
    aiVersion.classList.remove('active');
    humanVersion.classList.add('active');
    localStorage.setItem('versionPreference', 'human');
}

// Show AI version  
function showAIVersion() {
    toggle.classList.add('active');
    humanVersion.classList.remove('active');
    aiVersion.classList.add('active');
    localStorage.setItem('versionPreference', 'ai');
}