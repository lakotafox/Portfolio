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

          <div className="highlight-card">
            <div className="highlight-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 21H16M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Education & Certifications</h3>
            <p>Salt Lake Community College (Est. graduation 2026). AWS Cloud Practitioner in progress. Boot.dev certificates in Linux, OOP, and more. Hands-on experience with manual testing workflows and validation logic.</p>
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
    </section>
  );
};

export default Highlights;
