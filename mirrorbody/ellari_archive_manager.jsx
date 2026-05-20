import { useState, useEffect } from "react";

// ─── Seed data from actual CSV files ─────────────────────────────────────────
const SEED_VAULT = [
  { id:"dv001", title:"Secret Launch Prep Date", locked:"2025-06-30",
    reveal:"2025-12-27", status:"past", condition:"180 days after lock",
    path:"ELARRI.AI → BlackMirror Archive → TOO HOT Collection",
    control:"Seal-level asset" },
  { id:"dv002", title:"DNA Flame Alignment — Step 9 Unlock", locked:"2025-10-06",
    reveal:"2025-10-06", status:"past", condition:"Day after 10/05/25",
    path:"ELARRI.AI → BlackMirror Archive → Spell Ritual Artifacts → Time-Locked Flame Sequence",
    control:"Narrative weapon" },
];

const SEED_ASSETS = [
  { id:"a001",  title:"Art — DNA Flame Alignment",    file:"art_dna_flame_alignment.png",    cat:"art",   sub:"Legacy Lock",       status:"active", note:"Step 9 alignment art. Embodiment rite." },
  { id:"a002",  title:"Art — Flame Invocation",       file:"art_flame_invocation.png",       cat:"art",   sub:"Legacy Lock",       status:"active", note:"Final cloak / invocation visual." },
  { id:"a003",  title:"Art — Headphones Glamour",     file:"art_headphones_glamour.png",     cat:"art",   sub:"Legacy Lock",       status:"active", note:"Audio glyph and sound magic anchor." },
  { id:"a004",  title:"Art — Launch Fire Queen",      file:"art_launch_fire_queen.png",      cat:"art",   sub:"Legacy Lock",       status:"active", note:"Launch-prep fire queen. Tied to secret prep date." },
  { id:"a005",  title:"Art — Mess With the Best",     file:"art_mess_with_the_best.png",     cat:"art",   sub:"Legacy Lock",       status:"active", note:"Digital boundary protocol art." },
  { id:"a006",  title:"Art — MIB Watchers",           file:"art_mib_watchers.png",           cat:"art",   sub:"Legacy Lock",       status:"active", note:"Firewall / watcher control art." },
  { id:"a007",  title:"Art — MIRROR Product Line",    file:"art_mirror_product_line.png",    cat:"art",   sub:"Legacy Lock",       status:"active", note:"Core MIRROR product visual." },
  { id:"a008",  title:"Art — Naci Monument",          file:"art_naci_monument.png",          cat:"art",   sub:"Legacy Lock",       status:"active", note:"Closure monument. Memory unbinding and endings." },
  { id:"a009",  title:"Art — Quiet Flame Portrait",   file:"art_quiet_flame_portrait.png",   cat:"art",   sub:"Legacy Lock",       status:"active", note:"Sovereignty and quiet-flame portrait." },
  { id:"a010",  title:"Art — Still Blocked Comic",    file:"art_still_blocked_comic.png",    cat:"art",   sub:"Legacy Lock",       status:"active", note:"Boundary and social exit visual." },
  { id:"a011",  title:"Art — Underwater Depth Queen", file:"art_underwater_depth_queen.png", cat:"art",   sub:"Legacy Lock",       status:"active", note:"Reality reset and depth-queen visual." },
  { id:"a012",  title:"Art — Violet Fairy Sigil",     file:"art_violet_fairy_sigil.png",     cat:"art",   sub:"Legacy Lock",       status:"active", note:"Protection and sigil mood art." },
  { id:"a013",  title:"Cover — Black Fairy Spell Book",file:"cover_black_fairy_spell_book.png",cat:"art", sub:"Legacy Lock",       status:"active", note:"Primary cover art." },
  { id:"a014",  title:"Sigil Index Plate",            file:"sigil_index_plate.png",          cat:"art",   sub:"Legacy Lock",       status:"active", note:"Original tall sigil sheet." },
  { id:"a015",  title:"Sigil Index Plate — Compact",  file:"sigil_index_plate_compact.png",  cat:"art",   sub:"Legacy Lock",       status:"active", note:"Compact sigil sheet for final document." },
  { id:"a016",  title:"Sigil — Audio Gate",           file:"sigil_audio_gate.png",           cat:"sigil", sub:"Sound + Sigil Vault",status:"active", note:"Original custom sigil design." },
  { id:"a017",  title:"Sigil — DNA Flame",            file:"sigil_dna_flame.png",            cat:"sigil", sub:"Sound + Sigil Vault",status:"active", note:"Original custom sigil design." },
  { id:"a018",  title:"Sigil — Mirror Seal",          file:"sigil_mirror_seal.png",          cat:"sigil", sub:"Sound + Sigil Vault",status:"active", note:"Original custom sigil design." },
  { id:"a019",  title:"Sigil — Shadowlight Shield",   file:"sigil_shadowlight_shield.png",   cat:"sigil", sub:"Sound + Sigil Vault",status:"active", note:"Original custom sigil design." },
  { id:"a020",  title:"Sigil — Spiral Release",       file:"sigil_spiral_release.png",       cat:"sigil", sub:"Sound + Sigil Vault",status:"active", note:"Original custom sigil design." },
];

