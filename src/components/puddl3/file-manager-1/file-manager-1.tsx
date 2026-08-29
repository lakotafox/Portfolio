"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Clock,
  FileCode2,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderPlus,
  Grid2X2,
  List,
  MoreHorizontal,
  Search,
  Star,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

const transition =
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out";

const frame =
  "rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-950";
const panel =
  "rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900";

type TreeNode = { id: string; name: string; children?: TreeNode[] };

const TREE: TreeNode[] = [
  {
    id: "drive",
    name: "My Drive",
    children: [
      {
        id: "deliverables",
        name: "Client Deliverables",
        children: [
          { id: "northwind", name: "Northwind Rebrand" },
          { id: "harbor", name: "Harbor Coffee" },
        ],
      },
      {
        id: "brand",
        name: "Brand Library",
        children: [
          { id: "logos", name: "Logos" },
          { id: "type", name: "Typefaces" },
        ],
      },
      {
        id: "spring",
        name: "Spring Campaign",
        children: [{ id: "assets", name: "Assets" }],
      },
      { id: "ops", name: "Studio Operations" },
    ],
  },
];

type Row = {
  id: string;
  parent: string;
  folderId?: string;
  name: string;
  icon: typeof Folder;
  owner: string;
  initials: string;
  bytes: number;
  size: string;
  sub?: string;
  modified: string;
  rank: number;
  starred?: boolean;
};

const ROWS: Row[] = [
  {
    id: "r1",
    parent: "drive",
    folderId: "brand",
    name: "Brand Library",
    icon: Folder,
    owner: "Theo Park",
    initials: "TP",
    bytes: 102_200_000,
    size: "102.2 MB",
    sub: "8 items",
    modified: "Last week",
    rank: 1,
  },
  {
    id: "r2",
    parent: "drive",
    folderId: "deliverables",
    name: "Client Deliverables",
    icon: Folder,
    owner: "Priya Patel",
    initials: "PP",
    bytes: 482_200_000,
    size: "482.2 MB",
    sub: "11 items",
    modified: "Yesterday",
    rank: 3,
    starred: true,
  },
  {
    id: "r3",
    parent: "drive",
    folderId: "spring",
    name: "Spring Campaign",
    icon: Folder,
    owner: "Leo Grant",
    initials: "LG",
    bytes: 988_200_000,
    size: "988.2 MB",
    sub: "10 items",
    modified: "Today",
    rank: 4,
    starred: true,
  },
  {
    id: "r4",
    parent: "drive",
    folderId: "ops",
    name: "Studio Operations",
    icon: Folder,
    owner: "Nora Vale",
    initials: "NV",
    bytes: 246_000_000,
    size: "246.0 MB",
    sub: "4 items",
    modified: "2 days ago",
    rank: 2,
  },
  {
    id: "r5",
    parent: "brand",
    name: "brand-tokens.json",
    icon: FileCode2,
    owner: "Kenji Tan",
    initials: "KT",
    bytes: 64_000,
    size: "64.0 KB",
    modified: "Last week",
    rank: 1,
  },
  {
    id: "r6",
    parent: "logos",
    name: "wordmark-lockup.png",
    icon: FileImage,
    owner: "Theo Park",
    initials: "TP",
    bytes: 2_800_000,
    size: "2.8 MB",
    modified: "Last week",
    rank: 1,
  },
  {
    id: "r7",
    parent: "ops",
    name: "New Hire Onboarding.pdf",
    icon: FileText,
    owner: "Mira Stone",
    initials: "MS",
    bytes: 16_000_000,
    size: "16.0 MB",
    modified: "3 weeks ago",
    rank: 0,
  },
  {
    id: "r8",
    parent: "ops",
    name: "Q3 Studio Plan.pdf",
    icon: FileText,
    owner: "Nora Vale",
    initials: "NV",
    bytes: 11_000_000,
    size: "11.0 MB",
    modified: "Today",
    rank: 4,
    starred: true,
  },
  {
    id: "r9",
    parent: "assets",
    name: "Studio Reel 2026.mp4",
    icon: FileVideo,
    owner: "Leo Grant",
    initials: "LG",
    bytes: 64_000_000,
    size: "64.0 MB",
    modified: "Today",
    rank: 4,
  },
  {
    id: "r10",
    parent: "northwind",
    name: "Northwind key visual.png",
    icon: FileImage,
    owner: "Priya Patel",
    initials: "PP",
    bytes: 12_400_000,
    size: "12.4 MB",
    modified: "Today",
    rank: 4,
  },
  {
    id: "r11",
    parent: "harbor",
    name: "Harbor menu board.pdf",
    icon: FileText,
    owner: "Mira Stone",
    initials: "MS",
    bytes: 5_400_000,
    size: "5.4 MB",
    modified: "2 days ago",
    rank: 2,
  },
  {
    id: "r12",
    parent: "type",
    name: "specimen-grotesk.pdf",
    icon: FileText,
    owner: "Kenji Tan",
    initials: "KT",
    bytes: 3_100_000,
    size: "3.1 MB",
    modified: "Yesterday",
    rank: 3,
  },
];

