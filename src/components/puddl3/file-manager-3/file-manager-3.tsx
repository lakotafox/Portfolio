"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileImage,
  FileText,
  FileVideo,
  Globe,
  Link2,
  Lock,
  Share2,
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

type Person = { name: string; initials: string; role: string };

type FileRecord = {
  id: string;
  name: string;
  meta: string;
  icon: typeof FileImage;
  version: string;
  details: { label: string; value: string }[];
  people: Person[];
  activity: { id: string; who: string; what: string; at: string }[];
};

const OWNER: Person = { name: "Priya Patel", initials: "PP", role: "Owner" };
const EDITOR: Person = { name: "Theo Park", initials: "TP", role: "Can edit" };
const VIEWER: Person = { name: "Nora Vale", initials: "NV", role: "Can view" };
const REVIEWER: Person = {
  name: "Mira Stone",
  initials: "MS",
  role: "Can comment",
};

const FILES: FileRecord[] = [
  {
    id: "a1",
    name: "Northwind key visual.png",
    meta: "PNG · 12.4 MB",
    icon: FileImage,
    version: "Version 4 · 12.4 MB",
    details: [
      { label: "Type", value: "PNG image" },
      { label: "Size", value: "12.4 MB" },
      { label: "Dimensions", value: "4000 × 2500" },
      { label: "Owner", value: "Priya Patel" },
      { label: "Modified", value: "Today, 09:24" },
      { label: "Location", value: "Client Deliverables" },
    ],
    people: [OWNER, EDITOR, VIEWER],
    activity: [
      { id: "v1", who: "Priya Patel", what: "uploaded version 4", at: "Today" },
      { id: "v2", who: "Theo Park", what: "left a comment", at: "Yesterday" },
      { id: "v3", who: "Nora Vale", what: "shared with the studio", at: "Tue" },
    ],
  },
  {
    id: "a2",
    name: "Brand guidelines.pdf",
    meta: "PDF · 8.1 MB",
    icon: FileText,
    version: "Version 12 · 8.1 MB",
    details: [
      { label: "Type", value: "PDF document" },
      { label: "Size", value: "8.1 MB" },
      { label: "Pages", value: "64" },
      { label: "Owner", value: "Theo Park" },
      { label: "Modified", value: "Yesterday, 17:02" },
      { label: "Location", value: "Client Deliverables" },
    ],
    people: [EDITOR, OWNER, REVIEWER],
    activity: [
      { id: "v1", who: "Theo Park", what: "replaced page 41", at: "Yesterday" },
      { id: "v2", who: "Mira Stone", what: "resolved 3 comments", at: "Mon" },
    ],
  },
  {
    id: "a3",
    name: "Launch film master.mp4",
    meta: "MP4 · 1.2 GB",
    icon: FileVideo,
    version: "Version 2 · 1.2 GB",
    details: [
      { label: "Type", value: "MP4 video" },
      { label: "Size", value: "1.2 GB" },
      { label: "Duration", value: "1:48" },
      { label: "Owner", value: "Leo Grant" },
      { label: "Modified", value: "2 days ago" },
      { label: "Location", value: "Client Deliverables" },
    ],
    people: [
      { name: "Leo Grant", initials: "LG", role: "Owner" },
      OWNER,
      VIEWER,
      REVIEWER,
    ],
    activity: [
      { id: "v1", who: "Leo Grant", what: "uploaded the grade", at: "2d ago" },
      {
        id: "v2",
        who: "Priya Patel",
        what: "requested captions",
        at: "2d ago",
      },
    ],
  },
  {
    id: "a4",
    name: "Typography specimen.pdf",
    meta: "PDF · 2.6 MB",
    icon: FileText,
    version: "Version 1 · 2.6 MB",
    details: [
      { label: "Type", value: "PDF document" },
      { label: "Size", value: "2.6 MB" },
      { label: "Pages", value: "18" },
      { label: "Owner", value: "Kenji Tan" },
      { label: "Modified", value: "Last week" },
      { label: "Location", value: "Brand Library" },
    ],
    people: [{ name: "Kenji Tan", initials: "KT", role: "Owner" }, VIEWER],
    activity: [
      { id: "v1", who: "Kenji Tan", what: "created the file", at: "Last week" },
    ],
  },
  {
    id: "a5",
    name: "Packaging mock.png",
    meta: "PNG · 9.8 MB",
    icon: FileImage,
    version: "Version 7 · 9.8 MB",
    details: [
      { label: "Type", value: "PNG image" },
      { label: "Size", value: "9.8 MB" },
      { label: "Dimensions", value: "3200 × 3200" },
      { label: "Owner", value: "Mira Stone" },
      { label: "Modified", value: "Today, 08:10" },
      { label: "Location", value: "Client Deliverables" },
    ],
    people: [REVIEWER, OWNER, EDITOR, VIEWER],
    activity: [
      { id: "v1", who: "Mira Stone", what: "uploaded version 7", at: "Today" },
      { id: "v2", who: "Theo Park", what: "approved the mock", at: "Today" },
    ],
  },
];