const SUGGESTED_VAULT = [
  { title:"ELARRI Public Debut Window", condition:"3 artifacts deployed and receipted", path:"ELARRI.AI → BlackMirror Archive → Forward Lock", control:"Seal-level asset" },
  { title:"Audio Anthem Seal (Vol.001 Slot 5)", condition:"Original ELARRI anthem completed", path:"ELARRI.AI → BlackMirror Archive → Sound + Sigil Vault", control:"Narrative weapon" },
  { title:"MIRRORBODY Pre-Launch", condition:"Waitlist reaches 100 paid signups", path:"ELARRI.AI → BlackMirror Archive → MIRRORBODY → Commercial", control:"Seal-level asset" },
  { title:"MIRRORBODY Competition Date", condition:"Phase 3 gate criteria met", path:"ELARRI.AI → BlackMirror Archive → MIRRORBODY → Training", control:"Seal-level asset" },
];

const PENDING_ASSETS = [
  { title:"MIRRORBODY Training Tracker",    file:"mirrorbody_tracker.jsx",           cat:"product/app", sub:"MIRRORBODY → Training" },
  { title:"MIRRORBODY Wellness Vault",      file:"mirrorbody_wellness.jsx",          cat:"product/app", sub:"MIRRORBODY → Wellness" },
  { title:"MIRRORBODY Weigh-In Vault",      file:"mirrorbody_weighin.jsx",           cat:"product/app", sub:"MIRRORBODY → Wellness" },
  { title:"MIRRORBODY Becoming Tracker",    file:"mirrorbody_becoming.jsx",          cat:"product/app", sub:"MIRRORBODY → Identity" },
  { title:"MIRRORBODY Transformation Visual",file:"mirrorbody_transformation.jsx",   cat:"visual",      sub:"MIRRORBODY → Visuals" },
  { title:"L-sit → Handstand Skill Tree",   file:"mirrorbody_lsit_handstand_tree.html",cat:"visual",   sub:"MIRRORBODY → Visuals" },
  { title:"MIRRORBODY Exercise Library",    file:"mirrorbody_weekly_schedule.html",  cat:"reference",   sub:"MIRRORBODY → Training" },
  { title:"MIRRORBODY Financial Model",     file:"mirrorbody_financial_model.jsx",   cat:"financial",   sub:"MIRRORBODY → Commercial" },
  { title:"ELLARI Ecosystem Architecture",  file:"ellari_archive_manager.jsx",       cat:"infrastructure",sub:"ELARRI.AI → System Docs" },
];

