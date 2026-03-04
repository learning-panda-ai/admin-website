"use client";

import { useState } from "react";
import { UploadedFile } from "@/types/dashboard";
import { authHeaders } from "@/lib/auth";

interface SyncButtonProps {
  file: UploadedFile;
  token: string;
  onUpdate: (updated: UploadedFile) => void;
}

const LABEL: Record<string, string> = {
  pending: "Start ingestion",
  failed: "Retry ingestion",
  completed: "Re-ingest",
  queued: "Refresh status",
  processing: "Refresh status",
};

export default function SyncButton({ file, token, onUpdate }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const isActive =
    file.ingest_status === "queued" || file.ingest_status === "processing";

  async function handleSync() {
    setLoading(true);
    try {
      const shouldTrigger =
        file.ingest_status === "pending" ||
        file.ingest_status === "failed" ||
        file.ingest_status === "completed";

      const res = shouldTrigger
        ? await fetch(`/api/v1/files/${file.id}/ingest`, {
            method: "POST",
            headers: authHeaders(token),
          })
        : await fetch(`/api/v1/files/${file.id}/ingest-status`, {
            headers: authHeaders(token),
          });

      if (res.ok) {
        const updated: UploadedFile = await res.json();
        onUpdate(updated);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      title={LABEL[file.ingest_status] ?? "Sync"}
      onClick={handleSync}
      disabled={loading}
      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:cursor-not-allowed"
    >
      <svg
        className={`w-4 h-4 ${loading || isActive ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
}
