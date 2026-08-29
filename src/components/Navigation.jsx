import { useState, useEffect, useRef } from 'react';
import DiceMenu from './dice/DiceMenu';
import { useDice } from './dice/DiceProvider';

const Navigation = () => {
  const reroll = useDice()?.reroll ?? (() => {});
  const [isDark, setIsDark] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsDark(savedTheme === 'dark');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
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

  return (
    <nav className="nav">
      <div className="nav-container">
        <div></div>

        <div className="theme-controls">
          <div className="color-picker-container" ref={colorPickerRef}>
            <button
              className="color-picker-toggle"
              onClick={() => setShowColorPicker(!showColorPicker)}
              aria-label="Change the look"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22C12 22 16 18 16 12C16 6 12 2 12 2Z" fill="currentColor"/>
              </svg>
            </button>

            {showColorPicker && (
              <div className="color-picker-menu p4m-menu">
                <DiceMenu />
              </div>
            )}
          </div>

          {/* The light/dark toggle is gone — the rolled palette owns the page's
            * colours now, so a manual theme switch had nothing left to switch.
            * A one-click reroll is more useful in that spot. */}
          <button className="theme-toggle" onClick={reroll} aria-label="Roll a new look" title="Roll a new look (0 or space)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
              <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
