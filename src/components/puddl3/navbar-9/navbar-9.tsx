"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const surface =
  "rounded-[var(--rb-r-xl,12px)] border border-neutral-200 bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] dark:border-neutral-800 dark:bg-neutral-900";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

const pop = (reduce: boolean | null) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -4 },
  animate: reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
  exit: reduce
    ? { opacity: 0, transition: { duration: 0.12 } }
    : {
        opacity: 0,
        scale: 0.97,
        y: -4,
        transition: { duration: 0.12, ease: EASE_OUT },
      },
  transition: { duration: 0.18, ease: EASE_OUT },
});

const iconButton =
  "relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const CATEGORIES: {
  id: string;
  label: string;
  columns: { title: string; items: string[] }[];
}[] = [
  {
    id: "brew",
    label: "Brewing",
    columns: [
      {
        title: "Machines",
        items: ["Espresso", "Filter", "Grinders", "Kettles"],
      },
      { title: "Manual", items: ["Pour over", "Press", "Moka", "Siphon"] },
      { title: "Accessories", items: ["Scales", "Tampers", "Filters", "Jugs"] },
    ],
  },
  {
    id: "beans",
    label: "Beans",
    columns: [
      { title: "Roast", items: ["Light", "Medium", "Dark", "Decaf"] },
      { title: "Origin", items: ["Ethiopia", "Colombia", "Kenya", "Brazil"] },
      {
        title: "Format",
        items: ["Whole bean", "Ground", "Capsules", "Sample"],
      },
    ],
  },
];

const FLAT = ["Subscriptions", "Gifting", "Journal"];

const CART = [
  { id: "c1", name: "Meridian espresso grinder", price: 248, qty: 1 },
  { id: "c2", name: "Harbor blend, 1kg", price: 32, qty: 2 },
];

