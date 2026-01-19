import Threads from './components/Threads';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Highlights from './components/Highlights';
import Projects from './components/Projects';
import Recommendations from './components/Recommendations';
import './styles/App.css';

function App() {
  return (
    <>
      <Threads
        amplitude={1}
        distance={0}
        enableMouseInteraction={true}
      />

      <Navigation />
      <Hero />
      <Highlights />
      <Projects />
      <Recommendations />

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Lakota Fox</p>
        </div>
      </footer>
    </>
  );
}

export default App;
