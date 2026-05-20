import { useState, useEffect } from "react";

// ─── The five non-negotiables ──────────────────────────────────────────────
const PRACTICES = [
  { key:"wrist",     label:"Wrist prep",         sub:"2 min · joints ready",       time:"2 min" },
  { key:"lsit",      label:"Tuck L-sit attempts", sub:"5 × max hold",              time:"4 min" },
  { key:"handstand", label:"Wall handstand",       sub:"10 kick-up attempts",       time:"3 min" },
  { key:"hamstring", label:"Hamstring stretch",    sub:"3 × 60 sec forward fold",  time:"3 min" },
  { key:"compress",  label:"Compression holds",   sub:"5 × seated leg lift",        time:"2 min" },
];

const today = () => new Date().toISOString().split("T")[0];
const formatDate = d => { const [y,m,dy] = d.split("-"); return `${m}/${dy}/${y.slice(2)}`; };
const daysSince = d => Math.floor((new Date() - new Date(d)) / (1000*60*60*24));

const MILESTONES = [
  { key:"tuck10",   label:"Tuck L-sit 10 sec",    phase:1 },
  { key:"tuck20",   label:"Tuck L-sit 20 sec",    phase:1 },
  { key:"wall10",   label:"Wall HS 10 sec",        phase:1 },
  { key:"wall30",   label:"Wall HS 30 sec",        phase:2 },
  { key:"chest_wall",label:"Chest-to-wall HS",     phase:2 },
  { key:"single_l", label:"Single-leg L-sit",      phase:2 },
  { key:"pike10",   label:"Pike push-up × 10",     phase:2 },
  { key:"full_l",   label:"Full L-sit 5 sec",      phase:3 },
  { key:"full_l10", label:"Full L-sit 10 sec",     phase:3 },
  { key:"freehs",   label:"Freestanding HS 3 sec", phase:3 },
  { key:"freehs10", label:"Freestanding HS 10 sec",phase:4 },
  { key:"tuck_press",label:"Tuck press to HS",     phase:4 },
  { key:"straddle", label:"Straddle press to HS",  phase:4 },
  { key:"press_hs", label:"L-sit press to handstand", phase:5 },
];