const SHORTCUTS = [
  { id: "shared", icon: Users, label: "Shared with me" },
  { id: "recent", icon: Clock, label: "Recent" },
  { id: "starred", icon: Star, label: "Starred" },
  { id: "bin", icon: Trash2, label: "Bin" },
];

const NAME_BY_ID = new Map<string, string>();
(function walkNames(nodes: TreeNode[]) {
  nodes.forEach((n) => {
    NAME_BY_ID.set(n.id, n.name);
    if (n.children) walkNames(n.children);
  });
})(TREE);

const DESCENDANTS = new Map<string, string[]>();
(function collect(node: TreeNode): string[] {
  const ids = [node.id];
  node.children?.forEach((c) => ids.push(...collect(c)));
  DESCENDANTS.set(node.id, ids);
  return ids;
})(TREE[0]);

type SortKey = "name" | "size" | "modified";

export default function FileManager1() {
  const [open, setOpen] = useState<string[]>(["drive", "deliverables"]);
  const [folder, setFolder] = useState("drive");
  const [shortcut, setShortcut] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({
    key: "name",
    asc: true,
  });
  const [starred, setStarred] = useState<string[]>(
    ROWS.filter((r) => r.starred).map((r) => r.id),
  );

  const rows = useMemo(() => {
    let list: Row[];
    if (shortcut === "starred")
      list = ROWS.filter((r) => starred.includes(r.id));
    else if (shortcut === "recent") list = ROWS.filter((r) => r.rank >= 3);
    else if (shortcut === "shared")
      list = ROWS.filter((r) => r.owner !== "Nora Vale");
    else if (shortcut === "bin") list = [];
    else {
      const scope = DESCENDANTS.get(folder) ?? [folder];
      list = ROWS.filter((r) => scope.includes(r.parent));
    }

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));

    const dir = sort.asc ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "size") return (a.bytes - b.bytes) * dir;
      if (sort.key === "modified") return (a.rank - b.rank) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
  }, [folder, shortcut, query, sort, starred]);

  const visibleIds = rows.map((r) => r.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const toggleRow = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: true }));

  const openFolder = (id: string) => {
    setFolder(id);
    setShortcut(null);
    setSelected([]);
    setQuery("");
    setOpen((o) => (o.includes(id) ? o : [...o, id]));
  };

  const renderTree = (nodes: TreeNode[], depth = 0) =>
    nodes.map((n) => {
      const isOpen = open.includes(n.id);
      const isActive = !shortcut && folder === n.id;
      return (
        <li key={n.id}>
          <div
            style={{ paddingLeft: 4 + depth * 14 }}
            className={cx(
              "flex h-8 items-center rounded-[var(--rb-r-md,8px)] pr-2",
              transition,
              isActive
                ? "bg-neutral-100 dark:bg-neutral-800"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
            )}
          >
            {n.children ? (
              <button
                type="button"
                aria-label={`${isOpen ? "Collapse" : "Expand"} ${n.name}`}
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((o) =>
                    o.includes(n.id)
                      ? o.filter((x) => x !== n.id)
                      : [...o, n.id],
                  )
                }
                className={cx(
                  "inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-xs,4px)] text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <ChevronRight
                  className={cx(
                    "h-3.5 w-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
            ) : (
              <span aria-hidden className="h-5 w-5 shrink-0" />
            )}
            <button
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => openFolder(n.id)}
              className={cx(
                "flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-sm,6px)] px-1 text-[13px]",
                focus,
                isActive
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              <Folder
                className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                aria-hidden
              />
              <span className="truncate">{n.name}</span>
            </button>
          </div>
          {n.children && isOpen && (
            <ul className="space-y-0.5">{renderTree(n.children, depth + 1)}</ul>
          )}
        </li>
      );
    });

  const title = shortcut
    ? (SHORTCUTS.find((s) => s.id === shortcut)?.label ?? "Files")
    : (NAME_BY_ID.get(folder) ?? "My Drive");

  return (
    <div className="flex h-full min-h-[800px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className={cx(frame, "flex min-h-0 flex-1 flex-col gap-1")}>
        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Halcyon Drive
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500">
              Shared studio files and folders
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <FolderPlus className="h-3.5 w-3.5" aria-hidden />
              New folder
            </button>
            <button
              type="button"
              className={cx(
                "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Upload
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-1 lg:grid-cols-[248px_1fr]">
          <aside className={cx(panel, "hidden min-h-0 flex-col lg:flex")}>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <ul className="space-y-0.5">{renderTree(TREE)}</ul>
              <ul className="mt-4 space-y-0.5">
                {SHORTCUTS.map(({ id, icon: Icon, label }) => (
                  <li key={id}>
                    <button
                      type="button"
                      aria-current={shortcut === id ? "true" : undefined}
                      onClick={() => {
                        setShortcut(id);
                        setSelected([]);
                        setQuery("");
                      }}
                      className={cx(
                        "flex h-8 w-full cursor-pointer items-center gap-2 rounded-[var(--rb-r-md,8px)] px-2 text-[13px]",
                        transition,
                        focus,
                        shortcut === id
                          ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
                      )}
                    >
                      <Icon
                        className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                        aria-hidden
                      />
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3">
              <div className="rounded-[var(--rb-r-md,8px)] bg-neutral-50 p-3 dark:bg-neutral-800/40">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-medium text-neutral-900 dark:text-neutral-100">
                    Storage
                  </span>
                  <span className="text-[12px] text-neutral-500 tabular-nums">
                    88% full
                  </span>
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={88}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Storage used"
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
                >
                  <div
                    style={{ width: "88%" }}
                    className="h-full rounded-full bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]"
                  />
                </div>
                <p className="mt-2 text-[12px] text-neutral-500 tabular-nums">
                  1.77 TB of 2.00 TB used
                </p>
              </div>
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col gap-1">
            <div
              className={cx(
                panel,
                "flex flex-wrap items-center justify-between gap-2 px-3 py-2",
              )}
            >
              <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                {title}
              </p>
              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="relative max-w-[240px] min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <label htmlFor="file-manager-1-search" className="sr-only">
                    Search files
                  </label>
                  <input
                    id="file-manager-1-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search files"
                    className={cx(
                      "h-8 w-full rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white pr-2.5 pl-8 text-[13px] text-neutral-900 placeholder:text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
                      transition,
                      focus,
                    )}
                  />
                </div>
                <div
                  role="group"
                  aria-label="View mode"
                  className="flex items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 dark:bg-neutral-800/60"
                >
                  {[
                    { key: "list" as const, icon: List, label: "List view" },
                    { key: "grid" as const, icon: Grid2X2, label: "Grid view" },
                  ].map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      aria-label={label}
                      aria-pressed={view === key}
                      onClick={() => setView(key)}
                      className={cx(
                        "inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)]",
                        transition,
                        focus,
                        view === key
                          ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:text-neutral-100"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto")}>
              {rows.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                  <Folder className="h-6 w-6 text-neutral-300 dark:text-neutral-700" />
                  <p className="mt-3 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    Nothing here
                  </p>
                  <p className="mt-1 max-w-[280px] text-[12px] text-neutral-500">
                    {query
                      ? `No files match “${query}” in this location.`
                      : "This location is empty."}
                  </p>
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className={cx(
                        "mt-3 inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                        transition,
                        focus,
                      )}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : view === "grid" ? (
                <ul className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {rows.map((r) => {
                    const Icon = r.icon;
                    const isSelected = selected.includes(r.id);
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          aria-pressed={r.folderId ? undefined : isSelected}
                          onClick={() =>
                            r.folderId
                              ? openFolder(r.folderId)
                              : toggleRow(r.id)
                          }
                          className={cx(
                            "w-full cursor-pointer overflow-hidden rounded-[var(--rb-r-md,8px)] border bg-white text-left dark:bg-neutral-900",
                            transition,
                            focus,
                            isSelected && !r.folderId
                              ? "border-neutral-900 dark:border-white"
                              : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60",
                          )}
                        >
                          <span className="flex aspect-[4/3] items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                            <Icon
                              className="h-6 w-6 text-neutral-400"
                              aria-hidden
                            />
                          </span>
                          <span className="block px-2.5 py-2">
                            <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                              {r.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-neutral-500 tabular-nums">
                              {r.size} · {r.modified}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <table className="w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="text-[12px] text-neutral-500">
                      <th scope="col" className="w-9 py-2 pl-3 font-normal">
                        <input
                          type="checkbox"
                          aria-label="Select all files"
                          checked={allSelected}
                          onChange={() =>
                            setSelected(allSelected ? [] : visibleIds)
                          }
                          className={cx(
                            "h-3.5 w-3.5 cursor-pointer rounded-[var(--rb-r-xs,4px)] border-neutral-300 accent-neutral-900 dark:border-neutral-700 dark:accent-white",
                            focus,
                          )}
                        />
                      </th>
                      {(
                        [
                          { key: "name", label: "Name", cls: "w-1/2" },
                          {
                            key: "size",
                            label: "Size",
                            cls: "hidden sm:table-cell",
                          },
                          {
                            key: "modified",
                            label: "Modified",
                            cls: "hidden lg:table-cell",
                          },
                        ] as { key: SortKey; label: string; cls: string }[]
                      ).map(({ key, label, cls }) => (
                        <th
                          key={key}
                          scope="col"
                          aria-sort={
                            sort.key === key
                              ? sort.asc
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          className={cx("py-2 pr-3 font-normal", cls)}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSort(key)}
                            className={cx(
                              "inline-flex h-6 cursor-pointer items-center gap-1 rounded-[var(--rb-r-sm,6px)] px-1 hover:text-neutral-900 dark:hover:text-neutral-100",
                              transition,
                              focus,
                              sort.key === key &&
                                "text-neutral-900 dark:text-neutral-100",
                            )}
                          >
                            {label}
                            {sort.key === key &&
                              (sort.asc ? (
                                <ArrowUp className="h-3 w-3" aria-hidden />
                              ) : (
                                <ArrowDown className="h-3 w-3" aria-hidden />
                              ))}
                          </button>
                        </th>
                      ))}
                      <th
                        scope="col"
                        className="hidden py-2 pr-3 font-normal md:table-cell"
                      >
                        Owner
                      </th>
                      <th scope="col" className="w-10 py-2 pr-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const isSelected = selected.includes(r.id);
                      const isStarred = starred.includes(r.id);
                      const Icon = r.icon;
                      return (
                        <tr
                          key={r.id}
                          className={cx(
                            isSelected
                              ? "bg-neutral-50 dark:bg-neutral-800/50"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                            transition,
                          )}
                        >
                          <td className="py-2.5 pl-3">
                            <input
                              type="checkbox"
                              aria-label={`Select ${r.name}`}
                              checked={isSelected}
                              onChange={() => toggleRow(r.id)}
                              className={cx(
                                "h-3.5 w-3.5 cursor-pointer rounded-[var(--rb-r-xs,4px)] border-neutral-300 accent-neutral-900 dark:border-neutral-700 dark:accent-white",
                                focus,
                              )}
                            />
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="flex min-w-0 items-center gap-2">
                              <Icon
                                className="h-4 w-4 shrink-0 text-neutral-400"
                                aria-hidden
                              />
                              {r.folderId ? (
                                <button
                                  type="button"
                                  onClick={() => openFolder(r.folderId!)}
                                  className={cx(
                                    "min-w-0 cursor-pointer truncate rounded-[var(--rb-r-xs,4px)] text-[13px] font-medium text-neutral-900 hover:underline dark:text-neutral-100",
                                    focus,
                                  )}
                                >
                                  {r.name}
                                </button>
                              ) : (
                                <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                                  {r.name}
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label={
                                  isStarred
                                    ? `Unstar ${r.name}`
                                    : `Star ${r.name}`
                                }
                                aria-pressed={isStarred}
                                onClick={() =>
                                  setStarred((s) =>
                                    s.includes(r.id)
                                      ? s.filter((x) => x !== r.id)
                                      : [...s, r.id],
                                  )
                                }
                                className={cx(
                                  "inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                  transition,
                                  focus,
                                  isStarred
                                    ? "text-neutral-500"
                                    : "text-neutral-300 dark:text-neutral-700",
                                )}
                              >
                                <Star
                                  className={cx(
                                    "h-3.5 w-3.5",
                                    isStarred && "fill-current",
                                  )}
                                />
                              </button>
                            </span>
                          </td>
                          <td className="hidden py-2.5 pr-3 sm:table-cell">
                            <span className="block text-[13px] text-neutral-700 tabular-nums dark:text-neutral-300">
                              {r.size}
                            </span>
                            {r.sub && (
                              <span className="mt-0.5 block text-[11px] text-neutral-400 tabular-nums">
                                {r.sub}
                              </span>
                            )}
                          </td>
                          <td className="hidden py-2.5 pr-3 text-[13px] text-neutral-600 lg:table-cell dark:text-neutral-300">
                            {r.modified}
                          </td>
                          <td className="hidden py-2.5 pr-3 md:table-cell">
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                              >
                                {r.initials}
                              </span>
                              <span className="truncate text-[13px] text-neutral-600 dark:text-neutral-300">
                                {r.owner}
                              </span>
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <button
                              type="button"
                              aria-label={`Actions for ${r.name}`}
                              className={cx(
                                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                                transition,
                                focus,
                              )}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {selected.length > 0 && (
              <div
                role="status"
                className={cx(
                  panel,
                  "flex flex-wrap items-center justify-between gap-2 px-3 py-2",
                )}
              >
                <p className="text-[13px] text-neutral-700 dark:text-neutral-200">
                  <span className="font-medium tabular-nums">
                    {selected.length}
                  </span>{" "}
                  selected
                </p>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className={cx(
                    "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
