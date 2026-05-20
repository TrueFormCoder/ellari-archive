import { useState, useEffect, useRef } from "react";

// ─── Mantra Library ───────────────────────────────────────────────────────────
const MANTRAS = [
  // R1 — RECEIVE — Grounding / Intake
  { id:"m01", reg:"R1", name:"RECEIVE",    delivery:"Calm",    context:"session-open",
    phrase:"En var-a sa sel.",
    ipa:"/ɛn ˈvaɾ.a sa sel/",
    gloss:"I see the star.",
    note:"Open. Intake without distortion. Begin here." },
  { id:"m02", reg:"R1", name:"RECEIVE",    delivery:"Calm",    context:"session-open",
    phrase:"En var-a sa rola vi sa triem.",
    ipa:"/ɛn ˈvaɾ.a sa ˈɾo.la vi sa ˈtri.em/",
    gloss:"I see the role within the triad-field.",
    note:"Recognition before declaration. R1 always runs first." },

  // R2 — COMPILE — Pattern recognition
  { id:"m03", reg:"R2", name:"COMPILE",    delivery:"Plain",   context:"mid-session",
    phrase:"En mel-a ki sa triem es luma.",
    ipa:"/ɛn ˈmel.a ki sa ˈtri.em es ˈlu.ma/",
    gloss:"I say that the triad is bright.",
    note:"Neutral diagnostic. State what is true, not what you wish." },
  { id:"m04", reg:"R2", name:"COMPILE",    delivery:"Plain",   context:"mid-session",
    phrase:"En mel-a ki sa triem es dala.",
    ipa:"/ɛn ˈmel.a ki sa ˈtri.em es ˈda.la/",
    gloss:"I say that the triad is dark.",
    note:"Honest compile. Name it accurately before you move it." },

  // R3 — EMIT — Declaration
  { id:"m05", reg:"R3", name:"EMIT",       delivery:"Decisive", context:"training-peak",
    phrase:"En es en.",
    ipa:"/ɛn es ɛn/",
    gloss:"I am myself.",
    note:"The irreducible declaration. Three words. Full stop." },
  { id:"m06", reg:"R3", name:"EMIT",       delivery:"Decisive", context:"training-peak",
    phrase:"Lo es rola de en.",
    ipa:"/lo es ˈɾo.la de ɛn/",
    gloss:"This is not my role.",
    note:"Boundary declaration. No elaboration required." },
  { id:"m07", reg:"R3", name:"EMIT",       delivery:"Solemn",  context:"training-peak",
    phrase:"El-es ri es sa rus de en.",
    ipa:"/ˈel.es ɾi es sa ɾus de ɛn/",
    gloss:"Essence-resonance is my core.",
    note:"Identity creed. Slight vowel length allowed. The slowest R3." },

  // R4 — GUIDE — Directive / Release
  { id:"m08", reg:"R4", name:"GUIDE",      delivery:"Decisive", context:"session-close",
    phrase:"En del-te rola.",
    ipa:"/ɛn ˈdel.te ˈɾo.la/",
    gloss:"I unbind from the role.",
    note:"Post-session release. Exit the weight of the day's field." },
  { id:"m09", reg:"R4", name:"GUIDE",      delivery:"Decisive", context:"session-close",
    phrase:"En dam-te fa triem.",
    ipa:"/ɛn ˈdam.te fa ˈtri.em/",
    gloss:"I step out of the triad-field.",
    note:"Hard exit. Run after En del-te rola for full perimeter close." },
  { id:"m10", reg:"R4", name:"GUIDE",      delivery:"Solemn",  context:"competition",
    phrase:"Na lo var-te en sa rola.",
    ipa:"/na lo ˈvaɾ.te ɛn sa ˈɾo.la/",
    gloss:"I did not see myself as the role.",
    note:"Night-before competition perimeter seal. R4 boundary holds until receipt." },

  // R5 — RESONATE — Apex
  { id:"m11", reg:"R5", name:"RESONATE",   delivery:"Solemn",  context:"competition",
    phrase:"El'rasha Veinon Kaltra.",
    ipa:"/el ˈɾa.ʃa ˈve.non ˈkal.tɾa/",
    gloss:"The self-named departure · beyond bloodline · covenant fire carrier.",
    note:"Apex seal. On-deck activation. All registers running simultaneously." },

  // Training-register phrases (English in Aetherion register)
  { id:"m12", reg:"R3", name:"EMIT",       delivery:"Decisive", context:"training-peak",
    phrase:"Psychic Precision.",
    ipa:"",
    gloss:"Oracle Voiceprint · Part I",
    note:"The body knows what the mind trained it toward. Precision is the output." },
  { id:"m13", reg:"R3", name:"EMIT",       delivery:"Decisive", context:"training-peak",
    phrase:"Dangerous Clarity.",
    ipa:"",
    gloss:"Oracle Voiceprint · Part II",
    note:"No ambiguity about what this body is and what it has done." },
  { id:"m14", reg:"R4", name:"GUIDE",      delivery:"Decisive", context:"training-peak",
    phrase:"No Mercy.",
    ipa:"",
    gloss:"Oracle Voiceprint · Part III",
    note:"For the external standard that tried to define you before you got here." },
];

