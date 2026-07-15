const DONATE_URL = 'https://secure.savetheredwoods.org/a/donate?sourceid=1169003';

const SaveTheRedwoods = () => (
  <section className="redwoods" id="redwoods">
    <div className="container">
      <div className="redwoods-banner">
        <img
          className="redwoods-banner-img"
          src="/project-images/redwoods-banner.jpeg"
          alt="Pixel art of a retro computer displaying a forest scene"
          width="768"
          height="512"
        />
        <div className="redwoods-banner-body">
          <h2 className="redwoods-banner-title">Before you scroll — the trees</h2>
          <p className="redwoods-banner-text">
            Skip the "buy me a coffee" thing. If something here was useful, send a
            few bucks to Save the Redwoods League instead — they've been protecting
            these forests since 1918.
          </p>
          <div className="redwoods-banner-actions">
            <a
              className="redwoods-donate-btn"
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Donate to the League
            </a>
            <span className="redwoods-banner-disclaimer">
              Not affiliated, get nothing — I just like the trees.
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SaveTheRedwoods;
