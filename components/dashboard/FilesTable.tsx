"use client";

import { useMemo, useState } from "react";
import { UploadedFile } from "@/types/dashboard";
import { authHeaders } from "@/lib/auth";
import { BOARDS, STANDARDS, SUBJECTS } from "@/lib/constants";
import StatusBadge from "./StatusBadge";
import SyncButton from "./SyncButton";

interface FilesTableProps {
  files: UploadedFile[];
  loading: boolean;
  token: string;
  onFileUpdate: (updated: UploadedFile) => void;
  onFileDelete: (fileId: string) => void;
}

const TABLE_HEADERS = [
  "Filename",
  "Board",
  "Standard",
  "Subject",
  "State",
  "Uploaded",
  "Status",
  "Actions",
];

const INGEST_STATUSES = ["all", "pending", "queued", "processing", "completed", "failed"];
const PAGE_SIZES = [10, 25, 50];

const SELECT_CLASS =
  "bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors hover:border-slate-600";

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function FilesTable({ files, loading, token, onFileUpdate, onFileDelete }: FilesTableProps) {
  const [search, setSearch] = useState("");
  const [filterBoard, setFilterBoard] = useState("all");
  const [filterStandard, setFilterStandard] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const hasActiveFilters =
    search !== "" ||
    filterBoard !== "all" ||
    filterStandard !== "all" ||
    filterSubject !== "all" ||
    filterStatus !== "all";

  function clearFilters() {
    setSearch("");
    setFilterBoard("all");
    setFilterStandard("all");
    setFilterSubject("all");
    setFilterStatus("all");
    setPage(1);
  }

  function resetPage() {
    setPage(1);
  }

  async function handleDeletePendingFile(file: UploadedFile) {
    const confirmed = window.confirm(
      `Delete "${file.filename}" from dashboard records? This only removes it from the database.`
    );
    if (!confirmed) return;

    setDeletingFileId(file.id);
    try {
      const res = await fetch(`/api/v1/files/${file.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      if (res.ok) {
        onFileDelete(file.id);
        return;
      }

      const data = await res.json().catch(() => null);
      const message = data?.detail ?? "Could not delete the file record.";
      window.alert(message);
    } finally {
      setDeletingFileId((current) => (current === file.id ? null : current));
    }
  }

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (search && !f.filename.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterBoard !== "all" && f.board !== filterBoard) return false;
      if (filterStandard !== "all" && f.standard !== filterStandard) return false;
      if (filterSubject !== "all" && f.subject !== filterSubject) return false;
      if (filterStatus !== "all" && f.ingest_status !== filterStatus) return false;
      return true;
    });
  }, [files, search, filterBoard, filterStandard, filterSubject, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePageVal = Math.min(page, totalPages);
  const paginated = filtered.slice((safePageVal - 1) * pageSize, safePageVal * pageSize);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <svg className="animate-spin w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Loading files…</span>
      </div>
    );
  }

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search filename…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-600 hover:border-slate-600 transition-colors"
          />
        </div>

        {/* Board */}
        <select
          value={filterBoard}
          onChange={(e) => { setFilterBoard(e.target.value); resetPage(); }}
          className={SELECT_CLASS}
        >
          <option value="all">All Boards</option>
          {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Standard */}
        <select
          value={filterStandard}
          onChange={(e) => { setFilterStandard(e.target.value); resetPage(); }}
          className={SELECT_CLASS}
        >
          <option value="all">All Standards</option>
          {STANDARDS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Subject */}
        <select
          value={filterSubject}
          onChange={(e) => { setFilterSubject(e.target.value); resetPage(); }}
          className={SELECT_CLASS}
        >
          <option value="all">All Subjects</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
          className={SELECT_CLASS}
        >
          {INGEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}

        {/* Result count */}
        <div className="ml-auto text-xs text-slate-500 shrink-0">
          {hasActiveFilters
            ? <><span className="text-slate-300 font-medium">{filtered.length}</span> of {files.length} files</>
            : <><span className="text-slate-300 font-medium">{files.length}</span> {files.length === 1 ? "file" : "files"}</>
          }
        </div>
      </div>

      {/* ── Active filter chips ────────────────────────────────────────── */}
      {hasActiveFilters && (
        <div className="px-5 py-2 border-b border-slate-800/60 flex flex-wrap gap-1.5">
          {search && (
            <FilterChip label={`"${search}"`} onRemove={() => { setSearch(""); resetPage(); }} />
          )}
          {filterBoard !== "all" && (
            <FilterChip label={filterBoard} onRemove={() => { setFilterBoard("all"); resetPage(); }} />
          )}
          {filterStandard !== "all" && (
            <FilterChip label={filterStandard} onRemove={() => { setFilterStandard("all"); resetPage(); }} />
          )}
          {filterSubject !== "all" && (
            <FilterChip label={filterSubject} onRemove={() => { setFilterSubject("all"); resetPage(); }} />
          )}
          {filterStatus !== "all" && (
            <FilterChip
              label={filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
              onRemove={() => { setFilterStatus("all"); resetPage(); }}
            />
          )}
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg className="w-10 h-10 mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm font-medium text-slate-400">
            {hasActiveFilters ? "No files match the current filters" : "No files uploaded yet"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Table ────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {paginated.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Filename */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-slate-600 group-hover:text-slate-500 shrink-0 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.75}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <a
                          href={file.s3_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={file.filename}
                          className="text-slate-200 hover:text-indigo-400 truncate max-w-[200px] block transition-colors text-xs font-medium"
                        >
                          {file.filename}
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">{file.board}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">{file.standard}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">{file.subject}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{file.state ?? "—"}</td>

                    {/* Uploaded at */}
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(file.uploaded_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Ingest status */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <StatusBadge status={file.ingest_status} />
                        {file.ingested_at && (
                          <p className="text-slate-600 text-xs">
                            {new Date(file.ingested_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <SyncButton file={file} token={token} onUpdate={onFileUpdate} />
                        {file.ingest_status === "pending" && (
                          <button
                            title="Delete pending file"
                            onClick={() => void handleDeletePendingFile(file)}
                            disabled={deletingFileId === file.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination footer ─────────────────────────────────────────── */}
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            {/* Rows per page */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-600 transition-colors"
              >
                {PAGE_SIZES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>

            {/* Page nav */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                <span className="text-slate-300 font-medium">{(safePageVal - 1) * pageSize + 1}</span>
                –
                <span className="text-slate-300 font-medium">{Math.min(safePageVal * pageSize, filtered.length)}</span>
                {" "}of{" "}
                <span className="text-slate-300 font-medium">{filtered.length}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={safePageVal === 1}
                  title="First page"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePageVal === 1}
                  title="Previous page"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft />
                </button>

                {/* Page number pills */}
                <div className="flex items-center gap-0.5 mx-1">
                  {getPageRange(safePageVal, totalPages).map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1.5 text-slate-600">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
                          p === safePageVal
                            ? "bg-indigo-600 text-white"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePageVal === totalPages}
                  title="Next page"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={safePageVal === totalPages}
                  title="Last page"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-indigo-600/15 border border-indigo-500/25 text-indigo-300 text-xs rounded-full px-2.5 py-0.5">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-indigo-100 transition-colors ml-0.5"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}
