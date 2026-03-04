"use client";

import { useRef, useState } from "react";
import { UploadedFile } from "@/types/dashboard";
import { authHeaders } from "@/lib/auth";
import { BOARDS, STANDARDS, SUBJECTS, STATES } from "@/lib/constants";

interface UploadFormProps {
  token: string;
  onUploaded: (file: UploadedFile) => void;
}

const SELECT_CLASS =
  "w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function UploadForm({ token, onUploaded }: UploadFormProps) {
  const [board, setBoard] = useState<string>(BOARDS[0]);
  const [standard, setStandard] = useState<string>(STANDARDS[9]); // Class 10
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [state, setState] = useState<string>(STATES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.append("board", board);
    fd.append("standard", standard);
    fd.append("subject", subject);
    if (board === "State Board") fd.append("state", state);
    fd.append("file", file);

    try {
      const res = await fetch("/api/v1/upload", {
        method: "POST",
        headers: authHeaders(token),
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Upload failed.");
      }

      const uploaded: UploadedFile = await res.json();
      onUploaded(uploaded);
      setSuccess(`"${file.name}" uploaded successfully.`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Board */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Board</label>
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            className={SELECT_CLASS}
          >
            {BOARDS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Standard */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Standard</label>
          <select
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className={SELECT_CLASS}
          >
            {STANDARDS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={SELECT_CLASS}
          >
            {SUBJECTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">
            State{" "}
            {board !== "State Board" && (
              <span className="text-slate-600">(auto: Central)</span>
            )}
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            disabled={board !== "State Board"}
            className={`${SELECT_CLASS} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* File picker */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">PDF File</label>
        <div
          className={`relative flex items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${
            file
              ? "border-indigo-500/50 bg-indigo-500/5"
              : "border-slate-700 hover:border-slate-600"
          }`}
        >
          <svg
            className="w-5 h-5 text-slate-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm text-slate-400 flex-1 truncate">
            {file ? file.name : "Click to choose a PDF…"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
          {success}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !file}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload File
            </>
          )}
        </button>
      </div>
    </form>
  );
}
