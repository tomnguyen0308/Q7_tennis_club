"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const ADMIN_PASSWORD = "keobonG11";
const CASUAL_FEE = 130000;

function isBanned(name) {
  const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return n.includes("troc");
}

function getResult(s1, s2) {
  if (s1 === s2) return "draw";
  return s1 > s2 ? "pair1" : "pair2";
}

function formatVND(amount) {
  if (amount === 0) return "0đ";
  return (amount / 1000) + "k";
}
function formatSessionLabelFromDate(dateValue) {
  if (!dateValue) return "";
  const parsed = new Date('${dateValue}T00:00:00');
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
function stripCasual(name) {
  return name.replace(/ \(casual\)$/i, "").trim();
}

function getFines(sessions, members, casualPlayers) {
  const memberFines = {};
  members.forEach(m => memberFines[m.name] = 0);
  const casualFines = {};
  casualPlayers.forEach(c => casualFines[c.name] = 0);

  sessions.forEach(session => {
    (session.matches || []).forEach(match => {
      const { pair1, pair2, score1, score2 } = match;
      const isDraw = score1 === score2;
      const losers = isDraw ? [...pair1, ...pair2] : score1 < score2 ? pair1 : pair2;
      losers.forEach(rawName => {
        const p = stripCasual(rawName);
        if (memberFines[p] !== undefined) memberFines[p] += 10000;
        else if (casualFines[p] !== undefined) casualFines[p] += 10000;
      });
    });
  });
  return { memberFines, casualFines };
}

// ── Modals ──────────────────────────────────────────────────────────────────

function BannedModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: "#111620", border: "1px solid rgba(248,113,113,0.4)", borderRadius: 14, padding: 28, maxWidth: 300, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#F87171", marginBottom: 8 }}>Not Allowed</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 20 }}>This player is not allowed in the club.</div>
        <button onClick={onClose} style={{ width: "100%", padding: "11px", background: "#F87171", border: "none", borderRadius: 8, color: "#080b10", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}>OK</button>
      </div>
    </div>
  );
}

