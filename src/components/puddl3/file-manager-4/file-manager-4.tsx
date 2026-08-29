"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CloudUpload,
  FileArchive,
  FileImage,
  FileText,
  FileVideo,
  Pause,
  Play,
  RotateCcw,
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

type State = "done" | "uploading" | "paused" | "queued" | "failed";

type Upload = {
  id: string;
  name: string;
  mb: number;
  icon: typeof FileImage;
  progress: number;
  state: State;
};

const INITIAL: Upload[] = [
  {
    id: "u1",
    name: "hero-still-a.png",
    mb: 4.2,
    icon: FileImage,
    progress: 100,
    state: "done",
  },
  {
    id: "u2",
    name: "campaign-brief.pdf",
    mb: 1.1,
    icon: FileText,
    progress: 100,
    state: "done",
  },
  {
    id: "u3",
    name: "sizzle-30s.mp4",
    mb: 164,
    icon: FileVideo,
    progress: 62,
    state: "uploading",
  },
  {
    id: "u4",
    name: "press-kit.zip",
    mb: 240,
    icon: FileArchive,
    progress: 0,
    state: "queued",
  },
  {
    id: "u5",
    name: "billboard-2400.png",
    mb: 12.4,
    icon: FileImage,
    progress: 34,
    state: "failed",
  },
];

const EXTRA: Omit<Upload, "id" | "progress" | "state">[] = [
  { name: "teaser-15s.mp4", mb: 88, icon: FileVideo },
  { name: "storyboard-v4.pdf", mb: 6.7, icon: FileText },
  { name: "hero-still-b.png", mb: 3.9, icon: FileImage },
];

const noteFor = (u: Upload) => {
  if (u.state === "done") return "Uploaded";
  if (u.state === "failed") return "Connection lost";
  if (u.state === "paused") return `Paused at ${Math.round(u.progress)}%`;
  if (u.state === "queued") return "Waiting";
  const left = Math.max(1, Math.round(((100 - u.progress) / 100) * 60));
  return `${Math.round(u.progress)}% · ${left} s left`;
};

