"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminUser, UploadedFile } from "@/types/dashboard";
import { authHeaders, clearAdminCookie, getCookie } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import PageHeader from "@/components/dashboard/PageHeader";
import UploadForm from "@/components/dashboard/UploadForm";
import FilesTable from "@/components/dashboard/FilesTable";

const POLL_INTERVAL_MS = 4000;

export default function DashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [token, setToken] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auth + initial fetch ─────────────────────────────────────────────────
  useEffect(() => {
    const t = getCookie("lp_admin_token");
    if (!t) { router.replace("/"); return; }
    setToken(t);

    fetch("/api/v1/admin/auth/me", { headers: authHeaders(t) })
      .then(async (res) => {
        if (!res.ok) { clearAdminCookie(); router.replace("/"); return; }
        setAdmin(await res.json());
      })
      .catch(() => router.replace("/"))
      .finally(() => setLoadingAdmin(false));

    fetch("/api/v1/files", { headers: authHeaders(t) })
      .then(async (res) => { if (res.ok) setFiles(await res.json()); })
      .finally(() => setLoadingFiles(false));
  }, [router]);

  // ── Auto-poll active ingest tasks ────────────────────────────────────────
  const refreshActive = useCallback(
    async (currentToken: string, currentFiles: UploadedFile[]) => {
      const active = currentFiles.filter(
        (f) => f.ingest_status === "queued" || f.ingest_status === "processing"
      );
      if (active.length === 0) return;

      const updated = await Promise.all(
        active.map((f) =>
          fetch(`/api/v1/files/${f.id}/ingest-status`, {
            headers: authHeaders(currentToken),
          })
            .then((r) => (r.ok ? r.json() : f))
            .catch(() => f)
        )
      );
      setFiles((prev) =>
        prev.map((f) => updated.find((u: UploadedFile) => u.id === f.id) ?? f)
      );
    },
    []
  );

  useEffect(() => {
    if (!token) return;
    pollingRef.current = setInterval(() => {
      setFiles((current) => {
        refreshActive(token, current);
        return current;
      });
    }, POLL_INTERVAL_MS);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [token, refreshActive]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleUploaded(newFile: UploadedFile) {
    setFiles((prev) => [newFile, ...prev]);
  }

  function handleFileUpdate(updated: UploadedFile) {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loadingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  if (!admin) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar admin={admin} />

      <main className="flex-1 overflow-auto">
        <PageHeader
          title="File Management"
          description="Upload PDFs and track their ingestion into the vector database"
          badge={loadingFiles ? undefined : `${files.length} file${files.length !== 1 ? "s" : ""}`}
        />

        <div className="px-8 py-8 space-y-8">
          {/* Upload card */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-sm">Upload New File</h2>
            </div>
            <div className="p-6">
              <UploadForm token={token} onUploaded={handleUploaded} />
            </div>
          </section>

          {/* Files table card */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-sm">Uploaded Files</h2>
              </div>
              <span className="text-xs text-slate-500">
                Auto-refreshes every 4 s for active tasks
              </span>
            </div>

            <FilesTable
              files={files}
              loading={loadingFiles}
              token={token}
              onFileUpdate={handleFileUpdate}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