export default function FileManager3() {
  const [active, setActive] = useState("a1");
  const [restricted, setRestricted] = useState(true);
  const [copied, setCopied] = useState(false);

  const file = FILES.find((f) => f.id === active) ?? FILES[0];
  const PreviewIcon = file.icon;

  const copyLink = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex h-full min-h-[720px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "grid min-h-0 flex-1 gap-1 lg:grid-cols-[1fr_320px]",
        )}
      >
        <div className="flex min-h-[300px] min-w-0 flex-col gap-1 lg:min-h-0">
          <div className={cx(panel, "px-4 py-3")}>
            <h2 className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Client Deliverables
            </h2>
            <p className="mt-0.5 text-[12px] text-neutral-500 tabular-nums">
              {FILES.length} files · 1.24 GB
            </p>
          </div>

          <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-2")}>
            <ul className="space-y-0.5">
              {FILES.map((f) => {
                const isActive = f.id === active;
                const Icon = f.icon;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => {
                        setActive(f.id);
                        setCopied(false);
                      }}
                      className={cx(
                        "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--rb-r-md,8px)] px-2.5 py-2 text-left",
                        transition,
                        focus,
                        isActive
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
                      )}
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 text-neutral-400"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {f.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-neutral-500 tabular-nums">
                          {f.meta}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <aside className="flex min-h-0 min-w-0 flex-col gap-1">
          <div className={cx(panel, "p-3")}>
            <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 dark:bg-neutral-800">
              <PreviewIcon className="h-7 w-7 text-neutral-400" aria-hidden />
            </div>
            <h3 className="mt-3 truncate text-[14px] font-medium text-neutral-900 dark:text-neutral-100">
              {file.name}
            </h3>
            <p className="mt-0.5 text-[12px] text-neutral-500 tabular-nums">
              {file.version}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className={cx(
                  "inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                  transition,
                  focus,
                )}
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Download
              </button>
              <button
                type="button"
                aria-label={`Share ${file.name}`}
                className={cx(
                  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
                  transition,
                  focus,
                )}
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-3")}>
            <h4 className="text-[12px] font-medium text-neutral-500">
              Details
            </h4>
            <dl className="mt-2 space-y-1.5">
              {file.details.map((d) => (
                <div key={d.label} className="flex items-baseline gap-3">
                  <dt className="w-[86px] shrink-0 text-[12px] text-neutral-500">
                    {d.label}
                  </dt>
                  <dd className="min-w-0 flex-1 truncate text-[13px] text-neutral-800 dark:text-neutral-200">
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>

            <h4 className="mt-5 text-[12px] font-medium text-neutral-500">
              Shared with
            </h4>
            <ul className="mt-2 space-y-1.5">
              {file.people.map((p) => (
                <li key={p.name} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {p.initials}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-800 dark:text-neutral-200">
                    {p.name}
                  </span>
                  <span className="shrink-0 text-[12px] text-neutral-500">
                    {p.role}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center gap-2 rounded-[var(--rb-r-md,8px)] bg-neutral-50 p-2 dark:bg-neutral-800/40">
              <button
                type="button"
                aria-pressed={!restricted}
                onClick={() => setRestricted((r) => !r)}
                className={cx(
                  "flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-[var(--rb-r-sm,6px)] px-1 py-1 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/60",
                  transition,
                  focus,
                )}
              >
                {restricted ? (
                  <Lock
                    className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    aria-hidden
                  />
                ) : (
                  <Globe
                    className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                    aria-hidden
                  />
                )}
                <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-600 dark:text-neutral-300">
                  {restricted
                    ? "Restricted to invited people"
                    : "Anyone with the link can view"}
                </span>
              </button>
              <button
                type="button"
                aria-label="Copy link"
                onClick={copyLink}
                className={cx(
                  "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                  transition,
                  focus,
                )}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p role="status" className="mt-1 h-4 text-[11px] text-neutral-500">
              {copied ? "Link copied to clipboard" : ""}
            </p>

            <h4 className="mt-4 text-[12px] font-medium text-neutral-500">
              Activity
            </h4>
            <ul className="mt-2 space-y-2">
              {file.activity.map((a) => (
                <li key={a.id} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600"
                  />
                  <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {a.who}
                    </span>{" "}
                    {a.what}
                    <span className="text-neutral-400"> · {a.at}</span>
                  </p>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={cx(
                "mt-4 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-[var(--rb-r-md,8px)] border border-neutral-200 bg-white text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                transition,
                focus,
              )}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              Make a copy
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