export default function Navbar9() {
  const reduce = useReducedMotion();
  const [menu, setMenu] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [section, setSection] = useState<string | null>("brew");
  const [items, setItems] = useState(CART);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu && !drawer) return;
    const doc = rootRef.current?.ownerDocument;
    if (!doc) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-menu-root]")) setMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenu(null);
      setDrawer(false);
    };
    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, drawer]);

  const open = (id: string) => {
    setMenu((m) => (m === id ? null : id));
  };

  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);

  const setQty = (id: string, delta: number) =>
    setItems((list) =>
      list
        .map((i) =>
          i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i,
        )
        .filter((i) => i.qty > 0),
    );

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[560px] w-full flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header className="relative z-20 shrink-0 border-b border-neutral-200 dark:border-neutral-800">
        <p className="flex h-8 items-center justify-center bg-neutral-900 px-4 text-center text-[12px] text-[var(--rb-accent-fg,oklch(100%_0_0))] dark:bg-neutral-100 dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
          Free shipping on orders over $60
        </p>

        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
            className={cx(iconButton, "md:hidden", transition, focus)}
          >
            <Menu className="h-4 w-4" />
          </button>

          <a
            href="#"
            className={cx(
              "shrink-0 rounded-[var(--rb-r-md,8px)] text-[15px] font-semibold tracking-[-0.02em] text-neutral-900 dark:text-neutral-100",
              focus,
            )}
          >
            Harbor Coffee
          </a>

          <nav
            aria-label="Shop"
            className="ml-4 hidden items-center gap-0.5 md:flex"
            data-menu-root
          >
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-haspopup="true"
                aria-expanded={menu === c.id}
                onClick={() => open(c.id)}
                className={cx(
                  "inline-flex h-9 cursor-pointer items-center gap-1 rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium",
                  transition,
                  focus,
                  menu === c.id
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                )}
              >
                {c.label}
                <ChevronDown
                  aria-hidden
                  className={cx(
                    "h-3.5 w-3.5 transition-transform duration-150",
                    menu === c.id && "rotate-180",
                  )}
                />
              </button>
            ))}
            {FLAT.map((f) => (
              <a
                key={f}
                href="#"
                className={cx(
                  "inline-flex h-9 items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {f}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label="Search"
              className={cx(iconButton, transition, focus)}
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Account"
              className={cx(
                iconButton,
                "hidden sm:inline-flex",
                transition,
                focus,
              )}
            >
              <User className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Wishlist, 3 saved"
              className={cx(
                iconButton,
                "hidden sm:inline-flex",
                transition,
                focus,
              )}
            >
              <Heart className="h-4 w-4" />
              <span
                aria-hidden
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
              />
            </button>

            <div className="relative" data-menu-root>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={menu === "cart"}
                aria-label={`Cart, ${count} items`}
                onClick={() => open("cart")}
                className={cx(iconButton, transition, focus)}
              >
                <ShoppingBag className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute top-0.5 right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] px-1 text-[10px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] tabular-nums dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))]">
                    {count}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {menu === "cart" && (
                  <motion.div
                    {...pop(reduce)}
                    className={cx(
                      surface,
                      "absolute top-full right-0 z-30 mt-1.5 w-[300px] origin-top-right",
                    )}
                  >
                    <p className="px-3 py-2.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                      Your bag
                    </p>
                    {items.length === 0 ? (
                      <p className="px-3 pb-4 text-center text-[12px] text-neutral-500">
                        Your bag is empty.
                      </p>
                    ) : (
                      <ul className="max-h-[200px] overflow-y-auto px-1">
                        {items.map((i) => (
                          <li
                            key={i.id}
                            className="flex items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2 py-2"
                          >
                            <span
                              aria-hidden
                              className="h-9 w-9 shrink-0 rounded-[var(--rb-r-md,8px)] bg-neutral-100 dark:bg-neutral-800"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                                {i.name}
                              </span>
                              <span className="block text-[12px] text-neutral-500 tabular-nums">
                                ${i.price}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                aria-label={`Remove one ${i.name}`}
                                onClick={() => setQty(i.id, -1)}
                                className={cx(
                                  "inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                  transition,
                                  focus,
                                )}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-4 text-center text-[12px] text-neutral-900 tabular-nums dark:text-neutral-100">
                                {i.qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`Add one ${i.name}`}
                                onClick={() => setQty(i.id, 1)}
                                className={cx(
                                  "inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                  transition,
                                  focus,
                                )}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="text-neutral-500">Subtotal</span>
                        <span className="font-medium text-neutral-900 tabular-nums dark:text-neutral-100">
                          ${total}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={cx(
                          "mt-2.5 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.99] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                          transition,
                          focus,
                        )}
                      >
                        Checkout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {CATEGORIES.map(
          (c) =>
            menu === c.id && (
              <div
                key={c.id}
                data-menu-root
                className={cx(
                  "absolute inset-x-0 top-full z-30 hidden origin-top border-b border-neutral-200 bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none md:block dark:border-neutral-800 dark:bg-neutral-900",
                )}
              >
                <div className="mx-auto grid max-w-[900px] grid-cols-3 gap-6 px-4 py-6">
                  {c.columns.map((col) => (
                    <div key={col.title}>
                      <p className="text-[11px] font-medium tracking-[0.08em] text-neutral-400 uppercase">
                        {col.title}
                      </p>
                      <ul className="mt-2 space-y-0.5">
                        {col.items.map((item) => (
                          <li key={item}>
                            <a
                              href="#"
                              className={cx(
                                "block rounded-[var(--rb-r-md,8px)] px-2 py-1.5 text-[13px] text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                transition,
                                focus,
                              )}
                            >
                              {item}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ),
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Meridian grinder", "Harbor blend", "Pour-over set"].map((p) => (
            <div
              key={p}
              className="overflow-hidden rounded-[var(--rb-r-xl,12px)] border border-neutral-200 dark:border-neutral-800"
            >
              <div className="h-[110px] bg-neutral-100 dark:bg-neutral-900" />
              <div className="p-3">
                <p className="truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                  {p}
                </p>
                <p className="mt-0.5 text-[12px] text-neutral-500 tabular-nums">
                  From $32
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              aria-hidden
              onClick={() => setDrawer(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.16, ease: EASE_OUT },
              }}
              transition={{ duration: 0.24, ease: EASE_OUT }}
              className="absolute inset-0 z-30 bg-neutral-950/40 md:hidden"
            />
            <motion.aside
              aria-label="Shop menu"
              initial={reduce ? { opacity: 0 } : { x: "-100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={
                reduce
                  ? { opacity: 0, transition: { duration: 0.16 } }
                  : {
                      x: "-100%",
                      transition: { duration: 0.22, ease: EASE_DRAWER },
                    }
              }
              transition={{ duration: 0.32, ease: EASE_DRAWER }}
              className="absolute inset-y-0 left-0 z-40 flex w-[280px] max-w-[85%] flex-col border-r border-neutral-200 bg-white md:hidden dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
                <span className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
                  Menu
                </span>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => {
                    setDrawer(false);
                  }}
                  className={cx(iconButton, transition, focus)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {CATEGORIES.map((c) => (
                  <div key={c.id}>
                    <button
                      type="button"
                      aria-expanded={section === c.id}
                      onClick={() =>
                        setSection((s) => (s === c.id ? null : c.id))
                      }
                      className={cx(
                        "flex h-10 w-full cursor-pointer items-center justify-between rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900",
                        transition,
                        focus,
                      )}
                    >
                      {c.label}
                      <ChevronDown
                        aria-hidden
                        className={cx(
                          "h-3.5 w-3.5 text-neutral-400 transition-transform duration-150",
                          section === c.id && "rotate-180",
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {section === c.id && (
                        <motion.ul
                          initial={
                            reduce ? { opacity: 0 } : { height: 0, opacity: 0 }
                          }
                          animate={
                            reduce
                              ? { opacity: 1 }
                              : { height: "auto", opacity: 1 }
                          }
                          exit={
                            reduce
                              ? { opacity: 0, transition: { duration: 0.12 } }
                              : {
                                  height: 0,
                                  opacity: 0,
                                  transition: {
                                    duration: 0.16,
                                    ease: EASE_OUT,
                                  },
                                }
                          }
                          transition={{ duration: 0.2, ease: EASE_OUT }}
                          className="mb-1 space-y-0.5 pl-2.5 overflow-hidden"
                        >
                          {c.columns
                            .flatMap((col) => col.items)
                            .map((item) => (
                              <li key={item}>
                                <a
                                  href="#"
                                  className={cx(
                                    "block rounded-[var(--rb-r-md,8px)] px-2.5 py-1.5 text-[13px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
                                    transition,
                                    focus,
                                  )}
                                >
                                  {item}
                                </a>
                              </li>
                            ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {FLAT.map((f) => (
                  <a
                    key={f}
                    href="#"
                    className={cx(
                      "flex h-10 items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900",
                      transition,
                      focus,
                    )}
                  >
                    {f}
                  </a>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
