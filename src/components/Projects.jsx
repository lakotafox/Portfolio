import { useState } from 'react';
import ProjectDeck from './ProjectDeck';
import DiceWordmark from './dice/DiceWordmark';

const projectsData = [
  {
    id: 'gifsmith',
    title: 'Gifsmith',
    description: "Mobile-first GIF e-card maker with a full 1997 GeoCities soul. Search 4.6 million GIFs rescued by the Internet Archive's Wayback Machine, drag/pinch/rotate them onto a phone-shaped canvas with retro text and animated pixel backgrounds, then send your gram as a link or a rendered animated GIF. Guided tutorial by Floppy the mascot, installable as a PWA.",
    tag: 'Web Toy',
    link: '/gifsmith/',
    image: '/project-images/gifsmith.png',
    featured: true
  },
  {
    id: 'lennyhouse',
    title: 'LennyHouse',
    description: 'House finder for cats and their humans — 81 cute cat-friendly Portland houses, cottages & vintage apartments under $2,200/mo from Apartments.com and Bristol Urban, with live filters, source/price sorting, and every listing pinned on an interactive map.',
    tag: 'Tool',
    link: '/lennyhouse/',
    image: '/project-images/lennyhouse.png',
    featured: true
  },
  {
    id: 'pawsinmotion',
    title: 'Paws in Motion PDX',
    description: 'Landing site for a Portland dog walking & pet sitting business. Next.js + PUDDL3 P4RTS — animated shader backgrounds with live color theming, scrolling photo marquees, a 3D infinite dog gallery, and a Time to Pet app showcase.',
    tag: 'Client Work',
    link: '/pawsinmotion/',
    image: '/project-images/pawsinmotion.png',
    featured: true
  },
  {
    id: 'olliesfruitmap',
    title: "Fruit Map <3",
    description: "Every fruit and nut tree in Portland on one cute Win95 map — 30,000+ apples, figs, plums, cherries, pears, persimmons and walnuts from City of Portland open data. Tap 'Near me' to find fruit around you, filter by trunk size and age, and meet the old orchard survivors that predate their neighborhoods. Click sounds included.",
    tag: 'Open Data',
    link: '/olliesfruitmap/',
    image: '/project-images/olliesfruitmap.png',
    featured: true
  },
  {
    id: 'redwoods-map',
    title: 'PDX Redwoods Map',
    description: 'Interactive map of every redwood in Portland plus 19,000+ native giants — Douglas-firs, white oaks, redcedars — from City of Portland open data. Filter by species, size, and age; find trees that predate the city itself.',
    tag: 'Open Data',
    link: '/redwoods/',
    image: '/project-images/redwoods-map.png',
    featured: true
  },
  {
    id: 'plant-id',
    title: 'Plant Identifier',
    description: 'Snap a photo or two and get a best-match verdict with a confidence score, plus ranked candidates powered by GBIF, Wikipedia, iNaturalist and Pl@ntNet!',
    tag: 'Plants',
    link: '/plant-id/',
    image: '/project-images/plant-id.jpg',
    featured: true
  },
  {
    id: 'bird-id',
    title: 'Bird Song ID',
    description: 'Record a bird sound and get an instant AI identification with confidence scores and ranked candidates. Runs BirdNET entirely in-browser via ONNX Runtime — no server needed. Links out to eBird, Wikipedia, iNaturalist, and Xeno-canto.',
    tag: 'AI Tool',
    link: '/bird-id/',
    image: '/project-images/bird-id.png',
    featured: true
  },
  {
    id: 'lidar-scan',
    title: '3D Scanner',
    description: "Snap a photo and turn it into a 3D point cloud you can spin, pinch, and export. Browsers can't touch the iPhone's LiDAR, so an AI depth model (Depth Anything V2) runs entirely in-browser via Transformers.js instead — no server needed.",
    tag: 'AI Tool',
    link: '/lidar/',
    image: '/project-images/lidar.png',
    featured: true
  },
  {
    id: 'backlog',
    title: 'Backlog — Issue Board',
    description: 'A Jira-style backlog board built from scratch — draggable issue cards across Backlog / To Do / In Progress / Done, with issue types, priorities, labels, and story points. Vanilla JS, drag-and-drop via SortableJS, state persisted locally.',
    tag: 'Tool',
    link: '/backlog/',
    image: '/project-images/backlog.png',
    featured: true
  },
  {
    id: 'wattssite',
    title: 'Watts Automotive — Dealership Site',
    description: 'A modern, premium redesign of a lifted-truck dealership landing page — cinematic hero, slick category grid, and brand-grade polish, rebuilt from a dated dealer template. Next.js + Tailwind, mobile-first.',
    tag: 'Client Work',
    link: '/watts/',
    image: '/project-images/watts-site.jpg',
    featured: true
  },
  {
    id: 'wattstruck',
    title: 'Watts Automotive — Custom Truck Builder',
    description: 'Real-time Build-Your-Own-Truck configurator for a lifted-truck dealership — pick from 26 trucks, any paint color, dial in lift up to 16 inches, bolt on fitment-filtered aftermarket wheels, and tap to rotate. Rendered live via the RideStyler API.',
    tag: 'Client Work',
    link: '/watts/build-ridestyler/',
    image: '/project-images/watts.jpg',
    featured: true
  },
  {
    id: 'myart',
    title: 'My Art',
    description: 'A control room of generative-art instruments — dozens of live, code-driven pieces rendered in real time. Click any tile to enter the viewer; arrow keys move between works.',
    tag: 'Generative Art',
    link: '/art/',
    image: '/project-images/myart.png',
    featured: true
  },
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
    id: 'reallycoolhair',
    title: 'Really Cool Hair',
    description: 'A Portland salon moved off GlossGenius onto its own system: a booking flow that reads real availability, an owner dashboard, and a phone app the stylist runs the day from. The salon database is self-hosted on hardware they own, so booking here only works from my own devices — the site and apps are fully browsable.',
    tag: 'Client Work',
    link: '/reallycoolhair/',
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
  },
  {
    id: 'lightbike',
    title: 'Neon Cycle Arena',
    description: 'TRON-style light bike game in a retro terminal. Built with vanilla JavaScript and ASCII graphics.',
    tag: 'Game',
    link: '/projects/lightbike/index.html',
    image: '/project-images/lightbike.png'
  },
  {
    id: 'csis-portfolio',
    title: 'CSIS 1430 School Portfolio',
    description: 'My CSIS 1430 web dev class portfolio - 11 projects from week 1 to final, including a working Tic Tac Toe game with sound, Mad Libs, a Bootstrap pizza site, and a playable Mario embed.',
    tag: 'School',
    link: 'https://wcj.fyv.temporary.site',
    image: '/project-images/csis-portfolio.png'
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
        <DiceWordmark as="h2" className="section-title" text="Selected Work" />
      </div>

      {/* A tap deck instead of the drifting wall: stationary, one project in
        * focus at a time, same gesture on desktop and phone. Tap to riffle,
        * Open to visit. */}
      <ProjectDeck projects={projectsData} />

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
