const projectsData = [
  {
    id: 'foxbuilt',
    title: 'FoxBuilt Office Furniture',
    description: 'Hot lead generating platform built with Next.js 15 and TypeScript. Custom CMS with password-protected admin panel. Migrated from Shopify - now generates inbound calls for free.',
    tag: 'Full Stack',
    link: 'https://foxbuiltstore.com',
    image: '/project-images/foxbuilt.jpg'
  },
  {
    id: 'samwatts',
    title: 'Sam Watts Fitness',
    description: 'Professional fitness coaching website with booking and program information.',
    tag: 'Client Work',
    link: 'https://thesamwatts.com',
    image: '/project-images/samwatts.jpg'
  },
  {
    id: 'reallycoolhair',
    title: 'Really Cool Hair',
    description: 'Creative hair salon website with appointment booking and gallery showcase.',
    tag: 'Client Work',
    link: 'https://reallycoolhair.com',
    image: '/project-images/reallycoolhair.jpg'
  },
  {
    id: 'carcassonne',
    title: 'Carcassonne Portfolio',
    description: 'The fun, more artistic version of my portfolio. Same content as this page but in a fun way - explore projects by walking through a medieval Carcassonne-style world.',
    tag: 'Interactive',
    link: 'carcassonne.html',
    image: 'carc-map-favicon.png',
    featured: true
  },
  {
    id: 'mincoins',
    title: 'MinCoins Calculator',
    description: 'Java coin change algorithm with interactive visualization and code walkthrough. For the Java lovers out there.',
    tag: 'Algorithm',
    link: 'projects/mincoins/mincoins-area.html',
    image: '/project-images/mincoins.jpg'
  },
  {
    id: 'aiscalpel',
    title: 'AI: A Scalpel Not A Hammer',
    description: 'Philosophy paper on precision AI development, prompt engineering, and thoughtful tool usage. Includes interactive code comparison demos.',
    tag: 'Writing',
    link: 'projects/road-network/index.html',
    image: '/project-images/AI2.png'
  },
  {
    id: 'puddl3',
    title: 'Puddl3 (Puddle2Pool)',
    description: 'Real-time payroll platform providing instant wage access. Co-founded with two friends. Built with React, Node.js, PostgreSQL, and AWS infrastructure.',
    tag: 'Startup',
    link: 'https://puddle2pool.com/',
    image: '/project-images/PUDDLE.png'
  },
  {
    id: 'sudoku',
    title: "Grandma's Sudoku Robot",
    description: "A gift for my grandma. When her favorite sudoku website started running ads, I built her a Python app that generates personalized puzzles with family quotes and prints them automatically.",
    tag: 'Personal',
    link: 'projects/sudoku/index.html',
    image: '/project-images/sudoku.jpg'
  }
];

const Projects = () => {
  return (
    <main className="main" id="work">
      <div className="container">
        <h2 className="section-title">Selected Work</h2>
        <div className="projects-grid">
          {projectsData.map(project => (
            <a
              key={project.id}
              href={project.link}
              className={`project-card ${project.featured ? 'featured' : ''}`}
              target={project.link.startsWith('http') ? '_blank' : '_self'}
              rel={project.link.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <div className="project-image">
                {project.image ? (
                  <img src={project.image} alt={project.title} />
                ) : (
                  <div className="project-placeholder">{project.placeholder}</div>
                )}
              </div>
              <div className="project-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>
                <span className="project-tag">{project.tag}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Projects;