// ─── Session modes ────────────────────────────────────────────────────────────
const MODES = {
  session:     { label:"Training session", color:"#534AB7", bg:"#EEEDFE", regs:["R1","R2","R3","R4"], desc:"Opens with R1 grounding. Builds through R2→R3 peak. Closes with R4 release." },
  daily:       { label:"Daily ambient",    color:"#1D9E75", bg:"#E1F5EE", regs:["R1","R2","R3","R4","R5"], desc:"Full register cycle. One phrase per interval throughout the day." },
  competition: { label:"Competition day",  color:"#E84B9A", bg:"#FDE8F4", regs:["R4","R5"], desc:"Night-before and on-deck sequence only. Two mantras. Nothing else required." },
  manual:      { label:"Manual",           color:"#BA7517", bg:"#FAEEDA", regs:["R1","R2","R3","R4","R5"], desc:"Select any register or phrase manually." },
};

const REG_COLORS = { R1:"#1D9E75", R2:"#534AB7", R3:"#D85A30", R4:"#E84B9A", R5:"#BA7517" };
const REG_LABELS = { R1:"Receive", R2:"Compile", R3:"Emit", R4:"Guide", R5:"Resonate" };

const INTERVALS = [
  { label:"5 min",  val:5  },
  { label:"10 min", val:10 },
  { label:"15 min", val:15 },
  { label:"30 min", val:30 },
  { label:"1 hour", val:60 },
];

function pad(n){ return String(n).padStart(2,"0"); }
function fmt(s){ return `${pad(Math.floor(s/60))}:${pad(s%60)}`; }

