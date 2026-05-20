import { useState } from "react";

// ─── Phase data ───────────────────────────────────────────────────────────────
const PHASES = [
  {
    num: 1, name: "Foundation", alias: "Reset",
    duration: "Months 1–6", bf: "Any starting point",
    color: "#8C8A82", glow: "#E8E6E0",
    changes: ["Movement patterns established","Nervous system adapting","First strength gains visible","Posture improving — shoulders back"],
    gates: ["Back squat 1.0× BW × 3","Deadlift 1.25× BW × 3","3 strict pull-ups","Farmer carry 0.5× BW each hand"],
    measurements: { waist:"Stable → −1\"", hip:"Stable", thigh:"+0.25–0.5\"", shoulder:"Stable" },
    shape: { shoulderW:42, waistW:32, hipW:46, thighW:22, armW:10, calfW:14 },
  },
  {
    num: 2, name: "Development", alias: "Sculpt",
    duration: "Months 6–18", bf: "Recomposition visible",
    color: "#BA7517", glow: "#FAEEDA",
    changes: ["Waist visibly narrowing","Shoulder caps beginning to round","Quad sweep starting at front of thigh","Body weight may stay same — recomposition"],
    gates: ["Back squat 1.3× BW × 3","Deadlift 1.5× BW × 3","5 pull-ups","Hip thrust 1.5× BW × 5"],
    measurements: { waist:"−2 to −4\"", hip:"Stable → +1\"", thigh:"+0.5–1\"", shoulder:"+0.5\"" },
    shape: { shoulderW:45, waistW:28, hipW:47, thighW:24, armW:11, calfW:16 },
  },
  {
    num: 3, name: "Specialization", alias: "CurveUp",
    duration: "Months 12–24", bf: "18–22% athletic",
    color: "#1D9E75", glow: "#E1F5EE",
    changes: ["Glute fullness prominent","Quad sweep clearly visible","Round shoulder caps","Arms defined at rest","Waist-to-hip ratio dramatic"],
    gates: ["Back squat 1.5× BW × 3","Hip thrust 2.0× BW × 5","Weighted pull-ups","OHP 0.5× BW × 5"],
    measurements: { waist:"−4 to −6\"", hip:"+1 to +2\"", thigh:"+1–1.5\"", shoulder:"+1\"" },
    shape: { shoulderW:50, waistW:25, hipW:51, thighW:26, armW:13, calfW:17 },
  },
  {
    num: 4, name: "Goal Physique", alias: "EliteGlow",
    duration: "Year 2–4+", bf: "15–18% competition-adjacent",
    color: "#534AB7", glow: "#EEEDFE",
    changes: ["Abs visible at rest","Quad sweep + separation present","Deltoid caps fully round","Full muscular development","The body in Image 1 lives here"],
    gates: ["Back squat 1.75× BW × 3","Deadlift 2.0× BW × 1","Hip thrust 2.5× BW × 5","10+ weighted pull-ups"],
    measurements: { waist:"−6\"+ from start", hip:"+2\"+ from start", thigh:"+2\"+ from start", shoulder:"+1.5\"+ from start" },
    shape: { shoulderW:54, waistW:22, hipW:51, thighW:28, armW:14, calfW:18 },
  },
];

