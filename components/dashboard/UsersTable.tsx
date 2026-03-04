"use client";

import { useState } from "react";
import { WebsiteUser } from "@/types/dashboard";
import { authHeaders } from "@/lib/auth";

interface UsersTableProps {
  users: WebsiteUser[];
  loading: boolean;
  token: string;
  onUserUpdate: (updated: WebsiteUser) => void;
}

const TABLE_HEADERS = [
  "User",
  "Grade",
  "School Board",
  "Status",
  "Joined",
  "Action",
];

function ToggleButton({
  user,
  token,
  onUpdate,
}: {
  user: WebsiteUser;
  token: string;
  onUpdate: (u: WebsiteUser) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      if (res.ok) {
        onUpdate(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  if (user.is_active) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        )}
        Deactivate
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      Activate
    </button>
  );
}

export default function UsersTable({
  users,
  loading,
  token,
  onUserUpdate,
}: UsersTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading users…
      </div>
    );
  }

  if (users.length === 0) {
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm">No users found.</p>
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
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
              {/* User */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 text-sm font-semibold shrink-0">
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate max-w-45">
                      {user.name ?? <span className="text-slate-500 italic">No name</span>}
                    </p>
                    <p className="text-slate-500 text-xs truncate max-w-45">
                      {user.email}
                    </p>
                  </div>
                </div>
              </td>

              {/* Grade */}
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">
                {user.grade ?? <span className="text-slate-600">—</span>}
              </td>

              {/* School Board */}
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap text-xs">
                {user.school_board ?? <span className="text-slate-600">—</span>}
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                {user.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Inactive
                  </span>
                )}
              </td>

              {/* Joined */}
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                {new Date(user.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </td>

              {/* Action */}
              <td className="px-4 py-3">
                <ToggleButton user={user} token={token} onUpdate={onUserUpdate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
