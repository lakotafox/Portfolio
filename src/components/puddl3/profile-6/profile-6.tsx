"use client";

import { ArrowRight, Dribbble, Github, Linkedin, Mail } from "lucide-react";
import { motion, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const grid: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const statusDot = {
  available: "bg-emerald-500 dark:bg-emerald-400",
  engaged: "bg-amber-500 dark:bg-amber-400",
  booked: "bg-neutral-300 dark:bg-neutral-600",
} as const;

type Status = keyof typeof statusDot;

const designerLinks = [
  { label: "Dribbble", icon: Dribbble },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Email", icon: Mail },
];

const engineerLinks = [
  { label: "GitHub", icon: Github },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Email", icon: Mail },
];

const members: {
  name: string;
  role: string;
  city: string;
  bio: string;
  tags: string[];
  status: Status;
  statusLabel: string;
  avatar: string;
  links: typeof designerLinks;
}[] = [
  {
    name: "Isla Merritt",
    role: "Product designer",
    city: "Lisbon",
    bio: "Turns messy research into interfaces that feel obvious.",
    tags: ["Design systems", "Research"],
    status: "available",
    statusLabel: "Available",
    avatar: "https://i.pravatar.cc/150?img=32",
    links: designerLinks,
  },
  {
    name: "Theo Lambert",
    role: "Design engineer",
    city: "Berlin",
    bio: "Prototypes in production code, then ships the prototype.",
    tags: ["React", "Motion"],
    status: "engaged",
    statusLabel: "On a project",
    avatar: "https://i.pravatar.cc/150?img=12",
    links: engineerLinks,
  },
  {
    name: "Maren Voss",
    role: "Engineering lead",
    city: "Copenhagen",
    bio: "Keeps the platform boring so the product can be brave.",
    tags: ["Platform", "DX"],
    status: "booked",
    statusLabel: "Booked until Oct",
    avatar: "https://i.pravatar.cc/150?img=5",
    links: engineerLinks,
  },
  {
    name: "Callum Reid",
    role: "Backend engineer",
    city: "Glasgow",
    bio: "APIs, pipelines, and the occasional heroic migration.",
    tags: ["Go", "Postgres"],
    status: "available",
    statusLabel: "Available",
    avatar: "https://i.pravatar.cc/150?img=13",
    links: engineerLinks,
  },
  {
    name: "Petra Simic",
    role: "Brand designer",
    city: "Vienna",
    bio: "Identity systems built for a long shelf life.",
    tags: ["Identity", "Type"],
    status: "engaged",
    statusLabel: "On a project",
    avatar: "https://i.pravatar.cc/150?img=36",
    links: designerLinks,
  },
  {
    name: "Nico Ferrara",
    role: "Motion designer",
    city: "Turin",
    bio: "Makes the product move like it means it.",
    tags: ["3D", "Rive"],
    status: "available",
    statusLabel: "Available",
    avatar: "https://i.pravatar.cc/150?img=60",
    links: designerLinks,
  },
];

export default function Profile6() {
  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start lg:items-center bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto w-full max-w-[1400px]"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <motion.h2
              variants={item}
              className="text-3xl font-medium leading-tight tracking-tight text-neutral-900 dark:text-white sm:text-4xl lg:text-5xl"
            >
              Six people. Zero handoffs.
            </motion.h2>
            <motion.p
              variants={item}
              className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg"
            >
              A compact senior studio across six cities. Whoever you meet on the
              first call is who designs, builds, and ships your work.
            </motion.p>
          </div>
          <motion.a
            variants={item}
            href="#"
            className="group inline-flex items-center gap-2 rounded-full text-sm font-medium text-neutral-900 transition-colors duration-200 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 dark:text-white dark:hover:text-neutral-300 dark:focus-visible:ring-white/40"
          >
            See open roles
            <ArrowRight className="h-4 w-4 text-neutral-400 transition-colors duration-200 group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-white" />
          </motion.a>
        </div>

        <motion.div
          variants={grid}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3"
        >
          {members.map((member) => (
            <motion.article
              key={member.name}
              variants={item}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-[box-shadow,border-color] duration-300 hover:shadow-lg hover:shadow-neutral-950/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none dark:hover:border-neutral-700 dark:hover:shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <img
                  src={member.avatar}
                  alt={`Portrait of ${member.name}`}
                  className="h-16 w-16 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusDot[member.status]}`}
                  />
                  {member.statusLabel}
                </span>
              </div>

              <h3 className="mt-5 text-base font-semibold text-neutral-900 dark:text-white">
                {member.name}
              </h3>
              <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                {member.role}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {member.bio}
              </p>

              <div className="mb-5 mt-4 flex flex-wrap gap-1.5">
                {member.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex gap-1">
                  {member.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.label}
                        href="#"
                        aria-label={`${member.name} on ${link.label}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:ring-white/40"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {member.city}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
