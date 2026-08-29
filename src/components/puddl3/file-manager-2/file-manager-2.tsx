"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronRight,
  FileArchive,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  MoreHorizontal,
  Share2,
  Trash2,
  X,
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

const ROOT_CRUMBS = ["Halcyon Drive", "Spring Campaign", "Assets"];

const FOLDERS = [
  { id: "d1", name: "Key art" },
  { id: "d2", name: "Social cutdowns" },
  { id: "d3", name: "Print exports" },
];

type Kind = "image" | "video" | "doc" | "archive";

type Item = {
  id: string;
  name: string;
  ext: string;
  bytes: number;
  icon: typeof FileImage;
  kind: Kind;
  folder: string;
};

const FILES: Item[] = [
  {
    id: "f1",
    name: "hero-still-a.png",
    ext: "PNG",
    bytes: 4.2,
    icon: FileImage,
    kind: "image",
    folder: "d1",
  },
  {
    id: "f2",
    name: "hero-still-b.png",
    ext: "PNG",
    bytes: 3.9,
    icon: FileImage,
    kind: "image",
    folder: "d1",
  },
  {
    id: "f3",
    name: "teaser-15s.mp4",
    ext: "MP4",
    bytes: 88,
    icon: FileVideo,
    kind: "video",
    folder: "d2",
  },
  {
    id: "f4",
    name: "campaign-brief.pdf",
    ext: "PDF",
    bytes: 1.1,
    icon: FileText,
    kind: "doc",
    folder: "d1",
  },
  {
    id: "f5",
    name: "billboard-2400.png",
    ext: "PNG",
    bytes: 12.4,
    icon: FileImage,
    kind: "image",
    folder: "d3",
  },
  {
    id: "f6",
    name: "press-kit.zip",
    ext: "ZIP",
    bytes: 240,
    icon: FileArchive,
    kind: "archive",
    folder: "d3",
  },
  {
    id: "f7",
    name: "storyboard-v4.pdf",
    ext: "PDF",
    bytes: 6.7,
    icon: FileText,
    kind: "doc",
    folder: "d3",
  },
  {
    id: "f8",
    name: "sizzle-30s.mp4",
    ext: "MP4",
    bytes: 164,
    icon: FileVideo,
    kind: "video",
    folder: "d2",
  },
];

const FILTERS: { label: string; kind: Kind | null }[] = [
  { label: "All", kind: null },
  { label: "Images", kind: "image" },
  { label: "Video", kind: "video" },
  { label: "Documents", kind: "doc" },
];

