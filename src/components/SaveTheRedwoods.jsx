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
          <h2 className="redwoods-banner-title">Before you scroll — old growth forests need our help</h2>
          <p className="redwoods-banner-text">
            So instead of the "buy me a coffee" thing: if something here was useful,
            send some coin to Save the Redwoods League. They've been protecting
            these forests for more than 100 years.
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
              Not affiliated, I get nothing — I just like old trees.
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SaveTheRedwoods;
