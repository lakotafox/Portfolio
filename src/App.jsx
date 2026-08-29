import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Highlights from './components/Highlights';
import Projects from './components/Projects';
import Recommendations from './components/Recommendations';
import SaveTheRedwoods from './components/SaveTheRedwoods';
import { DiceProvider } from './components/dice/DiceProvider';
import DiceStage from './components/dice/DiceStage';
import './styles/p4rts.css';
import './styles/App.css';

/* The whole page sits inside DiceProvider, so one roll re-themes everything:
 * DiceStage paints the rolled backdrop + cursor, and the palette lands on
 * :root as --p4-* which App.css already reads (with fallbacks, so the site
 * still renders correctly if the dice never runs). */
function App() {
  return (
    <DiceProvider>
      <DiceStage />

      <div className="page">
        <Navigation />
        <Hero />
        <SaveTheRedwoods />
        <Highlights />
        <Projects />
        <Recommendations />

        <footer className="footer">
          <div className="container">
            <p>&copy; 2025 Lakota Fox</p>
          </div>
        </footer>
      </div>
    </DiceProvider>
  );
}

export default App;
