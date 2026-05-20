import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Constants ──────────────────────────────────────────────────────────────
const WATER_GOAL_OZ = 96;

const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack","Pre-workout","Post-workout"];

const PROTEIN_TIERS = [
  { key:"none", label:"None",   g:0,  color:"#B4B2A9" },
  { key:"low",  label:"~10g",   g:10, color:"#FAC775" },
  { key:"med",  label:"~25g",   g:25, color:"#9FE1CB" },
  { key:"high", label:"~40g",   g:40, color:"#1D9E75" },
];

const MOOD_SLOTS = [
  { key:"morning",   icon:"☀️", label:"Morning",   window:"6am – 12pm" },
  { key:"afternoon", icon:"🌤",  label:"Afternoon", window:"12pm – 6pm" },
  { key:"evening",   icon:"🌙", label:"Evening",   window:"6pm – midnight" },
];

const SCALE_5 = [
  { v:1, mood:"Low",   energy:"Drained", c:"#F09595" },
  { v:2, mood:"Meh",   energy:"Low",     c:"#FAC775" },
  { v:3, mood:"OK",    energy:"Steady",  c:"#B4B2A9" },
  { v:4, mood:"Good",  energy:"High",    c:"#9FE1CB" },
  { v:5, mood:"Great", energy:"Peak",    c:"#1D9E75" },
];

const MEASURES = [
  { key:"waist",      label:"Waist",       star:true  },
  { key:"hips",       label:"Hips",        star:true  },
  { key:"glutes",     label:"Glutes",      star:true  },
  { key:"chest",      label:"Chest",       star:false },
  { key:"leftArm",    label:"L arm",       star:false },
  { key:"rightArm",   label:"R arm",       star:false },
  { key:"leftThigh",  label:"L thigh",     star:false },
  { key:"rightThigh", label:"R thigh",     star:false },
  { key:"neck",       label:"Neck",        star:false },
];

const CYCLE_PHASES = [
  { r:[1,7],   name:"Menstruation",  tip:"Lower volume. Rest more.", bg:"#FAECE7", tx:"#712B13" },
  { r:[8,14],  name:"Follicular 🔥", tip:"Peak window — PR attempts today.", bg:"#E1F5EE", tx:"#085041" },
  { r:[15,21], name:"Ovulation",     tip:"High intensity. Estrogen is high.", bg:"#FAEEDA", tx:"#633806" },
  { r:[22,35], name:"Luteal",        tip:"Volume down. Fatigue is real.", bg:"#EEEDFE", tx:"#3C3489" },
];