const ACTIONS = [
  { id:"act1", priority:"now",    label:"Deploy MIRROR™ Path B declaration",     detail:"Paste into brand governance document. Establishes scope before Path A build.",      done:false },
  { id:"act2", priority:"now",    label:"Add 3 forward Date Vault entries",       detail:"ELARRI Public Debut + Audio Anthem + MIRRORBODY Pre-Launch. Activates vault governance.", done:false },
  { id:"act3", priority:"now",    label:"Register 9 unregistered assets",         detail:"Everything built in this session. Use the registry tab add form.",                   done:false },
  { id:"act4", priority:"now",    label:"Update GG_CrossProject_Log Entry 001",   detail:"Change 'to be created' → 'LIVE — public — created 2026-05-18'.",                  done:false },
  { id:"act5", priority:"week",   label:"Commit MIRRORBODY artifacts to GitHub",  detail:"mkdir mirrorbody/ + add all .jsx/.html files + git commit + push.",                 done:false },
  { id:"act6", priority:"week",   label:"W199: Segregate personal legal docs",    detail:"Create MindMirror™ + RSE Product Development Record stripped of personal content.", done:false },
  { id:"act7", priority:"week",   label:"Add entry 010+ to GG_CrossProject_Log", detail:"Summarize today's MIRRORBODY session. Commit to repo.",                             done:false },
  { id:"act8", priority:"week",   label:"Close past Date Vault entries formally", detail:"Add note to each: 'threshold passed [date], archived'. Prevents confusion.",        done:false },
  { id:"act9", priority:"90d",    label:"MIRROR™ Path A: SealForge backend",      detail:"POST /v1/seal → hash + timestamp + SGT-ID per asset. Cryptographic verification.", done:false },
  { id:"act10",priority:"90d",    label:"Create ellari-commercial private repo",  detail:"gh repo create ellari-commercial --private. Separate from public canon repo.",      done:false },
  { id:"act11",priority:"90d",    label:"OSF deposit — new target date",          detail:"Original June 2025 deadline passed. Set new date for 11-file deposit.",             done:false },
  { id:"act12",priority:"90d",    label:"Test session-start protocol",            detail:"New Claude window → fetch raw.githubusercontent.com/.../GG_CrossProject_Log.md",   done:false },
];

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); } catch { return d; } };
const daysPast = d => Math.floor((new Date() - new Date(d)) / 86400000);

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  purple:"#534AB7", purpleL:"#EEEDFE", purpleD:"#26215C",
  teal:"#1D9E75",   tealL:"#E1F5EE",
  coral:"#D85A30",  coralL:"#FAECE7",
  amber:"#BA7517",  amberL:"#FAEEDA",
  gray:"#5F5E5A",   grayL:"#F1EFE8",
  red:"#A32D2D",    redL:"#FCEBEB",
};
const priorityColor = p => p==="now"?C.red:p==="week"?C.amber:C.gray;
const priorityLabel = p => p==="now"?"Now":p==="week"?"This week":"90 days";