// ─── Muscle groups ────────────────────────────────────────────────────────────
const MUSCLES = [
  { key:"quads",     name:"Quadriceps",  priority:"CRITICAL", phase:3,
    desc:"The signature feature of Image 1. Outer sweep visible from front. VMO detail at knee. Takes 2+ years of heavy squats.",
    exercises:["Back squat (primary)","Box squat","Bulgarian split squat","Chair: footwork"],
    detail:"Heavy back squats 2×/week for 18–36 months builds the sweep. The outer quad (vastus lateralis) responds specifically to squat depth. Non-negotiable for this physique.",
    color:"#534AB7" },
  { key:"glutes",    name:"Glutes",      priority:"CRITICAL", phase:2,
    desc:"Full, projected glutes visible from side (Image 4). Competition scoring priority. Hip thrust is the #1 driver.",
    exercises:["Hip thrust (barbell)","Romanian deadlift","Step-up","Chair: kickback"],
    detail:"Hip thrust is the most direct glute builder. Progress from BW → loaded with barbell. The combination of hip thrust + RDL + squats builds the round projection in Image 4.",
    color:"#1D9E75" },
  { key:"shoulders", name:"Deltoids",    priority:"HIGH", phase:2,
    desc:"Round shoulder caps create the athletic V-taper. Makes waist look dramatically smaller. The most visible upper body change.",
    exercises:["Overhead press","Lateral raise","Chair: face pull","Chair: lateral raise"],
    detail:"Middle deltoid (lateral raise) creates the round cap. OHP builds anterior delt and overall shoulder size. The shoulder-to-waist ratio is what makes the physique look elite.",
    color:"#BA7517" },
  { key:"abs",       name:"Core / Abs",  priority:"HIGH", phase:4,
    desc:"Visible abs = muscle development + low body fat. Muscle is already building from compound lifts. Visibility requires Phase 3–4 body fat.",
    exercises:["All compound lifts (indirect)","Dead bug","Farmer's carry","Anti-rotation hold"],
    detail:"Abs are built in Phase 1–2 through compound loading. They become VISIBLE in Phase 3–4 when body fat reaches 17–20%. No amount of crunches reveals abs — body composition does.",
    color:"#F09595" },
  { key:"arms",      name:"Arms",        priority:"MODERATE", phase:2,
    desc:"Defined biceps and triceps — secondary to legs/glutes for this physique but clearly visible in Image 1.",
    exercises:["Inverted row","Bent-over row","Bench press","Bicep curl"],
    detail:"Arms develop significantly from pulling movements (rows, inverted rows) and pressing. Direct curl/extension work accelerates this from Phase 2 onward.",
    color:"#9FE1CB" },
  { key:"back",      name:"Back / Lats", priority:"HIGH", phase:2,
    desc:"Back width creates the V-taper from behind. Pulls shoulders into posture for presence and stage appearance.",
    exercises:["Inverted row","Bent-over row","Chair: lat pull","Pull-up"],
    detail:"Lat width is built through vertical pulling (pull-ups, lat pull) and horizontal pulling (rows). The V-taper effect dramatically improves with each phase of lat development.",
    color:"#AFA9EC" },
];

