const DONATE_URL = 'https://secure.savetheredwoods.org/a/donate?sourceid=1169003';

const stats = [
  {
    id: 1,
    figure: '95%',
    label: 'of old-growth coast redwoods have already been lost to logging',
  },
  {
    id: 2,
    figure: '#1',
    label: 'redwood forests store more carbon per acre than any other forest on Earth',
  },
  {
    id: 3,
    figure: '2,000+',
    label: 'years a single redwood can live — pulling carbon the whole time',
  },
];

const SaveTheRedwoods = () => {
  return (
    <section className="redwoods" id="redwoods">
      <div className="container">
        <div className="redwoods-card">
          <div className="redwoods-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L7 9h2.5L6 14h3l-3.5 5H11v3h2v-3h5.5L15 14h3l-3.5-5H17L12 2z" />
            </svg>
          </div>

          <h2 className="redwoods-title">Help Save the Redwoods</h2>
          <p className="redwoods-subtitle">A cause I care about</p>

          <p className="redwoods-text">
            Coast redwoods are the tallest living things on the planet and one of our
            best natural defenses against climate change — acre for acre, no forest
            on Earth captures more carbon. Save the Redwoods League has been
            protecting and restoring these forests since 1918. If my portfolio
            brought you here, consider sending a few dollars their way instead of
            buying me a coffee.
          </p>

          <div className="redwoods-stats">
            {stats.map((stat) => (
              <div key={stat.id} className="redwoods-stat">
                <span className="redwoods-figure">{stat.figure}</span>
                <span className="redwoods-label">{stat.label}</span>
              </div>
            ))}
          </div>

          <a
            className="redwoods-donate-btn"
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate to Save the Redwoods League
          </a>

          <p className="redwoods-disclaimer">
            Donations go directly to Save the Redwoods League, a 501(c)(3) nonprofit.
            I'm not affiliated with them and don't receive anything — I just think
            the trees are worth it.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SaveTheRedwoods;
