"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ArrowUp,
  FileText,
  Paperclip,
  RotateCcw,
  Square,
  Upload,
  X,
} from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
}

type Status = "uploading" | "done" | "error";

type FileItem = {
  id: string;
  name: string;
  size: string;
  status: Status;
  progress: number;
};

const INITIAL_FILES: FileItem[] = [
  {
    id: "a",
    name: "brand-guidelines.pdf",
    size: "3.4 MB",
    status: "done",
    progress: 100,
  },
  {
    id: "b",
    name: "q3-campaign-metrics.csv",
    size: "820 KB",
    status: "uploading",
    progress: 38,
  },
  {
    id: "c",
    name: "product-shot-hero.png",
    size: "9.1 MB",
    status: "error",
    progress: 64,
  },
];

const MAX_COMPOSER_HEIGHT = 200;

const ROW_ACTION =
  "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-white text-neutral-500 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]";

export default function PromptInput5() {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const fileList = useScrollFade<HTMLDivElement>();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const resize = () => {
      el.style.height = "auto";
      if (el.scrollHeight === 0) return;
      el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
    };

    resize();
    const frame = requestAnimationFrame(resize);
    el.ownerDocument.fonts?.ready.then(resize).catch(() => {});

    let lastWidth = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === lastWidth) return;
      lastWidth = el.clientWidth;
      resize();
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [value]);

  useEffect(() => () => clearTimeout(sendTimer.current), []);

  const addFile = () => {
    setFiles((prev) => [
      ...prev,
      {
        id: `f${prev.length + 1}-${Date.now()}`,
        name: `asset-${prev.length + 1}.png`,
        size: `${1 + prev.length}.2 MB`,
        status: "uploading",
        progress: 0,
      },
    ]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setFiles((prev) => {
        if (!prev.some((f) => f.status === "uploading")) return prev;
        return prev.map((f) =>
          f.status === "uploading"
            ? f.progress >= 100
              ? { ...f, status: "done", progress: 100 }
              : { ...f, progress: Math.min(100, f.progress + 6) }
            : f,
        );
      });
    }, 260);
    return () => clearInterval(timer);
  }, []);

  const canSend = value.trim().length > 0 && !busy;

  const submit = () => {
    if (!canSend) return;
    setBusy(true);
    setValue("");
    sendTimer.current = setTimeout(() => setBusy(false), 1800);
  };

  const cancel = () => {
    clearTimeout(sendTimer.current);
    setBusy(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const retry = (id: string) =>
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "uploading", progress: 0 } : f,
      ),
    );

  const remove = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="relative flex h-full w-full min-h-[560px] flex-col overflow-hidden bg-white dark:bg-neutral-950">
      {dragging && (
        <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-[var(--rb-r-2xl,14px)] border border-dashed border-neutral-300 bg-neutral-50/90 backdrop-blur-[1px] dark:border-neutral-800 dark:bg-neutral-900/90">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Drop files to attach
          </span>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4 py-8 sm:px-6"
      >
        <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200 bg-white transition-colors focus-within:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-700">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything"
            className="block max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
          <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-1">
            <button
              type="button"
              aria-label="Attach a file"
              onClick={addFile}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-neutral-100 text-neutral-500 transition-[transform,background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-200 hover:text-neutral-700 active:scale-[0.97] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
            >
              <Paperclip className="h-4 w-4 shrink-0" />
            </button>
            {busy ? (
              <button
                type="button"
                onClick={cancel}
                aria-label="Stop generating"
                className="ml-auto inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
              >
                <Square className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send"
                disabled={!canSend}
                onClick={submit}
                className="ml-auto inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--rb-r-md,8px)] bg-[var(--rb-accent,oklch(20.5%_0_0))] text-[var(--rb-accent-fg,oklch(100%_0_0))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(20.5%_0_0))_90%,transparent)] active:scale-95 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-[var(--rb-accent,oklch(100%_0_0))] dark:text-[var(--rb-accent-fg,oklch(20.5%_0_0))] dark:hover:bg-[color-mix(in_oklab,var(--rb-accent,oklch(100%_0_0))_90%,transparent)] dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))] dark:disabled:bg-neutral-700 dark:disabled:text-neutral-500"
              >
                <ArrowUp className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        <div className="rounded-[var(--rb-r-2xl,14px)] border border-neutral-200/70 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="relative">
            <div
              ref={fileList.ref}
              onScroll={fileList.onScroll}
              className="flex max-h-[13.5rem] flex-col gap-1 overflow-y-auto overscroll-contain"
            >
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-neutral-200/70 bg-white px-2.5 py-2 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <FileText className="h-4 w-4 shrink-0 text-neutral-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="min-w-0 flex-1 truncate text-[13px] text-neutral-900 dark:text-neutral-100">
                        {file.name}
                      </span>
                      {file.status === "uploading" && (
                        <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 sm:w-24">
                          <div
                            className="h-full rounded-full bg-neutral-900 transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] dark:bg-neutral-100"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                      {file.status === "error" ? (
                        <span className="shrink-0 text-right text-xs text-red-600 dark:text-red-400">
                          Connection lost
                        </span>
                      ) : (
                        <span className="min-w-[3rem] shrink-0 text-right text-xs tabular-nums text-neutral-500">
                          {file.status === "done"
                            ? file.size
                            : `${file.progress}%`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {file.status === "error" && (
                      <button
                        type="button"
                        aria-label={`Retry ${file.name}`}
                        onClick={() => retry(file.id)}
                        className={ROW_ACTION}
                      >
                        <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => remove(file.id)}
                      className={ROW_ACTION}
                    >
                      <X className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-[var(--rb-r-lg,10px)] bg-gradient-to-b from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                fileList.edges.start ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden="true"
              className={cx(
                "pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-[var(--rb-r-lg,10px)] bg-gradient-to-t from-neutral-50 to-transparent transition-opacity duration-200 ease-out dark:from-neutral-900",
                fileList.edges.end ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addFile}
          className="flex h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--rb-r-lg,10px)] border border-dashed border-neutral-200 bg-neutral-50 text-[13px] font-medium text-neutral-600 transition-[transform,background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-neutral-300 hover:bg-neutral-100 active:scale-[0.99] focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rb-accent,oklch(20.5%_0_0))] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:focus-visible:outline-[var(--rb-accent,oklch(100%_0_0))]"
        >
          <Upload className="h-4 w-4 shrink-0 text-neutral-500" />
          Drag files here, or browse
        </button>
      </div>
    </div>
  );
}