function AddMatchModal({ onAdd, onClose, loading, allPlayers }) {
  const [pair1, setPair1] = useState(["", ""]);
  const [pair2, setPair2] = useState(["", ""]);
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const allSelected = pair1[0] && pair1[1] && pair2[0] && pair2[1] && score1 !== "" && score2 !== "";
  const allUnique = new Set([pair1[0], pair1[1], pair2[0], pair2[1]]).size === 4;
  const taken = [pair1[0], pair1[1], pair2[0], pair2[1]].filter(Boolean);
  const available = (current) => allPlayers.filter(m => !taken.includes(m) || m === current);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#111620", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#e2e8f0" }}>Log Match</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#60A5FA", marginBottom: 8, fontFamily: "monospace" }}>PAIR A</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1].map(i => (
              <select key={i} value={pair1[i]} onChange={e => setPair1(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", padding: "8px 6px", fontSize: 11 }}>
                <option value="">Player {i + 1}</option>
                {available(pair1[i]).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <input type="number" min="0" max="10" placeholder="0" value={score1} onChange={e => setScore1(e.target.value)}
            style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#60A5FA", padding: "10px", fontSize: 22, fontWeight: 700, textAlign: "center" }} />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>—</span>
          <input type="number" min="0" max="10" placeholder="0" value={score2} onChange={e => setScore2(e.target.value)}
            style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#FB923C", padding: "10px", fontSize: 22, fontWeight: 700, textAlign: "center" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "#FB923C", marginBottom: 8, fontFamily: "monospace" }}>PAIR B</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1].map(i => (
              <select key={i} value={pair2[i]} onChange={e => setPair2(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                style={{ flex: 1, background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", padding: "8px 6px", fontSize: 11 }}>
                <option value="">Player {i + 1}</option>
                {available(pair2[i]).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ))}
          </div>
        </div>
        {!allUnique && taken.length === 4 && <div style={{ fontSize: 11, color: "#F87171", marginBottom: 12 }}>⚠ Each player can only appear once</div>}
        <button onClick={() => { if (allSelected && allUnique) onAdd({ pair1, pair2, score1: parseInt(score1), score2: parseInt(score2) }); }}
          disabled={!allSelected || !allUnique || loading}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: allSelected && allUnique && !loading ? "#4ADE80" : "rgba(255,255,255,0.06)", color: allSelected && allUnique && !loading ? "#080b10" : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
          {loading ? "SAVING..." : "CONFIRM MATCH"}
        </button>
      </div>
    </div>
  );
}

function AddSessionModal({ onAdd, onClose, loading }) {
  const now = new Date();
  const initialDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const [dateValue, setDateValue] = useState(initialDate);
  const previewLabel = formatSessionLabelFromDate(dateValue);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#111620", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#e2e8f0" }}>New Session</div>
        <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)}
          style={{ width: "100%", background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", padding: "10px 12px", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 10, fontFamily: "monospace" }}>
          Session label preview: {previewLabel || "—"}
        </div>
        <button onClick={() => dateValue && onAdd(dateValue)} disabled={!dateValue || loading}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: dateValue && !loading ? "#60A5FA" : "rgba(255,255,255,0.06)", color: dateValue && !loading ? "#080b10" : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }} />
        <button onClick={() => label.trim() && onAdd(label)} disabled={!label.trim() || loading}
          {loading ? "CREATING..." : "CREATE SESSION"}
        </button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function ClubMatchLog() {
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [casualPlayers, setCasualPlayers] = useState([]);
  const [fnbOrders, setFnbOrders] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [view, setView] = useState("matches");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showBanned, setShowBanned] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  // Members admin
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  // Casual
  const [casualInput, setCasualInput] = useState("");
  const [casualBannedWarn, setCasualBannedWarn] = useState(false);

  // F&B
  const [fnbPlayer, setFnbPlayer] = useState("");
  const [fnbItem, setFnbItem] = useState("");
  const [fnbQty, setFnbQty] = useState("1");
  const [fnbPrice, setFnbPrice] = useState("");

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [{ data: sessionsData }, { data: matchesData }, { data: membersData }, { data: casualData }, { data: fnbData }] = await Promise.all([
        supabase.from("sessions").select("*").order("created_at", { ascending: false }),
        supabase.from("matches").select("*").order("created_at", { ascending: true }),
        supabase.from("members").select("*").order("created_at", { ascending: true }),
        supabase.from("casual_players").select("*").order("created_at", { ascending: true }),
        supabase.from("fnb_orders").select("*").order("created_at", { ascending: true }),
      ]);
      const combined = (sessionsData || []).map(s => ({
        ...s, matches: (matchesData || []).filter(m => m.session_id === s.id),
      }));
      setSessions(combined);
      setMembers(membersData || []);
      setCasualPlayers(casualData || []);
      setFnbOrders(fnbData || []);
      if (combined.length > 0) setActiveSessionId(prev => prev || combined[0].id);
    } catch (e) { setError("Failed to load data."); }
    setLoadingData(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase.channel("club-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "casual_players" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "fnb_orders" }, loadData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadData]);

  // Sessions
  const addSession = async (selectedDate) => {
    const label = formatSessionLabelFromDate(selectedDate);
    if (!label) return;
    setSavingSession(true);
    const { data } = await supabase.from("sessions").insert([{ label }]).select().single();
    if (data) { setActiveSessionId(data.id); setShowAddSession(false); await loadData(); }
    setSavingSession(false);
  };
  const deleteSession = async (id) => {
    if (!window.confirm("Delete this entire session and all its matches?")) return;
    await supabase.from("casual_players").delete().eq("session_id", id);
    await supabase.from("matches").delete().eq("session_id", id);
    await supabase.from("sessions").delete().eq("id", id);
    setActiveSessionId(null);
    await loadData();
  };

  // Matches
  const addMatch = async (matchData) => {
    if (!activeSessionId) return;
    setSavingMatch(true);
    await supabase.from("matches").insert([{ session_id: activeSessionId, ...matchData }]);
    setShowAddMatch(false);
    await loadData();
    setSavingMatch(false);
  };
  const deleteMatch = async (id) => {
    if (!window.confirm("Delete this match?")) return;
    await supabase.from("matches").delete().eq("id", id);
    await loadData();
  };

  // Members
  const tryUnlock = () => {
    if (pwInput === ADMIN_PASSWORD) { setAdminUnlocked(true); setPwError(false); }
    else { setPwError(true); }
  };
  const addMember = async () => {
    if (!newMemberName.trim()) return;
    await supabase.from("members").insert([{ name: newMemberName.trim() }]);
    setNewMemberName("");
    await loadData();
  };
  const removeMember = async (id) => {
    if (!window.confirm("Remove this member?")) return;
    await supabase.from("members").delete().eq("id", id);
    await loadData();
  };

  // Casual
  const addCasual = async () => {
    const name = casualInput.trim();
    if (!name) return;
    if (isBanned(name)) { setShowBanned(true); setCasualInput(""); setCasualBannedWarn(false); return; }
    if (!activeSessionId) { alert("Please select or create a session first."); return; }
    await supabase.from("casual_players").insert([{ session_id: activeSessionId, name, paid: false }]);
    setCasualInput("");
    setCasualBannedWarn(false);
    await loadData();
  };
  const removeCasual = async (id) => {
    await supabase.from("casual_players").delete().eq("id", id);
    await loadData();
  };
  const toggleCasualPaid = async (id, paid) => {
    await supabase.from("casual_players").update({ paid: !paid }).eq("id", id);
    await loadData();
  };

  // F&B
  const addFnbOrder = async () => {
    if (!fnbPlayer || !fnbItem.trim() || !fnbPrice) return;
    await supabase.from("fnb_orders").insert([{ player_name: fnbPlayer, item: fnbItem.trim(), quantity: parseInt(fnbQty) || 1, total_price: parseInt(fnbPrice) }]);
    setFnbItem(""); setFnbQty("1"); setFnbPrice("");
    await loadData();
  };
  const deleteFnbOrder = async (id) => {
    await supabase.from("fnb_orders").delete().eq("id", id);
    await loadData();
  };
  const resetFnb = async () => {
    if (!window.confirm("Reset all F&B orders?")) return;
    await supabase.from("fnb_orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await loadData();
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeCasuals = casualPlayers.filter(c => c.session_id === activeSessionId);
  const allPlayers = [...members.map(m => m.name), ...activeCasuals.map(c => `${c.name} (casual)`)];
  const fnbTotal = fnbOrders.reduce((sum, o) => sum + o.total_price, 0);
  const { memberFines, casualFines } = getFines(sessions, members, casualPlayers);
  const sortedMemberFines = Object.entries(memberFines).sort((a, b) => b[1] - a[1]);
  const sortedCasualFines = Object.entries(casualFines).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const totalFines = Object.values(memberFines).reduce((a, b) => a + b, 0);

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e2e8f0", padding: "8px 10px", fontSize: 12, fontFamily: "monospace" };
  const cardStyle = { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 };
  const labelStyle = { fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", marginBottom: 12 };

  return (
    <div style={{ minHeight: "100vh", background: "#080b10", color: "#e2e8f0", fontFamily: "Georgia, serif", padding: "20px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: "#4ADE80", marginBottom: 6, fontFamily: "monospace" }}>🎾 CLUB MATCH LOG</div>
          <div style={{ fontSize: 28, fontWeight: 900 }}>Club Sessions</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "monospace" }}>Tue & Thu · 10k/player per loss · 10k each on draw</div>
        </div>

        {error && <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#F87171" }}>⚠ {error}</div>}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
          {[["matches","📋 Matches"],["members","👥 Members"],["fnb","🧃 F&B"],["fines","💰 Fines"]].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: view === v ? "#e2e8f0" : "rgba(255,255,255,0.06)", color: view === v ? "#080b10" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, fontFamily: "monospace", flexShrink: 0 }}>
              {label}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 12, letterSpacing: 2 }}>LOADING...</div>
        ) : (
          <>
            {/* ── MATCHES ── */}
            {view === "matches" && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => setActiveSessionId(s.id)} style={{ padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: activeSessionId === s.id ? "#60A5FA" : "rgba(255,255,255,0.05)", color: activeSessionId === s.id ? "#080b10" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                        {s.label}
                      </button>
                      <button onClick={() => deleteSession(s.id)} style={{ padding: "5px 7px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(248,113,113,0.1)", color: "#F87171", fontSize: 11 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => setShowAddSession(true)} style={{ padding: "7px 14px", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}>
                    + New Session
                  </button>
                </div>

                {activeSession ? (
                  <>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 14, fontFamily: "monospace" }}>
                      {activeSession.matches.length} match{activeSession.matches.length !== 1 ? "es" : ""} · {activeSession.label}
                      {activeCasuals.length > 0 && <span style={{ color: "#60A5FA" }}> · {activeCasuals.length} casual{activeCasuals.length > 1 ? "s" : ""}</span>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {activeSession.matches.map((match, idx) => {
                        const result = getResult(match.score1, match.score2);
                        const isDraw = result === "draw";
                        return (
                          <div key={match.id} style={cardStyle}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>MATCH {idx + 1}{isDraw ? " · 🤝 DRAW" : ""}</div>
                              <button onClick={() => deleteMatch(match.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#F87171", fontSize: 10, padding: "3px 8px", cursor: "pointer", fontFamily: "monospace" }}>✕ delete</button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                {match.pair1.map(p => (
                                  <div key={p} style={{ fontSize: 13, fontWeight: result === "pair1" ? 700 : 400, color: result === "pair1" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                                    {result === "pair1" ? "🏆 " : "💸 "}{p}
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                <span style={{ fontSize: 26, fontWeight: 900, color: result === "pair1" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.4)" }}>{match.score1}</span>
                                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)" }}>—</span>
                                <span style={{ fontSize: 26, fontWeight: 900, color: result === "pair2" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.4)" }}>{match.score2}</span>
                              </div>
                              <div style={{ flex: 1, textAlign: "right" }}>
                                {match.pair2.map(p => (
                                  <div key={p} style={{ fontSize: 13, fontWeight: result === "pair2" ? 700 : 400, color: result === "pair2" ? "#4ADE80" : isDraw ? "#FDE047" : "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                                    {p}{result === "pair2" ? " 🏆" : " 💸"}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", display: "flex", justifyContent: "space-between" }}>
                              <span>{isDraw ? "All 4 players fined 10k each" : "Losers pay 10k each"}</span>
                              <span style={{ color: "#FB923C" }}>{isDraw ? "40k total" : "20k total"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div onClick={() => setShowAddMatch(true)} style={{ marginTop: 12, border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 14, padding: "16px", textAlign: "center", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: "monospace", letterSpacing: 1 }}>
                      + LOG MATCH
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)", fontFamily: "monospace", fontSize: 12 }}>No sessions yet — tap "+ New Session" to start</div>
                )}
              </>
            )}

            {/* ── MEMBERS ── */}
            {view === "members" && (
              <>
                {/* Admin lock */}
                {!adminUnlocked ? (
                  <div style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#FB923C" }}>Members are password protected</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Enter password to add or remove members</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="password" placeholder="Password" value={pwInput} onChange={e => setPwInput(e.target.value)} onKeyDown={e => e.key === "Enter" && tryUnlock()}
                        style={{ ...inputStyle, flex: 1, letterSpacing: 4 }} />
                      <button onClick={tryUnlock} style={{ background: "#FB923C", border: "none", borderRadius: 8, color: "#080b10", fontWeight: 700, fontSize: 12, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace" }}>Unlock</button>
                    </div>
                    {pwError && <div style={{ fontSize: 11, color: "#F87171", marginTop: 6, fontFamily: "monospace" }}>❌ Wrong password.</div>}
                  </div>
                ) : (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#4ADE80", fontFamily: "monospace", marginBottom: 14 }}>
                    🔓 Unlocked · Admin mode
                  </div>
                )}

                {/* Club members list */}
                <div style={cardStyle}>
                  <div style={labelStyle}>CLUB MEMBERS · {members.length}</div>
                  {members.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4ADE80", flexShrink: 0, fontFamily: "monospace" }}>
                        {m.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, flex: 1 }}>{m.name}</div>
                      {adminUnlocked && <button onClick={() => removeMember(m.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#F87171", fontSize: 10, padding: "3px 8px", cursor: "pointer", fontFamily: "monospace" }}>✕ remove</button>}
                    </div>
                  ))}
                  {adminUnlocked && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} onKeyDown={e => e.key === "Enter" && addMember()} placeholder="New member name..." style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={addMember} style={{ background: "#4ADE80", border: "none", borderRadius: 8, color: "#080b10", fontWeight: 700, fontSize: 12, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace" }}>+ Add</button>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 12px" }}>
                  <span style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>CASUAL PLAYERS THIS SESSION</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                </div>

                <div style={cardStyle}>
                  <div style={labelStyle}>WALK-INS · 170k FEE EACH</div>
                  {activeCasuals.length === 0 && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", marginBottom: 12 }}>No casual players this session yet</div>
                  )}
                  {activeCasuals.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(96,165,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#60A5FA", flexShrink: 0, fontFamily: "monospace", marginTop: 2 }}>
                        {c.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                          <span style={{ fontSize: 11, fontFamily: "monospace", padding: "2px 7px", borderRadius: 6, background: c.paid ? "rgba(74,222,128,0.1)" : "rgba(251,146,60,0.1)", color: c.paid ? "#4ADE80" : "#FB923C", border: `1px solid ${c.paid ? "rgba(74,222,128,0.2)" : "rgba(251,146,60,0.2)"}` }}>
                            {c.paid ? "✓ 170k paid" : "⏳ 170k unpaid"}
                          </span>
                          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "monospace", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                            <input type="checkbox" checked={c.paid} onChange={() => toggleCasualPaid(c.id, c.paid)} style={{ accentColor: "#4ADE80", cursor: "pointer" }} />
                            Paid
                          </label>
                        </div>
                      </div>
                      <button onClick={() => removeCasual(c.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#F87171", fontSize: 10, padding: "3px 8px", cursor: "pointer", fontFamily: "monospace", marginTop: 2 }}>✕</button>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <input value={casualInput} onChange={e => { setCasualInput(e.target.value); setCasualBannedWarn(isBanned(e.target.value)); }}
                      onKeyDown={e => e.key === "Enter" && addCasual()}
                      placeholder="Casual player name..." style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={addCasual} style={{ background: "#60A5FA", border: "none", borderRadius: 8, color: "#080b10", fontWeight: 700, fontSize: 12, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace" }}>+ Add</button>
                  </div>
                  {casualBannedWarn && (
                    <div style={{ marginTop: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#F87171", fontFamily: "monospace" }}>
                      🚫 This player is not allowed in the club.
                    </div>
                  )}
                  {!activeSessionId && <div style={{ fontSize: 11, color: "#FB923C", marginTop: 8, fontFamily: "monospace" }}>⚠ Create a session first to add casual players</div>}
                </div>
              </>
            )}

            {/* ── F&B ── */}
            {view === "fnb" && (
              <>
                <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: "#60A5FA", fontFamily: "monospace" }}>F&B TOTAL</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#60A5FA", marginTop: 4 }}>{formatVND(fnbTotal)}</div>
                  </div>
                  <button onClick={resetFnb} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, color: "#F87171", fontSize: 11, padding: "8px 14px", cursor: "pointer", fontFamily: "monospace" }}>Reset tab</button>
                </div>

                {fnbOrders.length > 0 && (
                  <div style={cardStyle}>
                    <div style={labelStyle}>ORDERS</div>
                    {fnbOrders.map(order => (
                      <div key={order.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <button onClick={() => deleteFnbOrder(order.id)} style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.15)", color: "#F87171", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{order.player_name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{order.item} × {order.quantity}</div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#60A5FA", fontFamily: "monospace" }}>{formatVND(order.total_price)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={cardStyle}>
                  <div style={labelStyle}>LOG NEW ORDER</div>
                  <select value={fnbPlayer} onChange={e => setFnbPlayer(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 8 }}>
                    <option value="">Select player...</option>
                    {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    {activeCasuals.map(c => <option key={c.id} value={c.name}>{c.name} (casual)</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input value={fnbItem} onChange={e => setFnbItem(e.target.value)} placeholder="Item (Pocari, Cơm...)" style={{ ...inputStyle, flex: 2 }} />
                    <input value={fnbQty} onChange={e => setFnbQty(e.target.value)} type="number" min="1" placeholder="Qty" style={{ ...inputStyle, width: 56 }} />
                  </div>
                  <input value={fnbPrice} onChange={e => setFnbPrice(e.target.value)} type="number" placeholder="Total price in VND (e.g. 15000)" style={{ ...inputStyle, width: "100%", marginBottom: 10 }} />
                  <button onClick={addFnbOrder} disabled={!fnbPlayer || !fnbItem.trim() || !fnbPrice}
                    style={{ width: "100%", padding: "11px", border: "none", borderRadius: 10, background: fnbPlayer && fnbItem.trim() && fnbPrice ? "#60A5FA" : "rgba(255,255,255,0.06)", color: fnbPlayer && fnbItem.trim() && fnbPrice ? "#080b10" : "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "monospace" }}>
                    + Log Order
                  </button>
                </div>
              </>
            )}

            {/* ── FINES ── */}
            {view === "fines" && (
              <>
                <div style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: "#FB923C", fontFamily: "monospace" }}>TOTAL FINES COLLECTED</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#FB923C", marginTop: 4 }}>{formatVND(totalFines)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 4, fontFamily: "monospace" }}>across all sessions</div>
                  </div>
                  <div style={{ fontSize: 36 }}>💰</div>
                </div>

                <div style={labelStyle}>CLUB MEMBERS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {sortedMemberFines.map(([name, amount], idx) => (
                    <div key={name} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${amount > 0 ? "rgba(251,146,60,0.15)" : "rgba(255,255,255,0.05)"}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: idx === 0 && amount > 0 ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: amount > 0 ? 600 : 400 }}>{name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 2, fontFamily: "monospace" }}>{amount > 0 ? `${amount / 10000} loss${amount / 10000 > 1 ? "es" : ""}` : "clean record ✨"}</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: amount > 0 ? "#FB923C" : "#4ADE80" }}>{amount > 0 ? `−${formatVND(amount)}` : "0đ"}</div>
                    </div>
                  ))}
                </div>

                {(sortedCasualFines.length > 0 || activeCasuals.length > 0) && (
                  <>
                    <div style={labelStyle}>CASUAL PLAYERS (THIS SESSION)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {activeCasuals.map(c => {
                        const fine = casualFines[c.name] || 0;
                        const total = CASUAL_FEE + fine;
                        return (
                          <div key={c.id} style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 12, padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(96,165,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#60A5FA", fontFamily: "monospace", flexShrink: 0 }}>C</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                                    {fine > 0 ? `${fine / 10000} loss${fine / 10000 > 1 ? "es" : ""}` : "no losses"}
                                  </span>
                                  <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 7px", borderRadius: 6, background: c.paid ? "rgba(74,222,128,0.1)" : "rgba(251,146,60,0.1)", color: c.paid ? "#4ADE80" : "#FB923C", border: `1px solid ${c.paid ? "rgba(74,222,128,0.2)" : "rgba(251,146,60,0.2)"}` }}>
                                    {c.paid ? "✓ 170k paid" : "⏳ 170k unpaid"}
                                  </span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                {fine > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: "#FB923C" }}>−{formatVND(fine)} fine</div>}
                              </div>
                            </div>
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                                170k entry {fine > 0 ? `+ ${formatVND(fine)} fine` : ""}
                              </span>
                              <span style={{ fontSize: 15, fontWeight: 700, color: c.paid && fine === 0 ? "#4ADE80" : "#F87171" }}>
                                {formatVND(total)} total
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showAddMatch && <AddMatchModal onAdd={addMatch} onClose={() => setShowAddMatch(false)} loading={savingMatch} allPlayers={allPlayers} />}
      {showAddSession && <AddSessionModal onAdd={addSession} onClose={() => setShowAddSession(false)} loading={savingSession} />}
      {showBanned && <BannedModal onClose={() => setShowBanned(false)} />}
    </div>
  );
}