export default function App() {
  const [mode,       setMode]    = useState("session");
  const [regFilter,  setRegF]    = useState("all");
  const [idx,        setIdx]     = useState(0);
  const [running,    setRunning] = useState(false);
  const [interval,   setIval]    = useState(15);
  const [remaining,  setRemain]  = useState(15*60);
  const [completed,  setComp]    = useState([]);
  const [showIPA,    setIPA]     = useState(false);
  const [tab,        setTab]     = useState("timer");
  const timerRef = useRef(null);

  const modeData  = MODES[mode];
  const filtered  = MANTRAS.filter(m =>
    (regFilter === "all" || m.reg === regFilter) &&
    (mode === "manual" || modeData.regs.includes(m.reg))
  );
  const current   = filtered[idx % Math.max(filtered.length,1)];
  const regColor  = current ? REG_COLORS[current.reg] : "#534AB7";

  useEffect(() => {
    setIdx(0); setRemain(interval * 60); setRunning(false);
    if(timerRef.current) clearInterval(timerRef.current);
  }, [mode, interval]);

  useEffect(() => {
    if(timerRef.current) clearInterval(timerRef.current);
    if(running) {
      timerRef.current = setInterval(() => {
        setRemain(r => {
          if(r <= 1) {
            setIdx(i => (i+1) % Math.max(filtered.length,1));
            setComp(c => [...c, current?.id]);
            return interval * 60;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running, interval, filtered.length, current]);

  const progress = 1 - (remaining / (interval * 60));
  const circ = 2 * Math.PI * 52;

  const C = {
    bg:"var(--color-background-primary)",
    bg2:"var(--color-background-secondary)",
    border:"var(--color-border-tertiary)",
    text:"var(--color-text-primary)",
    sub:"var(--color-text-secondary)",
  };
  const btn = (v="d",col="#534AB7") => ({
    fontSize:"11px", padding:"6px 12px", borderRadius:"var(--border-radius-md)",
    border:v==="p"?"none":`0.5px solid ${C.border}`,
    background:v==="p"?col:C.bg2, color:v==="p"?"white":C.sub,
    cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:v==="p"?500:400,
  });

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1rem 0" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"12px" }}>
        <div>
          <span style={{ fontSize:"15px", fontWeight:500, letterSpacing:"-0.01em" }}>Aetherion</span>
          <span style={{ fontSize:"9px", color:C.sub, letterSpacing:"0.1em", marginLeft:"8px", textTransform:"uppercase" }}>mantra timer</span>
        </div>
        <div style={{ fontSize:"10px", color:C.sub }}>{completed.length} completed today</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`0.5px solid ${C.border}`, marginBottom:"1rem" }}>
        {[["timer","Timer"],["library","Library"],["guide","Delivery guide"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ fontSize:"11px", padding:"6px 10px", border:"none", background:"transparent", color:tab===id?C.text:C.sub, borderBottom:`2px solid ${tab===id?"#534AB7":"transparent"}`, fontWeight:tab===id?500:400, cursor:"pointer", fontFamily:"var(--font-sans)" }}>{lbl}</button>
        ))}
      </div>

      {tab === "timer" && (
        <div>
          {/* Mode selector */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"6px", marginBottom:"14px" }}>
            {Object.entries(MODES).map(([id,m])=>(
              <div key={id} onClick={()=>setMode(id)} style={{ padding:"8px 10px", borderRadius:"var(--border-radius-md)", border:`0.5px solid ${mode===id?m.color:C.border}`, background:mode===id?m.bg:C.bg, cursor:"pointer" }}>
                <div style={{ fontSize:"11px", fontWeight:500, color:mode===id?m.color:C.text }}>{m.label}</div>
                <div style={{ fontSize:"9px", color:C.sub, marginTop:"1px" }}>{m.desc.split(".")[0]}.</div>
              </div>
            ))}
          </div>

          {/* Timer circle */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:"16px" }}>
            <div style={{ position:"relative", width:"128px", height:"128px" }}>
              <svg width="128" height="128" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="64" cy="64" r="52" fill="none" stroke={C.border} strokeWidth="3"/>
                <circle cx="64" cy="64" r="52" fill="none" stroke={regColor} strokeWidth="3"
                  strokeDasharray={circ} strokeDashoffset={circ*(1-progress)} strokeLinecap="round"
                  style={{ transition:"stroke-dashoffset 0.5s ease, stroke 0.3s" }}/>
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <div style={{ fontSize:"22px", fontWeight:500, fontFamily:"var(--font-mono)", color:regColor }}>{fmt(remaining)}</div>
                <div style={{ fontSize:"9px", color:C.sub }}>until next</div>
              </div>
            </div>

            <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
              <button onClick={()=>setRunning(r=>!r)} style={{ ...btn("p", regColor), padding:"8px 20px", fontSize:"12px" }}>
                {running ? "Pause" : "Start"}
              </button>
              <button onClick={()=>{ setRunning(false); setRemain(interval*60); setIdx(0); }} style={btn()}>Reset</button>
              <button onClick={()=>{ setIdx(i=>(i+1)%Math.max(filtered.length,1)); setRemain(interval*60); }} style={btn()}>Skip ›</button>
            </div>

            {/* Interval selector */}
            <div style={{ display:"flex", gap:"5px", marginTop:"10px" }}>
              {INTERVALS.map(iv=>(
                <button key={iv.val} onClick={()=>setIval(iv.val)} style={{ ...btn(interval===iv.val?"p":"d", regColor), padding:"3px 8px" }}>{iv.label}</button>
              ))}
            </div>
          </div>

          {/* Current mantra */}
          {current && (
            <div style={{ background:C.bg2, borderRadius:"var(--border-radius-lg)", padding:"16px 18px", border:`0.5px solid ${regColor}44`, marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                  <span style={{ fontSize:"9px", padding:"2px 8px", borderRadius:"10px", background:REG_COLORS[current.reg], color:"white", fontWeight:500 }}>{current.reg} · {REG_LABELS[current.reg]}</span>
                  <span style={{ fontSize:"9px", padding:"2px 8px", borderRadius:"10px", background:`${regColor}22`, color:regColor }}>{current.delivery}</span>
                </div>
                <button onClick={()=>setIPA(v=>!v)} style={{ ...btn(), fontSize:"10px", padding:"2px 8px" }}>{showIPA?"hide IPA":"IPA"}</button>
              </div>

              <div style={{ fontSize:"19px", fontWeight:500, color:C.text, lineHeight:1.4, marginBottom:"8px", letterSpacing:"-0.01em" }}>{current.phrase}</div>
              {showIPA && current.ipa && (
                <div style={{ fontSize:"12px", color:"#534AB7", fontFamily:"var(--font-mono)", marginBottom:"6px" }}>{current.ipa}</div>
              )}
              <div style={{ fontSize:"12px", color:C.sub, fontStyle:"italic", marginBottom:"6px" }}>{current.gloss}</div>
              <div style={{ fontSize:"10px", color:C.sub, borderTop:`0.5px solid ${C.border}`, paddingTop:"8px", lineHeight:1.5 }}>{current.note}</div>
            </div>
          )}

          {/* Register filter */}
          {mode === "manual" && (
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
              {["all","R1","R2","R3","R4","R5"].map(r=>(
                <button key={r} onClick={()=>setRegF(r)} style={{ ...btn(regFilter===r?"p":"d", r==="all"?"#534AB7":REG_COLORS[r]), padding:"3px 9px" }}>
                  {r === "all" ? "All" : `${r} · ${REG_LABELS[r]}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "library" && (
        <div>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"12px" }}>
            {["all","R1","R2","R3","R4","R5"].map(r=>(
              <button key={r} onClick={()=>setRegF(r)} style={{ ...btn(regFilter===r?"p":"d", r==="all"?"#534AB7":REG_COLORS[r]), padding:"3px 9px" }}>
                {r === "all" ? "All" : `${r}`}
              </button>
            ))}
          </div>
          {MANTRAS.filter(m => regFilter==="all" || m.reg===regFilter).map(m => (
            <div key={m.id} onClick={()=>{ const fi=filtered.findIndex(f=>f.id===m.id); if(fi>=0){setIdx(fi);setTab("timer");} }} style={{ background:C.bg2, border:`0.5px solid ${REG_COLORS[m.reg]}44`, borderLeft:`2px solid ${REG_COLORS[m.reg]}`, borderRadius:"0 var(--border-radius-md) var(--border-radius-md) 0", padding:"10px 12px", marginBottom:"6px", cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                <div style={{ display:"flex", gap:"5px" }}>
                  <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"8px", background:REG_COLORS[m.reg], color:"white" }}>{m.reg}</span>
                  <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"8px", background:`${REG_COLORS[m.reg]}22`, color:REG_COLORS[m.reg] }}>{m.delivery}</span>
                </div>
                <span style={{ fontSize:"9px", color:C.sub }}>{m.context}</span>
              </div>
              <div style={{ fontSize:"13px", fontWeight:500, color:C.text, marginBottom:"2px" }}>{m.phrase}</div>
              {m.ipa && <div style={{ fontSize:"10px", color:"#534AB7", fontFamily:"var(--font-mono)", marginBottom:"2px" }}>{m.ipa}</div>}
              <div style={{ fontSize:"10px", color:C.sub, fontStyle:"italic" }}>{m.gloss}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "guide" && (
        <div>
          <div style={{ fontSize:"11px", color:C.sub, marginBottom:"12px", lineHeight:1.6 }}>
            Five registers, one sequence. R1 always runs before R3. You cannot declare your way to grounding. The sequence is architecture, not preference.
          </div>
          {Object.entries(REG_COLORS).map(([reg, col]) => (
            <div key={reg} style={{ background:C.bg2, border:`0.5px solid ${col}44`, borderRadius:"var(--border-radius-lg)", padding:"12px 14px", marginBottom:"8px" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"6px" }}>
                <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"10px", background:col, color:"white", fontWeight:500 }}>{reg}</span>
                <span style={{ fontSize:"13px", fontWeight:500 }}>{REG_LABELS[reg]}</span>
              </div>
              <div style={{ fontSize:"11px", color:C.sub, lineHeight:1.6 }}>
                {reg==="R1" && "Intake. Receptive. Opening statement. The mouth opens to ask, not to declare. SHA'AL register. No declarations before this runs."}
                {reg==="R2" && "Processing. Pattern recognition. Recognition statement: I see the pattern. The body knows. Neutral diagnostic — state what is true, not what you wish it were."}
                {reg==="R3" && "Output. Truth into form. Declaration. The ESH fire-form. Where the incantations live. Only activated after R1 reception has run."}
                {reg==="R4" && "Directive. Routing. Command. VAESHA gate function applied as speech. Perimeter close. Run at session end and night-before competition."}
                {reg==="R5" && "Apex. All four registers running simultaneously. El'rasha Veinon Kaltra lives here. On-deck activation. Resonance — not a higher volume of R3, a different state entirely."}
              </div>
              <div style={{ marginTop:"8px", borderTop:`0.5px solid ${C.border}`, paddingTop:"6px" }}>
                <div style={{ fontSize:"9px", color:C.sub, marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Example phrase</div>
                {MANTRAS.filter(m=>m.reg===reg).slice(0,1).map(m=>(
                  <div key={m.id}>
                    <div style={{ fontSize:"12px", fontWeight:500 }}>{m.phrase}</div>
                    {m.ipa && <div style={{ fontSize:"10px", color:"#534AB7", fontFamily:"var(--font-mono)" }}>{m.ipa}</div>}
                    <div style={{ fontSize:"10px", color:C.sub, fontStyle:"italic" }}>{m.gloss}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ padding:"12px 14px", background:C.bg2, borderRadius:"var(--border-radius-lg)", border:`0.5px solid ${C.border}`, marginTop:"4px" }}>
            <div style={{ fontSize:"11px", fontWeight:500, marginBottom:"6px" }}>Session sequence</div>
            {[["Session open","R1 grounding × 2 mantras","10 min before lifting"],
              ["Warm-up","R2 compile × 1–2 mantras","Pattern recognition"],
              ["Training peak","R3 declaration × 2–3 mantras","At maximum intensity"],
              ["Session close","R4 release × 2 mantras","Final set or cooldown"],
              ["Competition only","R5 apex · El'rasha Veinon Kaltra","On-deck, not before"],
            ].map(([phase, mant, when])=>(
              <div key={phase} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:`0.5px solid ${C.border}`, fontSize:"11px" }}>
                <span style={{ fontWeight:500 }}>{phase}</span>
                <span style={{ color:C.sub }}>{when}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
