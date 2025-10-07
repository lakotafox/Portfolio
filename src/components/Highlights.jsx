import { useState } from 'react';

const Highlights = () => {
  const [showSkills, setShowSkills] = useState(false);

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
            <h3>Full Stack Developer</h3>
            <p>I like building things that shouldn't exist yet. for the last two years, I've learned how to take ideas from cocept to product fast. Now I'm looking for a team that wants to build bold, useful tech</p>
            <button className="skills-toggle" onClick={() => setShowSkills(!showSkills)}>
              {showSkills ? 'Hide' : 'Full List of Skills'} {showSkills ? '▲' : '▼'}
            </button>
            {showSkills && (
              <div className="skills-dropdown">
                <div className="skills-category">
                  <h4>Programming & Frameworks</h4>
                  <ul>
                    <li>JavaScript, TypeScript, React.js, Next.js 15</li>
                    <li>Python, Node.js, Java</li>
                    <li>HTML5, CSS3, GraphQL, REST APIs</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Backend & Database</h4>
                  <ul>
                    <li>PostgreSQL, Redis, Docker</li>
                    <li>Flask, Stripe API, Cloudinary</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Frontend/UI</h4>
                  <ul>
                    <li>Tailwind CSS, Three.js, GSAP</li>
                    <li>Canvas API, WebGL, jQuery</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Cloud/DevOps</h4>
                  <ul>
                    <li>AWS (EC2, S3, Lambda)</li>
                    <li>Netlify, Git, GitHub Actions</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>Creative Tools</h4>
                  <ul>
                    <li>TouchDesigner, Sonic Pi</li>
                    <li>Adobe Suite, Python curses</li>
                    <li>JavaScript game engines</li>
                  </ul>
                </div>
                <div className="skills-category">
                  <h4>AI & Automation</h4>
                  <ul>
                    <li>Prompt engineering and AI-assisted coding</li>
                    <li>Faster iteration, higher code quality</li>
                    <li>Effective testing and collaboration</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Education & Certifications</h3>
            <p>Salt Lake Community College (Est. graduation 2026). AWS Cloud Practitioner in progress. Boot.dev certificates in Linux, OOP, and more.</p>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Mission Focused</h3>
            <p>Efficiency is doing things right; effectiveness is doing the right things. Building solutions that matter.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Highlights;
