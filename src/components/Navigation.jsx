import { useState, useEffect, useRef } from 'react';

const colorThemes = [
  { name: 'blue', color: '#3b82f6', hover: '#2563eb', label: 'Blue' },
  { name: 'purple', color: '#a855f7', hover: '#9333ea', label: 'Purple' },
  { name: 'green', color: '#10b981', hover: '#059669', label: 'Green' },
  { name: 'orange', color: '#f97316', hover: '#ea580c', label: 'Orange' },
  { name: 'pink', color: '#ec4899', hover: '#db2777', label: 'Pink' },
  { name: 'red', color: '#ef4444', hover: '#dc2626', label: 'Red' },
  { name: 'teal', color: '#14b8a6', hover: '#0d9488', label: 'Teal' },
];

const Navigation = () => {
  const [isDark, setIsDark] = useState(true);
  const [currentColor, setCurrentColor] = useState('blue');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedColor = localStorage.getItem('themeColor') || 'blue';

    setIsDark(savedTheme === 'dark');
    setCurrentColor(savedColor);

    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    applyColorTheme(savedColor);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const applyColorTheme = (themeName) => {
    const theme = colorThemes.find(t => t.name === themeName);
    if (theme) {
      document.documentElement.style.setProperty('--accent', theme.color);
      document.documentElement.style.setProperty('--accent-hover', theme.hover);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.body.classList.toggle('dark-theme', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const changeColor = (themeName) => {
    setCurrentColor(themeName);
    applyColorTheme(themeName);
    localStorage.setItem('themeColor', themeName);
    setShowColorPicker(false);

    // Trigger event for Threads component to update
    window.dispatchEvent(new CustomEvent('themeColorChange'));
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        <div></div>

        <div className="theme-controls">
          <div className="color-picker-container" ref={colorPickerRef}>
            <button
              className="color-picker-toggle"
              onClick={() => setShowColorPicker(!showColorPicker)}
              aria-label="Change theme color"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z" fill="currentColor"/>
              </svg>
            </button>

            {showColorPicker && (
              <div className="color-picker-menu">
                {colorThemes.map(theme => (
                  <button
                    key={theme.name}
                    className={`color-option ${currentColor === theme.name ? 'active' : ''}`}
                    onClick={() => changeColor(theme.name)}
                    aria-label={`${theme.label} theme`}
                  >
                    <span
                      className="color-swatch"
                      style={{ backgroundColor: theme.color }}
                    ></span>
                    <span className="color-label">{theme.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <svg className="sun-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.657 15.657L14.243 14.243M5.757 5.757L4.343 4.343M15.657 4.343L14.243 5.757M5.757 14.243L4.343 15.657" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <svg className="moon-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