export default function FileManager4() {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<Upload[]>(INITIAL);
  const added = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setQueue((q) => {
        if (!q.some((u) => u.state === "uploading")) return q;
        return q.map((u) => {
          if (u.state !== "uploading") return u;
          const next = u.progress + 3;
          return next >= 100
            ? { ...u, progress: 100, state: "done" as State }
            : { ...u, progress: next };
        });
      });
    }, 900);
    return () => window.clearInterval(id);
  }, []);

  const done = queue.filter((u) => u.state === "done").length;
  const totalMb = queue.reduce((s, u) => s + u.mb, 0);
  const sentMb = queue.reduce((s, u) => s + (u.mb * u.progress) / 100, 0);

  const addFile = () => {
    const source = EXTRA[added.current % EXTRA.length];
    added.current += 1;
    setQueue((q) => [
      ...q,
      {
        ...source,
        id: `n${added.current}`,
        progress: 0,
        state: q.some((u) => u.state === "uploading") ? "queued" : "uploading",
      },
    ]);
  };

  const act = (u: Upload) => {
    setQueue((q) =>
      q.flatMap((x) => {
        if (x.id !== u.id) return [x];
        if (x.state === "uploading")
          return [{ ...x, state: "paused" as State }];
        if (x.state === "paused" || x.state === "queued")
          return [{ ...x, state: "uploading" as State }];
        if (x.state === "failed")
          return [{ ...x, progress: 0, state: "uploading" as State }];
        return [];
      }),
    );
  };

  return (
    <div className="flex h-full min-h-[640px] w-full flex-col overflow-hidden bg-white p-4 sm:p-6 dark:bg-neutral-950">
      <div
        className={cx(
          frame,
          "mx-auto flex min-h-0 w-full max-w-[720px] flex-1 flex-col gap-1",
        )}
      >
        <div
          className={cx(
            panel,
            "flex items-center justify-between gap-3 px-4 py-3",
          )}
        >
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
              Upload to Spring Campaign
            </h2>
            <p className="mt-0.5 truncate text-[12px] text-neutral-500 tabular-nums">
              {done} of {queue.length} complete · {totalMb.toFixed(1)} MB total
            </p>
          </div>
          <button
            type="button"
            aria-label="Close uploader"
            className={cx(
              "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
              transition,
              focus,
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cx(panel, "p-3")}>
          <button
            type="button"
            onClick={addFile}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFile();
            }}
            className={cx(
              "flex w-full cursor-pointer flex-col items-center justify-center rounded-[var(--rb-r-md,8px)] border border-dashed px-4 py-7 text-center",
              transition,
              focus,
              dragging
                ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800/60"
                : "border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/40",
            )}
          >
            <CloudUpload className="h-6 w-6 text-neutral-400" aria-hidden />
            <p className="mt-2.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Drop files here or click to browse
            </p>
            <p className="mt-1 text-[12px] text-neutral-500">
              Up to 2 GB per file. Images, video, PDF and archives.
            </p>
          </button>
        </div>

        <div className={cx(panel, "min-h-0 flex-1 overflow-y-auto p-3")}>
          <p className="text-[12px] font-medium text-neutral-500">Queue</p>
          {queue.length === 0 ? (
            <div className="mt-2 flex flex-col items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-50 px-6 py-10 text-center dark:bg-neutral-800/40">
              <CloudUpload className="h-5 w-5 text-neutral-300 dark:text-neutral-700" />
              <p className="mt-2 text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                Queue is empty
              </p>
              <p className="mt-1 text-[12px] text-neutral-500">
                Drop files above to start a new upload.
              </p>
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {queue.map((u) => {
                const Icon = u.icon;
                const note = noteFor(u);
                return (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 rounded-[var(--rb-r-md,8px)] border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 text-neutral-400"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                          {u.name}
                        </span>
                        <span className="shrink-0 text-[12px] text-neutral-500 tabular-nums">
                          {u.mb.toFixed(1)} MB
                        </span>
                      </p>
                      {u.state === "done" ? (
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-500">
                          <Check
                            className="h-3 w-3 shrink-0 text-neutral-400"
                            aria-hidden
                          />
                          {note}
                        </p>
                      ) : (
                        <>
                          <div
                            role="progressbar"
                            aria-valuenow={Math.round(u.progress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Upload progress for ${u.name}`}
                            className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
                          >
                            <div
                              style={{ width: `${u.progress}%` }}
                              className={cx(
                                "h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
                                u.state === "failed"
                                  ? "bg-red-500"
                                  : "bg-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))]",
                              )}
                            />
                          </div>
                          <p
                            className={cx(
                              "mt-1 text-[12px] tabular-nums",
                              u.state === "failed"
                                ? "text-red-600 dark:text-red-400"
                                : "text-neutral-500",
                            )}
                          >
                            {note}
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => act(u)}
                      aria-label={
                        u.state === "failed"
                          ? `Retry ${u.name}`
                          : u.state === "uploading"
                            ? `Pause ${u.name}`
                            : u.state === "paused" || u.state === "queued"
                              ? `Start ${u.name}`
                              : `Remove ${u.name}`
                      }
                      className={cx(
                        "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-sm,6px)] text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                        transition,
                        focus,
                      )}
                    >
                      {u.state === "failed" ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : u.state === "uploading" ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : u.state === "paused" || u.state === "queued" ? (
                        <Play className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          className={cx(
            panel,
            "flex flex-wrap items-center justify-between gap-2 px-3 py-2",
          )}
        >
          <p className="text-[12px] text-neutral-500 tabular-nums">
            {sentMb.toFixed(1)} MB of {totalMb.toFixed(1)} MB transferred
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQueue([])}
              className={cx(
                "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] px-2.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                transition,
                focus,
              )}
            >
              Cancel all
            </button>
            <button
              type="button"
              onClick={() =>
                setQueue((q) => q.filter((u) => u.state !== "done"))
              }
              className={cx(
                "inline-flex h-8 cursor-pointer items-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] px-3 text-[13px] font-medium text-[var(--rb-accent-fg,oklch(100%_0_0))] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-[0.98] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)]",
                transition,
                focus,
              )}
            >
              Clear completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
