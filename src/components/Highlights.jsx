import { useState } from 'react';

const Highlights = () => {
  const [showSkills, setShowSkills] = useState(false);
  const [showCerts, setShowCerts] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showArchmageInfo, setShowArchmageInfo] = useState(false);

  const googleAICerts = [
    { name: 'Google AI Essentials Certification', file: '/certs/google-ai-essentials-full.pdf', verify: 'https://coursera.org/share/b8a0932852fd8d9da42a7583c17279c0' },
    { name: 'Introduction to AI', file: '/certs/intro-to-ai.pdf', verify: 'https://coursera.org/share/1675bab0dd5f9b315e478d73331f3224' },
    { name: 'Maximize Productivity With AI Tools', file: '/certs/maximize-productivity.pdf', verify: 'https://coursera.org/share/9b6bcf078f3b7e4be5eff2372e0a46c7', gold: true },
    { name: 'Discover the Art of Prompting', file: '/certs/art-of-prompting.pdf', verify: 'https://coursera.org/share/81df8a707a4af6613f753e06db8f7816', gold: true },
    { name: 'Use AI Responsibly', file: '/certs/use-ai-responsibly.pdf', verify: 'https://coursera.org/share/7df438eca9ef2fbf86efaa13d8cbd6be', gold: true },
    { name: 'Stay Ahead of the AI Curve', file: '/certs/stay-ahead-ai-curve.pdf', verify: 'https://coursera.org/share/12c43e0e8fb4ffc5b3184f5fa5d6b938', gold: true },
  ];

  const ibmCerts = [
    { name: 'IBM AI Developer Professional Certificate', file: '/certs/ibm-ai-developer-professional.pdf', verify: 'https://coursera.org/share/09c71b2eac8a066a1bf1f31f41c173d9', purple: true },
    { name: 'Intro to Software Engineering', file: '/certs/intro-software-engineering.pdf', verify: 'https://coursera.org/share/3b65b0274e6343d57b56d08a28c46fe4' },
    { name: 'Intro to AI', file: '/certs/intro-ai-ibm.pdf', verify: 'https://coursera.org/share/9dfe9dc5e789725984036c3390cd0682', gold: true },
    { name: 'Generative AI Applications', file: '/certs/generative-ai-intro.pdf', verify: 'https://coursera.org/share/2578cc2200dfe3eccbe2ba03ed2dc22c', gold: true },
    { name: 'Prompt Engineering', file: '/certs/prompt-engineering-basics.pdf', verify: 'https://coursera.org/share/25f159eed73e25de874aa19dcbdec067', purple: true },
    { name: 'Intro to HTML, CSS & JavaScript', file: '/certs/html-css-js.pdf', verify: 'https://coursera.org/share/c23375100e05963c739c4faa7630de12' },
    { name: 'Python for AI & Data Science', file: '/certs/python-data-science-ai.pdf', verify: 'https://coursera.org/share/ccdbdf4ea65402283e5d9d5f664cd888', gold: true },
    { name: 'AI Apps with Python & Flask', file: '/certs/python-flask-ai.pdf', verify: 'https://coursera.org/share/643983b6c6faa543da21c1bf0a82b87b', gold: true },
    { name: 'GenAI Apps with Python', file: '/certs/genai-python.pdf', verify: 'https://coursera.org/share/df3c551128d26d66983a07346756d065', purple: true },
    { name: 'GenAI for Software Development', file: '/certs/genai-software-dev.pdf', verify: 'https://coursera.org/share/02e2274eb681a245d951a1e5ea4f721d', gold: true },
    { name: 'Software Dev Career & Interview Prep', file: '/certs/software-dev-career.pdf', verify: 'https://coursera.org/share/667e8711ca923bad07867309ccb15e55' },
  ];

  const bootdevCerts = [
    { name: 'Introduction to Python', file: '/certs/bootdev-intro-python.png', verify: 'https://www.boot.dev/certificates/f60a79a1-729f-4834-816c-a4ac55332b96', isImage: true },
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
            <h3>Software Developer</h3>
            <p>I build full-stack web apps, security tools, and AI-powered systems. Strong debugging and problem-solving skills with systematic troubleshooting across the entire stack — from dev tools and logging to production infrastructure.</p>
            <button className="skills-toggle" onClick={() => setShowSkills(!showSkills)}>
              {showSkills ? 'Hide' : 'Full List of Skills'} {showSkills ? '▲' : '▼'}
            </button>
            {showSkills && (
              <div className="skills-dropdown">
                <div className="skills-category">
                  <h4>Core Strengths</h4>
                  <ul>
                    <li>JavaScript, TypeScript, Python, Java</li>
                    <li>React.js, Next.js 15, Tailwind CSS, Flask</li>
                    <li>Node.js, REST APIs, PostgreSQL</li>
                    <li>AWS (EC2, S3, Lambda), Netlify, Cloudinary</li>
                    <li>Debugging, systematic troubleshooting, Git</li>
                  </ul>
                </div>
                <div className="skills-category ai-proficiency">
                  <h4>AI Proficiency</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>5B+ tokens processed in under a year. Advanced AI-augmented workflow.</p>
                  <ul>
                    <li>AI coding agents: Claude Code, Cursor, Windsurf</li>
                    <li>Prompt engineering & context management</li>
                    <li>RAG (Retrieval-Augmented Generation) pipelines</li>
                    <li>AI agent orchestration & multi-agent systems</li>
                    <li>Guardrails, safety layers & responsible AI</li>
                    <li>LLM integration (API, SDK, MCP servers)</li>
                    <li>Building AI-powered tools & automation</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Infrastructure & Tools</h4>
                  <ul>
                    <li>GitHub Actions, CI/CD pipelines</li>
                    <li>Linux, SSH, server administration</li>
                    <li>Security scanning & penetration testing</li>
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
            <p>IBM & Google AI certified. I architect AI-augmented development workflows — from RAG pipelines and agent orchestration to guardrails and LLM integration. 5 billion+ tokens processed building real software with AI coding agents.</p>
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
                          className={`cert-button ${cert.gold ? 'cert-gold' : ''} ${cert.purple ? 'cert-purple' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCert(cert);
                          }}
                        >
                          {cert.purple && <span className="purple-star">✦</span>}
                          {cert.gold && !cert.purple && <span className="gold-star">★</span>}
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
                          className={`cert-button ${cert.gold ? 'cert-gold' : ''} ${cert.purple ? 'cert-purple' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCert(cert);
                          }}
                        >
                          {cert.purple && <span className="purple-star">✦</span>}
                          {cert.gold && !cert.purple && <span className="gold-star">★</span>}
                          {cert.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Boot.dev</h4>
                  <ul className="cert-list">
                    {bootdevCerts.map((cert, index) => (
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
            <p>Full-stack platforms, security tools, startup MVPs, AI-powered applications, and client websites. I've shipped production software with Java, Python, TypeScript, React, Next.js, and AWS. I build systems that solve real problems — from automated security scanners to AI agent pipelines.</p>
            <button
              className="skills-toggle"
              onClick={() => {
                const projectsSection = document.getElementById('projects');
                if (projectsSection) {
                  const rect = projectsSection.getBoundingClientRect();
                  const scrollTop = window.pageYOffset + rect.top - (window.innerHeight / 2) + (rect.height / 2);
                  window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                }
              }}
            >
              See Projects ↓
            </button>
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
            {selectedCert.isImage ? (
              <img
                src={selectedCert.file}
                className="cert-modal-pdf"
                alt={selectedCert.name}
                style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <iframe
                src={selectedCert.file}
                className="cert-modal-pdf"
                title={selectedCert.name}
              />
            )}
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
                  {selectedCert.verify.includes('boot.dev') ? 'Verify on Boot.dev' : 'Verify on Coursera'}
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
