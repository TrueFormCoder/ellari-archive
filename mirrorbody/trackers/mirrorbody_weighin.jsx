import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────
const CYCLE_PHASES = [
  { key:"menstruation", name:"Menstruation", range:[1,7],   color:"#F09595", note:"Water retention dropping. Weight often falls mid-phase." },
  { key:"follicular",   name:"Follicular",   range:[8,14],  color:"#9FE1CB", note:"Typically lowest weight of cycle. Most reliable reading." },
  { key:"ovulation",    name:"Ovulation",    range:[15,21], color:"#FAC775", note:"Slight rise possible. Still a good reading window." },
  { key:"luteal",       name:"Luteal",       range:[22,35], color:"#AFA9EC", note:"Water retention peaks. Expect 1–4 lbs above follicular. NOT fat gain." },
];

const FREQUENCIES = [
  { days:4, label:"Every 4 days" },
  { days:5, label:"Every 5 days" },
  { days:7, label:"Weekly (recommended)" },
];

const CONDITIONS = [
  "First thing on waking",
  "Post-bathroom",
  "Pre-food and water",
  "Same scale, same floor",
];

const isoDate = (d = new Date()) => d.toISOString().split("T")[0];
const addDays  = (dateStr, n) => { const d = new Date(dateStr); d.setDate(d.getDate()+n); return isoDate(d); };
const daysBetween = (a, b) => Math.round((new Date(b)-new Date(a))/(1000*60*60*24));

const getCyclePhase = (cycleDay) => {
  if (!cycleDay) return null;
  return CYCLE_PHASES.find(c => +cycleDay >= c.range[0] && +cycleDay <= c.range[1]) || null;
};