export default function App() {
  const [tab,      setTab]    = useState("vault");
  const [vault,    setVault]  = useState([]);
  const [assets,   setAssets] = useState([]);
  const [actions,  setActs]   = useState([]);
  const [loading,  setLoading]= useState(true);
  const [adding,   setAdding] = useState(null);
  const [form,     setForm]   = useState({});
  const [filter,   setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("ea_vault");   if (r) setVault(JSON.parse(r.value));   else setVault([]); } catch { setVault([]); }
      try { const r = await window.storage.get("ea_assets");  if (r) setAssets(JSON.parse(r.value));  else setAssets([]); } catch { setAssets([]); }
      try { const r = await window.storage.get("ea_actions"); if (r) setActs(JSON.parse(r.value));   else setActs(ACTIONS.map(a=>({...a}))); } catch { setActs(ACTIONS.map(a=>({...a}))); }
      setLoading(false);
    })();
  }, []);

  const save = async (key, val) => { try { await window.storage.set(key, JSON.stringify(val)); } catch {} };

  const allVault  = [...SEED_VAULT,  ...vault];
  const allAssets = [...SEED_ASSETS, ...assets];

  const addVaultEntry = async () => {
    if (!form.title || !form.locked || !form.condition) return;
    const entry = { id:`dv${Date.now()}`, ...form, status:"active", reveal: form.reveal || "" };
    const updated = [...vault, entry];
    setVault(updated); await save("ea_vault", updated);
    setAdding(null); setForm({});
  };

  const addAssetEntry = async () => {
    if (!form.title || !form.file) return;
    const entry = { id:`a${Date.now()}`, ...form, status:"active", note: form.note || "" };
    const updated = [...assets, entry];
    setAssets(updated); await save("ea_assets", updated);
    setAdding(null); setForm({});
  };

  const toggleAction = async (id) => {
    const updated = actions.map(a => a.id===id ? {...a, done:!a.done} : a);
    setActs(updated); await save("ea_actions", updated);
  };

  const addSuggestedVault = async (s) => {
    const entry = { id:`dv${Date.now()}`, title:s.title, locked:today(), reveal:"",
                    status:"active", condition:s.condition, path:s.path, control:s.control };
    const updated = [...vault, entry];
    setVault(updated); await save("ea_vault", updated);
  };

  const addPendingAsset = async (p) => {
    const entry = { id:`a${Date.now()}`, ...p, status:"active", note:`Unregistered — added ${today()}` };
    const updated = [...assets, entry];
    setAssets(updated); await save("ea_assets", updated);
  };

  const card  = { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"12px 14px", marginBottom:"8px" };
  const inp   = { fontSize:"12px", padding:"6px 9px", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", width:"100%", boxSizing:"border-box" };
  const btn   = (v="d") => ({ fontSize:"11px", padding:"5px 10px", borderRadius:"var(--border-radius-md)", border:v==="p"?"none":"0.5px solid var(--color-border-secondary)", background:v==="p"?C.purple:"var(--color-background-secondary)", color:v==="p"?"#EEEDFE":"var(--color-text-secondary)", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:v==="p"?500:400 });

  if (loading) return <div style={{padding:"2rem",fontFamily:"var(--font-mono)",fontSize:"12px",color:"var(--color-text-secondary)"}}>loading archive...</div>;

  const doneCount   = actions.filter(a=>a.done).length;
  const vaultActive = allVault.filter(v=>v.status==="active").length;
  const vaultPast   = allVault.filter(v=>v.status==="past").length;

  return (
    <div style={{fontFamily:"var(--font-sans)",padding:"1rem 0"}}>

      <div style={{marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
        <div>
          <span style={{fontSize:"15px",fontWeight:500,letterSpacing:"-0.01em"}}>Archive + Vault</span>
          <span style={{fontSize:"9px",color:"var(--color-text-secondary)",letterSpacing:"0.1em",marginLeft:"8px",textTransform:"uppercase"}}>ELLARI Inc</span>
        </div>
        <div style={{fontSize:"10px",color:"var(--color-text-tertiary)",fontFamily:"var(--font-mono)"}}>as of {today()}</div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px",marginBottom:"14px"}}>
        {[
          { label:"Date vault entries", val:allVault.length,  sub:`${vaultPast} past · ${vaultActive} active`, col:vaultPast>0?C.red:C.teal },
          { label:"Registered assets",  val:allAssets.length, sub:`${PENDING_ASSETS.length} pending`,          col:C.purple },
          { label:"Actions",            val:actions.length,   sub:`${doneCount} done`,                         col:doneCount===actions.length?C.teal:C.amber },
          { label:"Repo commits",       val:2,                sub:"pending: MIRRORBODY",                       col:C.coral },
        ].map(s=>(
          <div key={s.label} style={{padding:"8px 10px",background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",textAlign:"center"}}>
            <div style={{fontSize:"8px",color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"2px"}}>{s.label}</div>
            <div style={{fontSize:"20px",fontWeight:500,color:s.col,fontFamily:"var(--font-mono)",lineHeight:1.1}}>{s.val}</div>
            <div style={{fontSize:"8px",color:"var(--color-text-tertiary)",marginTop:"1px"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"0.5px solid var(--color-border-tertiary)",marginBottom:"1rem",gap:"2px"}}>
        {[["vault","Date vault"],["assets","Asset registry"],["repo","Repo status"],["actions","Actions"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{fontSize:"11px",padding:"6px 10px",border:"none",background:"transparent",color:tab===id?"var(--color-text-primary)":"var(--color-text-secondary)",borderBottom:`2px solid ${tab===id?C.purple:"transparent"}`,fontWeight:tab===id?500:400,cursor:"pointer",fontFamily:"var(--font-sans)",whiteSpace:"nowrap"}}>{lbl}</button>
        ))}
      </div>

      {/* ── DATE VAULT ──────────────────────────────────── */}
      {tab==="vault" && (
        <div>
          <div style={{fontSize:"11px",color:"var(--color-text-secondary)",marginBottom:"12px",lineHeight:"1.6"}}>
            Principle: <em>"Not everything needs release. Some assets are stronger when locked."</em> Each entry has a lock date, a reveal condition, and an archive path.
          </div>

          {allVault.map(v=>{
            const past = v.status==="past";
            const bc   = past ? C.redL : C.purpleL;
            const tc   = past ? C.red  : C.purple;
            return (
              <div key={v.id} style={{...card,borderColor:past?C.red:C.purple,background:bc}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"12px",fontWeight:500,color:past?C.red:C.purpleD,marginBottom:"3px"}}>{v.title}</div>
                    <div style={{fontSize:"10px",color:tc,fontFamily:"var(--font-mono)",marginBottom:"4px"}}>
                      locked {fmtDate(v.locked)}{v.reveal ? ` → reveal ${fmtDate(v.reveal)}` : ""} {v.condition ? `· ${v.condition}` : ""}
                    </div>
                    <div style={{fontSize:"9px",color:"var(--color-text-tertiary)"}}>{v.path}</div>
                  </div>
                  <span style={{fontSize:"9px",padding:"2px 7px",borderRadius:"10px",background:past?C.red:C.purple,color:"white",whiteSpace:"nowrap",flexShrink:0}}>{past?"past":v.status}</span>
                </div>
                {past && (
                  <div style={{marginTop:"6px",padding:"5px 8px",background:"rgba(163,45,45,0.08)",borderRadius:"4px",fontSize:"9px",color:C.red}}>
                    Threshold passed {daysPast(v.reveal)} days ago — close with an archive note, then add a forward entry.
                  </div>
                )}
              </div>
            );
          })}

          {/* Suggested forward entries */}
          <div style={{marginTop:"14px",marginBottom:"8px",fontSize:"11px",fontWeight:500,color:"var(--color-text-secondary)"}}>Suggested forward entries — tap to add</div>
          {SUGGESTED_VAULT.filter(s=>!allVault.find(v=>v.title===s.title)).map((s,i)=>(
            <div key={i} style={{...card,borderStyle:"dashed",cursor:"pointer"}} onClick={()=>addSuggestedVault(s)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"12px",fontWeight:500}}>{s.title}</div>
                  <div style={{fontSize:"10px",color:"var(--color-text-secondary)",marginTop:"2px"}}>Condition: {s.condition}</div>
                </div>
                <span style={{...btn("p"),fontSize:"10px"}}>+ Lock now</span>
              </div>
            </div>
          ))}

          {/* Manual add form */}
          {adding==="vault" ? (
            <div style={{...card,borderColor:C.purple,marginTop:"10px"}}>
              <div style={{fontSize:"11px",fontWeight:500,marginBottom:"8px"}}>New vault entry</div>
              {[["title","Title"],["locked","Locked date (YYYY-MM-DD)"],["reveal","Reveal date (optional)"],["condition","Reveal condition"],["path","Archive path"],["control","Control level"]].map(([k,lbl])=>(
                <div key={k} style={{marginBottom:"6px"}}>
                  <div style={{fontSize:"9px",color:"var(--color-text-secondary)",marginBottom:"2px"}}>{lbl}</div>
                  <input value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} style={inp}/>
                </div>
              ))}
              <div style={{display:"flex",gap:"6px",marginTop:"4px"}}>
                <button onClick={addVaultEntry} style={{...btn("p"),flex:1}}>Lock this entry</button>
                <button onClick={()=>{setAdding(null);setForm({});}} style={btn()}>cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setAdding("vault")} style={{...btn("p"),marginTop:"10px",width:"100%"}}>+ Add vault entry manually</button>
          )}
        </div>
      )}

      {/* ── ASSET REGISTRY ──────────────────────────────── */}
      {tab==="assets" && (
        <div>
          <div style={{display:"flex",gap:"6px",marginBottom:"12px",flexWrap:"wrap"}}>
            {["all","art","sigil","product/app","visual","reference","financial","infrastructure"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{fontSize:"10px",padding:"3px 9px",borderRadius:"12px",border:`0.5px solid ${filter===f?C.purple:"var(--color-border-secondary)"}`,background:filter===f?C.purple:"transparent",color:filter===f?"#EEEDFE":"var(--color-text-secondary)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>{f}</button>
            ))}
          </div>

          {allAssets.filter(a=>filter==="all"||a.cat===filter).map(a=>{
            const catColor = a.cat==="art"?C.teal:a.cat==="sigil"?C.purple:a.cat.includes("product")?C.coral:a.cat==="visual"?C.amber:C.gray;
            return (
              <div key={a.id} style={{...card,borderLeft:`2px solid ${catColor}`,borderRadius:"0 var(--border-radius-md) var(--border-radius-md) 0",paddingLeft:"10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"12px",fontWeight:500}}>{a.title}</div>
                    <div style={{fontSize:"10px",color:"var(--color-text-secondary)",marginTop:"1px",fontFamily:"var(--font-mono)"}}>{a.file}</div>
                    <div style={{fontSize:"9px",color:"var(--color-text-tertiary)",marginTop:"2px"}}>{a.sub || a.path?.split("→").pop()?.trim()}</div>
                    {a.note && <div style={{fontSize:"9px",color:"var(--color-text-secondary)",marginTop:"2px",fontStyle:"italic"}}>{a.note}</div>}
                  </div>
                  <span style={{fontSize:"9px",padding:"1px 6px",borderRadius:"8px",background:catColor+"22",color:catColor,flexShrink:0,marginLeft:"8px"}}>{a.cat}</span>
                </div>
              </div>
            );
          })}

          {/* Pending assets to register */}
          {(filter==="all"||PENDING_ASSETS.some(p=>p.cat===filter)) && (
            <>
              <div style={{marginTop:"14px",marginBottom:"8px",fontSize:"11px",fontWeight:500,color:C.coral}}>Unregistered — {PENDING_ASSETS.filter(p=>!allAssets.find(a=>a.file===p.file)&&(filter==="all"||p.cat===filter)).length} pending</div>
              {PENDING_ASSETS.filter(p=>!allAssets.find(a=>a.file===p.file)&&(filter==="all"||p.cat===filter)).map((p,i)=>(
                <div key={i} style={{...card,borderStyle:"dashed",borderColor:C.coral}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:"12px",fontWeight:500,color:C.coral}}>{p.title}</div>
                      <div style={{fontSize:"10px",color:"var(--color-text-secondary)",fontFamily:"var(--font-mono)",marginTop:"1px"}}>{p.file}</div>
                      <div style={{fontSize:"9px",color:"var(--color-text-tertiary)",marginTop:"1px"}}>{p.sub}</div>
                    </div>
                    <button onClick={()=>addPendingAsset(p)} style={{...btn("p"),background:C.coral,fontSize:"10px",flexShrink:0}}>Register</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Manual add */}
          {adding==="asset" ? (
            <div style={{...card,borderColor:C.purple,marginTop:"10px"}}>
              <div style={{fontSize:"11px",fontWeight:500,marginBottom:"8px"}}>New asset entry</div>
              {[["title","Title"],["file","Filename"],["cat","Category"],["sub","Sub-vault"],["note","Notes"]].map(([k,lbl])=>(
                <div key={k} style={{marginBottom:"6px"}}>
                  <div style={{fontSize:"9px",color:"var(--color-text-secondary)",marginBottom:"2px"}}>{lbl}</div>
                  <input value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} style={inp}/>
                </div>
              ))}
              <div style={{display:"flex",gap:"6px",marginTop:"4px"}}>
                <button onClick={addAssetEntry} style={{...btn("p"),flex:1}}>Register asset</button>
                <button onClick={()=>{setAdding(null);setForm({});}} style={btn()}>cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setAdding("asset")} style={{...btn("p"),marginTop:"10px",width:"100%"}}>+ Register asset manually</button>
          )}
        </div>
      )}

      {/* ── REPO STATUS ─────────────────────────────────── */}
      {tab==="repo" && (
        <div>
          <div style={{...card,borderColor:C.teal,background:C.tealL}}>
            <div style={{fontSize:"11px",fontWeight:500,color:"#085041",marginBottom:"6px"}}>github.com/TrueFormCoder/ellari-archive · PUBLIC · LIVE</div>
            <div style={{fontSize:"10px",color:"#1D9E75",fontFamily:"var(--font-mono)"}}>2 commits · .gitignore 313 lines · tested and working</div>
          </div>

          <div style={{marginBottom:"8px",fontSize:"11px",fontWeight:500,color:"var(--color-text-secondary)"}}>Committed</div>
          {[
            { path:"canon/aetherion/",   desc:"7 files — lexicon, operators, decision records, sound-key bridge" },
            { path:"canon/pantheon/",    desc:"2 files — MirrorPantheon + NACI integration candidate" },
            { path:"logs/GG_CrossProject_Log.md", desc:"Master log — 9 entries, decision index, watch items W377-W401" },
            { path:".gitignore",         desc:"313 lines — commercial, credentials, private tracks protected" },
            { path:"README.md",          desc:"Repo description with TrueFormCoder URLs" },
          ].map((f,i)=>(
            <div key={i} style={{...card,padding:"8px 12px"}}>
              <div style={{fontSize:"11px",fontFamily:"var(--font-mono)",color:C.teal}}>{f.path}</div>
              <div style={{fontSize:"10px",color:"var(--color-text-secondary)",marginTop:"2px"}}>{f.desc}</div>
            </div>
          ))}

          <div style={{marginTop:"12px",marginBottom:"8px",fontSize:"11px",fontWeight:500,color:C.coral}}>Pending</div>
          {[
            { path:"mirrorbody/trackers/", desc:"4 tracker apps — training, wellness, weigh-in, becoming", priority:"this week" },
            { path:"mirrorbody/visuals/",  desc:"3 visual tools — transformation, skill tree, exercise library", priority:"this week" },
            { path:"mirrorbody/financial/",desc:"Financial model + business analysis", priority:"this week" },
            { path:"commercial/",          desc:"Lane A landing page + 7-email welcome sequence", priority:"this week" },
            { path:"logs/ (update)",       desc:"Entry 001 status → LIVE. Entry 010+ for MIRRORBODY session.", priority:"this week" },
            { path:"ellari-commercial/",   desc:"Private repo for financial data, email metrics, customer info", priority:"90 days" },
          ].map((f,i)=>(
            <div key={i} style={{...card,borderStyle:"dashed",borderColor:f.priority==="this week"?C.coral:C.amber,padding:"8px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:"11px",fontFamily:"var(--font-mono)",color:f.priority==="this week"?C.coral:C.amber}}>{f.path}</div>
                  <div style={{fontSize:"10px",color:"var(--color-text-secondary)",marginTop:"2px"}}>{f.desc}</div>
                </div>
                <span style={{fontSize:"9px",padding:"1px 6px",borderRadius:"8px",background:(f.priority==="this week"?C.coral:C.amber)+"22",color:f.priority==="this week"?C.coral:C.amber,flexShrink:0,marginLeft:"8px"}}>{f.priority}</span>
              </div>
            </div>
          ))}

          <div style={{marginTop:"12px",padding:"10px 14px",background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)"}}>
            <div style={{fontSize:"10px",fontWeight:500,marginBottom:"6px"}}>Session-start protocol — test this</div>
            <div style={{fontSize:"10px",fontFamily:"var(--font-mono)",color:"var(--color-text-secondary)",lineHeight:"1.6",wordBreak:"break-all"}}>
              In a new Claude window → paste:<br/>
              "Please fetch https://raw.githubusercontent.com/TrueFormCoder/ellari-archive/main/logs/GG_CrossProject_Log.md and summarize Entries 002, 005, and 008."
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIONS ─────────────────────────────────────── */}
      {tab==="actions" && (
        <div>
          <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
            {[["all","All"],["now","Now"],["week","This week"],["90d","90 days"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)} style={{fontSize:"10px",padding:"3px 9px",borderRadius:"12px",border:`0.5px solid ${filter===v?C.purple:"var(--color-border-secondary)"}`,background:filter===v?C.purple:"transparent",color:filter===v?"#EEEDFE":"var(--color-text-secondary)",cursor:"pointer",fontFamily:"var(--font-sans)"}}>{l}</button>
            ))}
          </div>
          <div style={{fontSize:"11px",color:"var(--color-text-secondary)",marginBottom:"10px"}}>{doneCount}/{actions.length} complete</div>
          <div style={{height:"4px",background:"var(--color-border-tertiary)",borderRadius:"2px",marginBottom:"12px",overflow:"hidden"}}>
            <div style={{width:`${Math.round(doneCount/actions.length*100)}%`,height:"100%",background:doneCount===actions.length?C.teal:C.purple,transition:"width 0.4s ease"}}/>
          </div>

          {actions.filter(a=>filter==="all"||a.priority===filter).map(a=>(
            <div key={a.id} onClick={()=>toggleAction(a.id)} style={{...card,cursor:"pointer",opacity:a.done?0.5:1,borderColor:a.done?"var(--color-border-tertiary)":priorityColor(a.priority)}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"50%",border:`1.5px solid ${a.done?C.teal:priorityColor(a.priority)}`,background:a.done?C.teal:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>
                  {a.done && <span style={{color:"white",fontSize:"10px",fontWeight:500}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:"8px"}}>
                    <div style={{fontSize:"12px",fontWeight:a.done?400:500,textDecoration:a.done?"line-through":"none"}}>{a.label}</div>
                    <span style={{fontSize:"9px",padding:"1px 6px",borderRadius:"8px",background:priorityColor(a.priority)+"22",color:priorityColor(a.priority),flexShrink:0}}>{priorityLabel(a.priority)}</span>
                  </div>
                  <div style={{fontSize:"10px",color:"var(--color-text-secondary)",marginTop:"3px",lineHeight:"1.4"}}>{a.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
