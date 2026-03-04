import { UploadedFile } from "@/types/dashboard";
import StatusBadge from "./StatusBadge";
import SyncButton from "./SyncButton";

interface FilesTableProps {
  files: UploadedFile[];
  loading: boolean;
  token: string;
  onFileUpdate: (updated: UploadedFile) => void;
}

const TABLE_HEADERS = [
  "Filename",
  "Board",
  "Standard",
  "Subject",
  "State",
  "Uploaded",
  "Ingest Status",
  "Sync",
];

export default function FilesTable({
  files,
  loading,
  token,
  onFileUpdate,
}: FilesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
        Loading files…
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <svg
          className="w-10 h-10 mb-3 text-slate-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">No files uploaded yet.</p>
      </div>
    );
  }

  return (
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
        <tbody className="divide-y divide-slate-800">
          {files.map((file) => (
            <tr key={file.id} className="hover:bg-slate-800/40 transition-colors">
              {/* Filename */}
              <td className="px-4 py-3 max-w-xs">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-slate-500 shrink-0"
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
                    className="text-slate-200 hover:text-indigo-400 truncate max-w-[180px] block transition-colors"
                  >
                    {file.filename}
                  </a>
                </div>
              </td>

              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                {file.board}
              </td>
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                {file.standard}
              </td>
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                {file.subject}
              </td>
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                {file.state}
              </td>

              {/* Uploaded at */}
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
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

              {/* Sync */}
              <td className="px-4 py-3">
                <SyncButton file={file} token={token} onUpdate={onFileUpdate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
