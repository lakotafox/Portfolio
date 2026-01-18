import { useState } from 'react';

const projectsData = [
  {
    id: 'adventurecrafter',
    title: 'AdventureCrafter',
    description: 'Custom-built 2D game engine with real-time multiplayer collaboration.',
    tag: 'Game Engine',
    link: 'https://adventurecrafter.netlify.app',
    image: '/project-images/adventurecrafter.png',
    hasModal: true,
    fullDescription: 'A custom 2D game engine built from the ground up, inspired by tools like Godot. Features real-time collaborative world building with live synchronization, allowing multiple creators to design and play together simultaneously. Create maps, place objects, define game logic, and playtest with friends in real-time.',
    downloadFile: 'https://drive.google.com/file/d/16tRLHdodHBWC5xyDxRDtzhV247W4trnw/view?usp=drive_link',
    downloadName: 'Demo Save File'
  },
  {
    id: 'foxbuilt',
    title: 'FoxBuilt Office Furniture',
    description: 'Hot lead generating platform built with Next.js 15 and TypeScript. Custom CMS with password-protected admin panel. Migrated from Shopify - now generates inbound calls for free.',
    tag: 'Full Stack',
    link: 'https://foxbuiltstore.com',
    image: '/project-images/foxbuilt.jpg'
  },
  {
    id: 'puddl3',
    title: 'Puddl3',
    description: 'Real-time payroll platform providing instant wage access. Co-founded with two friends. Built with React, Node.js, PostgreSQL, and AWS infrastructure.',
    tag: 'Startup',
    link: 'https://puddle2pool.com/',
    image: '/project-images/PUDDLE.png'
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
    link: '/carcassonne.html',
    image: '/project-images/carc.png',
    featured: true
  },
  {
    id: 'mincoins',
    title: 'MinCoins Calculator',
    description: 'Java coin change algorithm with interactive visualization and code walkthrough. For the Java lovers out there.',
    tag: 'Algorithm',
    link: '/projects/mincoins/mincoins-area.html',
    image: '/project-images/mincoins.jpg'
  },
  {
    id: 'aiscalpel',
    title: 'AI: A Scalpel Not A Hammer',
    description: 'Philosophy paper on precision AI development, prompt engineering, and thoughtful tool usage. Includes interactive code comparison demos.',
    tag: 'Writing',
    link: '/projects/road-network/index.html',
    image: '/project-images/AI2.png'
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
    id: 'sudoku',
    title: "Grandma's Sudoku Robot",
    description: "A gift for my grandma. When her favorite sudoku website started running ads, I built her a Python app that generates personalized puzzles with family quotes and prints them automatically.",
    tag: 'Personal',
    link: '/projects/sudoku/index.html',
    image: '/project-images/sudoku.jpg'
  }
];

const Projects = () => {
  const [modalProject, setModalProject] = useState(null);

  const handleCardClick = (e, project) => {
    if (project.hasModal) {
      e.preventDefault();
      setModalProject(project);
    }
  };

  const closeModal = () => {
    setModalProject(null);
  };

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
              onClick={(e) => handleCardClick(e, project)}
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

      {/* Project Modal */}
      {modalProject && (
        <div className="project-modal-overlay" onClick={closeModal}>
          <div className="project-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <div className="modal-image">
              <img src={modalProject.image} alt={modalProject.title} />
            </div>
            <div className="modal-content">
              <h2 className="modal-title">{modalProject.title}</h2>
              <span className="project-tag">{modalProject.tag}</span>
              <p className="modal-description">{modalProject.fullDescription}</p>
              <div className="modal-actions">
                {modalProject.downloadFile && (
                  <a
                    href={modalProject.downloadFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-btn modal-btn-secondary"
                  >
                    Download {modalProject.downloadName}
                  </a>
                )}
                <a
                  href={modalProject.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-btn modal-btn-primary"
                >
                  Launch Project
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Projects;
