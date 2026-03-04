"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminUser, WebsiteUser } from "@/types/dashboard";
import { authHeaders, clearAdminCookie, getCookie } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import PageHeader from "@/components/dashboard/PageHeader";
import UsersTable from "@/components/dashboard/UsersTable";

const DEBOUNCE_MS = 400;

export default function UsersPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<WebsiteUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [token, setToken] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 20;

  // ── Auth ─────────────────────────────────────────────────────────────────
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
  }, [router]);

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(
    async (t: string, q: string, p: number) => {
      setLoadingUsers(true);
      const params = new URLSearchParams({
        page: String(p),
        limit: String(LIMIT),
      });
      if (q.trim()) params.set("search", q.trim());

      try {
        const res = await fetch(`/api/v1/admin/users?${params}`, {
          headers: authHeaders(t),
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
          setTotal(data.total);
          setPages(data.pages);
        }
      } finally {
        setLoadingUsers(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!token) return;
    fetchUsers(token, search, page);
  }, [token, page, fetchUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (token) fetchUsers(token, value, 1);
    }, DEBOUNCE_MS);
  }

  function handleUserUpdate(updated: WebsiteUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
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

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar admin={admin} />

      <main className="flex-1 overflow-auto">
        <PageHeader
          title="User Management"
          description="View and manage website user access. Toggle active/inactive to control dashboard access."
          badge={`${total} user${total !== 1 ? "s" : ""}`}
        />

        <div className="px-8 py-8 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Users</p>
              <p className="text-white text-2xl font-bold mt-1">{total}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Active</p>
              <p className="text-emerald-400 text-2xl font-bold mt-1">{activeCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Inactive</p>
              <p className="text-red-400 text-2xl font-bold mt-1">{inactiveCount}</p>
            </div>
          </div>

          {/* Users table card */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Card header with search */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-white font-semibold text-sm">Website Users</h2>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <UsersTable
              users={users}
              loading={loadingUsers}
              token={token}
              onUserUpdate={handleUserUpdate}
            />

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                <p className="text-slate-500 text-xs">
                  Page {page} of {pages} · {total} users total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
