import React, { useEffect, useMemo, useRef, useState } from "react";

type ApiUserRow = {
  id: string;
  email: string;
  role: "admin" | "user";
  credits: number;
  used_credits: number;
  created_at: string;
};

const TOKEN_KEY = "mpn_token_v1";
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";

// ✅ token por pestaña (para que admin y user no se pisen)
function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

async function apiGetUsers(token: string) {
  const r = await fetch(`${API_BASE}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "FAILED TO LOAD USERS.");
  return data.users as ApiUserRow[];
}

async function apiAddCredits(token: string, userId: string, addCredits: number) {
  const r = await fetch(`${API_BASE}/api/admin/credits/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, addCredits }),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "FAILED TO ADD CREDITS.");
  return data.user;
}

async function apiSetRole(token: string, userId: string, role: "admin" | "user") {
  const r = await fetch(`${API_BASE}/api/admin/role/set`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, role }),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok || !data?.ok) throw new Error(data?.message || "FAILED TO SET ROLE.");
  return data.user;
}

export const AdminPanel: React.FC = () => {
  // ✅ importante: NO localStorage (se pisa entre pestañas)
  const token = useMemo(() => getToken(), []);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ApiUserRow[]>([]);
  const [error, setError] = useState("");

  const [creditsDraft, setCreditsDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  // ✅ polling controlado
  const pollingRef = useRef<number | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);

    if (!token) {
      setError("NO TOKEN. LOGIN AGAIN.");
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError("");

    try {
      const list = await apiGetUsers(token);
      setUsers(list);
    } catch (e: any) {
      setError(String(e?.message || "ERROR."));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ✅ primer load + polling live (1.5s)
  useEffect(() => {
    let alive = true;

    const first = async () => {
      await load();
      if (!alive) return;

      // refresco live
      pollingRef.current = window.setInterval(() => {
        // si estás haciendo una acción (add/role), no pisar la UI
        if (busyId) return;
        load({ silent: true });
      }, 1500);
    };

    first();

    return () => {
      alive = false;
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCredits = async (userId: string) => {
    const raw = creditsDraft[userId] || "";
    const n = Number(raw);

    if (!Number.isFinite(n) || n <= 0) {
      setError("ADD CREDITS MUST BE A NUMBER > 0.");
      return;
    }

    setBusyId(userId);
    setError("");

    try {
      await apiAddCredits(token, userId, Math.floor(n));
      setCreditsDraft((p) => ({ ...p, [userId]: "" }));

      // ✅ actualiza al tiro y vuelve a cargar (para ver estado real)
      await load({ silent: true });
    } catch (e: any) {
      setError(String(e?.message || "ERROR."));
    } finally {
      setBusyId(null);
    }
  };

  const handleSetRole = async (userId: string, role: "admin" | "user") => {
    setBusyId(userId);
    setError("");

    try {
      await apiSetRole(token, userId, role);
      await load({ silent: true });
    } catch (e: any) {
      setError(String(e?.message || "ERROR."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-neon-panel/40 border border-neon-cyan/20 p-4 rounded-lg backdrop-blur-sm">
      <div className="flex items-end justify-between gap-4 mb-4 border-b border-neon-cyan/30 pb-3">
        <div>
          <h2 className="font-retro text-neon-cyan text-sm">ADMIN // USERS</h2>
          <p className="font-code text-xs text-neon-pink/60 tracking-widest">
            MANAGE ROLES & CREDITS
          </p>

          {/* ✅ indicador live discreto */}
          <div className="mt-1 font-tech text-[10px] text-neon-cyan/50">
            LIVE UPDATE: ON (1.5s)
          </div>
        </div>

        <button
          onClick={() => load()}
          className="font-retro text-xs border border-neon-cyan text-neon-cyan px-3 py-2 rounded hover:bg-neon-cyan/20 hover:shadow-[0_0_10px_#00FFFF] transition-all"
        >
          REFRESH
        </button>
      </div>

      {loading ? (
        <div className="font-code text-neon-pink/70 text-sm">LOADING USERS...</div>
      ) : error ? (
        <div className="font-tech text-red-500 text-sm">&gt; {error}</div>
      ) : users.length === 0 ? (
        <div className="font-code text-neon-pink/70 text-sm">NO USERS.</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-black/40 border border-neon-pink/20 rounded-lg p-3 flex flex-col gap-2"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <div className="font-code text-neon-cyan text-sm break-all">
                    {u.email}
                  </div>
                  <div className="font-tech text-xs text-neon-pink/60">
                    ID: {u.id} // CREATED: {new Date(u.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-tech text-xs text-neon-pink/70">ROLE:</span>
                  <select
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) =>
                      handleSetRole(u.id, e.target.value as "admin" | "user")
                    }
                    className="bg-black border border-neon-cyan/50 text-neon-cyan font-code text-xs px-2 py-2 rounded"
                  >
                    <option value="user">USER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="bg-black/40 border border-neon-cyan/20 rounded p-2">
                  <div className="font-tech text-xs text-neon-pink/60">CREDITS</div>
                  <div className="font-code text-neon-cyan text-lg">
                    {Number(u.credits ?? 0)}
                  </div>
                </div>

                <div className="bg-black/40 border border-neon-cyan/20 rounded p-2">
                  <div className="font-tech text-xs text-neon-pink/60">USED</div>
                  <div className="font-code text-neon-cyan text-lg">
                    {Number(u.used_credits ?? 0)}
                  </div>
                </div>

                <div className="bg-black/40 border border-neon-cyan/20 rounded p-2">
                  <div className="font-tech text-xs text-neon-pink/60">ADD CREDITS</div>
                  <div className="flex gap-2">
                    <input
                      value={creditsDraft[u.id] ?? ""}
                      onChange={(e) =>
                        setCreditsDraft((p) => ({ ...p, [u.id]: e.target.value }))
                      }
                      placeholder="e.g. 10"
                      className="flex-1 bg-black border border-neon-pink/40 text-neon-pink font-code text-sm px-2 py-2 rounded"
                    />
                    <button
                      disabled={busyId === u.id}
                      onClick={() => handleAddCredits(u.id)}
                      className={`font-retro text-xs px-3 py-2 border rounded transition-all ${
                        busyId === u.id
                          ? "opacity-60 cursor-not-allowed border-neon-pink/30 text-neon-pink/40"
                          : "border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black hover:shadow-[0_0_20px_#ff6ac1]"
                      }`}
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-4 font-tech text-xs text-neon-pink/50">
          Note: Only admins can access these endpoints (requireAuth + requireAdmin).
        </div>
      )}
    </div>
  );
};
