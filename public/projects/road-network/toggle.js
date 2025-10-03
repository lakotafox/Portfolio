// Toggle functionality for Human/AI versions
const toggle = document.getElementById('versionToggle');
const humanVersion = document.getElementById('humanVersion');
const aiVersion = document.getElementById('aiVersion');

// Music elements
const aiMusic = document.getElementById('aiMusic');
let mainMusic = null;
let aiMusicStarted = false;

// Load content on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load both content files
    await loadContent();
    
    // Get reference to main portfolio music if in iframe
    try {
        if (window.parent && window.parent !== window) {
            mainMusic = window.parent.document.getElementById('bgMusic');
        }
    } catch (e) {
        console.log('Not in iframe or cross-origin');
    }
    
    // Set AI music volume and start playing for the essay page
    if (aiMusic) {
        aiMusic.volume = 0.3;
        
        // Pause main music if it exists
        if (mainMusic && !mainMusic.paused) {
            mainMusic.pause();
        }
        
        // Start AI music for the entire essay page
        aiMusic.play().catch(e => console.log('Error playing AI music:', e));
        aiMusicStarted = true;
    }
    
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
    
    // Music continues playing for both sides of the essay
}

// Show AI version  
function showAIVersion() {
    toggle.classList.add('active');
    humanVersion.classList.remove('active');
    aiVersion.classList.add('active');
    localStorage.setItem('versionPreference', 'ai');
    
    // Music continues playing for both sides of the essay
}

// Handle page visibility changes (when user navigates away/back)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause AI music if playing
        if (aiMusic && !aiMusic.paused) {
            aiMusic.pause();
        }
    } else {
        // Page is visible again, resume AI music (plays for entire essay)
        if (aiMusic && aiMusic.paused && aiMusicStarted) {
            aiMusic.play().catch(e => console.log('Error resuming AI music:', e));
        }
    }
});

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    // Stop AI music
    if (aiMusic && !aiMusic.paused) {
        aiMusic.pause();
        aiMusic.currentTime = 0;
    }
    
    // Resume main music if it exists
    if (mainMusic && mainMusic.paused && aiMusicStarted) {
        mainMusic.play().catch(e => console.log('Error resuming main music:', e));
    }
});