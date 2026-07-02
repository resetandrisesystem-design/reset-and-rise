"use client";

import { useState, useMemo } from "react";
import { Search, Shield, Crown, Sparkles, Layers } from "lucide-react";
import { format } from "date-fns";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  plan: "core" | "premium" | "vip";
  created_at: string;
}

interface Props {
  users: UserRow[];
  callerEmail: string;
}

const PLAN_META = {
  core:    { label: "Core",    icon: Layers,    color: "text-navy-400",  bg: "bg-ivory-100" },
  premium: { label: "Premium", icon: Sparkles,  color: "text-gold-500",  bg: "bg-gold-50"   },
  vip:     { label: "VIP",     icon: Crown,     color: "text-navy-500",  bg: "bg-navy-500"  },
} as const;

export default function AdminClient({ users: initialUsers, callerEmail }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(() => ({
    total: users.length,
    core: users.filter((u) => u.plan === "core").length,
    premium: users.filter((u) => u.plan === "premium").length,
    vip: users.filter((u) => u.plan === "vip").length,
  }), [users]);

  async function updatePlan(userId: string, newPlan: "core" | "premium" | "vip") {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, newPlan, callerEmail }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: newPlan } : u));
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to update plan: ${errorData.error || res.status}`);
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setUpdatingId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Shield size={20} className="text-gold-400" />
        <div>
          <h2 className="section-title mb-0">Admin Panel</h2>
          <p className="text-navy-400 text-sm mt-1">Manage users and plan access</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="stat-card text-center">
          <p className="font-serif text-3xl text-navy-500 font-medium">{stats.total}</p>
          <p className="text-xs text-navy-400">Total users</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-serif text-3xl text-navy-400 font-medium">{stats.core}</p>
          <p className="text-xs text-navy-400">Core</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-serif text-3xl text-gold-500 font-medium">{stats.premium}</p>
          <p className="text-xs text-navy-400">Premium</p>
        </div>
        <div className="stat-card text-center">
          <p className="font-serif text-3xl text-navy-500 font-medium">{stats.vip}</p>
          <p className="text-xs text-navy-400">VIP</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          className="input pl-9"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User list */}
      <div className="card">
        {filtered.length === 0 ? (
          <p className="text-center text-navy-400 text-sm py-8 italic">No users match your search.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => {
              const meta = PLAN_META[u.plan];
              const Icon = meta.icon;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 py-3 px-3 rounded-xl hover:bg-ivory-50 border-b border-ivory-100 last:border-0"
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm text-navy-500 font-medium truncate">
                      {u.full_name || "—"}
                    </p>
                    <p className="text-xs text-navy-400 truncate">{u.email}</p>
                  </div>

                  <div className="text-xs text-navy-300 hidden md:block flex-shrink-0">
                    Joined {format(new Date(u.created_at), "d MMM yyyy")}
                  </div>

                  <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${meta.bg} ${meta.color}`}>
                    <Icon size={12} />
                    {meta.label}
                  </div>

                  <select
                    value={u.plan}
                    onChange={(e) => updatePlan(u.id, e.target.value as "core" | "premium" | "vip")}
                    disabled={updatingId === u.id}
                    className="text-xs border border-ivory-200 rounded-lg px-2 py-1.5 bg-white text-navy-500 font-medium outline-none focus:border-gold-300 disabled:opacity-50 flex-shrink-0"
                  >
                    <option value="core">Core</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