export default function FileManager2() {
  const [files, setFiles] = useState(FILES);
  const [folder, setFolder] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const [asc, setAsc] = useState(true);
  const [selected, setSelected] = useState<string[]>(["f1", "f3"]);

  const activeFolder = FOLDERS.find((f) => f.id === folder);
  const crumbs = activeFolder
    ? [...ROOT_CRUMBS, activeFolder.name]
    : ROOT_CRUMBS;

  const visible = useMemo(() => {
    const kind = FILTERS.find((f) => f.label === filter)?.kind ?? null;
    const list = files.filter(
      (f) =>
        (folder === null || f.folder === folder) &&
        (kind === null || f.kind === kind),
    );
    return [...list].sort(
      (a, b) => a.name.localeCompare(b.name) * (asc ? 1 : -1),
    );
  }, [files, folder, filter, asc]);

  const folderCount = folder === null ? FOLDERS.length : 0;
  const totalSize = visible.reduce((sum, f) => sum + f.bytes, 0);

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const openFolder = (id: string | null) => {
    setFolder(id);
    setSelected([]);
    setFilter("All");
  };

  const removeSelected = () => {
    setFiles((f) => f.filter((x) => !selected.includes(x.id)));
    setSelected([]);
  };

  return (
    <div className="flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div className={cx(frame, "flex min-h-0 flex-1 flex-col gap-1")}>
        <div className={cx(panel, "px-4 py-3")}>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-[12px]">
              {crumbs.map((c, i) => (
                <li key={c} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight
                      className="h-3 w-3 text-neutral-300 dark:text-neutral-700"
                      aria-hidden
                    />
                  )}
                  {i === crumbs.length - 1 ? (
                    <span
                      aria-current="page"
                      className="font-medium text-neutral-900 dark:text-neutral-100"
                    >
                      {c}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openFolder(null)}
                      className={cx(
                        "cursor-pointer rounded-[var(--rb-r-xs,4px)] px-0.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                        transition,
                        focus,
                      )}
                    >
                      {c}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
                {activeFolder ? activeFolder.name : "Assets"}
              </h2>
              <p className="mt-0.5 text-[12px] text-neutral-500 tabular-nums">
                {folderCount} folders · {visible.length} files ·{" "}
                {totalSize.toFixed(1)} MB
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Filter by type"
                className="hidden items-center gap-0.5 rounded-[var(--rb-r-lg,10px)] bg-neutral-100 p-1 sm:flex dark:bg-neutral-800/60"
              >
                {FILTERS.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={filter === f.label}
                    onClick={() => setFilter(f.label)}
                    className={cx(
                      "inline-flex h-6 cursor-pointer items-center rounded-[var(--rb-r-sm,6px)] px-2 text-[12px] font-medium",
                      transition,
                      focus,
                      filter === f.label
                        ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:text-neutral-100"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAsc((a) => !a)}
                aria-label={`Sort by name, ${asc ? "ascending" : "descending"}`}
                className={cx(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                {asc ? (
                  <ArrowDownAZ className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ArrowUpAZ className="h-3.5 w-3.5" aria-hidden />
                )}
                Name
              </button>
            </div>
          </div>
        </div>

        <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-3")}>
          {folder === null && (
            <>
              <p className="text-[12px] font-medium text-neutral-500">
                Folders
              </p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {FOLDERS.map((f) => {
                  const count = files.filter((x) => x.folder === f.id).length;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => openFolder(f.id)}
                        className={cx(
                          "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white px-3 py-2.5 text-left hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800/60",
                          transition,
                          focus,
                        )}
                      >
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 dark:bg-neutral-800"
                        >
                          <Folder className="h-4 w-4 text-neutral-500" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                            {f.name}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-neutral-500 tabular-nums">
                            {count} items
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <p
            className={cx(
              "text-[12px] font-medium text-neutral-500",
              folder === null && "mt-5",
            )}
          >
            Files
          </p>
          {visible.length === 0 ? (
            <div className="mt-2 flex flex-col items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-6 py-10 text-center dark:bg-neutral-800/40">
              <FileImage className="h-5 w-5 text-neutral-300 dark:text-neutral-700" />
              <p className="mt-2 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                No files to show
              </p>
              <p className="mt-1 text-[12px] text-neutral-500">
                Nothing here matches the “{filter}” filter.
              </p>
            </div>
          ) : (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {visible.map((f) => {
                const isSelected = selected.includes(f.id);
                const Icon = f.icon;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggle(f.id)}
                      className={cx(
                        "w-full cursor-pointer overflow-hidden rounded-[var(--rb-r-md,8px)] border bg-white text-left dark:bg-neutral-900",
                        transition,
                        focus,
                        isSelected
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
                          {f.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-neutral-500 tabular-nums">
                          {f.ext} · {f.bytes.toFixed(1)} MB
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
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
            <div className="flex items-center gap-1.5">
              {[
                { icon: Share2, label: "Share", onClick: () => {} },
                { icon: Trash2, label: "Delete", onClick: removeSelected },
                { icon: MoreHorizontal, label: "More", onClick: () => {} },
              ].map(({ icon: Icon, label, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className={cx(
                    "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                    transition,
                    focus,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </button>
              ))}
              <button
                type="button"
                aria-label="Clear selection"
                onClick={() => setSelected([])}
                className={cx(
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