const calcCycleDay = (periodStart) => {
  if (!periodStart) return null;
  const days = daysBetween(periodStart, isoDate()) + 1;
  return Math.max(1, Math.min(35, days));
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [checkins, setCheckins] = useState([]);
  const [config, setConfig]     = useState({
    frequency: 7,
    baseline: "",
    periodStart: "",
    goal: "",
  });
  const [loading, setLoading]   = useState(true);

  // New check-in form
  const [form, setForm] = useState({
    date: isoDate(),
    weight: "",
    cycleDay: "",
    conditions: [],
    notes: "",
  });
  const [condChecked, setCondChecked] = useState([false, false, false, false]);
  const [showForm, setShowForm]       = useState(false);
  const [saved, setSaved]             = useState(false);

  // ── Load ──
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("mb_weighins"); if (r) setCheckins(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("mb_weighcfg"); if (r) setConfig(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  // Auto-fill cycle day from period start
  useEffect(() => {
    const cd = calcCycleDay(config.periodStart);
    if (cd) setForm(f => ({ ...f, cycleDay: String(cd) }));
  }, [config.periodStart]);

  const saveConfig = async (c) => {
    setConfig(c);
    try { await window.storage.set("mb_weighcfg", JSON.stringify(c)); } catch {}
  };

  const saveCheckin = async () => {
    if (!form.weight) return;
    const entry = {
      id: Date.now(),
      date: form.date,
      weight: +form.weight,
      cycleDay: form.cycleDay ? +form.cycleDay : null,
      cyclePhase: form.cycleDay ? getCyclePhase(+form.cycleDay)?.key || null : null,
      conditions: condChecked,
      notes: form.notes,
      allConditionsMet: condChecked.every(Boolean),
    };
    const next = [...checkins.filter(c => c.date !== form.date), entry]
      .sort((a,b) => a.date.localeCompare(b.date));
    setCheckins(next);
    try { await window.storage.set("mb_weighins", JSON.stringify(next)); } catch {}
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setCondChecked([false,false,false,false]);
    setForm(f => ({ ...f, weight:"", notes:"" }));
  };

  const removeCheckin = async (id) => {
    const next = checkins.filter(c => c.id !== id);
    setCheckins(next);
    try { await window.storage.set("mb_weighins", JSON.stringify(next)); } catch {}
  };

  // ── Derived ──
  const latestCheckin  = checkins[checkins.length - 1];
  const firstCheckin   = checkins[0];
  const nextDate       = latestCheckin ? addDays(latestCheckin.date, config.frequency) : null;
  const daysUntilNext  = nextDate ? daysBetween(isoDate(), nextDate) : null;
  const totalChange    = (latestCheckin && firstCheckin) ? (latestCheckin.weight - firstCheckin.weight).toFixed(1) : null;
  const currentCycleDay = calcCycleDay(config.periodStart);
  const currentPhase   = currentCycleDay ? getCyclePhase(currentCycleDay) : null;

  // Phase-normalized trend: adjust each reading by phase offset
  // Follicular = baseline (day 8-14). Luteal adds ~2lbs typically.
  const PHASE_OFFSET = { menstruation:1, follicular:0, ovulation:0.5, luteal:2 };

  // Chart data
  const chartData = useMemo(() => checkins.map(c => {
    const phase = CYCLE_PHASES.find(p => p.key === c.cyclePhase);
    const offset = PHASE_OFFSET[c.cyclePhase] || 0;
    return {
      date: c.date.slice(5),
      weight: c.weight,
      normalized: c.cyclePhase ? Math.round((c.weight - offset) * 10) / 10 : null,
      phase: c.cyclePhase,
      phaseColor: phase?.color || "#B4B2A9",
      allConditions: c.allConditionsMet,
    };
  }), [checkins]);

  // Phase-grouped stats
  const phaseStats = useMemo(() => {
    const groups = {};
    CYCLE_PHASES.forEach(p => {
      const readings = checkins.filter(c => c.cyclePhase === p.key);
      if (readings.length) {
        const avg = readings.reduce((s,c) => s+c.weight, 0) / readings.length;
        groups[p.key] = { count: readings.length, avg: +avg.toFixed(1) };
      }
    });
    return groups;
  }, [checkins]);

  const follicularAvg = phaseStats.follicular?.avg;
  const lutealAvg     = phaseStats.luteal?.avg;
  const phaseGap      = follicularAvg && lutealAvg ? (lutealAvg - follicularAvg).toFixed(1) : null;

  // Colors / style tokens
  const purple = "#534AB7", purpleL = "#EEEDFE", purpleD = "#26215C";
  const green  = "#1D9E75", greenL  = "#E1F5EE";
  const amber  = "#BA7517", amberL  = "#FAEEDA";
  const red    = "#993C1D", redL    = "#FAECE7";

  const card = { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"14px", marginBottom:"10px" };
  const inp  = { fontSize:"13px", padding:"6px 10px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", width:"100%" };
  const lbl  = { fontSize:"10px", color:"var(--color-text-secondary)", display:"block", marginBottom:"4px", letterSpacing:"0.04em", textTransform:"uppercase" };
  const mkBtn = (v="d") => ({ fontSize:"12px", padding:"6px 12px", borderRadius:"var(--border-radius-md)", border:v==="p"?"none":"0.5px solid var(--color-border-secondary)", background:v==="p"?purple:v==="ghost"?"transparent":"var(--color-background-secondary)", color:v==="p"?purpleL:v==="x"?red:"var(--color-text-secondary)", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:v==="p"?500:400 });

  // Custom dot for chart — colored by cycle phase
  const CycleDot = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const isContaminated = !payload.allConditions;
    return (
      <circle cx={cx} cy={cy} r={isContaminated ? 4 : 6}
        fill={payload.phaseColor}
        stroke={isContaminated ? "#E24B4A" : "var(--color-background-primary)"}
        strokeWidth={2}
        opacity={isContaminated ? 0.5 : 1}
      />
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const phase = CYCLE_PHASES.find(p => p.key === d?.phase);
    return (
      <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:"8px", padding:"10px 12px", fontSize:"11px", fontFamily:"var(--font-mono)" }}>
        <div style={{ fontWeight:500, marginBottom:"3px" }}>{d?.date} — {d?.weight} lbs</div>
        {phase && <div style={{ color:phase.color, marginBottom:"2px" }}>Cycle: {phase.name}</div>}
        {d?.normalized && <div style={{ color:"var(--color-text-secondary)" }}>Normalized: {d.normalized} lbs</div>}
        {!d?.allConditions && <div style={{ color:red, marginTop:"3px" }}>⚠ Conditions not all met</div>}
      </div>
    );
  };

  if (loading) return <div style={{ padding:"2rem", fontSize:"12px", color:"var(--color-text-secondary)", fontFamily:"var(--font-mono)" }}>loading...</div>;

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem 0" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"1rem", flexWrap:"wrap" }}>
        <div>
          <span style={{ fontSize:"15px", fontWeight:500, color:"var(--color-text-primary)", letterSpacing:"-0.01em" }}>Weigh-In Vault</span>
          <span style={{ fontSize:"9px", color:"var(--color-text-secondary)", letterSpacing:"0.1em", marginLeft:"8px", textTransform:"uppercase" }}>cycle-aware · weekly protocol</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {currentPhase && (
            <span style={{ fontSize:"11px", padding:"2px 10px", borderRadius:"20px", background:currentPhase.color+"33", color:"var(--color-text-primary)", fontWeight:500 }}>
              {currentPhase.name} · Day {currentCycleDay}
            </span>
          )}
          {daysUntilNext !== null && (
            <span style={{ fontSize:"11px", padding:"2px 10px", borderRadius:"20px", background:daysUntilNext<=0?greenL:daysUntilNext===1?amberL:"var(--color-background-secondary)", color:daysUntilNext<=0?green:daysUntilNext===1?amber:"var(--color-text-secondary)", fontWeight:500 }}>
              {daysUntilNext<=0 ? "Weigh-in today ✓" : daysUntilNext===1 ? "Weigh-in tomorrow" : `Next weigh-in in ${daysUntilNext}d`}
            </span>
          )}
          {!checkins.length && <span style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>No check-ins yet</span>}
        </div>
      </div>

      {/* ── Save flash ── */}
      {saved && (
        <div style={{ background:greenL, border:`0.5px solid ${green}`, borderRadius:"var(--border-radius-md)", padding:"8px 14px", marginBottom:"10px", fontSize:"12px", color:green, fontFamily:"var(--font-mono)" }}>
          weigh-in logged ✓
        </div>
      )}

      {/* ── Summary stats ── */}
      {checkins.length >= 2 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"12px" }}>
          {[
            { label:"Latest",       value:`${latestCheckin.weight} lbs`,   sub: latestCheckin.date.slice(5), color:purple },
            { label:"Total change", value:`${totalChange>0?"+":""}${totalChange} lbs`, sub:`over ${checkins.length} check-ins`, color:+totalChange<0?green:+totalChange>0?red:purple },
            { label:"Check-ins",    value:checkins.length, sub:`every ${config.frequency} days`, color:"var(--color-text-primary)" },
            { label:"Cycle gap",    value:phaseGap?`${phaseGap} lbs`:"—", sub:"luteal vs follicular", color:"var(--color-text-secondary)" },
          ].map(s => (
            <div key={s.label} style={{ padding:"10px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)" }}>
              <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"3px" }}>{s.label}</div>
              <div style={{ fontSize:"17px", fontWeight:500, color:s.color, fontFamily:"var(--font-mono)", lineHeight:1.2 }}>{s.value}</div>
              <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", marginTop:"2px" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart ── */}
      {chartData.length >= 2 && (
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
            <div>
              <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"2px" }}>Weight trend — colored by cycle phase</div>
              <div style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>Each dot = one weigh-in · color = cycle phase · ⊗ = conditions incomplete</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top:10, right:10, left:-20, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="date" tick={{ fontSize:10, fill:"var(--color-text-secondary)" }} />
              <YAxis tick={{ fontSize:10, fill:"var(--color-text-secondary)" }} domain={["auto","auto"]} />
              <Tooltip content={<CustomTooltip />} />
              {follicularAvg && <ReferenceLine y={follicularAvg} stroke={green} strokeDasharray="4 3" strokeWidth={1} label={{ value:"follicular avg", position:"insideTopRight", fontSize:9, fill:green }} />}
              {lutealAvg     && <ReferenceLine y={lutealAvg}     stroke="#AFA9EC" strokeDasharray="4 3" strokeWidth={1} label={{ value:"luteal avg",     position:"insideBottomRight", fontSize:9, fill:"#534AB7" }} />}
              <Line type="monotone" dataKey="weight" stroke="var(--color-border-secondary)" strokeWidth={1.5} dot={<CycleDot />} activeDot={false} connectNulls />
              {chartData.some(d => d.normalized) && (
                <Line type="monotone" dataKey="normalized" stroke={purple} strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls name="Normalized" />
              )}
            </LineChart>
          </ResponsiveContainer>

          {/* Phase legend */}
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginTop:"8px" }}>
            {CYCLE_PHASES.map(p => {
              const stat = phaseStats[p.key];
              return (
                <div key={p.key} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:p.color }} />
                  <span style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>
                    {p.name.split(" ")[0]}{stat ? ` (avg ${stat.avg} lbs)` : ""}
                  </span>
                </div>
              );
            })}
            {chartData.some(d => d.normalized) && (
              <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                <div style={{ width:"12px", height:"1px", background:purple, borderTop:`2px dashed ${purple}` }} />
                <span style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>Normalized (−luteal offset)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cycle phase context ── */}
      {currentPhase && (
        <div style={{ padding:"12px 14px", background:currentPhase.color+"22", border:`0.5px solid ${currentPhase.color}`, borderRadius:"var(--border-radius-lg)", marginBottom:"10px" }}>
          <div style={{ fontSize:"12px", fontWeight:500, marginBottom:"4px" }}>
            {currentPhase.name} — Day {currentCycleDay}
          </div>
          <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"6px" }}>{currentPhase.note}</div>
          {phaseGap && currentPhase.key === "luteal" && (
            <div style={{ fontSize:"11px", color:purple, background:purpleL, padding:"5px 10px", borderRadius:"var(--border-radius-md)" }}>
              Your cycle gap is ~{phaseGap} lbs. Any reading in this phase is expected to be ~{phaseGap} lbs above your follicular average ({follicularAvg} lbs). This is water, not fat.
            </div>
          )}
          {currentPhase.key === "follicular" && (
            <div style={{ fontSize:"11px", color:green, background:greenL, padding:"5px 10px", borderRadius:"var(--border-radius-md)" }}>
              Best weigh-in window of the cycle. Most reliable reading.
            </div>
          )}
        </div>
      )}

      {/* ── New check-in ── */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ ...mkBtn("p"), width:"100%", padding:"11px", fontSize:"13px", marginBottom:"10px" }}>
          {daysUntilNext <= 0 || !checkins.length ? "+ Log weigh-in" : `+ Log weigh-in (${daysUntilNext}d early)`}
        </button>
      ) : (
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <span style={{ fontSize:"13px", fontWeight:500 }}>Log weigh-in</span>
            <button onClick={() => setShowForm(false)} style={mkBtn()}>cancel</button>
          </div>

          {/* Conditions checklist */}
          <div style={{ padding:"10px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:"12px" }}>
            <div style={{ fontSize:"11px", fontWeight:500, marginBottom:"8px" }}>Protocol conditions</div>
            {CONDITIONS.map((c,i) => (
              <label key={i} style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", marginBottom:"6px" }}>
                <input type="checkbox" checked={condChecked[i]} onChange={e => setCondChecked(p => p.map((v,j) => j===i?e.target.checked:v))} style={{ width:"14px", height:"14px", cursor:"pointer" }} />
                <span style={{ fontSize:"12px", color:condChecked[i]?"var(--color-text-primary)":"var(--color-text-secondary)" }}>{c}</span>
              </label>
            ))}
            <div style={{ fontSize:"10px", color: condChecked.every(Boolean)?green:amber, marginTop:"4px" }}>
              {condChecked.every(Boolean) ? "All conditions met ✓ — this reading is reliable." : `${condChecked.filter(Boolean).length}/4 met — reading still logged but flagged on chart.`}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
            <div>
              <span style={lbl}>Date</span>
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} style={inp} />
            </div>
            <div>
              <span style={lbl}>Weight (lbs)</span>
              <input type="number" value={form.weight} onChange={e => setForm(f=>({...f,weight:e.target.value}))} placeholder="lbs" step="0.1" style={{ ...inp, fontFamily:"var(--font-mono)", textAlign:"center" }} autoFocus />
            </div>
            <div>
              <span style={lbl}>Cycle day</span>
              <input type="number" min="1" max="35" value={form.cycleDay} onChange={e => setForm(f=>({...f,cycleDay:e.target.value}))} placeholder="auto" style={{ ...inp, fontFamily:"var(--font-mono)", textAlign:"center" }} />
              {form.cycleDay && (() => { const p = getCyclePhase(+form.cycleDay); return p ? <div style={{ fontSize:"9px", color:p.color, marginTop:"3px" }}>{p.name}</div> : null; })()}
            </div>
          </div>

          <div style={{ marginBottom:"10px" }}>
            <span style={lbl}>Notes (optional)</span>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. travel yesterday, heavy dinner, felt bloated…" style={inp} />
          </div>

          <button onClick={saveCheckin} disabled={!form.weight} style={{ ...mkBtn("p"), width:"100%", padding:"11px", fontSize:"13px", opacity:form.weight?1:0.5 }}>
            Seal weigh-in ✓
          </button>
        </div>
      )}

      {/* ── Phase-grouped stats ── */}
      {checkins.length >= 4 && Object.keys(phaseStats).length >= 2 && (
        <div style={card}>
          <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>Your cycle pattern</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px", marginBottom:"12px" }}>
            {CYCLE_PHASES.filter(p => phaseStats[p.key]).map(p => {
              const stat = phaseStats[p.key];
              const diff = follicularAvg ? (stat.avg - follicularAvg).toFixed(1) : null;
              return (
                <div key={p.key} style={{ padding:"10px 12px", background:p.color+"22", borderRadius:"var(--border-radius-md)", border:`0.5px solid ${p.color}55` }}>
                  <div style={{ fontSize:"11px", fontWeight:500, color:"var(--color-text-primary)", marginBottom:"3px" }}>{p.name}</div>
                  <div style={{ fontSize:"18px", fontWeight:500, fontFamily:"var(--font-mono)", color:"var(--color-text-primary)" }}>{stat.avg} lbs</div>
                  <div style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>avg · {stat.count} reading{stat.count>1?"s":""}</div>
                  {diff !== null && p.key !== "follicular" && (
                    <div style={{ fontSize:"10px", marginTop:"3px", color:+diff>0?purple:green }}>
                      {+diff>0?"+":""}{diff} vs follicular {+diff>0?"(water retention)":""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {phaseGap && (
            <div style={{ padding:"10px 12px", background:purpleL, borderRadius:"var(--border-radius-md)" }}>
              <div style={{ fontSize:"12px", fontWeight:500, color:purpleD, marginBottom:"3px" }}>Your personal cycle gap: {phaseGap} lbs</div>
              <div style={{ fontSize:"11px", color:purple }}>
                Your luteal readings run {phaseGap} lbs above follicular on average. When you see a reading that high, it's predictable water retention — not a trend change. Don't adjust nutrition or panic. Wait for your follicular window.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Check-in history ── */}
      {checkins.length > 0 && (
        <div style={card}>
          <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>Check-in history</div>
          {checkins.slice().reverse().map((c, i, arr) => {
            const phase = CYCLE_PHASES.find(p => p.key === c.cyclePhase);
            const prev  = arr[i+1];
            const delta = prev ? (c.weight - prev.weight).toFixed(1) : null;
            return (
              <div key={c.id} style={{ display:"flex", gap:"10px", padding:"8px 0", borderBottom:"0.5px solid var(--color-border-tertiary)", alignItems:"flex-start" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:phase?.color||"var(--color-border-secondary)", marginTop:"5px", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"12px", fontWeight:500, fontFamily:"var(--font-mono)" }}>{c.weight} lbs</span>
                    <span style={{ fontSize:"10px", color:"var(--color-text-secondary)", fontFamily:"var(--font-mono)" }}>{c.date.slice(5)}</span>
                    {phase && <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:"10px", background:phase.color+"33", color:"var(--color-text-primary)" }}>{phase.name}</span>}
                    {delta !== null && <span style={{ fontSize:"10px", color:+delta<0?green:+delta>0?red:"var(--color-text-secondary)", fontFamily:"var(--font-mono)" }}>{+delta>0?"+":""}{delta}</span>}
                    {!c.allConditionsMet && <span style={{ fontSize:"10px", color:amber }}>⚠ incomplete conditions</span>}
                  </div>
                  {c.notes && <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginTop:"2px", fontStyle:"italic" }}>{c.notes}</div>}
                </div>
                <button onClick={()=>removeCheckin(c.id)} style={{ fontSize:"11px", color:"var(--color-text-tertiary)", background:"transparent", border:"none", cursor:"pointer" }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Configuration ── */}
      <div style={card}>
        <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"12px" }}>Configuration</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
          <div>
            <span style={lbl}>Check-in frequency</span>
            <div style={{ display:"flex", gap:"6px" }}>
              {FREQUENCIES.map(f => (
                <button key={f.days} onClick={()=>saveConfig({...config,frequency:f.days})} style={{ flex:1, padding:"5px 4px", border:`1px solid ${config.frequency===f.days?purple:"var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background:config.frequency===f.days?purpleL:"transparent", cursor:"pointer", fontSize:"10px", color:config.frequency===f.days?purpleD:"var(--color-text-secondary)", fontWeight:config.frequency===f.days?500:400 }}>
                  Every<br/>{f.days}d
                </button>
              ))}
            </div>
          </div>
          <div>
            <span style={lbl}>Baseline / goal weight</span>
            <input type="number" value={config.baseline||""} onChange={e=>saveConfig({...config,baseline:e.target.value})} placeholder="lbs" step="0.1" style={inp} />
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          <div>
            <span style={lbl}>Last period start date</span>
            <input type="date" value={config.periodStart||""} onChange={e=>saveConfig({...config,periodStart:e.target.value})} style={inp} />
            {config.periodStart && <div style={{ fontSize:"9px", color:"var(--color-text-secondary)", marginTop:"3px" }}>Current cycle day: {calcCycleDay(config.periodStart)}</div>}
          </div>
          <div>
            <span style={lbl}>Weigh-in day of week</span>
            <select value={config.weekday||"Monday"} onChange={e=>saveConfig({...config,weekday:e.target.value})} style={{ ...inp, cursor:"pointer" }}>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Protocol reference ── */}
      <div style={{ padding:"12px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", border:"0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ fontSize:"11px", fontWeight:500, color:"var(--color-text-primary)", marginBottom:"8px" }}>Protocol — every check-in, no exceptions</div>
        {CONDITIONS.map((c,i) => (
          <div key={i} style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"4px", display:"flex", gap:"6px", alignItems:"flex-start" }}>
            <span style={{ color:green, flexShrink:0 }}>✓</span>{c}
          </div>
        ))}
        <div style={{ marginTop:"8px", fontSize:"11px", color:"var(--color-text-secondary)", borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:"8px" }}>
          If any condition is missed: log it anyway with a note. It's marked on the chart but not discarded. Pattern still emerges.
        </div>
      </div>

    </div>
  );
}
