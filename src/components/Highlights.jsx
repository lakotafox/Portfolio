import { useState } from 'react';

const Highlights = () => {
  const [showSkills, setShowSkills] = useState(false);
  const [showCerts, setShowCerts] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showArchmageInfo, setShowArchmageInfo] = useState(false);

  const googleAICerts = [
    { name: 'Full Specialization Certificate', file: '/certs/google-ai-essentials-full.pdf', verify: 'https://coursera.org/share/b8a0932852fd8d9da42a7583c17279c0' },
    { name: 'Introduction to AI', file: '/certs/intro-to-ai.pdf' },
    { name: 'Maximize Productivity With AI Tools', file: '/certs/maximize-productivity.pdf' },
    { name: 'Discover the Art of Prompting', file: '/certs/art-of-prompting.pdf' },
    { name: 'Use AI Responsibly', file: '/certs/use-ai-responsibly.pdf' },
    { name: 'Stay Ahead of the AI Curve', file: '/certs/stay-ahead-ai-curve.pdf' },
  ];

  const ibmCerts = [
    { name: 'Introduction to Software Engineering', file: '/certs/intro-software-engineering.pdf' },
  ];

  return (
    <section className="highlights">
      <div className="container">
        <div className="highlights-grid">
          <div className="highlight-card" style={{ zIndex: showSkills ? 100 : 1 }}>
            <div className="highlight-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 18L22 12L16 6M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Student Developer</h3>
            <p>I'm a student developer with strong debugging and problem-solving skills. I build web apps and I'm experienced in systematic debugging and troubleshooting, using dev tools and logging to identify and fix issues for all of my websites.</p>
            <button className="skills-toggle" onClick={() => setShowSkills(!showSkills)}>
              {showSkills ? 'Hide' : 'Full List of Skills'} {showSkills ? '▲' : '▼'}
            </button>
            {showSkills && (
              <div className="skills-dropdown">
                <div className="skills-category">
                  <h4>Core Strengths</h4>
                  <ul>
                    <li>AI-assisted development & prompt engineering</li>
                    <li>React.js, CSS3 (with AI assistance)</li>
                    <li>Netlify, GitHub Actions, Cloudinary</li>
                    <li>Debugging, problem-solving, Git workflow</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Actively Learning</h4>
                  <ul>
                    <li>Languages: JavaScript, Python, Java, HTML5</li>
                    <li>Frameworks: Next.js 15, Tailwind CSS, jQuery</li>
                    <li>Tools: REST APIs, Sonic Pi, Godot 4</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Working Knowledge</h4>
                  <ul>
                    <li>TypeScript, Node.js, Flask</li>
                    <li>PostgreSQL, AWS (EC2, S3, Lambda)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="highlight-card" style={{ zIndex: showCerts ? 100 : 1 }}>
            <div className="highlight-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Education & Certifications</h3>
            <p>Proficient in Python, JavaScript, HTML/CSS, and Linux. Google AI Essentials certified. Experienced with prompt engineering, LLM integration, AI agents, and multi-agent swarms. Claude Code power user.</p>
            <button className="skills-toggle" onClick={() => setShowCerts(!showCerts)}>
              {showCerts ? 'Hide' : 'View All Certifications'} {showCerts ? '▲' : '▼'}
            </button>
            {showCerts && (
              <div className="skills-dropdown">
                <div className="skills-category">
                  <h4>Google AI Essentials (Coursera)</h4>
                  <ul className="cert-list">
                    {googleAICerts.map((cert, index) => (
                      <li key={index}>
                        <button
                          className="cert-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCert(cert);
                          }}
                        >
                          {cert.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>IBM</h4>
                  <ul className="cert-list">
                    {ibmCerts.map((cert, index) => (
                      <li key={index}>
                        <button
                          className="cert-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCert(cert);
                          }}
                        >
                          {cert.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Boot.dev</h4>
                  <ul>
                    <li className="archmage-item">
                      Going for the Arch Mage coin
                      <button
                        className="info-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowArchmageInfo(!showArchmageInfo);
                        }}
                      >
                        ?
                      </button>
                      {showArchmageInfo && (
                        <div className="archmage-info">
                          The Boot.dev Archmage coin is a prestigious, physical token awarded to users who reach the highest rank, Level 100, on the Boot.dev coding platform, signifying mastery in backend development through completing courses and projects, unlocking exclusive Discord channels, and becoming a true expert.
                        </div>
                      )}
                    </li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Education</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Getting government degrees on the side in my free time</p>
                  <ul>
                    <li>Associate's in CS (~2026)</li>
                    <li>Bachelor's in CS (~2028)</li>
                    <li>Master's in CS (~2030)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Diverse Project Experience</h3>
            <p>Full-stack platforms, startup MVPs, client websites, and automation tools. I've built with Java, Python, TypeScript, React, Next.js, and AWS. Whether it's for fun, for business, to generate leads, or a simple Python app for my great grandma, I enjoy building across the stack.</p>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="cert-modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="cert-modal" onClick={(e) => e.stopPropagation()}>
            <button className="cert-modal-close" onClick={() => setSelectedCert(null)}>
              &times;
            </button>
            <h3 className="cert-modal-title">{selectedCert.name}</h3>
            <iframe
              src={selectedCert.file}
              className="cert-modal-pdf"
              title={selectedCert.name}
            />
            <div className="cert-modal-actions">
              <a
                href={selectedCert.file}
                target="_blank"
                rel="noopener noreferrer"
                className="cert-modal-btn"
              >
                Open Full Size
              </a>
              {selectedCert.verify && (
                <a
                  href={selectedCert.verify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cert-modal-btn cert-modal-btn-secondary"
                >
                  Verify on Coursera
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Highlights;