export default function App() {
  const [tab,        setTab]     = useState("today");
  const [log,        setLog]     = useState({});
  const [milestones, setMiles]   = useState({});
  const [note,       setNote]    = useState("");
  const [sealing,    setSealing] = useState(null);
  const [loading,    setLoading] = useState(true);
  const [flash,      setFlash]   = useState(null);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("mb_becoming"); if (r) setLog(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("mb_milestones"); if (r) setMiles(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  const todayLog  = log[today()] || {};
  const completed = PRACTICES.filter(p => todayLog[p.key]).length;
  const allDone   = completed === PRACTICES.length;

  // Streak calculation
  const streak = (() => {
    let s = 0, d = new Date();
    while (true) {
      const k = d.toISOString().split("T")[0];
      const dayL = log[k] || {};
      const done = PRACTICES.filter(p => dayL[p.key]).length === PRACTICES.length;
      if (!done) { if (k !== today()) break; d.setDate(d.getDate()-1); s++; continue; }
      s++;
      d.setDate(d.getDate()-1);
      if (s > 365) break;
    }
    return s;
  })();

  const totalDays   = Object.keys(log).filter(k => PRACTICES.filter(p => (log[k]||{})[p.key]).length === PRACTICES.length).length;
  const milesSealed = Object.keys(milestones).length;

  const togglePractice = async (key) => {
    const updated = { ...log, [today()]: { ...(log[today()]||{}), [key]: !(log[today()]||{})[key] } };
    setLog(updated);
    try { await window.storage.set("mb_becoming", JSON.stringify(updated)); } catch {}
    const newComp = PRACTICES.filter(p => (updated[today()]||{})[p.key]).length;
    if (newComp === PRACTICES.length) {
      setFlash("day");
      setTimeout(() => setFlash(null), 4000);
    }
  };

  const sealMilestone = async (key) => {
    const m = { ...milestones, [key]: { date: today(), note: note.trim() } };
    setMiles(m);
    try { await window.storage.set("mb_milestones", JSON.stringify(m)); } catch {}
    setSealing(null);
    setNote("");
    setFlash("milestone");
    setTimeout(() => setFlash(null), 4000);
  };

  // Style tokens
  const K = {
    purple:"#534AB7", purpleL:"#EEEDFE", purpleD:"#26215C",
    green:"#1D9E75",  greenL:"#E1F5EE",
    pink:"#E84B9A",   pinkL:"#FDE8F4",
  };
  const card  = { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"14px", marginBottom:"10px" };
  const inp   = { fontSize:"13px", padding:"6px 10px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", width:"100%" };
  const mkBtn = (v="d") => ({ fontSize:"12px", padding:"6px 12px", borderRadius:"var(--border-radius-md)", border:v==="p"?"none":"0.5px solid var(--color-border-secondary)", background:v==="p"?K.purple:"var(--color-background-secondary)", color:v==="p"?K.purpleL:"var(--color-text-secondary)", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:v==="p"?500:400 });

  const phaseColor = (p) => [K.green, K.green, "#BA7517", K.pink, K.purple][p-1] || K.purple;

  if (loading) return <div style={{ padding:"2rem", fontFamily:"var(--font-mono)", fontSize:"12px", color:"var(--color-text-secondary)" }}>loading...</div>;

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem 0" }}>

      {/* Header */}
      <div style={{ marginBottom:"12px" }}>
        <span style={{ fontSize:"15px", fontWeight:500, letterSpacing:"-0.01em" }}>Becoming</span>
        <span style={{ fontSize:"9px", color:"var(--color-text-secondary)", letterSpacing:"0.1em", marginLeft:"8px", textTransform:"uppercase" }}>the daily record</span>
      </div>

      {/* Flash */}
      {flash === "day" && (
        <div style={{ background:K.purpleL, border:`1px solid ${K.purple}`, borderRadius:"var(--border-radius-md)", padding:"10px 14px", marginBottom:"12px", fontFamily:"var(--font-mono)" }}>
          <div style={{ fontSize:"11px", fontWeight:500, color:K.purpleD, marginBottom:"2px" }}>◉ DAILY RECEIPT — SEALED</div>
          <div style={{ fontSize:"12px", color:K.purple }}>{today()} — All five. You showed up as that person today.</div>
        </div>
      )}
      {flash === "milestone" && (
        <div style={{ background:K.pinkL, border:`1px solid ${K.pink}`, borderRadius:"var(--border-radius-md)", padding:"10px 14px", marginBottom:"12px", fontFamily:"var(--font-mono)" }}>
          <div style={{ fontSize:"11px", fontWeight:500, color:"#4B1528", marginBottom:"2px" }}>◉ MILESTONE RECEIPT — SEALED</div>
          <div style={{ fontSize:"12px", color:K.pink }}>This is now part of the record. It counts whether or not anyone saw it.</div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginBottom:"14px" }}>
        {[
          { label:"Current streak", value:streak, sub:streak===1?"day":"days", color:streak>=7?K.green:streak>=3?"#BA7517":K.purple },
          { label:"Total days",     value:totalDays, sub:"full practice days", color:K.purple },
          { label:"Sealed milestones", value:milesSealed, sub:`of ${MILESTONES.length}`, color:K.pink },
        ].map(s => (
          <div key={s.label} style={{ padding:"10px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", textAlign:"center" }}>
            <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"3px" }}>{s.label}</div>
            <div style={{ fontSize:"22px", fontWeight:500, color:s.color, fontFamily:"var(--font-mono)", lineHeight:1.1 }}>{s.value}</div>
            <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", marginTop:"2px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"0.5px solid var(--color-border-tertiary)", marginBottom:"1.25rem" }}>
        {[["today","Today"],["vault","Receipt vault"],["milestones","Skill milestones"],["calendar","Record"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ fontSize:"12px", padding:"7px 10px", border:"none", background:"transparent", color:tab===id?"var(--color-text-primary)":"var(--color-text-secondary)", borderBottom:`2px solid ${tab===id?K.purple:"transparent"}`, fontWeight:tab===id?500:400, cursor:"pointer", fontFamily:"var(--font-sans)", whiteSpace:"nowrap" }}>{label}</button>
        ))}
      </div>

      {/* ────────────────
          TODAY
      ──────────────── */}
      {tab === "today" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <div>
              <div style={{ fontSize:"13px", fontWeight:500 }}>Daily practice — {today()}</div>
              <div style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>12 min. The work that isn't visible yet.</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"18px", fontWeight:500, color:allDone?K.green:K.purple, fontFamily:"var(--font-mono)" }}>{completed}/{PRACTICES.length}</div>
              <div style={{ fontSize:"9px", color:"var(--color-text-secondary)" }}>{allDone?"Today sealed":"in progress"}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height:"5px", background:"var(--color-border-tertiary)", borderRadius:"3px", marginBottom:"12px", overflow:"hidden" }}>
            <div style={{ width:`${(completed/PRACTICES.length)*100}%`, height:"100%", background:allDone?K.green:K.purple, borderRadius:"3px", transition:"width 0.4s ease" }} />
          </div>

          {/* Practice items */}
          {PRACTICES.map(p => {
            const done = !!(todayLog[p.key]);
            return (
              <div key={p.key} onClick={() => togglePractice(p.key)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", background:done?"var(--color-background-secondary)":"var(--color-background-primary)", border:`0.5px solid ${done?K.purple:"var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", marginBottom:"7px", cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"50%", border:`1.5px solid ${done?K.purple:"var(--color-border-secondary)"}`, background:done?K.purple:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                  {done && <span style={{ color:"white", fontSize:"11px", fontWeight:500 }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:done?500:400, color:"var(--color-text-primary)", textDecoration:done?"none":"none" }}>{p.label}</div>
                  <div style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>{p.sub}</div>
                </div>
                <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", fontFamily:"var(--font-mono)" }}>{p.time}</div>
              </div>
            );
          })}

          {allDone && (
            <div style={{ marginTop:"12px", padding:"12px 14px", background:K.purpleL, borderRadius:"var(--border-radius-lg)", textAlign:"center" }}>
              <div style={{ fontSize:"13px", fontWeight:500, color:K.purpleD, marginBottom:"4px" }}>Today is sealed.</div>
              <div style={{ fontSize:"11px", color:K.purple }}>This is what becoming looks like. It doesn't feel dramatic. It never does.</div>
            </div>
          )}

          {!allDone && completed === 0 && (
            <div style={{ marginTop:"4px", padding:"10px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)" }}>
              <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", lineHeight:"1.5" }}>
                The person who can press to handstand does this every day — not when they feel like it, not when they have energy, every day. That's the only thing that distinguishes that person from anyone else. Tap each practice as you complete it.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────
          RECEIPT VAULT
      ──────────────── */}
      {tab === "vault" && (
        <div>
          <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"12px", fontFamily:"var(--font-mono)" }}>
            {totalDays} full days sealed · {streak} day streak
          </div>
          {totalDays === 0 && (
            <div style={{ textAlign:"center", padding:"3rem 1rem", color:"var(--color-text-tertiary)", fontSize:"13px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)" }}>
              Complete all five practices today to generate your first receipt.
            </div>
          )}
          {Object.entries(log)
            .filter(([_, v]) => PRACTICES.filter(p => v[p.key]).length === PRACTICES.length)
            .sort((a,b) => b[0].localeCompare(a[0]))
            .slice(0,30)
            .map(([date]) => (
              <div key={date} style={{ background:"var(--color-background-secondary)", border:"0.5px dashed var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", padding:"10px 14px", marginBottom:"6px", fontFamily:"var(--font-mono)" }}>
                <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"4px" }}>◉ DAILY RECEIPT</div>
                <div style={{ fontSize:"14px", fontWeight:500, color:"var(--color-text-primary)" }}>{formatDate(date)}</div>
                <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", marginTop:"2px" }}>All five. You showed up as that person.</div>
                <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", marginTop:"2px" }}>{daysSince(date)} days ago</div>
              </div>
            ))}
        </div>
      )}

      {/* ────────────────
          SKILL MILESTONES
      ──────────────── */}
      {tab === "milestones" && (
        <div>
          <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"14px" }}>
            Seal a milestone when you hit it. These are the receipts that prove you became that person.
          </div>
          {MILESTONES.map(m => {
            const sealed = milestones[m.key];
            const col    = phaseColor(m.phase);
            return (
              <div key={m.key} style={{ ...card, borderColor:sealed?col:"var(--color-border-tertiary)", marginBottom:"7px", padding:"10px 14px" }}>
                {sealing === m.key ? (
                  <div>
                    <div style={{ fontSize:"12px", fontWeight:500, marginBottom:"8px" }}>Sealing: {m.label}</div>
                    <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note (time, date, how it felt)..." style={{ ...inp, marginBottom:"8px" }} />
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => sealMilestone(m.key)} style={{ ...mkBtn("p"), flex:1 }}>Seal this receipt ✓</button>
                      <button onClick={() => setSealing(null)} style={mkBtn()}>cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:"12px", fontWeight:sealed?500:400, color:"var(--color-text-primary)" }}>{m.label}</div>
                      {sealed ? (
                        <div style={{ fontFamily:"var(--font-mono)", fontSize:"10px", color:col, marginTop:"2px" }}>
                          Sealed {formatDate(sealed.date)}{sealed.note ? ` — ${sealed.note}` : ""}
                        </div>
                      ) : (
                        <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", marginTop:"1px" }}>Phase {m.phase} · not yet sealed</div>
                      )}
                    </div>
                    {sealed ? (
                      <span style={{ fontSize:"12px", color:col }}>✓</span>
                    ) : (
                      <button onClick={()=>setSealing(m.key)} style={{ ...mkBtn(), fontSize:"11px", padding:"4px 10px" }}>seal ↗</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────
          RECORD (Calendar view)
      ──────────────── */}
      {tab === "calendar" && (
        <div>
          <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"14px" }}>
            Last 60 days. Each square is a day. Filled = all five completed.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(10,1fr)", gap:"5px", marginBottom:"16px" }}>
            {Array.from({length:60}).map((_,i) => {
              const d = new Date(); d.setDate(d.getDate()-(59-i));
              const k = d.toISOString().split("T")[0];
              const dayL = log[k] || {};
              const comp = PRACTICES.filter(p => dayL[p.key]).length;
              const isToday = k === today();
              return (
                <div key={k} title={k} style={{ aspectRatio:"1", borderRadius:"4px", background: comp===5?K.purple : comp>0?K.purple+"44":"var(--color-background-secondary)", border:isToday?`1.5px solid ${K.purple}`:"0.5px solid var(--color-border-tertiary)", position:"relative" }}>
                  {isToday && <div style={{ position:"absolute", top:-8, left:"50%", transform:"translateX(-50%)", fontSize:"8px", color:K.purple, whiteSpace:"nowrap", fontFamily:"var(--font-mono)" }}>today</div>}
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
            {[["All five completed",K.purple],["Partial",K.purple+"44"],["None","var(--color-background-secondary)"]].map(([l,c])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                <div style={{ width:"10px", height:"10px", borderRadius:"2px", background:c, border:"0.5px solid var(--color-border-tertiary)" }} />
                <span style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Identity reflection card */}
          <div style={{ padding:"14px 16px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", border:"0.5px solid var(--color-border-secondary)" }}>
            <div style={{ fontSize:"12px", fontWeight:500, marginBottom:"8px" }}>What this record says</div>
            <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", lineHeight:"1.7" }}>
              {totalDays === 0 && "The record is empty. That's fine — it starts today. The first square is the hardest one."}
              {totalDays >= 1 && totalDays < 7 && `${totalDays} full days. The record has started. Don't break it today.`}
              {totalDays >= 7 && totalDays < 30 && `${totalDays} full days. The pattern is real. You've shown up as that person ${totalDays} times.`}
              {totalDays >= 30 && totalDays < 90 && `${totalDays} full days. A month of becoming. The neural patterns are being built. The skill is coming before you can feel it.`}
              {totalDays >= 90 && `${totalDays} full days. This is who you are now. The record doesn't lie.`}
            </div>
          </div>

          {/* Clear option */}
          <div style={{ marginTop:"2rem", padding:"10px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px dashed var(--color-border-secondary)" }}>
            <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"6px" }}>Danger zone</div>
            <button onClick={async() => { if(window.confirm("Clear all practice data?")){ setLog({}); try{await window.storage.delete("mb_becoming");}catch{} }}} style={{ ...mkBtn("d"), fontSize:"11px", color:"#993C1D", borderColor:"#993C1D" }}>Clear all records</button>
          </div>
        </div>
      )}
    </div>
  );
}
