"use client";

import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";

const topics = [
  "All",
  "Company",
  "Insights",
  "Productivity",
  "Product Updates",
];

type Post = {
  tag: "Company" | "Insights" | "Productivity" | "Product Updates";
  title: string;
  desc: string;
  date: string;
  author: string;
  read: string;
  image: string;
};

const posts: Post[] = [
  {
    tag: "Company",
    title: "SOC 2 is here",
    desc: "Ember now meets the highest bar for security and privacy, independently audited on every plan.",
    date: "Aug 6, 2025",
    author: "Sahaj Garg",
    read: "2 minute read",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80",
  },
  {
    tag: "Product Updates",
    title: "Smart tagging arrives",
    desc: "Let Ember file your docs for you. Smart tags sort everything automatically as you work.",
    date: "Jul 30, 2025",
    author: "Tanay Kothari",
    read: "3 minute read",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&q=80",
  },
  {
    tag: "Insights",
    title: "Designing for focus",
    desc: "The best tools disappear as you use them. A quiet look at how we design for focus, not features.",
    date: "Jul 18, 2025",
    author: "Aditya Mankare",
    read: "5 minute read",
    image:
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1000&q=80",
  },
  {
    tag: "Company",
    title: "Ember raises $30M",
    desc: "We're doubling down on the craft. Here's what the next chapter looks like and who we're building it with.",
    date: "Jun 24, 2025",
    author: "Tanay Kothari",
    read: "3 minute read",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1000&q=80",
  },
  {
    tag: "Productivity",
    title: "The five-minute review",
    desc: "Skip the productivity theatre. The lightweight weekly ritual our team actually sticks with.",
    date: "Jun 10, 2025",
    author: "Riya Patel",
    read: "4 minute read",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1000&q=80",
  },
  {
    tag: "Product Updates",
    title: "A faster command palette",
    desc: "Every action, one keystroke away. The new palette is faster and remembers how you work.",
    date: "May 28, 2025",
    author: "Leo Ramirez",
    read: "2 minute read",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&q=80",
  },
];

const tagStyle: Record<Post["tag"], string> = {
  Company:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  Insights:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  Productivity:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Product Updates":
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

export default function Blog7() {
  const [active, setActive] = useState<string>("All");

  const visible = useMemo(
    () => (active === "All" ? posts : posts.filter((p) => p.tag === active)),
    [active],
  );

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-12">
          <aside className="flex flex-col gap-3">
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-sm font-semibold text-neutral-900 dark:text-white"
            >
              Recommended topics
            </motion.h3>
            <div className="flex flex-col items-start gap-2">
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => setActive(t)}
                  className={`px-3.5 py-1.5 rounded-full border text-sm transition-colors cursor-pointer ${
                    active === t
                      ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </aside>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((post, i) => (
                <motion.article
                  key={post.title}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    layout: { type: "spring", stiffness: 260, damping: 30 },
                    opacity: { duration: 0.25, ease: "easeOut" },
                    y: { duration: 0.25, ease: "easeOut" },
                    delay: i * 0.03,
                  }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col gap-5 cursor-pointer group"
                >
                  <div className="aspect-16/11 rounded-2xl bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                    <img
                      src={post.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <span
                      className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-medium ${tagStyle[post.tag]}`}
                    >
                      {post.tag}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-white leading-tight truncate">
                      {post.title}
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                      {post.desc}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                      <span>{post.date}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                      <span>{post.author}</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-400 dark:bg-neutral-600" />
                      <span>{post.read}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