const isoDate   = (d = new Date()) => d.toISOString().split("T")[0];
const nowTime   = () => new Date().toTimeString().slice(0,5);
const sleepDuration = (bed, wake) => {
  if (!bed || !wake) return null;
  const [bh,bm] = bed.split(":").map(Number);
  const [wh,wm] = wake.split(":").map(Number);
  let m = (wh*60+wm) - (bh*60+bm);
  if (m < 0) m += 1440;
  return +(m/60).toFixed(1);
};
const blankDay = date => ({
  date, weight:"", water:0, meals:[],
  sleep:{ bedtime:"", wakeTime:"", quality:null, notes:"" },
  moods:{ morning:null, afternoon:null, evening:null },
  measurements:{},
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,    setTab]    = useState("today");
  const [date,   setDate]   = useState(isoDate());
  const [days,   setDaysRaw]= useState({});
  const [phase,  setPhaseRaw]=useState({ phase:1, bodyweight:null, cycleDay:null });
  const [sessions,setSess]  = useState([]);
  const [loading,setLoading]= useState(true);

  // Meal form
  const [mealForm, setMealForm] = useState({ type:"Breakfast", desc:"", protein:"none", time:nowTime() });
  // Measurements editing
  const [editM, setEditM]   = useState(false);
  const [mDraft, setMDraft] = useState({});
  // Trend metric
  const [trendM, setTrendM] = useState("weight");

  // ── Load ──
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("mb_days"); if (r) setDaysRaw(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("mb_ph");   if (r) setPhaseRaw(JSON.parse(r.value)); } catch {}
      try { const r = await window.storage.get("mb_s");    if (r) setSess(JSON.parse(r.value)); } catch {}
      setLoading(false);
    })();
  }, []);

  const today = days[date] || blankDay(date);

  const persist = async (updated) => {
    const next = { ...days, [date]: { ...today, ...updated } };
    setDaysRaw(next);
    try { await window.storage.set("mb_days", JSON.stringify(next)); } catch {}
  };

  const savePhase = async (d) => {
    setPhaseRaw(d);
    try { await window.storage.set("mb_ph", JSON.stringify(d)); } catch {}
  };

  // ── Derived: today ──
  const sleepH     = sleepDuration(today.sleep?.bedtime, today.sleep?.wakeTime);
  const proteinG   = today.meals.reduce((s,m) => s + (PROTEIN_TIERS.find(p=>p.key===m.protein)?.g||0), 0);
  const proteinGoal = phase.bodyweight ? Math.round(+phase.bodyweight) : null;
  const waterPct   = Math.min(100, Math.round((today.water/WATER_GOAL_OZ)*100));
  const moodVals   = Object.values(today.moods).filter(Boolean);
  const moodAvg    = moodVals.length ? +(moodVals.reduce((s,m)=>s+m.mood,0)/moodVals.length).toFixed(1) : null;
  const energyAvg  = moodVals.length ? +(moodVals.reduce((s,m)=>s+m.energy,0)/moodVals.length).toFixed(1) : null;
  const todaySession = sessions.find(s => s.date === date);
  const cycleInfo  = phase.cycleDay ? CYCLE_PHASES.find(c => +phase.cycleDay >= c.r[0] && +phase.cycleDay <= c.r[1]) : null;

  // ── Derived: trends (last 30 days) ──
  const trendData = useMemo(() => {
    const out = [];
    for (let i=29; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const k = isoDate(d);
      const e = days[k];
      const mv = e ? Object.values(e.moods||{}).filter(Boolean) : [];
      const sd = e ? sleepDuration(e.sleep?.bedtime, e.sleep?.wakeTime) : null;
      out.push({
        date: k.slice(5),
        weight: e?.weight ? +e.weight : null,
        water:  e?.water  || 0,
        sleep:  sd,
        mood:   mv.length ? +(mv.reduce((s,m)=>s+m.mood,0)/mv.length).toFixed(1) : null,
        energy: mv.length ? +(mv.reduce((s,m)=>s+m.energy,0)/mv.length).toFixed(1) : null,
        protein: e?.meals?.reduce((s,m)=>s+(PROTEIN_TIERS.find(p=>p.key===m.protein)?.g||0),0)||0,
      });
    }
    return out;
  }, [days]);

  // 7-day rolling avg weight
  const weightTrend = useMemo(() => trendData.map((d,i) => {
    const win = trendData.slice(Math.max(0,i-6),i+1).filter(x=>x.weight);
    const avg = win.length ? Math.round(win.reduce((s,x)=>s+x.weight,0)/win.length*10)/10 : null;
    return { ...d, avg7: avg };
  }), [trendData]);

  // Recovery score
  const recoverTrend = useMemo(() => trendData.map(d => ({
    date: d.date,
    score: d.sleep && d.mood
      ? Math.round(((Math.min(d.sleep,9)/9)*40) + ((d.mood/5)*30) + ((Math.min(d.water,WATER_GOAL_OZ)/WATER_GOAL_OZ)*30))
      : null,
  })), [trendData]);

  // Measurement history for chart
  const measureTrend = useMemo(() => Object.entries(days)
    .filter(([,d]) => d.measurements && Object.keys(d.measurements).length)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([date,d]) => ({ date:date.slice(5), ...d.measurements }))
  , [days]);

  // ── Actions ──
  const logMood = async (slot, field, val) => {
    const moods = { ...today.moods, [slot]: { ...(today.moods[slot]||{}), [field]:val, time:nowTime() } };
    await persist({ moods });
  };
  const addMeal = async () => {
    if (!mealForm.desc.trim()) return;
    await persist({ meals:[...today.meals, { id:Date.now(), ...mealForm }] });
    setMealForm({ type:"Snack", desc:"", protein:"none", time:nowTime() });
  };
  const rmMeal  = async id => persist({ meals:today.meals.filter(m=>m.id!==id) });
  const addWater = async oz => persist({ water: Math.max(0, (today.water||0)+oz) });

  // ── Tokens ──
  const K = {
    purple:"#534AB7", purpleL:"#EEEDFE", purpleD:"#26215C",
    green:"#1D9E75",  greenL:"#E1F5EE",
    amber:"#BA7517",  amberL:"#FAEEDA",
    red:"#993C1D",    redL:"#FAECE7",
  };
  const card  = { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"14px", marginBottom:"10px" };
  const inp   = { fontSize:"13px", padding:"6px 10px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", width:"100%" };
  const lbl   = { fontSize:"10px", color:"var(--color-text-secondary)", display:"block", marginBottom:"4px", letterSpacing:"0.04em", textTransform:"uppercase" };
  const ttip  = { contentStyle:{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:"8px", fontSize:"11px", fontFamily:"var(--font-mono)" } };
  const mkBtn = (v="d") => ({ fontSize:"12px", padding:"6px 12px", borderRadius:"var(--border-radius-md)", border:v==="p"?"none":"0.5px solid var(--color-border-secondary)", background:v==="p"?K.purple:v==="g"?"transparent":"var(--color-background-secondary)", color:v==="p"?K.purpleL:v==="x"?K.red:"var(--color-text-secondary)", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:v==="p"?500:400 });

  if (loading) return <div style={{ padding:"2rem", fontFamily:"var(--font-mono)", fontSize:"12px", color:"var(--color-text-secondary)" }}>loading vault...</div>;

  // ── Shared sub-components ──
  const StatCard = ({ label, value, sub, color }) => (
    <div style={{ padding:"10px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)" }}>
      <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"3px" }}>{label}</div>
      <div style={{ fontSize:"17px", fontWeight:500, color, fontFamily:"var(--font-mono)", lineHeight:1.2 }}>{value}</div>
      <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", marginTop:"2px" }}>{sub}</div>
    </div>
  );

  const ScaleRow = ({ label, val, onSelect, items }) => (
    <div>
      <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", marginBottom:"4px" }}>{label}</div>
      <div style={{ display:"flex", gap:"4px" }}>
        {items.map(s => (
          <button key={s.v} onClick={() => onSelect(s.v)} style={{ flex:1, padding:"6px 2px", border:`1px solid ${val===s.v?s.c:"var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background:val===s.v?s.c+"44":"transparent", cursor:"pointer", fontSize:"11px", fontFamily:"var(--font-mono)", color:"var(--color-text-primary)", fontWeight:val===s.v?500:400 }}>{s.v}</button>
        ))}
      </div>
      {val && <div style={{ fontSize:"9px", marginTop:"2px", color:items[val-1]?.c }}>{label==="Mood" ? items[val-1]?.mood : items[val-1]?.energy}</div>}
    </div>
  );

  const WaterBar = ({ compact }) => (
    <div>
      {!compact && <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
        <span style={{ fontSize:"13px", fontWeight:500 }}>Water</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"18px", fontWeight:500, color:waterPct>=100?K.green:K.purple }}>{today.water} oz</span>
      </div>}
      <div style={{ height:compact?6:10, background:"var(--color-border-tertiary)", borderRadius:"5px", overflow:"hidden", marginBottom:compact?4:8 }}>
        <div style={{ width:`${waterPct}%`, height:"100%", background:waterPct>=100?K.green:K.purple, borderRadius:"5px", transition:"width 0.4s ease" }} />
      </div>
      {!compact && <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", marginBottom:"10px" }}>
        {WATER_GOAL_OZ-today.water > 0 ? `${WATER_GOAL_OZ-today.water}oz remaining (goal ${WATER_GOAL_OZ}oz)` : "Goal met ✓"}
      </div>}
      <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
        {[8,12,16,24,32].map(oz => <button key={oz} onClick={()=>addWater(oz)} style={mkBtn()}>{compact?"+"+oz:"+"+oz+"oz"}</button>)}
        <button onClick={()=>addWater(-8)} style={mkBtn("x")}>−8{compact?"":"oz"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem 0" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px", flexWrap:"wrap" }}>
        <div>
          <span style={{ fontSize:"15px", fontWeight:500, color:"var(--color-text-primary)", letterSpacing:"-0.01em" }}>MIRRORBODY</span>
          <span style={{ fontSize:"9px", color:"var(--color-text-secondary)", letterSpacing:"0.1em", marginLeft:"8px", textTransform:"uppercase" }}>wellness vault</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ fontSize:"11px", padding:"3px 8px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"20px", background:"var(--color-background-secondary)", color:"var(--color-text-primary)", fontFamily:"var(--font-mono)", cursor:"pointer" }} />
          {cycleInfo && <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"20px", background:cycleInfo.bg, color:cycleInfo.tx, fontWeight:500 }}>{cycleInfo.name}</span>}
          <button onClick={()=>savePhase({...phase, cycleDay: phase.cycleDay ? (phase.cycleDay%35)+1 : 1})} style={{ ...mkBtn(), fontSize:"10px", padding:"2px 8px" }}>
            {phase.cycleDay ? `Cycle day ${phase.cycleDay}` : "Set cycle day"}
          </button>
        </div>
      </div>
      {cycleInfo && <div style={{ fontSize:"11px", padding:"5px 10px", background:cycleInfo.bg, color:cycleInfo.tx, borderRadius:"var(--border-radius-md)", marginBottom:"10px" }}>{cycleInfo.tip}</div>}

      {/* ── Tabs ── */}
      <div style={{ display:"flex", borderBottom:"0.5px solid var(--color-border-tertiary)", marginBottom:"1.25rem", overflowX:"auto" }}>
        {[["today","Today"],["body","Body"],["fuel","Fuel"],["recovery","Recovery"],["trends","Trends"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ fontSize:"12px", padding:"7px 12px", border:"none", background:"transparent", color:tab===id?"var(--color-text-primary)":"var(--color-text-secondary)", borderBottom:`2px solid ${tab===id?K.purple:"transparent"}`, fontWeight:tab===id?500:400, cursor:"pointer", fontFamily:"var(--font-sans)", whiteSpace:"nowrap" }}>{label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════
          TODAY
      ══════════════════════════════════ */}
      {tab==="today" && (
        <div>
          {/* Quick stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"12px" }}>
            <StatCard label="Weight" value={today.weight?`${today.weight}lbs`:"—"} sub={phase.bodyweight&&today.weight?`${(+today.weight-phase.bodyweight>0?"+":"")}${(+today.weight-phase.bodyweight).toFixed(1)} vs baseline`:"not logged"} color={K.purple} />
            <StatCard label="Water" value={`${today.water}oz`} sub={`${waterPct}% of goal`} color={waterPct>=100?K.green:waterPct>=50?K.amber:K.red} />
            <StatCard label="Sleep" value={sleepH?`${sleepH}h`:"—"} sub={today.sleep?.quality?`quality ${today.sleep.quality}/5`:"not logged"} color={sleepH>=8?K.green:sleepH>=7?K.amber:sleepH?K.red:"var(--color-text-secondary)"} />
            <StatCard label="Mood" value={moodAvg?`${moodAvg}/5`:"—"} sub={energyAvg?`energy ${energyAvg}/5`:"not checked in"} color={moodAvg>=4?K.green:moodAvg>=3?K.amber:moodAvg?K.red:"var(--color-text-secondary)"} />
          </div>

          {/* Protein bar */}
          {proteinGoal && (
            <div style={{ padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                <span style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>Protein today</span>
                <span style={{ fontSize:"12px", fontWeight:500, color:proteinG>=proteinGoal?K.green:K.purple, fontFamily:"var(--font-mono)" }}>{proteinG}g / {proteinGoal}g target</span>
              </div>
              <div style={{ height:"4px", background:"var(--color-border-tertiary)", borderRadius:"2px" }}>
                <div style={{ width:`${Math.min(100,Math.round(proteinG/proteinGoal*100))}%`, height:"100%", background:proteinG>=proteinGoal?K.green:K.purple, borderRadius:"2px", transition:"width 0.3s" }} />
              </div>
            </div>
          )}

          {/* Recovery score today */}
          {sleepH && moodAvg && (
            <div style={{ padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:"10px", display:"flex", gap:"12px", alignItems:"center" }}>
              {(() => {
                const score = Math.round(((Math.min(sleepH,9)/9)*40)+((moodAvg/5)*30)+((Math.min(today.water,WATER_GOAL_OZ)/WATER_GOAL_OZ)*30));
                const col = score>=75?K.green:score>=50?K.amber:K.red;
                return <>
                  <div>
                    <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Recovery score</div>
                    <div style={{ fontSize:"24px", fontWeight:500, color:col, fontFamily:"var(--font-mono)" }}>{score}</div>
                  </div>
                  <div style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>
                    {score>=75?"Body is recovered. Train hard today." : score>=50?"Adequate recovery. Normal training." : "Under-recovered. Consider deload or rest."}
                  </div>
                </>;
              })()}
            </div>
          )}

          {/* Quick water */}
          <div style={card}>
            <WaterBar compact={false} />
          </div>

          {/* Quick mood log */}
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>Mood check-ins</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
              {MOOD_SLOTS.map(slot => {
                const m = today.moods[slot.key];
                const s = m?.mood ? SCALE_5[m.mood-1] : null;
                return (
                  <div key={slot.key} style={{ padding:"10px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:`0.5px solid ${s?s.c+"66":"var(--color-border-tertiary)"}` }}>
                    <div style={{ fontSize:"11px", fontWeight:500, marginBottom:"6px" }}>{slot.icon} {slot.label}</div>
                    <div style={{ display:"flex", gap:"3px", marginBottom:"4px" }}>
                      {SCALE_5.map(sc => (
                        <button key={sc.v} onClick={()=>logMood(slot.key,"mood",sc.v)} style={{ flex:1, padding:"4px 1px", border:`1px solid ${m?.mood===sc.v?sc.c:"var(--color-border-tertiary)"}`, borderRadius:"4px", background:m?.mood===sc.v?sc.c+"44":"transparent", cursor:"pointer", fontSize:"9px", fontFamily:"var(--font-mono)" }}>{sc.v}</button>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:"3px" }}>
                      {SCALE_5.map(sc => (
                        <button key={sc.v} onClick={()=>logMood(slot.key,"energy",sc.v)} style={{ flex:1, padding:"4px 1px", border:`1px solid ${m?.energy===sc.v?sc.c:"var(--color-border-tertiary)"}`, borderRadius:"4px", background:m?.energy===sc.v?sc.c+"44":"transparent", cursor:"pointer", fontSize:"9px", fontFamily:"var(--font-mono)" }}>{sc.v}</button>
                      ))}
                    </div>
                    {s && <div style={{ fontSize:"9px", color:s.c, marginTop:"4px" }}>mood: {s.mood}{m?.energy?` · energy: ${SCALE_5[m.energy-1]?.energy}`:""}</div>}
                    {m?.time && <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", fontFamily:"var(--font-mono)", marginTop:"2px" }}>{m.time}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's workout link */}
          {todaySession && (
            <div style={{ ...card, borderColor:K.purple, paddingTop:"10px", paddingBottom:"10px" }}>
              <div style={{ fontSize:"11px", fontWeight:500, color:K.purple, marginBottom:"2px" }}>Today's workout — {todaySession.dayType}</div>
              <div style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>{todaySession.exercises?.map(e=>e.name).join(" · ")}</div>
            </div>
          )}

          {/* Quick weight entry */}
          <div style={card}>
            <span style={lbl}>Body weight (lbs) — today</span>
            <input type="number" value={today.weight||""} onChange={e=>persist({weight:e.target.value})} placeholder="lbs" step="0.1" style={inp} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          BODY
      ══════════════════════════════════ */}
      {tab==="body" && (
        <div>
          {/* Weight + settings */}
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>Body weight</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
              <div>
                <span style={lbl}>Today (lbs)</span>
                <input type="number" value={today.weight||""} onChange={e=>persist({weight:e.target.value})} placeholder="lbs" step="0.1" style={inp} />
              </div>
              <div>
                <span style={lbl}>Baseline / bodyweight goal</span>
                <input type="number" value={phase.bodyweight||""} onChange={e=>savePhase({...phase,bodyweight:+e.target.value})} placeholder="lbs" step="0.1" style={inp} />
              </div>
            </div>

            {weightTrend.filter(d=>d.weight).length >= 2 && (
              <div>
                <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"6px" }}>Daily weight + 7-day rolling average</div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={weightTrend} margin={{top:4,right:4,left:-25,bottom:4}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                    <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} interval={5} />
                    <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} domain={["auto","auto"]} />
                    <Tooltip {...ttip} />
                    <Line type="monotone" dataKey="weight" stroke="var(--color-border-secondary)" strokeWidth={1} dot={{r:2}} name="Daily" connectNulls />
                    <Line type="monotone" dataKey="avg7"   stroke={K.purple}                    strokeWidth={2} dot={false}  name="7-day avg" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:"12px", marginTop:"4px" }}>
                  {[["var(--color-border-secondary)","Daily"],[ K.purple,"7-day avg"]].map(([c,l])=>(
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                      <div style={{ width:"12px", height:"2px", background:c, borderRadius:"1px" }} />
                      <span style={{ fontSize:"9px", color:"var(--color-text-secondary)" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cycle day */}
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>Cycle tracking</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              <div>
                <span style={lbl}>Current cycle day (1–35)</span>
                <input type="number" min="1" max="35" value={phase.cycleDay||""} onChange={e=>savePhase({...phase,cycleDay:+e.target.value})} placeholder="Day 1" style={inp} />
              </div>
              <div>
                <span style={lbl}>Last period start date</span>
                <input type="date" value={phase.periodStart||""} onChange={e=>{
                  const daysSince = Math.floor((new Date()-new Date(e.target.value))/(1000*60*60*24))+1;
                  savePhase({...phase,periodStart:e.target.value,cycleDay:Math.min(daysSince,35)});
                }} style={inp} />
                <div style={{ fontSize:"9px", color:"var(--color-text-secondary)", marginTop:"3px" }}>Auto-calculates current cycle day</div>
              </div>
            </div>
            {cycleInfo && (
              <div style={{ marginTop:"10px", padding:"10px 12px", background:cycleInfo.bg, borderRadius:"var(--border-radius-md)" }}>
                <div style={{ fontSize:"12px", fontWeight:500, color:cycleInfo.tx, marginBottom:"2px" }}>{cycleInfo.name} — Day {phase.cycleDay}</div>
                <div style={{ fontSize:"11px", color:cycleInfo.tx }}>{cycleInfo.tip}</div>
              </div>
            )}
            <div style={{ marginTop:"10px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"4px" }}>
              {CYCLE_PHASES.map((c,i)=>(
                <div key={i} style={{ padding:"6px 8px", background:c.bg, borderRadius:"var(--border-radius-md)", border:`0.5px solid ${cycleInfo?.name===c.name?"var(--color-border-primary)":"transparent"}` }}>
                  <div style={{ fontSize:"9px", fontWeight:500, color:c.tx }}>Day {c.r[0]}–{c.r[1]}</div>
                  <div style={{ fontSize:"9px", color:c.tx, marginTop:"1px" }}>{c.name.replace(" 🔥","")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Measurements */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:500 }}>Measurements (inches)</div>
                <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", marginTop:"1px" }}>Key: waist, hips, glutes · Take every 2–4 weeks</div>
              </div>
              <button onClick={()=>{ setEditM(!editM); setMDraft(today.measurements||{}); }} style={mkBtn()}>{editM?"cancel":"update"}</button>
            </div>

            {editM ? (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"10px" }}>
                  {MEASURES.map(f=>(
                    <div key={f.key}>
                      <span style={{ ...lbl, color:f.star?"var(--color-text-primary)":undefined }}>{f.star?"★ ":""}{f.label}</span>
                      <input type="number" step="0.25" value={mDraft[f.key]||""} onChange={e=>setMDraft(p=>({...p,[f.key]:e.target.value}))} placeholder='in"' style={{ ...inp, fontFamily:"var(--font-mono)" }} />
                    </div>
                  ))}
                </div>
                <button onClick={async()=>{ const c=Object.fromEntries(Object.entries(mDraft).filter(([,v])=>v!=="")); await persist({measurements:{...today.measurements,...c}}); setEditM(false); }} style={{ ...mkBtn("p"), width:"100%" }}>Save measurements</button>
              </div>
            ) : (
              <div>
                {/* Primary 3 */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px", marginBottom:"8px" }}>
                  {MEASURES.filter(f=>f.star).map(f=>(
                    <div key={f.key} style={{ padding:"10px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", textAlign:"center" }}>
                      <div style={{ fontSize:"9px", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"3px" }}>{f.label}</div>
                      <div style={{ fontSize:"20px", fontWeight:500, color:today.measurements?.[f.key]?"var(--color-text-primary)":"var(--color-text-tertiary)", fontFamily:"var(--font-mono)" }}>
                        {today.measurements?.[f.key]?`${today.measurements[f.key]}"`:  "—"}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Secondary */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"5px" }}>
                  {MEASURES.filter(f=>!f.star).map(f=>(
                    <div key={f.key} style={{ padding:"5px 8px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>{f.label}</span>
                      <span style={{ fontSize:"10px", fontFamily:"var(--font-mono)" }}>{today.measurements?.[f.key]?`${today.measurements[f.key]}"`:  "—"}</span>
                    </div>
                  ))}
                </div>
                {(!today.measurements||!Object.keys(today.measurements).length) && (
                  <div style={{ textAlign:"center", padding:"1rem", color:"var(--color-text-tertiary)", fontSize:"12px" }}>No measurements for this date. Tap "update" to add.</div>
                )}
              </div>
            )}

            {/* Measurement trend chart */}
            {measureTrend.length >= 2 && (
              <div style={{ marginTop:"12px" }}>
                <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"6px" }}>Waist / hips / glutes trend</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={measureTrend} margin={{top:4,right:4,left:-25,bottom:4}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                    <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} />
                    <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} domain={["auto","auto"]} />
                    <Tooltip {...ttip} />
                    {["waist","hips","glutes"].map((k,i)=>(
                      <Line key={k} type="monotone" dataKey={k} stroke={[K.purple,K.green,K.amber][i]} strokeWidth={2} dot={{r:3}} connectNulls name={k} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:"10px", marginTop:"4px" }}>
                  {["waist","hips","glutes"].map((k,i)=>(
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                      <div style={{ width:"10px", height:"2px", background:[K.purple,K.green,K.amber][i], borderRadius:"1px" }} />
                      <span style={{ fontSize:"9px", color:"var(--color-text-secondary)" }}>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          FUEL
      ══════════════════════════════════ */}
      {tab==="fuel" && (
        <div>
          {/* Water */}
          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
              <span style={{ fontSize:"13px", fontWeight:500 }}>Water intake</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"20px", fontWeight:500, color:waterPct>=100?K.green:K.purple }}>{today.water} oz</span>
            </div>
            <WaterBar compact={false} />
          </div>

          {/* Protein summary */}
          {proteinGoal && (
            <div style={{ ...card, padding:"10px 14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                <span style={{ fontSize:"12px", fontWeight:500 }}>Protein</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"14px", fontWeight:500, color:proteinG>=proteinGoal?K.green:K.purple }}>{proteinG}g / {proteinGoal}g</span>
              </div>
              <div style={{ height:"5px", background:"var(--color-border-tertiary)", borderRadius:"3px" }}>
                <div style={{ width:`${Math.min(100,Math.round(proteinG/proteinGoal*100))}%`, height:"100%", background:proteinG>=proteinGoal?K.green:K.purple, borderRadius:"3px", transition:"width 0.3s" }} />
              </div>
              <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", marginTop:"4px" }}>Target: 1g per pound of bodyweight · {today.meals.length} meals logged</div>
            </div>
          )}

          {/* Add meal */}
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>Meals</div>
            <div style={{ padding:"10px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:"10px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"8px" }}>
                <div>
                  <span style={lbl}>Type</span>
                  <select value={mealForm.type} onChange={e=>setMealForm(p=>({...p,type:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
                    {MEAL_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <span style={lbl}>Time</span>
                  <input type="time" value={mealForm.time} onChange={e=>setMealForm(p=>({...p,time:e.target.value}))} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom:"8px" }}>
                <span style={lbl}>Description</span>
                <input value={mealForm.desc} onChange={e=>setMealForm(p=>({...p,desc:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addMeal()} placeholder="e.g. Greek yogurt, berries, granola…" style={inp} />
              </div>
              <div style={{ marginBottom:"10px" }}>
                <span style={lbl}>Protein estimate</span>
                <div style={{ display:"flex", gap:"6px" }}>
                  {PROTEIN_TIERS.map(t=>(
                    <button key={t.key} onClick={()=>setMealForm(p=>({...p,protein:t.key}))} style={{ flex:1, padding:"5px 4px", border:`1px solid ${mealForm.protein===t.key?t.color:"var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background:mealForm.protein===t.key?t.color+"33":"transparent", cursor:"pointer", fontSize:"10px", color:"var(--color-text-secondary)" }}>{t.label}</button>
                  ))}
                </div>
              </div>
              <button onClick={addMeal} style={{ ...mkBtn("p"), width:"100%", fontSize:"12px" }}>+ Add meal</button>
            </div>

            {today.meals.length===0 && <div style={{ textAlign:"center", padding:"1rem", color:"var(--color-text-tertiary)", fontSize:"12px" }}>No meals logged today.</div>}
            {today.meals.map(meal=>{
              const tier = PROTEIN_TIERS.find(p=>p.key===meal.protein);
              return (
                <div key={meal.id} style={{ display:"flex", gap:"10px", padding:"8px 0", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"2px" }}>
                      <span style={{ fontSize:"10px", color:"var(--color-text-secondary)", fontFamily:"var(--font-mono)" }}>{meal.time}</span>
                      <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:"10px", background:"var(--color-background-secondary)", color:"var(--color-text-secondary)" }}>{meal.type}</span>
                      {tier&&tier.key!=="none" && <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:"10px", background:tier.color+"33", color:"var(--color-text-secondary)" }}>{tier.label} protein</span>}
                    </div>
                    <div style={{ fontSize:"12px", color:"var(--color-text-primary)" }}>{meal.desc}</div>
                  </div>
                  <button onClick={()=>rmMeal(meal.id)} style={{ fontSize:"11px", color:"var(--color-text-tertiary)", background:"transparent", border:"none", cursor:"pointer" }}>✕</button>
                </div>
              );
            })}
            {today.meals.length>0 && (
              <div style={{ marginTop:"8px", padding:"6px 10px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>{today.meals.length} meals</span>
                <span style={{ fontSize:"12px", fontFamily:"var(--font-mono)", color:K.purple }}>~{proteinG}g protein</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          RECOVERY — Sleep + Mood detail
      ══════════════════════════════════ */}
      {tab==="recovery" && (
        <div>
          {/* Sleep */}
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>Sleep</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
              <div>
                <span style={lbl}>Bedtime</span>
                <input type="time" value={today.sleep?.bedtime||""} onChange={e=>persist({sleep:{...today.sleep,bedtime:e.target.value}})} style={inp} />
              </div>
              <div>
                <span style={lbl}>Wake time</span>
                <input type="time" value={today.sleep?.wakeTime||""} onChange={e=>persist({sleep:{...today.sleep,wakeTime:e.target.value}})} style={inp} />
              </div>
            </div>
            {sleepH && (
              <div style={{ padding:"10px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginBottom:"10px", display:"flex", gap:"14px", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:"9px", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.04em" }}>Duration</div>
                  <div style={{ fontSize:"26px", fontWeight:500, color:sleepH>=8?K.green:sleepH>=7?K.amber:K.red, fontFamily:"var(--font-mono)" }}>{sleepH}h</div>
                </div>
                <div style={{ height:"40px", width:"0.5px", background:"var(--color-border-tertiary)" }} />
                <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", flex:1 }}>
                  {sleepH>=8?"Optimal. Full recovery window. Train hard today." : sleepH>=7?"Adequate. Normal training intensity." : sleepH>=6?"Light deficit. Reduce volume by 20%." : "Significant deficit. Consider rest day or deload."}
                  {cycleInfo && sleepH<7 && <div style={{ marginTop:"3px", fontSize:"10px", color:cycleInfo.tx }}>Combined with {cycleInfo.name} — prioritize recovery today.</div>}
                </div>
              </div>
            )}
            <div style={{ marginBottom:"10px" }}>
              <span style={lbl}>Sleep quality (1–5)</span>
              <div style={{ display:"flex", gap:"6px" }}>
                {[1,2,3,4,5].map(v=>(
                  <button key={v} onClick={()=>persist({sleep:{...today.sleep,quality:v}})} style={{ flex:1, padding:"8px", border:`1px solid ${today.sleep?.quality===v?K.purple:"var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background:today.sleep?.quality===v?K.purpleL:"transparent", cursor:"pointer", fontSize:"13px", fontFamily:"var(--font-mono)", color:today.sleep?.quality===v?K.purpleD:"var(--color-text-secondary)", fontWeight:today.sleep?.quality===v?500:400 }}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <span style={lbl}>Notes</span>
              <input value={today.sleep?.notes||""} onChange={e=>persist({sleep:{...today.sleep,notes:e.target.value}})} placeholder="e.g. woke at 3am, restless, vivid dreams…" style={inp} />
            </div>
          </div>

          {/* Mood — full 3-slot detail */}
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"12px" }}>Mood log — {date}</div>
            {MOOD_SLOTS.map(slot=>{
              const m = today.moods[slot.key];
              return (
                <div key={slot.key} style={{ marginBottom:"16px", paddingBottom:"16px", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                    <div>
                      <span style={{ fontSize:"13px", fontWeight:500 }}>{slot.icon} {slot.label}</span>
                      <span style={{ fontSize:"10px", color:"var(--color-text-secondary)", marginLeft:"8px" }}>{slot.window}</span>
                    </div>
                    {m?.time && <span style={{ fontSize:"10px", color:"var(--color-text-secondary)", fontFamily:"var(--font-mono)" }}>logged {m.time}</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"8px" }}>
                    <ScaleRow label="Mood"   val={m?.mood}   onSelect={v=>logMood(slot.key,"mood",v)}   items={SCALE_5} />
                    <ScaleRow label="Energy" val={m?.energy} onSelect={v=>logMood(slot.key,"energy",v)} items={SCALE_5} />
                  </div>
                  <div>
                    <span style={lbl}>Stress level (1–5)</span>
                    <div style={{ display:"flex", gap:"4px", marginBottom:"6px" }}>
                      {[1,2,3,4,5].map(v=>{
                        const stressColors=["#9FE1CB","#B4B2A9","#FAC775","#F09595","#E24B4A"];
                        return <button key={v} onClick={()=>logMood(slot.key,"stress",v)} style={{ flex:1, padding:"5px", border:`1px solid ${m?.stress===v?stressColors[v-1]:"var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", background:m?.stress===v?stressColors[v-1]+"44":"transparent", cursor:"pointer", fontSize:"11px", fontFamily:"var(--font-mono)", color:"var(--color-text-primary)", fontWeight:m?.stress===v?500:400 }}>{v}</button>;
                      })}
                    </div>
                    <input value={m?.note||""} onChange={e=>logMood(slot.key,"note",e.target.value)} placeholder="Any context (training, nutrition, life events)…" style={{ ...inp, fontSize:"12px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          TRENDS
      ══════════════════════════════════ */}
      {tab==="trends" && (
        <div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"14px" }}>
            {[["weight","Weight"],["sleep","Sleep"],["mood","Mood"],["energy","Energy"],["water","Water"],["protein","Protein"],["recovery","Recovery"]].map(([k,l])=>(
              <button key={k} onClick={()=>setTrendM(k)} style={{ fontSize:"11px", padding:"4px 12px", borderRadius:"20px", border:`0.5px solid ${trendM===k?K.purple:"var(--color-border-secondary)"}`, background:trendM===k?K.purpleL:"var(--color-background-primary)", color:trendM===k?K.purpleD:"var(--color-text-secondary)", cursor:"pointer", fontWeight:trendM===k?500:400 }}>{l}</button>
            ))}
          </div>

          {trendM==="weight" && (
            <div style={card}>
              <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>Weight — daily + 7-day rolling average</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightTrend} margin={{top:4,right:4,left:-25,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                  <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} interval={5} />
                  <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} domain={["auto","auto"]} />
                  <Tooltip {...ttip} />
                  <Line type="monotone" dataKey="weight" stroke="var(--color-border-secondary)" strokeWidth={1} dot={{r:2}} name="Daily"    connectNulls />
                  <Line type="monotone" dataKey="avg7"   stroke={K.purple}                    strokeWidth={2} dot={false}  name="7-day avg" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {(trendM==="mood"||trendM==="energy") && (
            <div style={card}>
              <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>Mood + energy daily averages (scale 1–5)</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{top:4,right:4,left:-25,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                  <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} interval={5} />
                  <YAxis domain={[0,5]} ticks={[1,2,3,4,5]} tick={{fontSize:9,fill:"var(--color-text-secondary)"}} />
                  <Tooltip {...ttip} />
                  <Line type="monotone" dataKey="mood"   stroke={K.purple} strokeWidth={2} dot={{r:2}} name="Mood"   connectNulls />
                  <Line type="monotone" dataKey="energy" stroke={K.green}  strokeWidth={2} dot={{r:2}} name="Energy" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {trendM==="sleep" && (
            <div style={card}>
              <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>Sleep duration — hours per night</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData} margin={{top:4,right:4,left:-25,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                  <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} interval={5} />
                  <YAxis domain={[0,10]} tick={{fontSize:9,fill:"var(--color-text-secondary)"}} />
                  <Tooltip {...ttip} formatter={v=>[`${v}h`,"Sleep"]} />
                  <Bar dataKey="sleep" fill={K.purple} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {trendM==="water" && (
            <div style={card}>
              <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>Water intake — oz/day (goal {WATER_GOAL_OZ}oz)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData} margin={{top:4,right:4,left:-25,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                  <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} interval={5} />
                  <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} />
                  <Tooltip {...ttip} formatter={v=>[`${v}oz`,"Water"]} />
                  <Bar dataKey="water" fill={K.green} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {trendM==="protein" && (
            <div style={card}>
              <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>Estimated protein — g/day{proteinGoal?` (goal ${proteinGoal}g)`:""}</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trendData} margin={{top:4,right:4,left:-25,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                  <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} interval={5} />
                  <YAxis tick={{fontSize:9,fill:"var(--color-text-secondary)"}} />
                  <Tooltip {...ttip} formatter={v=>[`${v}g`,"Protein"]} />
                  <Bar dataKey="protein" fill={K.amber} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {trendM==="recovery" && (
            <div style={card}>
              <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"4px" }}>Recovery score — composite (0–100)</div>
              <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", marginBottom:"8px" }}>Sleep 40% + Mood 30% + Hydration 30%</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={recoverTrend} margin={{top:4,right:4,left:-25,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                  <XAxis dataKey="date" tick={{fontSize:9,fill:"var(--color-text-secondary)"}} interval={5} />
                  <YAxis domain={[0,100]} tick={{fontSize:9,fill:"var(--color-text-secondary)"}} />
                  <Tooltip {...ttip} formatter={v=>[v,"Recovery"]} />
                  <Line type="monotone" dataKey="score" stroke={K.green} strokeWidth={2} dot={{r:2}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", gap:"16px", marginTop:"8px" }}>
                {[[K.green,"75+","Recovered"],[K.amber,"50–74","Adequate"],[K.red,"0–49","Under-recovered"]].map(([c,r,l])=>(
                  <div key={r} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:c }} />
                    <span style={{ fontSize:"9px", color:"var(--color-text-secondary)" }}>{r}: {l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"10px" }}>30-day summary</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"8px" }}>
              {[
                { label:"Days logged",    value: Object.keys(days).filter(k=>{ const d=new Date(); d.setDate(d.getDate()-30); return new Date(k)>=d; }).length },
                { label:"Avg sleep",      value: (()=>{ const w=trendData.filter(d=>d.sleep); return w.length?+(w.reduce((s,d)=>s+d.sleep,0)/w.length).toFixed(1)+"h":"—"; })() },
                { label:"Avg mood",       value: (()=>{ const w=trendData.filter(d=>d.mood); return w.length?+(w.reduce((s,d)=>s+d.mood,0)/w.length).toFixed(1)+"/5":"—"; })() },
                { label:"Avg water",      value: (()=>{ const w=trendData.filter(d=>d.water>0); return w.length?Math.round(w.reduce((s,d)=>s+d.water,0)/w.length)+"oz":"—"; })() },
                { label:"Avg protein",    value: (()=>{ const w=trendData.filter(d=>d.protein>0); return w.length?Math.round(w.reduce((s,d)=>s+d.protein,0)/w.length)+"g":"—"; })() },
                { label:"Water goal days",value: trendData.filter(d=>d.water>=WATER_GOAL_OZ).length },
              ].map(s=>(
                <div key={s.label} style={{ padding:"8px 10px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)" }}>
                  <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"3px" }}>{s.label}</div>
                  <div style={{ fontSize:"16px", fontWeight:500, color:"var(--color-text-primary)", fontFamily:"var(--font-mono)" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ marginTop:"1rem", padding:"12px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:"0.5px dashed var(--color-border-secondary)" }}>
            <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"8px" }}>Danger zone</div>
            <button onClick={async()=>{ if(window.confirm("Clear ALL wellness data? This cannot be undone.")){ setDaysRaw({}); try{await window.storage.delete("mb_days");}catch{} }}} style={{ ...mkBtn("x"), fontSize:"11px" }}>Clear all wellness data</button>
          </div>
        </div>
      )}
    </div>
  );
}
