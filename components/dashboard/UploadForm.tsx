"use client";

import { useRef, useState } from "react";
import { UploadedFile } from "@/types/dashboard";
import { authHeaders } from "@/lib/auth";
import { BOARDS, STANDARDS, SUBJECTS, STATES } from "@/lib/constants";

interface UploadFormProps {
  token: string;
  onUploaded: (file: UploadedFile) => void;
}

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

const SELECT_CLASS =
  "w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-600 transition-colors";

let _counter = 0;
function uid() {
  return `fe-${++_counter}-${Math.random().toString(36).slice(2, 7)}`;
}

function toPdfEntries(files: File[]): FileEntry[] {
  return files
    .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
    .map((f) => ({ id: uid(), file: f, status: "pending" }));
}

export default function UploadForm({ token, onUploaded }: UploadFormProps) {
  const [board, setBoard] = useState<string>(BOARDS[0]);
  const [standard, setStandard] = useState<string>(STANDARDS[9]); // Class 10
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [state, setState] = useState<string>(STATES[0]);
  const [queue, setQueue] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Queue helpers ──────────────────────────────────────────────────────────

  function addToQueue(files: File[]) {
    const entries = toPdfEntries(files);
    if (entries.length > 0) setQueue((prev) => [...prev, ...entries]);
  }

  function removeEntry(id: string) {
    setQueue((prev) => prev.filter((e) => e.id !== id));
  }

  function clearUploaded() {
    setQueue((prev) => prev.filter((e) => e.status !== "done"));
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when leaving the drop-zone itself, not child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    addToQueue(Array.from(e.dataTransfer.files));
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async function handleUploadAll() {
    const toUpload = queue.filter((e) => e.status === "pending" || e.status === "error");
    if (toUpload.length === 0) return;

    setUploading(true);

    for (const entry of toUpload) {
      setQueue((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: "uploading" } : e))
      );

      const fd = new FormData();
      fd.append("board", board);
      fd.append("standard", standard);
      fd.append("subject", subject);
      if (board === "State Board") fd.append("state", state);
      fd.append("file", entry.file);

      try {
        const res = await fetch("/api/v1/upload", {
          method: "POST",
          headers: authHeaders(token),
          body: fd,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail ?? "Upload failed.");
        }

        const uploaded: UploadedFile = await res.json();
        onUploaded(uploaded);

        setQueue((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: "done", error: undefined } : e))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed.";
        setQueue((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: "error", error: msg } : e))
        );
      }
    }

    setUploading(false);
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const pendingCount = queue.filter((e) => e.status === "pending" || e.status === "error").length;
  const doneCount = queue.filter((e) => e.status === "done").length;
  const activeEntry = queue.find((e) => e.status === "uploading");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Metadata selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Board</label>
          <select value={board} onChange={(e) => setBoard(e.target.value)} className={SELECT_CLASS}>
            {BOARDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Standard</label>
          <select value={standard} onChange={(e) => setStandard(e.target.value)} className={SELECT_CLASS}>
            {STANDARDS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={SELECT_CLASS}>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">
            State{" "}
            {board !== "State Board" && <span className="text-slate-600">(auto: Central)</span>}
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            disabled={board !== "State Board"}
            className={`${SELECT_CLASS} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-6 py-8 transition-colors select-none ${
          uploading
            ? "border-slate-800 cursor-not-allowed opacity-50"
            : isDragOver
            ? "border-indigo-500 bg-indigo-500/10 cursor-copy"
            : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/30 cursor-pointer"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-300 font-medium">
            {isDragOver ? "Drop PDFs here" : "Drag & drop PDFs here"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            or <span className="text-indigo-400 hover:text-indigo-300">browse files</span> — multiple supported
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addToQueue(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </div>

      {/* File queue */}
      {queue.length > 0 && (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          {/* Queue header */}
          <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300 font-medium">
                {queue.length} {queue.length === 1 ? "file" : "files"}
              </span>
              {doneCount > 0 && (
                <span className="text-emerald-400">· {doneCount} uploaded</span>
              )}
              {queue.filter((e) => e.status === "error").length > 0 && (
                <span className="text-red-400">
                  · {queue.filter((e) => e.status === "error").length} failed
                </span>
              )}
            </div>
            {doneCount > 0 && !uploading && (
              <button
                type="button"
                onClick={clearUploaded}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear uploaded
              </button>
            )}
          </div>

          {/* File rows */}
          <ul className="divide-y divide-slate-800/50 max-h-60 overflow-y-auto">
            {queue.map((entry) => (
              <FileRow
                key={entry.id}
                entry={entry}
                uploading={uploading}
                onRemove={() => removeEntry(entry.id)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: current upload hint */}
        <div className="text-xs text-slate-500 truncate min-w-0">
          {uploading && activeEntry && (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin w-3 h-3 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="truncate">Uploading {activeEntry.file.name}</span>
            </span>
          )}
        </div>

        {/* Right: buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {queue.length > 0 && !uploading && (
            <button
              type="button"
              onClick={() => setQueue([])}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={uploading || pendingCount === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
          >
            {uploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {pendingCount > 1 ? `Upload ${pendingCount} files` : "Upload file"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FileRow ────────────────────────────────────────────────────────────────────

interface FileRowProps {
  entry: FileEntry;
  uploading: boolean;
  onRemove: () => void;
}

function FileRow({ entry, uploading, onRemove }: FileRowProps) {
  const { status, file, error } = entry;

  const statusIcon = {
    pending: (
      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    uploading: (
      <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    ),
    done: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[status];

  const statusLabel = {
    pending: <span className="text-slate-600">Queued</span>,
    uploading: <span className="text-indigo-400">Uploading…</span>,
    done: <span className="text-emerald-400">Done</span>,
    error: <span className="text-red-400">Failed</span>,
  }[status];

  const canRemove = status !== "uploading";

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 group hover:bg-slate-800/30 transition-colors">
      {/* Icon */}
      <div className="shrink-0">{statusIcon}</div>

      {/* Name + error */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${status === "done" ? "text-slate-500" : "text-slate-200"}`}>
          {file.name}
        </p>
        {status === "error" && error && (
          <p className="text-xs text-red-400/80 truncate mt-0.5">{error}</p>
        )}
      </div>

      {/* Status label */}
      <span className="text-xs shrink-0">{statusLabel}</span>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove || (uploading && status === "pending")}
        title="Remove"
        className={`shrink-0 p-0.5 rounded text-slate-700 hover:text-slate-300 transition-all disabled:cursor-not-allowed ${
          canRemove && !uploading ? "opacity-0 group-hover:opacity-100" : "opacity-0"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}
