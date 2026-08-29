import DiceWordmark from './dice/DiceWordmark';
import DiceCta from './dice/DiceCta';
import { useDice } from './dice/DiceProvider';

const Hero = () => {
  const d = useDice();
  return (
    <section className="hero">
      <div className="container">
        <DiceWordmark className="hero-title" text="Lakota Fox" />
        <p className="hero-subtitle">Software Developer building full-stack platforms, developer tools, and security software. Currently based in Portland, Oregon.</p>
        <DiceCta fx={d?.look?.cta} palette={d?.look?.palette} label="See the work" href="#work" />
      </div>
    </section>
  );
};

export default Hero;
