"use client";

import { useEffect, useState } from "react";
import { Apple, Check, Star } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const listAvatars = [
  "https://i.pravatar.cc/80?img=12",
  "https://i.pravatar.cc/80?img=45",
  "https://i.pravatar.cc/80?img=38",
];

const testimonials = [
  {
    quote:
      "Booked a stylist and a location scout in one afternoon. The fit was perfect.",
    name: "Mara Chen",
    role: "Photographer",
    rating: "5.0",
    avatar: "https://i.pravatar.cc/80?img=25",
  },
  {
    quote:
      "Every brief I posted came back with three serious portfolios by morning.",
    name: "Jonas Reyes",
    role: "Art Director",
    rating: "4.9",
    avatar: "https://i.pravatar.cc/80?img=33",
  },
  {
    quote:
      "It replaced four group chats and a spreadsheet. My bookings doubled.",
    name: "Amélie Fortin",
    role: "Stylist",
    rating: "5.0",
    avatar: "https://i.pravatar.cc/80?img=47",
  },
];

export default function Waitlist5() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [slide, setSlide] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setSlide((current) => (current + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, [reduceMotion, slide]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.log("Waitlist signup:", email);
    setStatus("success");
  };

  const active = testimonials[slide];

  return (
    <section className="w-full min-h-[var(--rb-section-min-h,100vh)] flex items-start lg:items-center bg-white px-4 py-16 dark:bg-neutral-950 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto w-full max-w-[1400px]"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="max-w-2xl">
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
            >
              <Apple className="h-4 w-4" />
              Launching on iOS this fall
            </motion.div>

            <motion.h1
              variants={item}
              className="mt-6 text-4xl font-medium leading-[1.08] tracking-tight text-neutral-900 dark:text-white sm:text-5xl md:text-6xl"
            >
              Find. <em className="font-serif font-normal italic">Book.</em>{" "}
              Create.
              <br />
              At last, in <em className="font-serif font-normal italic">
                one
              </em>{" "}
              place.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-lg"
            >
              Brief vetted photographers, stylists, and art directors, then lock
              the booking and get paid in one seamless space, from first hello
              to final file.
            </motion.p>

            <motion.form
              variants={item}
              onSubmit={handleSubmit}
              className="mt-9 w-full max-w-xl"
            >
              <AnimatePresence mode="wait" initial={false}>
                {status === "success" ? (
                  <motion.div
                    key="success"
                    role="status"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex min-h-14 items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-neutral-50 px-6 py-3 text-center text-sm font-medium text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white sm:text-base"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    You&apos;re on the list: see you at the beta.
                  </motion.div>
                ) : (
                  <motion.div
                    key="fields"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@studio.com"
                      required
                      disabled={status === "loading"}
                      aria-label="Email address"
                      className="h-14 w-full rounded-full border border-transparent bg-neutral-100 px-6 text-base text-neutral-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-neutral-500 focus-visible:border-neutral-300 focus-visible:ring-2 focus-visible:ring-neutral-900/10 disabled:opacity-50 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus-visible:border-neutral-700 dark:focus-visible:ring-white/15 sm:flex-1"
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="inline-flex h-14 w-full shrink-0 cursor-pointer items-center justify-center rounded-full bg-black px-8 text-base font-medium text-white transition-colors duration-200 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950 sm:w-auto"
                    >
                      {status === "loading" ? "Saving…" : "Save my spot"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>

            <motion.div
              variants={item}
              className="mt-7 flex items-center gap-3"
            >
              <div className="flex -space-x-2.5">
                {listAvatars.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-9 w-9 rounded-full border-2 border-white object-cover dark:border-neutral-950"
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  6,200+ creatives
                </span>{" "}
                already signed up for the beta
              </p>
            </motion.div>
          </div>

          <motion.div variants={item} className="w-full">
            <div className="relative overflow-hidden rounded-[2rem] bg-neutral-100 dark:bg-neutral-900">
              <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5]">
                <img
                  src="/svg/placeholder.svg"
                  alt="Featured creator portfolio"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-black/5 dark:ring-white/10" />

              <div className="absolute inset-x-4 bottom-4 grid items-end sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[22rem] sm:max-w-[calc(100%-3rem)]">
                <AnimatePresence initial={false}>
                  <motion.figure
                    key={slide}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="col-start-1 row-start-1 rounded-2xl border border-neutral-200/80 bg-white/95 p-5 shadow-xl shadow-neutral-950/10 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95 dark:shadow-black/40"
                  >
                    <div
                      className="flex gap-1"
                      role="img"
                      aria-label={`Rated ${active.rating} out of 5`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          aria-hidden="true"
                          className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white"
                        />
                      ))}
                    </div>
                    <blockquote className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      &ldquo;{active.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      <img
                        src={active.avatar}
                        alt={active.name}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                          {active.name}
                        </p>
                        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {active.role}
                        </p>
                      </div>
                      <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-neutral-900 dark:bg-neutral-800 dark:text-white">
                        {active.rating}
                        <Star className="h-3 w-3 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                      </span>
                    </figcaption>
                  </motion.figure>
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              {testimonials.map((testimonial, index) => (
                <motion.button
                  key={testimonial.name}
                  type="button"
                  onClick={() => setSlide(index)}
                  aria-label={`Show testimonial from ${testimonial.name}`}
                  aria-current={slide === index}
                  initial={false}
                  animate={{ width: slide === index ? 24 : 8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-2 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-neutral-950 ${
                    slide === index
                      ? "bg-neutral-900 dark:bg-white"
                      : "bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
