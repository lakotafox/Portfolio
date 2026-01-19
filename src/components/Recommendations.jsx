const recommendations = [
  {
    id: 1,
    name: 'Eli Alhiander',
    title: 'Co-Founder, Puddle',
    text: 'Lakota is an exceptional developer with a sharp eye for problem-solving. His work on Puddle was instrumental in getting our MVP off the ground. Highly recommend working with him.',
  },
  {
    id: 2,
    name: 'Parker Paxman',
    title: 'User, AdventureCrafter',
    text: 'AdventureCrafter is incredible! The real-time collaboration features make it so easy to build worlds with friends. Lakota clearly knows how to build engaging, user-friendly tools.',
  },
  {
    id: 3,
    name: 'Cyndee Busk',
    title: 'Employee, FoxBuilt',
    text: 'The website Lakota built for FoxBuilt transformed our business. We went from paying for Shopify to generating free inbound leads. Professional work and great communication.',
  },
];

const Recommendations = () => {
  return (
    <section className="recommendations" id="recommendations">
      <div className="container">
        <h2 className="section-title">Recommendations</h2>

        <div className="recommendations-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-card">
              <div className="recommendation-quote">"</div>
              <p className="recommendation-text">{rec.text}</p>
              <div className="recommendation-author">
                <strong>{rec.name}</strong>
                <span>{rec.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recommendations;
