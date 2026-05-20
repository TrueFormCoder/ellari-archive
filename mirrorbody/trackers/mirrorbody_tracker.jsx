
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Constants ──────────────────────────────────────────────────────────────
const EXERCISE_GROUPS = {
  Squat:  ["Back squat","Box squat","Goblet squat","Bulgarian split squat","Step-up"],
  Hinge:  ["Conventional deadlift","Romanian deadlift","Single-leg RDL","Good morning"],
  Push:   ["Barbell bench press","Overhead press","Dumbbell incline press"],
  Pull:   ["Inverted row","Bent-over row","Bicep curl","Pull-up"],
  Glute:  ["Hip thrust","Glute bridge"],
  Core:   ["Farmer's carry","Dead bug","Anti-rotation hold"],
  Chair:  ["Chair: footwork","Chair: single-leg footwork","Chair: row","Chair: lat pull","Chair: pushdown","Chair: face pull","Chair: kickback","Chair: lateral raise","Chair: hamstring curl"],
  Cardio: ["Bike — LISS","Bike — HIIT","Incline trainer — walk","Incline trainer — intervals"],
};
const ALL_EXERCISES = Object.entries(EXERCISE_GROUPS).flatMap(([g,ex]) => ex.map(n => ({ name: n, group: g })));
const BW_EXERCISES = new Set(["Pull-up","Dead bug","Anti-rotation hold"]);

const DAY_TYPES = {
  1: ["Day A · Full body","Day B · Full body","Day C · Full body","Active recovery","Deload"],
  2: ["Upper A · Push","Lower A · Squat","Upper B · Pull","Lower B · Hinge","Optional · Cardio","Active recovery","Deload"],
  3: ["Powerlifting — volume","Powerlifting — recovery","Powerlifting — intensity","Physique — glutes/hams","Physique — back/width","Physique — chest/tris","Physique — shoulders/arms","Strongwoman events","Deload"],
  4: ["Peak block","Competition prep","Posing practice","Peak week","Competition day"],
};

const BENCHMARKS = [
  { lift: "Back squat",         mult: 1.00, reps: 3, label: "1.0× bodyweight × 3" },
  { lift: "Conventional deadlift", mult: 1.25, reps: 3, label: "1.25× bodyweight × 3" },
  { lift: "Barbell bench press", mult: 0.60, reps: 3, label: "0.6× bodyweight × 3" },
  { lift: "Overhead press",     mult: 0.40, reps: 5, label: "0.4× bodyweight × 5" },
  { lift: "Pull-up",            mult: null, reps: 3, label: "3 strict reps" },
];

const CYCLE_PHASES = [
  { days: [1,7],  label: "Menstruation", note: "Lower volume. Body is recovering.", color: "#F7C1C1" },
  { days: [8,14], label: "Follicular 🔥", note: "Peak performance window. PR attempts here.", color: "#9FE1CB" },
  { days: [15,21],label: "Ovulation",     note: "High intensity OK. Energy is high.", color: "#FAC775" },
  { days: [22,35],label: "Luteal",        note: "Volume down, load maintained. Fatigue is real.", color: "#CECBF6" },
];