// ─── Body SVG ─────────────────────────────────────────────────────────────────
const BodyFig = ({ shape, color, glow, phase, active }) => {
  const { shoulderW, waistW, hipW, thighW, armW, calfW } = shape;
  const cx = 50, gap = 3;

  const lTX = cx - gap/2 - thighW;
  const rTX = cx + gap/2;
  const lCX = lTX + (thighW - calfW) / 2;
  const rCX = rTX + (thighW - calfW) / 2;
  const armR = Math.round(armW / 2);
  const thighR = Math.round(thighW * 0.45);
  const calfR  = Math.round(calfW * 0.45);

  return (
    <svg viewBox="0 0 100 205" width="80" height="170" style={{ transition:"all 0.3s ease", filter:active?`drop-shadow(0 0 10px ${color}88)`:"none" }}>
      {active && <ellipse cx={cx} cy={108} rx={44} ry={78} fill={glow} opacity={0.25} />}

      {/* Head */}
      <ellipse cx={cx} cy={13} rx={12} ry={13} fill={color} />
      {/* Neck */}
      <rect x={cx-5} y={25} width={10} height={12} rx={2} fill={color} />

      {/* Shoulder caps — Phase 3+ */}
      {phase >= 3 && <>
        <ellipse cx={cx - shoulderW/2 - 4} cy={39} rx={9} ry={7} fill={color} />
        <ellipse cx={cx + shoulderW/2 + 4} cy={39} rx={9} ry={7} fill={color} />
      </>}

      {/* Upper torso band */}
      <rect x={cx - shoulderW/2} y={35} width={shoulderW} height={18} rx={4} fill={color} />

      {/* Arms */}
      <rect x={cx - shoulderW/2 - armW - 2} y={37} width={armW} height={46} rx={armR} fill={color} />
      <rect x={cx + shoulderW/2 + 2}        y={37} width={armW} height={46} rx={armR} fill={color} />

      {/* Torso taper: shoulders → waist */}
      <polygon points={`${cx-shoulderW/2+3},52 ${cx+shoulderW/2-3},52 ${cx+waistW/2},88 ${cx-waistW/2},88`} fill={color} />

      {/* Waist → hips */}
      <polygon points={`${cx-waistW/2},87 ${cx+waistW/2},87 ${cx+hipW/2},107 ${cx-hipW/2},107`} fill={color} />

      {/* Hip band */}
      <rect x={cx - hipW/2} y={104} width={hipW} height={14} rx={3} fill={color} />

      {/* Thighs */}
      <rect x={lTX} y={115} width={thighW} height={42} rx={thighR} fill={color} />
      <rect x={rTX} y={115} width={thighW} height={42} rx={thighR} fill={color} />

      {/* Knees */}
      <ellipse cx={lTX + thighW/2} cy={158} rx={thighW*0.48} ry={6} fill={color} />
      <ellipse cx={rTX + thighW/2} cy={158} rx={thighW*0.48} ry={6} fill={color} />

      {/* Calves */}
      <rect x={lCX} y={161} width={calfW} height={30} rx={calfR} fill={color} />
      <rect x={rCX} y={161} width={calfW} height={30} rx={calfR} fill={color} />

      {/* Feet */}
      <ellipse cx={lCX + calfW/2} cy={193} rx={calfW*0.6} ry={4} fill={color} opacity={0.7} />
      <ellipse cx={rCX + calfW/2} cy={193} rx={calfW*0.6} ry={4} fill={color} opacity={0.7} />

      {/* Phase 3: quad sweep lines + ab center */}
      {phase >= 3 && <g stroke={`${color}55`} strokeWidth="1" fill="none">
        <line x1={cx} y1={52} x2={cx} y2={87} />
        <line x1={cx-5} y1={62} x2={cx+5} y2={62} />
        <line x1={cx-5} y1={72} x2={cx+5} y2={72} />
      </g>}

      {/* Phase 4: outer quad sweep line */}
      {phase >= 4 && <g stroke={`${color}66`} strokeWidth="1" fill="none">
        <line x1={cx-5} y1={81} x2={cx+5} y2={81} />
        <path d={`M ${lTX+3},118 Q ${lTX+1},140 ${lTX+4},156`} />
        <path d={`M ${rTX+thighW-3},118 Q ${rTX+thighW+1},140 ${rTX+thighW-4},156`} />
      </g>}

      {/* Phase label dot */}
      <circle cx={cx} cy={200} r={2.5} fill={color} opacity={0.8} />
    </svg>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,          setTab]          = useState("phases");
  const [activePhase,  setActivePhase]  = useState(4);
  const [activeMuscle, setActiveMuscle] = useState(null);
  const [showSide,     setShowSide]     = useState(false);

  const K = {
    purple:"#534AB7", purpleL:"#EEEDFE", purpleD:"#26215C",
    green:"#1D9E75",  greenL:"#E1F5EE",
    amber:"#BA7517",  amberL:"#FAEEDA",
    red:"#993C1D",    redL:"#FAECE7",
  };

  const card  = { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"14px", marginBottom:"10px" };
  const lbl   = { fontSize:"10px", color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.04em" };
  const mkBtn = (v="d",c) => ({ fontSize:"12px", padding:"6px 12px", borderRadius:"var(--border-radius-md)", border:v==="p"?"none":`0.5px solid ${c||"var(--color-border-secondary)"}`, background:v==="p"?(c||K.purple):v==="outline"?(c||"transparent")+"11":"var(--color-background-secondary)", color:v==="p"?K.purpleL:v==="outline"?(c||K.purple):"var(--color-text-secondary)", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:v==="p"?500:400 });

  const activeP = PHASES[activePhase - 1];

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem 0" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:"12px" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:"10px" }}>
          <span style={{ fontSize:"16px", fontWeight:500, letterSpacing:"-0.02em" }}>MIRRORBODY</span>
          <span style={{ fontSize:"9px", color:"var(--color-text-secondary)", letterSpacing:"0.12em", textTransform:"uppercase" }}>transformation system</span>
        </div>
      </div>

      {/* ── Goal callout ── */}
      <div style={{ padding:"10px 14px", background:K.purpleL, border:`0.5px solid ${K.purple}`, borderRadius:"var(--border-radius-lg)", marginBottom:"14px" }}>
        <div style={{ fontSize:"11px", fontWeight:500, color:K.purpleD, marginBottom:"3px" }}>◉ GOAL PHYSIQUE — DECODED</div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {["Quad sweep","Round deltoid caps","Visible abs","Full glute projection","15–18% body fat","2–4 year timeline"].map(t => (
            <span key={t} style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"10px", background:K.purple+"22", color:K.purple }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", borderBottom:"0.5px solid var(--color-border-tertiary)", marginBottom:"1.25rem" }}>
        {[["phases","Phase progression"],["muscles","Muscle map"],["decoder","What it takes"],["milestones","Milestones"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ fontSize:"12px", padding:"7px 12px", border:"none", background:"transparent", color:tab===id?"var(--color-text-primary)":"var(--color-text-secondary)", borderBottom:`2px solid ${tab===id?K.purple:"transparent"}`, fontWeight:tab===id?500:400, cursor:"pointer", fontFamily:"var(--font-sans)", whiteSpace:"nowrap" }}>{label}</button>
        ))}
      </div>

      {/* ════════════════════════════════
          PHASE PROGRESSION
      ════════════════════════════════ */}
      {tab === "phases" && (
        <div>
          {/* Phase selector buttons */}
          <div style={{ display:"flex", gap:"6px", marginBottom:"14px", justifyContent:"center" }}>
            {PHASES.map(p => (
              <button key={p.num} onClick={()=>setActivePhase(p.num)} style={{ padding:"5px 14px", borderRadius:"20px", border:`0.5px solid ${activePhase===p.num?p.color:"var(--color-border-secondary)"}`, background:activePhase===p.num?p.color+"22":"transparent", cursor:"pointer", fontSize:"11px", color:activePhase===p.num?p.color:"var(--color-text-secondary)", fontWeight:activePhase===p.num?500:400, fontFamily:"var(--font-sans)", transition:"all 0.2s" }}>
                P{p.num}
              </button>
            ))}
          </div>

          {/* 4 body figures */}
          <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"16px", padding:"16px 8px 10px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", alignItems:"flex-end", position:"relative" }}>
            {/* Progress line behind figures */}
            <div style={{ position:"absolute", bottom:"30px", left:"10%", right:"10%", height:"1px", background:"var(--color-border-tertiary)", zIndex:0 }} />
            {PHASES.map(p => (
              <div key={p.num} onClick={()=>setActivePhase(p.num)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", cursor:"pointer", transition:"all 0.2s", transform:activePhase===p.num?"scale(1.05)":"scale(0.95)", opacity:activePhase===p.num?1:0.55, zIndex:1 }}>
                <BodyFig shape={p.shape} color={p.color} glow={p.glow} phase={p.num} active={activePhase===p.num} />
                <div style={{ fontSize:"10px", fontWeight:500, color:p.color }}>{p.alias}</div>
                <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)" }}>{p.duration.split(" ")[0]+p.duration.split(" ")[1]}</div>
              </div>
            ))}
          </div>

          {/* Active phase detail */}
          <div style={{ ...card, borderColor:activeP.color }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
              <div>
                <div style={{ fontSize:"15px", fontWeight:500, color:activeP.color }}>Phase {activeP.num} — {activeP.name}</div>
                <div style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>{activeP.duration} · {activeP.alias}</div>
              </div>
              <span style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px", background:activeP.color+"22", color:activeP.color, fontWeight:500 }}>{activeP.bf}</span>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"12px" }}>
              <div>
                <div style={{ ...lbl, marginBottom:"6px" }}>What changes</div>
                {activeP.changes.map((c,i) => (
                  <div key={i} style={{ display:"flex", gap:"6px", marginBottom:"5px" }}>
                    <span style={{ color:activeP.color, flexShrink:0 }}>›</span>
                    <span style={{ fontSize:"11px", color:"var(--color-text-primary)", lineHeight:"1.4" }}>{c}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ ...lbl, marginBottom:"6px" }}>Capacity gates to advance</div>
                {activeP.gates.map((g,i) => (
                  <div key={i} style={{ display:"flex", gap:"6px", marginBottom:"5px" }}>
                    <span style={{ color:K.green, flexShrink:0, fontSize:"10px" }}>✓</span>
                    <span style={{ fontSize:"11px", color:"var(--color-text-primary)", fontFamily:"var(--font-mono)", lineHeight:"1.4" }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)" }}>
              <div style={{ ...lbl, marginBottom:"6px" }}>Expected measurement changes from Phase 1 baseline</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px" }}>
                {[["Waist",activeP.measurements.waist,K.green],["Hips",activeP.measurements.hip,activeP.color],["Thigh",activeP.measurements.thigh,activeP.color],["Shoulder",activeP.measurements.shoulder,K.amber]].map(([label,val,col])=>(
                  <div key={label} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", marginBottom:"2px", textTransform:"uppercase" }}>{label}</div>
                    <div style={{ fontSize:"11px", fontWeight:500, color:col, fontFamily:"var(--font-mono)" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phase comparison strip */}
          <div style={card}>
            <div style={{ fontSize:"12px", fontWeight:500, marginBottom:"10px" }}>Key ratio changes across all 4 phases</div>
            {PHASES.map(p => {
              const waistRatio = Math.round((p.shape.waistW / p.shape.shoulderW) * 100);
              const hipRatio   = Math.round((p.shape.hipW   / p.shape.shoulderW) * 100);
              return (
                <div key={p.num} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                  <span style={{ fontSize:"10px", color:p.color, fontWeight:500, width:"20px" }}>P{p.num}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"2px" }}>
                      <span style={{ fontSize:"9px", color:"var(--color-text-secondary)" }}>Waist-to-shoulder ratio</span>
                      <span style={{ fontSize:"9px", fontFamily:"var(--font-mono)", color:p.color }}>{waistRatio}%</span>
                    </div>
                    <div style={{ height:"5px", background:"var(--color-border-tertiary)", borderRadius:"3px", overflow:"hidden" }}>
                      <div style={{ width:`${waistRatio}%`, height:"100%", background:p.color, borderRadius:"3px", transition:"width 0.5s" }} />
                    </div>
                  </div>
                  <span style={{ fontSize:"9px", color:"var(--color-text-secondary)", width:"60px", textAlign:"right" }}>{p.alias}</span>
                </div>
              );
            })}
            <div style={{ fontSize:"10px", color:"var(--color-text-tertiary)", marginTop:"6px" }}>Lower ratio = more dramatic athletic taper. Phase 1→4 reduces from 76% → 41%.</div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          MUSCLE MAP
      ════════════════════════════════ */}
      {tab === "muscles" && (
        <div>
          <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"12px" }}>
            Every visible muscle in the goal physique — what builds it and when it shows.
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
            {MUSCLES.map(m => (
              <div key={m.key} onClick={()=>setActiveMuscle(activeMuscle===m.key?null:m.key)} style={{ padding:"10px 12px", background:activeMuscle===m.key?m.color+"22":"var(--color-background-secondary)", border:`0.5px solid ${activeMuscle===m.key?m.color:"var(--color-border-tertiary)"}`, borderRadius:"var(--border-radius-md)", cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                  <span style={{ fontSize:"12px", fontWeight:500 }}>{m.name}</span>
                  <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
                    <span style={{ fontSize:"8px", padding:"1px 5px", borderRadius:"8px", background: m.priority==="CRITICAL"?K.redL:m.priority==="HIGH"?K.amberL:K.greenL, color: m.priority==="CRITICAL"?K.red:m.priority==="HIGH"?K.amber:K.green, fontWeight:600 }}>{m.priority}</span>
                  </div>
                </div>
                <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", lineHeight:"1.4" }}>{m.desc}</div>
                <div style={{ display:"flex", gap:"4px", marginTop:"5px", flexWrap:"wrap" }}>
                  {m.exercises.slice(0,2).map(e=>(
                    <span key={e} style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"8px", background:m.color+"22", color:m.color }}>{e.split("(")[0].trim()}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {activeMuscle && (() => {
            const m = MUSCLES.find(x=>x.key===activeMuscle);
            const phaseAchieved = PHASES[m.phase - 1];
            return (
              <div style={{ ...card, borderColor:m.color }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
                  <div style={{ fontSize:"13px", fontWeight:500, color:m.color }}>{m.name} — full development plan</div>
                  <span style={{ fontSize:"10px", color:phaseAchieved.color, padding:"2px 8px", borderRadius:"10px", background:phaseAchieved.color+"22" }}>Visible: Phase {m.phase}</span>
                </div>
                <div style={{ fontSize:"12px", color:"var(--color-text-secondary)", marginBottom:"10px", lineHeight:"1.5", padding:"8px 10px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)" }}>
                  {m.detail}
                </div>
                <div style={{ ...lbl, marginBottom:"6px" }}>All exercises that build this muscle</div>
                {m.exercises.map((e,i) => (
                  <div key={i} style={{ display:"flex", gap:"8px", padding:"5px 0", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                    <span style={{ color:m.color, fontSize:"11px" }}>›</span>
                    <span style={{ fontSize:"12px", color:"var(--color-text-primary)" }}>{e}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Priority guide */}
          <div style={{ padding:"10px 12px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", marginTop:"8px" }}>
            <div style={{ fontSize:"11px", fontWeight:500, marginBottom:"6px" }}>Priority reading</div>
            {[["CRITICAL","Must train 2×/week consistently. The physique doesn't exist without this.","#FAECE7",K.red],["HIGH","Significant contributor. Training 1–2×/week plus indirect work from compound lifts.","#FAEEDA",K.amber],["MODERATE","Visible but secondary. Develops naturally from compound lifting. Add direct work at Phase 2+.","#EAF3DE",K.green]].map(([p,d,bg,col])=>(
              <div key={p} style={{ display:"flex", gap:"8px", marginBottom:"4px" }}>
                <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"8px", background:bg, color:col, fontWeight:600, flexShrink:0, height:"fit-content", marginTop:"2px" }}>{p}</span>
                <span style={{ fontSize:"10px", color:"var(--color-text-secondary)" }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          WHAT IT TAKES — GOAL DECODER
      ════════════════════════════════ */}
      {tab === "decoder" && (
        <div>
          <div style={card}>
            <div style={{ fontSize:"13px", fontWeight:500, marginBottom:"12px" }}>Goal physique — honest requirements</div>
            {[
              { icon:"📅", label:"Timeline",          val:"2–4 years consistent",    note:"The quad development in Image 1 requires 2+ years of heavy squats 2×/week. This is not a shortcut physique.",           color:K.purple },
              { icon:"🏋",  label:"Training frequency",val:"4×/week minimum (Phase 2+)", note:"The required volume cannot be compressed into 3 sessions. Upper/lower split is the minimum structure.",           color:K.amber  },
              { icon:"🥩",  label:"Protein",           val:"1g/lb bodyweight daily", note:"Every day. Not just training days. Muscle synthesis requires sustained protein availability. No exceptions.",              color:K.green  },
              { icon:"⚡",  label:"Non-negotiable lifts",val:"Squat + hip thrust + OHP",  note:"The quad sweep (squat), glute projection (hip thrust), and shoulder caps (OHP) are almost entirely these three.",  color:K.purple },
              { icon:"📊",  label:"Body fat target",   val:"15–18% — lean not extreme", note:"Visible abs at this muscle mass require reaching ~17% BF. This is a training outcome, not a crash diet outcome.",    color:K.amber  },
              { icon:"🔒",  label:"Continuity",        val:"No month+ breaks",        note:"Muscle is built over years. A 4-week break sets quad development back 6–8 weeks. Deloads are not breaks.",             color:K.green  },
              { icon:"💉",  label:"What this is NOT",  val:"Steroids are NOT required", note:"This physique is fully achievable naturally. It requires time and consistency, not shortcuts.",                        color:"var(--color-text-secondary)" },
            ].map((item,i) => (
              <div key={i} style={{ display:"flex", gap:"12px", padding:"9px 0", borderBottom:"0.5px solid var(--color-border-tertiary)", alignItems:"flex-start" }}>
                <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:item.color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", flexShrink:0 }}>{item.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:"10px", alignItems:"baseline", marginBottom:"2px", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"12px", fontWeight:500 }}>{item.label}</span>
                    <span style={{ fontSize:"11px", fontFamily:"var(--font-mono)", color:item.color }}>{item.val}</span>
                  </div>
                  <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", lineHeight:"1.5" }}>{item.note}</div>
                </div>
              </div>
            ))}
          </div>

          {/* MIRRORBODY path */}
          <div style={{ ...card, borderColor:K.purple }}>
            <div style={{ fontSize:"12px", fontWeight:500, color:K.purple, marginBottom:"10px" }}>The MIRRORBODY path to Image 1</div>
            {[
              { phase:"Phase 1  (0–6 mo)",    col:"#8C8A82", point:"Foundation. Learning the lifts. Posture changes. First 3 pull-ups." },
              { phase:"Phase 2  (6–18 mo)",   col:K.amber,   point:"Body visibly recomposing. Waist −3\". Shoulder caps starting. People notice." },
              { phase:"Phase 3  (12–24 mo)",  col:K.green,   point:"Glutes prominent. Quad sweep visible. Athletic silhouette clear. This is CurveUp." },
              { phase:"Phase 4  (24–48 mo)+", col:K.purple,  point:"The woman in Image 1 lives here. Abs visible. Quads separate. This is the goal — sealed." },
            ].map((row,i) => (
              <div key={i} style={{ display:"flex", gap:"12px", padding:"8px 0", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ width:"3px", background:row.col, borderRadius:"2px", flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:"11px", fontWeight:500, color:row.col, fontFamily:"var(--font-mono)", marginBottom:"2px" }}>{row.phase}</div>
                  <div style={{ fontSize:"11px", color:"var(--color-text-secondary)" }}>{row.point}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Weight note */}
          <div style={{ padding:"10px 14px", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", border:`0.5px solid var(--color-border-secondary)` }}>
            <div style={{ fontSize:"11px", fontWeight:500, marginBottom:"4px" }}>Why weight-based milestones (Image 2) are wrong for this goal</div>
            <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", lineHeight:"1.5" }}>
              The 230→145 lbs silhouette chart shows fat loss. The goal physique in Image 1 is body recomposition — muscle gain + fat loss simultaneously. A woman building toward that physique may weigh the same or MORE than when she started (more muscle mass) while looking dramatically different. The correct metrics are: measurements, capacity (what you can lift), and body composition — not scale weight.
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          MILESTONES — RECEIPT SYSTEM
      ════════════════════════════════ */}
      {tab === "milestones" && (
        <div>
          <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"12px" }}>
            Capacity milestones, not weight milestones. Each one sealed as a receipt.
          </div>
          {[
            {
              gate:"Gate 1", label:"Foundation Complete", phase:"P1→P2",
              color:"#8C8A82", bg:"#E8E6E0",
              criteria:[
                "Back squat: 1.0× bodyweight × 3 reps",
                "Conventional deadlift: 1.25× bodyweight × 3 reps",
                "3 strict unassisted pull-ups",
                "6 months of consistent training (no month+ breaks)",
              ],
              visual:"Body has changed visibly — posture, shoulders, waist.",
              unlock:"Upper/Lower split · 4×/week training begins",
            },
            {
              gate:"Gate 2", label:"Development Locked In", phase:"P2→P3",
              color:K.amber, bg:K.amberL,
              criteria:[
                "Back squat: 1.3× bodyweight × 3 reps",
                "Hip thrust: 1.5× bodyweight × 5 reps",
                "5 pull-ups",
                "Waist measurement down 2\"+ from baseline",
                "Shoulder measurement up 0.5\"+ from baseline",
              ],
              visual:"Shoulder caps visible. Waist narrowing clearly. Recomposition is real.",
              unlock:"Competition path selection · Path A/B/C specialization begins",
            },
            {
              gate:"Gate 3", label:"Specialization Phase", phase:"P3→P4",
              color:K.green, bg:K.greenL,
              criteria:[
                "Back squat: 1.5× bodyweight × 3 reps",
                "Hip thrust: 2.0× bodyweight × 5 reps",
                "Weighted pull-ups",
                "Quad sweep visible from front in photos",
                "Hips measurement +1\"+ from baseline",
              ],
              visual:"The athletic silhouette is clear in any clothing. People ask what you're training for.",
              unlock:"Competition prep timeline · Date Vault sealed",
            },
            {
              gate:"Gate 4", label:"Goal Physique Range", phase:"P4 target",
              color:K.purple, bg:K.purpleL,
              criteria:[
                "Back squat: 1.75× bodyweight × 3 reps",
                "Hip thrust: 2.5× bodyweight × 5 reps",
                "Deadlift: 2.0× bodyweight × 1 rep",
                "10+ weighted pull-ups",
                "Body fat 15–18% (measured or estimated)",
                "Abs visible at rest",
              ],
              visual:"The woman in Image 1. The bar doesn't grade the body — it just moves.",
              unlock:"Competition day · The private work made public.",
            },
          ].map((m, i) => (
            <div key={i} style={{ fontFamily:"var(--font-mono)", background:"var(--color-background-secondary)", border:`0.5px dashed ${m.color}`, borderRadius:"var(--border-radius-md)", padding:"14px 16px", marginBottom:"10px" }}>
              <div style={{ fontSize:"9px", color:"var(--color-text-tertiary)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"6px" }}>
                ◉ MILESTONE RECEIPT — {m.phase}
              </div>
              <div style={{ fontSize:"16px", fontWeight:500, color:m.color, marginBottom:"2px", fontFamily:"var(--font-sans)" }}>{m.gate} — {m.label}</div>
              <div style={{ height:"0.5px", background:m.color+"44", margin:"8px 0" }} />
              <div style={{ fontSize:"10px", color:"var(--color-text-secondary)", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.04em" }}>Criteria to seal this gate</div>
              {m.criteria.map((c,j) => (
                <div key={j} style={{ fontSize:"11px", color:"var(--color-text-primary)", marginBottom:"4px", display:"flex", gap:"6px" }}>
                  <span style={{ color:m.color, flexShrink:0 }}>□</span>{c}
                </div>
              ))}
              <div style={{ height:"0.5px", background:m.color+"44", margin:"8px 0" }} />
              <div style={{ fontSize:"11px", color:"var(--color-text-secondary)", marginBottom:"4px", fontStyle:"italic" }}>{m.visual}</div>
              <div style={{ fontSize:"10px", color:m.color, marginTop:"4px" }}>Unlocks: {m.unlock}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