const today = () => new Date().toISOString().split("T")[0];
const e1RM  = (w, r) => (r === 1 ? +w : Math.round(+w * (1 + +r / 30)));
const volLoad = (w, r) => Math.round(+w * +r);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("log");
  const [sessions, setSessions]   = useState([]);
  const [prs, setPrs]             = useState({});
  const [phase, setPhaseRaw]      = useState({
    phase: 1, startDate: today(), bodyweight: null,
    sessionsSinceDeload: 0, lastDeloadDate: null, cycleDay: null,
  });
  const [loading, setLoading]     = useState(true);
  const [flash, setFlash]         = useState(null);

  // Log form state
  const [logDate, setLogDate]     = useState(today());
  const [logType, setLogType]     = useState("");
  const [logExs, setLogExs]       = useState([]);
  const [logNotes, setLogNotes]   = useState("");
  const [sessRPE, setSessRPE]     = useState("");

  // Progress
  const [progEx, setProgEx]       = useState("Back squat");

  // ── Load ──
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("mb_s"); if (r) setSessions(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("mb_p"); if (r) setPrs(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("mb_ph"); if (r) setPhaseRaw(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  const savePhase = async (d) => {
    setPhaseRaw(d);
    try { await window.storage.set("mb_ph", JSON.stringify(d)); } catch {}
  };

  // ── Log helpers ──
  const addEx   = (name) => { if (!name) return; setLogExs(p => [...p, { name, sets: [{ weight:"", reps:"", rpe:"" }] }]); };
  const rmEx    = (i) => setLogExs(p => p.filter((_,idx) => idx !== i));
  const addSet  = (i) => setLogExs(p => p.map((ex,idx) => idx!==i ? ex : { ...ex, sets: [...ex.sets, { weight:"", reps:"", rpe:"" }] }));
  const rmSet   = (ei,si) => setLogExs(p => p.map((ex,i) => i!==ei ? ex : { ...ex, sets: ex.sets.filter((_,j) => j!==si) }));
  const upSet   = (ei,si,f,v) => setLogExs(p => p.map((ex,i) => i!==ei ? ex : { ...ex, sets: ex.sets.map((s,j) => j!==si ? s : { ...s, [f]: v }) }));

  // ── Save session ──
  const saveSession = async () => {
    const valid = logExs.filter(ex => ex.sets.some(s => s.reps));
    if (!valid.length) return;

    const session = { id: Date.now(), date: logDate, phase: phase.phase, dayType: logType, exercises: valid, notes: logNotes, sessRPE };

    const newSessions = [...sessions, session];
    const updPRs = { ...prs };
    const newPRsFound = [];

    valid.forEach(ex => {
      const isBW = BW_EXERCISES.has(ex.name);
      ex.sets.forEach(set => {
        const r = +set.reps; if (!r) return;
        const w = +set.weight;
        const metric = isBW ? r : (w > 0 ? e1RM(w, r) : 0);
        if (!metric) return;
        const existing = updPRs[ex.name];
        if (!existing || metric > existing.metric) {
          const pr = { exercise: ex.name, weight: w, reps: r, date: logDate, phase: phase.phase, metric, isBW };
          newPRsFound.push(pr);
          updPRs[ex.name] = pr;
        }
      });
    });

    const isDeload = logType?.toLowerCase().includes("deload");
    const newPhase = { ...phase, sessionsSinceDeload: isDeload ? 0 : (phase.sessionsSinceDeload||0)+1, lastDeloadDate: isDeload ? logDate : phase.lastDeloadDate };

    try { await window.storage.set("mb_s", JSON.stringify(newSessions)); } catch {}
    try { await window.storage.set("mb_p", JSON.stringify(updPRs)); } catch {}
    try { await window.storage.set("mb_ph", JSON.stringify(newPhase)); } catch {}

    setSessions(newSessions); setPrs(updPRs); setPhaseRaw(newPhase);
    setFlash(newPRsFound.length ? { type:"pr", list: newPRsFound } : { type:"ok" });
    setTimeout(() => setFlash(null), 5000);
    setLogExs([]); setLogNotes(""); setLogType(""); setSessRPE("");
  };

  // ── Progress data ──
  const progData = sessions
    .filter(s => s.exercises?.some(ex => ex.name === progEx))
    .map(s => {
      const ex = s.exercises.find(e => e.name === progEx);
      const isBW = BW_EXERCISES.has(progEx);
      const best = Math.max(...ex.sets.map(set => {
        const r = +set.reps; if (!r) return 0;
        const w = +set.weight;
        return isBW ? r : (w > 0 ? e1RM(w,r) : 0);
      }).filter(Boolean));
      const vol = ex.sets.reduce((sum,s) => sum + (+s.weight > 0 && +s.reps > 0 ? volLoad(s.weight,s.reps) : 0), 0);
      return { date: s.date.slice(5), best, vol, phase: s.phase };
    }).filter(d => d.best > 0).slice(-20);

  const sessVolToday = logExs.reduce((sum,ex) => sum + ex.sets.reduce((s2,set) => s2 + (+set.weight>0&&+set.reps>0 ? volLoad(set.weight,set.reps) : 0), 0), 0);
  const deloadDue  = phase.sessionsSinceDeload >= 12;
  const deloadSoon = phase.sessionsSinceDeload >= 9;

  const cycleInfo = phase.cycleDay ? CYCLE_PHASES.find(c => phase.cycleDay >= c.days[0] && phase.cycleDay <= c.days[1]) : null;

  // ── Tokens ──
  const purple = "#534AB7", purpleL = "#EEEDFE", purpleD = "#26215C", purpleMid = "#AFA9EC";
  const green = "#1D9E75", greenL = "#E1F5EE";
  const amber = "#BA7517", amberL = "#FAEEDA";
  const red = "#993C1D", redL = "#FAECE7";

  const C = {
    card:  { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"14px", marginBottom:"10px" },
    input: { fontSize:"13px", padding:"6px 10px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", width:"100%" },
    label: { fontSize:"10px", color:"var(--color-text-secondary)", display:"block", marginBottom:"4px", letterSpacing:"0.04em", textTransform:"uppercase" },
    mono:  { fontSize:"12px", padding:"5px 6px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-mono)", textAlign:"center", width:"100%" },
  };

  const btn = (v="default") => ({
    fontSize:"12px", padding:"6px 12px", borderRadius:"var(--border-radius-md)",
    border: v==="primary" ? "none" : "0.5px solid var(--color-border-secondary)",
    background: v==="primary" ? purple : v==="ghost" ? "transparent" : "var(--color-background-secondary)",
    color: v==="primary" ? purpleL : v==="danger" ? red : "var(--color-text-secondary)",
    cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight: v==="primary"?500:400,
  });

  const select = { ...C.input, cursor:"pointer" };

  if (loading) return <div style={{ padding:"2rem", fontFamily:"var(--font-mono)", fontSize:"12px", color:"var(--color-text-secondary)" }}>loading vault...</div>;

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem 0" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"1rem", flexWrap:"wrap" }}>
        <span style={{ fontSize:"15px", fontWeight:500, color:"var(--color-text-primary)", letterSpacing:"-0.01em" }}>MIRRORBODY</span>
        <span style={{ fontSize:"9px", color:"var(--color-text-secondary)", letterSpacing:"0.1em", textTransform:"uppercase" }}>training vault</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px", background:purpleL, color:purpleD, fontWeight:500 }}>Phase {phase.phase}</span>
          <span style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px", fontWeight:500, background: deloadDue?redL : deloadSoon?amberL : greenL, color: deloadDue?red : deloadSoon?amber : green }}>
            {deloadDue ? "⚡ deload now" : `${phase.sessionsSinceDeload}/12 sessions`}
          </span>
          {cycleInfo && <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"20px", background: cycleInfo.color+"33", color:"var(--color-text-secondary)" }}>{cycleInfo.label}</span>}
          <span style={{ fontSize:"10px", color:"var(--color-text-tertiary)" }}>{sessions.length} logged · {Object.keys(prs).length} PRs</span>
        </div>
      </div>

      {/* ── Flash ── */}
      {flash?.type === "pr" && (
        <div style={{ background:purpleL, border:`1px solid ${purple}`, borderRadius:"var(--border-radius-md)", padding:"10px 14px", marginBottom:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:500, color:purpleD, marginBottom:"5px", fontFamily:"var(--font-mono)", letterSpacing:"0.06em" }}>◉ PR RECEIPT — SEALED</div>
          {flash.list.map((pr,i) => (
            <div key={i} style={{ fontSize:"12px", color:purple, fontFamily:"var(--font-mono)" }}>
              {pr.exercise}: {pr.isBW ? `${pr.reps} reps` : `${pr.weight}lbs × ${pr.reps}`} → {pr.isBW ? `${pr.metric} rep PR` : `est. 1RM ${pr.metric}lbs`}
            </div>
          ))}
        </div>
      )}
      {flash?.type === "ok" && (
        <div style={{ background:greenL, border:`0.5px solid ${green}`, borderRadius:"var(--border-radius-md)", padding:"8px 14px", marginBottom:"12px", fontSize:"12px", color:green, fontFamily:"var(--font-mono)" }}>
          session sealed ✓
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display:"flex", borderBottom:"0.5px solid var(--color-border-tertiary)", marginBottom:"1.25rem" }}>
        {[["log","Log session"],["vault","PR vault"],["progress","Progress"],["phase","Phase + benchmarks"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            fontSize:"12px", padding:"7px 12px", border:"none", background:"transparent",
            color: tab===id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            borderBottom:`2px solid ${tab===id ? purple : "transparent"}`,
            fontWeight: tab===id ? 500 : 400, cursor:"pointer", fontFamily:"var(--font-sans)",
          }}>{label}</button>
        ))}
      </div>

      {/* ════════════════════════════
          LOG SESSION
      ════════════════════════════ */}
      {tab === "log" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
            <div>
              <span style={C.label}>Date</span>
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} style={C.input} />
            </div>
            <div>
              <span style={C.label}>Session type</span>
              <select value={logType} onChange={e => setLogType(e.target.value)} style={select}>
                <option value="">Select...</option>
                {(DAY_TYPES[phase.phase]||DAY_TYPES[1]).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {sessVolToday > 0 && (
            <div style={{ display:"flex", gap:"16px", padding:"6px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:"10px", alignItems:"center" }}>
              <span style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>Session volume</span>
              <span style={{ fontSize:"14px", fontWeight:500, color:purple, fontFamily:"var(--font-mono)" }}>{sessVolToday.toLocaleString()} lbs</span>
              <span style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginLeft:"auto" }}>{logExs.reduce((s,ex) => s+ex.sets.length,0)} sets · {logExs.length} exercises</span>
            </div>
          )}

          <div style={{ marginBottom:"12px" }}>
            <span style={C.label}>Add exercise</span>
            <select onChange={e => { addEx(e.target.value); e.target.value=""; }} style={select} defaultValue="">
              <option value="">+ Add exercise to session...</option>
              {Object.entries(EXERCISE_GROUPS).map(([g,exs]) => (
                <optgroup key={g} label={g}>
                  {exs.map(e => <option key={e} value={e}>{e}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {logExs.map((ex,ei) => {
            const isBW   = BW_EXERCISES.has(ex.name);
            const prFor  = prs[ex.name];
            const exVol  = ex.sets.reduce((s,set) => s + (+set.weight>0&&+set.reps>0 ? volLoad(set.weight,set.reps) : 0), 0);
            return (
              <div key={ei} style={C.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:500, color:"var(--color-text-primary)" }}>{ex.name}</div>
                    {prFor && (
                      <div style={{ fontSize:"10px", color:purple, marginTop:"2px", fontFamily:"var(--font-mono)" }}>
                        PR: {prFor.isBW ? `${prFor.reps} reps` : `${prFor.weight}lbs × ${prFor.reps}`} ({prFor.isBW ? `${prFor.metric} rep best` : `e1RM ${prFor.metric}`})
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                    {exVol > 0 && <span style={{ fontSize:"10px", color:"var(--color-text-secondary)", fontFamily:"var(--font-mono)" }}>{exVol.toLocaleString()}lb vol</span>}
                    <button onClick={() => rmEx(ei)} style={{ ...btn("ghost"), padding:"2px 6px", fontSize:"14px", color:"var(--color-text-secondary)" }}>✕</button>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns: isBW?"28px 1fr 1fr 50px 22px":"28px 1fr 1fr 1fr 50px 22px", gap:"5px", marginBottom:"4px" }}>
                  {["#", isBW?"":"lbs", "reps", "RPE", isBW?"best":"e1RM",""].map((h,i) => (
                    h && <span key={i} style={{ fontSize:"9px", color:"var(--color-text-tertiary)", textAlign:"center", textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</span>
                  ))}
                </div>

                {ex.sets.map((set,si) => {
                  const computed = +set.reps > 0 ? (isBW ? +set.reps : (+set.weight>0 ? e1RM(set.weight,set.reps) : null)) : null;
                  const isPR = computed && prFor && computed > prFor.metric;
                  return (
                    <div key={si} style={{ display:"grid", gridTemplateColumns: isBW?"28px 1fr 1fr 50px 22px":"28px 1fr 1fr 1fr 50px 22px", gap:"5px", marginBottom:"5px", alignItems:"center" }}>
                      <span style={{ fontSize:"10px", color:"var(--color-text-tertiary)", textAlign:"center", fontFamily:"var(--font-mono)" }}>{si+1}</span>
                      {!isBW && <input type="number" placeholder="lbs" value={set.weight} onChange={e => upSet(ei,si,"weight",e.target.value)} style={C.mono} min="0" />}
                      <input type="number" placeholder="reps" value={set.reps}   onChange={e => upSet(ei,si,"reps",e.target.value)}   style={C.mono} min="1" />
                      <input type="number" placeholder="RPE"  value={set.rpe}    onChange={e => upSet(ei,si,"rpe",e.target.value)}    style={{ ...C.mono, min:"1", max:"10" }} />
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"11px", textAlign:"center", color: isPR?purple : computed?"var(--color-text-primary)":"var(--color-text-tertiary)", fontWeight: isPR?500:400 }}>
                        {computed ? (isPR ? "★"+computed : computed) : "—"}
                      </span>
                      <button onClick={() => rmSet(ei,si)} style={{ fontSize:"10px", color:"var(--color-text-tertiary)", background:"transparent", border:"none", cursor:"pointer" }}>✕</button>
                    </div>
                  );
                })}
                <button onClick={() => addSet(ei)} style={{ ...btn(), fontSize:"11px", padding:"3px 9px", marginTop:"2px" }}>+ set</button>
              </div>
            );
          })}

          {logExs.length > 0 && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 64px", gap:"10px", marginBottom:"12px", alignItems:"end" }}>
                <div>
                  <span style={C.label}>Session notes</span>
                  <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} placeholder="How it felt. What clicked. Sleep / nutrition." style={{ ...C.input, minHeight:"56px", resize:"vertical" }} />
                </div>
                <div>
                  <span style={C.label}>Overall RPE</span>
                  <input type="number" min="1" max="10" value={sessRPE} onChange={e => setSessRPE(e.target.value)} placeholder="1–10" style={{ ...C.mono, padding:"7px" }} />
                </div>
              </div>
              <button onClick={saveSession} style={{ ...btn("primary"), width:"100%", padding:"11px", fontSize:"13px" }}>
                Seal session ✓
              </button>
            </>
          )}
          {logExs.length === 0 && (
            <div style={{ textAlign:"center", padding:"2.5rem 1rem", color:"var(--color-text-tertiary)", fontSize:"13px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)" }}>
              Add exercises above to start logging.
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════
          PR VAULT
      ════════════════════════════ */}
      {tab === "vault" && (
        <div>
          <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"1rem", fontFamily:"var(--font-mono)" }}>
            {Object.keys(prs).length} receipts sealed · {sessions.length} sessions logged
          </div>
          {Object.keys(prs).length === 0 && (
            <div style={{ textAlign:"center", padding:"3rem", color:"var(--color-text-tertiary)", fontSize:"13px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)" }}>
              Log your first session to generate PR receipts.
            </div>
          )}
          {Object.entries(prs).sort((a,b) => new Date(b[1].date)-new Date(a[1].date)).map(([name,pr]) => {
            const bw   = phase.bodyweight;
            const bm   = BENCHMARKS.find(b => b.lift === name);
            const target = bm?.mult && bw ? Math.round(bw * bm.mult) : null;
            const pct  = target ? Math.min(100, Math.round((pr.metric/target)*100)) : (name==="Pull-up" && pr ? Math.min(100, Math.round((pr.reps/3)*100)) : null);
            const done = pct !== null && pct >= 100;
            return (
              <div key={name} style={{ background:"var(--color-background-secondary)", border:`0.5px dashed ${done?"#1D9E75":"var(--color-border-secondary)"}`, borderRadius:"var(--border-radius-md)", padding:"14px 16px", marginBottom:"8px", fontFamily:"var(--font-mono)" }}>
                <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"6px" }}>
                  ◉ PR RECEIPT · PHASE {pr.phase} · {pr.date}
                </div>
                <div style={{ fontSize:"14px", fontWeight:500, color:"var(--color-text-primary)", marginBottom:"3px", fontFamily:"var(--font-sans)" }}>{pr.exercise}</div>
                <div style={{ fontSize:"22px", fontWeight:500, color:done?green:purple, marginBottom:"4px", letterSpacing:"-0.02em" }}>
                  {pr.isBW ? `${pr.reps} reps` : `${pr.weight} lbs × ${pr.reps}`}{done?" ✓":""}
                </div>
                <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom: pct?"8px":0 }}>
                  {pr.isBW ? "bodyweight" : `est. 1RM: ${pr.metric} lbs`}
                  {target ? ` · target: ${target} lbs` : ""}
                </div>
                {pct !== null && (
                  <div>
                    <div style={{ height:"4px", background:"var(--color-border-tertiary)", borderRadius:"2px", overflow:"hidden", marginBottom:"3px" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:done?green:purple, borderRadius:"2px", transition:"width 0.6s ease" }} />
                    </div>
                    <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)" }}>{pct}% of Phase 1 benchmark</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════
          PROGRESS
      ════════════════════════════ */}
      {tab === "progress" && (
        <div>
          <div style={{ marginBottom:"14px" }}>
            <span style={C.label}>Exercise</span>
            <select value={progEx} onChange={e => setProgEx(e.target.value)} style={select}>
              {Object.entries(EXERCISE_GROUPS).map(([g,exs]) => (
                <optgroup key={g} label={g}>
                  {exs.map(e => <option key={e}>{e}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {prs[progEx] && (
            <div style={{ display:"flex", gap:"12px", marginBottom:"12px", flexWrap:"wrap" }}>
              <div style={{ padding:"10px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", minWidth:"120px" }}>
                <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"4px" }}>Current PR</div>
                <div style={{ fontSize:"18px", fontWeight:500, color:purple, fontFamily:"var(--font-mono)" }}>
                  {prs[progEx].isBW ? `${prs[progEx].reps} reps` : `${prs[progEx].metric} lbs`}
                </div>
                <div style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>{prs[progEx].date}</div>
              </div>
              {!prs[progEx].isBW && (
                <div style={{ padding:"10px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", minWidth:"120px" }}>
                  <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"4px" }}>Top set</div>
                  <div style={{ fontSize:"18px", fontWeight:500, color:"var(--color-text-primary)", fontFamily:"var(--font-mono)" }}>{prs[progEx].weight}×{prs[progEx].reps}</div>
                  <div style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>lbs × reps</div>
                </div>
              )}
              <div style={{ padding:"10px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", minWidth:"80px" }}>
                <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"4px" }}>Sessions</div>
                <div style={{ fontSize:"18px", fontWeight:500, color:"var(--color-text-primary)", fontFamily:"var(--font-mono)" }}>
                  {sessions.filter(s => s.exercises?.some(e => e.name===progEx)).length}
                </div>
              </div>
            </div>
          )}

          {progData.length > 1 ? (
            <div style={{ marginBottom:"16px" }}>
              <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>
                {BW_EXERCISES.has(progEx) ? "Max reps" : "Estimated 1RM"} over time
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={progData} margin={{ top:4, right:8, left:-20, bottom:4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:"var(--color-text-secondary)" }} />
                  <YAxis tick={{ fontSize:10, fill:"var(--color-text-secondary)" }} />
                  <Tooltip contentStyle={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:"8px", fontSize:"11px", fontFamily:"var(--font-mono)" }} formatter={v => [`${v}${BW_EXERCISES.has(progEx)?" reps":" lbs"}`, BW_EXERCISES.has(progEx)?"reps":"e1RM"]} />
                  <Line type="monotone" dataKey="best" stroke={purple} strokeWidth={2} dot={{ r:3, fill:purple, strokeWidth:0 }} activeDot={{ r:5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"1.5rem", color:"var(--color-text-tertiary)", fontSize:"13px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:"14px" }}>
              {progData.length === 1 ? "1 session logged — need 2+ for the chart." : `No sessions with ${progEx} yet.`}
            </div>
          )}

          <div style={{ fontSize:"13px", fontWeight:500, color:"var(--color-text-primary)", marginBottom:"8px" }}>Recent sets — {progEx}</div>
          {sessions.filter(s => s.exercises?.some(e => e.name===progEx)).slice(-6).reverse().map(session => {
            const ex = session.exercises.find(e => e.name===progEx);
            const sv = ex.sets.reduce((s,set) => s + (+set.weight>0&&+set.reps>0 ? volLoad(set.weight,set.reps) : 0), 0);
            return (
              <div key={session.id} style={{ ...C.card, padding:"10px 14px", marginBottom:"6px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <span style={{ fontSize:"12px", fontWeight:500, fontFamily:"var(--font-mono)" }}>{session.date}</span>
                  <div style={{ display:"flex", gap:"10px" }}>
                    {sv>0 && <span style={{ fontSize:"10px", color:"var(--color-text-secondary)", fontFamily:"var(--font-mono)" }}>{sv.toLocaleString()} lbs</span>}
                    <span style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>{session.dayType}</span>
                  </div>
                </div>
                {ex.sets.filter(s => s.reps).map((set,i) => {
                  const m = BW_EXERCISES.has(progEx) ? null : (+set.weight>0&&+set.reps>0 ? e1RM(set.weight,set.reps) : null);
                  return (
                    <div key={i} style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"2px", fontFamily:"var(--font-mono)" }}>
                      {i+1}: {BW_EXERCISES.has(progEx) ? `${set.reps} reps` : `${set.weight}lbs × ${set.reps}`}
                      {set.rpe ? ` @ RPE ${set.rpe}` : ""}
                      {m && <span style={{ color:purple }}> → {m}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════
          PHASE + BENCHMARKS
      ════════════════════════════ */}
      {tab === "phase" && (
        <div>
          <div style={C.card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"12px" }}>Training settings</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
              <div>
                <span style={C.label}>Current phase</span>
                <select value={phase.phase} onChange={e => savePhase({ ...phase, phase:+e.target.value })} style={select}>
                  <option value={1}>Phase 1 — Foundation</option>
                  <option value={2}>Phase 2 — Development</option>
                  <option value={3}>Phase 3 — Specialization</option>
                  <option value={4}>Phase 4 — Competition prep</option>
                </select>
              </div>
              <div>
                <span style={C.label}>Bodyweight (lbs)</span>
                <input type="number" value={phase.bodyweight||""} onChange={e => savePhase({ ...phase, bodyweight:+e.target.value })} placeholder="lbs" style={C.input} />
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div>
                <span style={C.label}>Cycle day (optional, 1–35)</span>
                <input type="number" min="1" max="35" value={phase.cycleDay||""} onChange={e => savePhase({ ...phase, cycleDay:+e.target.value })} placeholder="e.g. 8" style={C.input} />
                {cycleInfo && (
                  <div style={{ marginTop:"6px", padding:"6px 10px", background:cycleInfo.color+"22", borderRadius:"var(--border-radius-md)", fontSize:"11px" }}>
                    <span style={{ fontWeight:500 }}>{cycleInfo.label}</span> — {cycleInfo.note}
                  </div>
                )}
              </div>
              <div>
                <span style={C.label}>Deload counter</span>
                <div style={{ display:"flex", gap:"8px", alignItems:"center", marginTop:"4px" }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"20px", fontWeight:500, color: deloadDue?red:deloadSoon?amber:"var(--color-text-primary)" }}>{phase.sessionsSinceDeload}</span>
                  <span style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>/ 12</span>
                  <button onClick={() => savePhase({ ...phase, sessionsSinceDeload:0, lastDeloadDate:today() })} style={{ ...btn(), fontSize:"10px", padding:"3px 8px" }}>reset</button>
                </div>
                {phase.lastDeloadDate && <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", marginTop:"4px" }}>Last deload: {phase.lastDeloadDate}</div>}
              </div>
            </div>
          </div>

          <div style={{ fontSize:"13px", fontWeight:500, color:"var(--color-text-primary)", marginBottom:"10px" }}>Phase 1 benchmarks</div>
          {BENCHMARKS.map(bm => {
            const pr     = prs[bm.lift];
            const bw     = phase.bodyweight;
            const target = bm.mult && bw ? Math.round(bw*bm.mult) : null;
            const metric = pr?.metric || 0;
            const pct    = target ? Math.min(100, Math.round((metric/target)*100))
                         : (bm.lift==="Pull-up"&&pr ? Math.min(100, Math.round((pr.reps/3)*100)) : null);
            const done   = pct !== null && pct >= 100;
            return (
              <div key={bm.lift} style={{ ...C.card, marginBottom:"8px", borderColor:done?"#1D9E75":"var(--color-border-tertiary)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:500 }}>{bm.lift}</div>
                    <div style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>Target: {bm.label}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {pr ? (
                      <div style={{ fontSize:"13px", fontWeight:500, color:done?green:purple, fontFamily:"var(--font-mono)" }}>
                        {pr.isBW ? `${pr.reps} reps` : `${pr.weight}lbs × ${pr.reps}`}{done&&" ✓"}
                      </div>
                    ) : <div style={{ fontSize:"11px", color:"var(--color-text-tertiary)" }}>not yet logged</div>}
                    {target && <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", fontFamily:"var(--font-mono)" }}>target {target} lbs</div>}
                  </div>
                </div>
                {pct !== null ? (
                  <div>
                    <div style={{ height:"5px", background:"var(--color-border-tertiary)", borderRadius:"3px", overflow:"hidden", marginBottom:"3px" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:done?green:purple, borderRadius:"3px", transition:"width 0.6s ease" }} />
                    </div>
                    <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", fontFamily:"var(--font-mono)" }}>{pct}% of target</div>
                  </div>
                ) : (!bw && bm.mult && <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)" }}>Enter bodyweight above to see progress %</div>)}
              </div>
            );
          })}

          <div style={{ fontSize:"13px", fontWeight:500, color:"var(--color-text-primary)", marginBottom:"8px", marginTop:"16px" }}>Session history ({sessions.length})</div>
          {sessions.length === 0 && <div style={{ fontSize:"13px", color:"var(--color-text-tertiary)" }}>No sessions yet.</div>}
          {sessions.slice(-15).reverse().map(session => (
            <div key={session.id} style={{ padding:"8px 0", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"12px", fontWeight:500, fontFamily:"var(--font-mono)" }}>{session.date}</span>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  {session.sessRPE && <span style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>RPE {session.sessRPE}</span>}
                  <span style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>{session.dayType||"—"}</span>
                  <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"10px", background:purpleL, color:purpleD }}>P{session.phase}</span>
                </div>
              </div>
              <div style={{ fontSize:"11px", color:"var(--color-text-tertiary)", marginTop:"1px" }}>
                {session.exercises?.slice(0,5).map(e=>e.name).join(" · ")}{session.exercises?.length>5?` +${session.exercises.length-5}`:""}
              </div>
              {session.notes && <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginTop:"1px", fontStyle:"italic" }}>"{session.notes.slice(0,80)}{session.notes.length>80?"…":""}"</div>}
            </div>
          ))}

          <div style={{ marginTop:"2rem", padding:"12px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px dashed var(--color-border-secondary)" }}>
            <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>Danger zone</div>
            <button onClick={async () => {
              if (window.confirm("Clear ALL session data and PRs? This cannot be undone.")) {
                setSessions([]); setPrs({});
                try { await window.storage.delete("mb_s"); await window.storage.delete("mb_p"); } catch {}
              }
            }} style={{ ...btn("danger"), fontSize:"11px" }}>Clear all data</button>
          </div>
        </div>
      )}
    </div>
  );
}
