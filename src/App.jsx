import { useState, useEffect } from "react";

// ─── SCENARIOS ───────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id:"S1",  day:1, age:"Age 22", emoji:"🛡️", tag:"Scenario 1",  title:"Protect Yourself First",
    story:"You just landed your first job! Getting insured while young costs $10,000 now — but could save you much more later.",
    type:"choice",
    choices:[
      {label:"Buy Insurance", sub:"HSGM + PA + CI · -$10,000",      cost:-10000, value:"insured",    emoji:"✅"},
      {label:"Skip It",       sub:"I'm young, I'll be fine",         cost:0,      value:"uninsured",  emoji:"❌"}
    ], payoffNote:"⏳ This choice will matter on Day 3..." },

  { id:"S2",  day:1, age:"Age 24", emoji:"🏠", tag:"Scenario 2",  title:"Buy Your First Home",
    story:"The BTO ballot comes through! Your choice determines how much you gain when you sell later.",
    type:"choice",
    choices:[
      {label:"Buy HDB BTO", sub:"Affordable & stable · -$40,000",       cost:-40000, value:"hdb",   emoji:"🏠"},
      {label:"Buy a Condo", sub:"Higher cost, higher upside · -$80,000", cost:-80000, value:"condo", emoji:"🏙️"}
    ], payoffNote:"⏳ Property profits revealed on Day 3!" },

  { id:"S3",  day:1, age:"Age 25", emoji:"📈", tag:"Scenario 3",  title:"Small Cap Tech Bet",
    story:"A hot small cap tech stock — high risk, high reward, or total loss. $10,000 on the line.",
    type:"choice",
    choices:[
      {label:"Buy Small Cap Tech", sub:"Swing for the fences · -$10,000", cost:-10000, value:"smallcap",    emoji:"🎲"},
      {label:"Keep Cash Safe",     sub:"Too risky for me",                 cost:0,      value:"no_smallcap", emoji:"💵"}
    ], payoffNote:"⏳ Find out what happens on Day 2..." },

  { id:"S4",  day:1, age:"Age 25", emoji:"📉", tag:"Scenario 4",  title:"Markets Are Volatile!",
    story:"The market tanks overnight. T-Bills at 3% — safe & guaranteed, or ride it out?",
    type:"choice",
    choices:[
      {label:"Buy T-Bills @ 3%", sub:"Safe & steady · -$10,000", cost:-10000, value:"tbills",    emoji:"🏦"},
      {label:"Do Nothing",       sub:"Ride the volatility",       cost:0,      value:"no_tbills", emoji:"🎢"}
    ], payoffNote:"⏳ T-Bills mature and pay out on Day 3!" },

  { id:"S5",  day:1, age:"Age 26", emoji:"💹", tag:"Scenario 5",  title:"Tech ETF Opportunity",
    story:"Your friend made 30% on a Tech ETF. Diversified, lower risk — want in for $10,000?",
    type:"choice",
    choices:[
      {label:"Buy Tech ETF", sub:"Diversified growth · -$10,000", cost:-10000, value:"etf",    emoji:"🚀"},
      {label:"Not Ready",    sub:"Maybe next time",                cost:0,      value:"no_etf", emoji:"🙈"}
    ], payoffNote:"⏳ ETF performance revealed on Day 2 & 3!" },

  { id:"SVB", day:2, age:"Age 28", emoji:"🌟", tag:"Vision Board", title:"Career Check-In",
    story:"Promoted! Income from the last 3 years is added. Those who submitted a Vision Board set clearer goals and earned more.",
    type:"choice",
    choices:[
      {label:"Yes — Vision Board Submitted!", sub:"Clear goals = higher income · +$180,000", gain:180000, value:"vb_yes", emoji:"🎯"},
      {label:"No — No Vision Board",          sub:"Still growing, but slower · +$120,000",   gain:120000, value:"vb_no",  emoji:"😬"}
    ] },

  { id:"S6",  day:2, age:"Age 29", emoji:"📜", tag:"Scenario 6",  title:"Will & LPA Time",
    story:"What happens to your assets if something happens to you? Will & LPA costs $1,000 but protects your family.",
    type:"choice",
    choices:[
      {label:"Do Up Will & LPA", sub:"Protect the family · -$1,000", cost:-1000, value:"will_lpa", emoji:"📋"},
      {label:"Not Now",          sub:"Too young to worry",            cost:0,     value:"no_will",  emoji:"🙈"}
    ], payoffNote:"⏳ Will & LPA = faster inheritance on Day 3!" },

  { id:"S7",  day:2, age:"Age 29", emoji:"🔄", tag:"Scenario 7",  title:"Continue Insurance Premiums?",
    story:"Insurance premiums are due again. $10,000 to keep coverage — is it worth continuing?",
    type:"choice",
    choices:[
      {label:"Keep Paying",   sub:"Stay protected · -$10,000", cost:-10000, value:"cont_insurance",   emoji:"🛡️"},
      {label:"Cancel Policy", sub:"Save the money now",         cost:0,      value:"cancel_insurance", emoji:"✂️"}
    ], payoffNote:"⏳ Critical if CI strikes on Day 3..." },

  { id:"S8",  day:2, age:"Age 30", emoji:"💍", tag:"Scenario 8",  title:"Your Dream Wedding",
    story:"Getting married! Angpaos from guests will NOT fully cover the cost.",
    type:"choice",
    choices:[
      {label:"Luxury Wedding", sub:"Grand celebration · -$50,000",    cost:-50000, value:"luxury_wedding", emoji:"👑"},
      {label:"Simple Wedding", sub:"Intimate & meaningful · -$25,000", cost:-25000, value:"simple_wedding", emoji:"🌸"}
    ] },

  { id:"S9",  day:2, age:"Age 31", emoji:"🚀", tag:"Scenario 9",  title:"Tech ETF Is Pumping!",
    story:"Your ETF has grown! Buy more for -$15,000? Those who bought in Scenario 5 also get a +$10,000 bonus.",
    type:"choice",
    choices:[
      {label:"Buy More ETF",     sub:"Double down · -$15,000", cost:-15000, value:"etf_more",    emoji:"💰"},
      {label:"Hold What I Have", sub:"Don't get greedy",        cost:0,      value:"no_etf_more", emoji:"🧘"}
    ], payoffNote:"⏳ ETF boom profits locked in on Day 3!" },

  { id:"S10", day:2, age:"Age 31", emoji:"🚗", tag:"Scenario 10", title:"Buy a Car?",
    story:"COE is available! A car means convenience — but it's a depreciating asset at $90,000 all in.",
    type:"choice",
    choices:[
      {label:"Buy a Car",        sub:"Convenience & status · -$90,000", cost:-90000, value:"car",    emoji:"🚗"},
      {label:"Public Transport", sub:"Save the money",                   cost:0,      value:"no_car", emoji:"🚌"}
    ], payoffNote:"⏳ Car resale value revealed on Day 3..." },

  { id:"S11", day:2, age:"Age 32", emoji:"💥", tag:"Scenario 11", title:"Small Cap DELISTED!",
    story:"BREAKING: The small cap tech company has been delisted. All shareholders lose everything.",
    type:"reveal",
    compute:(d)=> d.S3==="smallcap"
      ? {gain:-10000, msg:"💸 Your $10,000 is completely wiped out — company delisted.",  color:"#f87171"}
      : {gain:0,      msg:"✅ You stayed away from it. That was the right call!",          color:"#4ade80"} },

  { id:"S10b",day:2, age:"Age 33", emoji:"👴", tag:"Everyone",    title:"Parents' Rising Premiums",
    story:"Your parents retired and their insurance premiums are rising. The responsibility falls on you — this affects everyone.",
    type:"automatic", gain:-20000,
    note:"Everyone pays $20,000 ($10,000 per parent). This is the sandwich generation reality." },

  { id:"SD3", day:3, age:"Age 35", emoji:"🎉", tag:"Day 3 Bonus", title:"Career Milestone!",
    story:"You've been promoted! Everyone receives +$200,000 from years of career growth and compounding.",
    type:"automatic", gain:200000,
    note:"This reflects years of income, savings & compound growth. Everyone gets this!" },

  { id:"S14", day:3, age:"Age 35", emoji:"🏥", tag:"Scenario 14", title:"1 in 4: Critical Illness",
    story:"1 in 4 people face CI in their lifetime. Facilitator will announce if you're affected — then tap your answer below.",
    type:"ci",
    choices:[
      {label:"Yes — I was affected by CI", value:"ci_yes", emoji:"😰"},
      {label:"No — All clear for me",      value:"ci_no",  emoji:"✅"}
    ],
    compute:(d, ciChoice)=>{
      const insured = d.S1==="insured" || d.S7==="cont_insurance";
      if (ciChoice==="ci_yes" && !insured) return {gain:-100000, msg:"😰 CI hit & no insurance — -$100,000.",             color:"#f87171"};
      if (ciChoice==="ci_yes" &&  insured) return {gain:0,       msg:"🛡️ CI hit but you're insured — fully covered!",     color:"#4ade80"};
      return                                      {gain:0,       msg:"✅ No CI this time — insurance remains your safety net.", color:"#4ade80"};
    } },

  { id:"S15", day:3, age:"Age 36", emoji:"🔑", tag:"Scenario 15", title:"Sell Your Car",
    story:"Time to let go of the car. Depreciation and maintenance costs over the years really add up.",
    type:"reveal",
    compute:(d)=> d.S10==="car"
      ? {gain:10000, msg:"🚗 Car sold +$10,000 — but net loss ~$80,000 overall including maintenance.", color:"#facc15"}
      : {gain:0,     msg:"✅ No car, no loss! Public transport saved you tens of thousands.",            color:"#4ade80"} },

  { id:"S16", day:3, age:"Age 37", emoji:"🏡", tag:"Scenario 16", title:"Sell Your Property!",
    story:"The property market has grown. Time to cash out — your Day 1 choice determines your profit.",
    type:"reveal",
    compute:(d)=>{
      if (d.S2==="hdb")   return {gain:100000, msg:"🏠 HDB sold! Property gains: +$100,000!", color:"#4ade80"};
      if (d.S2==="condo") return {gain:200000, msg:"🏙️ Condo sold! Gains: +$200,000!",        color:"#4ade80"};
      return                     {gain:0,      msg:"😅 No property — no gains.",               color:"#94a3b8"};
    } },

  { id:"S17", day:3, age:"Age 38", emoji:"👴", tag:"Scenario 17", title:"Inheritance",
    story:"Your grandparents have passed. Those with a Will & LPA receive their inheritance faster.",
    type:"reveal",
    compute:(d)=> d.S6==="will_lpa"
      ? {gain:100000, msg:"📜 Will & LPA done! Inheritance received: +$100,000!", color:"#4ade80"}
      : {gain:0,      msg:"😔 No Will & LPA — process delayed, no inheritance.",   color:"#f87171"} },

  { id:"S4p", day:3, age:"Age 39", emoji:"💰", tag:"S4 Payoff",   title:"T-Bills Mature!",
    story:"Your T-Bills have matured with 3% compounded returns. Boring wins the long game.",
    type:"reveal",
    compute:(d)=> d.S4==="tbills"
      ? {gain:12000, msg:"💰 T-Bills paid out: +$12,000!", color:"#4ade80"}
      : {gain:0,     msg:"📉 No T-Bills — missed safe guaranteed returns.", color:"#94a3b8"} },

  { id:"S18", day:3, age:"Age 40", emoji:"🌟", tag:"Scenario 18", title:"Tech ETF Booms!",
    story:"The tech ETF has absolutely skyrocketed. Lock in your profits!",
    type:"reveal",
    compute:(d)=> (d.S5==="etf" || d.S9==="etf_more")
      ? {gain:100000, msg:"🚀 ETF boom! Profits locked in: +$100,000!", color:"#4ade80"}
      : {gain:0,      msg:"📉 No ETF — missed the boom. Lesson learned!", color:"#94a3b8"} },
];

const DAY_INFO = {
  1:{label:"Day 1", sub:"Early Career · Ages 22–26",    color:"#4ade80"},
  2:{label:"Day 2", sub:"Building Life · Ages 28–33",   color:"#facc15"},
  3:{label:"Day 3", sub:"Reaping Results · Ages 35–40", color:"#f97316"},
};

const PLAYER_NAMES = [
  "Winnie","Matthew","Hana","Zong Xian","Damian","Klavier","Mervell",
  "Arianna","Geremia","Cara","Sonakshi","Yugavaani","Marcus",
  "Player 14","Player 15","Player 16","Player 17","Player 18","Player 19","Player 20"
];

const BASE_NW = 100000;
const FACIL_PASS = "tldr2026";

// ─── STORAGE (localStorage — works on any deployed React app) ────────────────
async function sGet(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
async function sSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}  
}

// ─── COMPUTE NET WORTH ────────────────────────────────────────────────────────
// decisions = { scenarioId: choiceValue }
// completed = Set of scenario IDs the player has submitted
function computeNW(decisions, completed) {
  let nw = BASE_NW;
  for (const s of SCENARIOS) {
    if (!completed.has(s.id)) continue;
    if (s.type === "choice") {
      const c = s.choices?.find(c => c.value === decisions[s.id]);
      if (c) { nw += (c.cost || 0); nw += (c.gain || 0); }
    } else if (s.type === "automatic") {
      nw += s.gain;
    } else if (s.type === "reveal" || s.type === "ci") {
      if (s.compute) {
        const r = s.type === "ci"
          ? s.compute(decisions, decisions[s.id])
          : s.compute(decisions);
        nw += r.gain;
      }
    }
    // S5→S9 bonus: if player bought S5 ETF and has now completed S9
    if (s.id === "S9" && decisions["S5"] === "etf" && completed.has("S9")) nw += 10000;
  }
  return nw;
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]       = useState(null); // null | facilitator | player
  const [booting, setBooting] = useState(true);

  // ── Facilitator state
  const [facilAuthed, setFacilAuthed]   = useState(false);
  const [facilPass, setFacilPass]       = useState("");
  const [globalIdx, setGlobalIdx]       = useState(0);   // which scenario index is live
  const [allPlayerData, setAllPlayerData] = useState({}); // { 1: {decisions, completed:[]} }

  // ── Player state
  const [playerNum, setPlayerNum]   = useState(null);
  const [numInput, setNumInput]     = useState("");
  const [myDecisions, setMyDecisions] = useState({});
  const [myCompleted, setMyCompleted] = useState(new Set()); // Set of scenario IDs done
  const [liveGlobalIdx, setLiveGlobalIdx] = useState(0);
  const [pendingCiChoice, setPendingCiChoice] = useState(null);
  const [revealResult, setRevealResult] = useState(null); // shown after reveal/ci

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const gi = await sGet("global_idx");
      if (gi !== null) { setGlobalIdx(gi); setLiveGlobalIdx(gi); }
      setBooting(false);
    })();
  }, []);

  // ── Facilitator: poll all players ────────────────────────────────────────
  useEffect(() => {
    if (mode !== "facilitator") return;
    const load = async () => {
      const all = {};
      for (let i = 1; i <= 20; i++) {
        const pd = await sGet(`player_${i}`);
        if (pd) all[i] = pd;
      }
      setAllPlayerData(all);
    };
    load();
    const iv = setInterval(load, 3500);
    return () => clearInterval(iv);
  }, [mode]);

  // ── Player: poll global index + own data ─────────────────────────────────
  useEffect(() => {
    if (mode !== "player" || playerNum === null) return;
    const poll = async () => {
      const gi = await sGet("global_idx");
      if (gi !== null) setLiveGlobalIdx(gi);
      const pd = await sGet(`player_${playerNum}`);
      if (pd) {
        setMyDecisions(pd.decisions || {});
        setMyCompleted(new Set(pd.completed || []));
      }
    };
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, [mode, playerNum]);

  // ── Facilitator actions ───────────────────────────────────────────────────
  async function facilAdvance() {
    const next = Math.min(globalIdx + 1, SCENARIOS.length - 1);
    setGlobalIdx(next); setRevealResult(null);
    await sSet("global_idx", next);
  }
  async function facilBack() {
    const prev = Math.max(globalIdx - 1, 0);
    setGlobalIdx(prev);
    await sSet("global_idx", prev);
  }
  async function facilReset() {
    if (!window.confirm("Reset ALL player data and restart the game?")) return;
    setGlobalIdx(0); setAllPlayerData({});
    await sSet("global_idx", 0);
    for (let i = 1; i <= 20; i++) await sSet(`player_${i}`, {decisions:{}, completed:[]});
  }

  // ── Player: join ──────────────────────────────────────────────────────────
  async function joinGame() {
    const n = parseInt(numInput);
    if (!n || n < 1 || n > 20) return;

    // Always clear state first so previous player's data never bleeds in
    setMyDecisions({});
    setMyCompleted(new Set());
    setRevealResult(null);
    setPendingCiChoice(null);

    // Then load this player's saved data (if any)
    const pd = await sGet(`player_${n}`);
    if (pd) {
      setMyDecisions(pd.decisions || {});
      setMyCompleted(new Set(pd.completed || []));
    }

    const gi = await sGet("global_idx");
    if (gi !== null) setLiveGlobalIdx(gi);

    // Set player number last so polling starts with clean state
    setPlayerNum(n);
  }

  // ── Player: submit a decision ─────────────────────────────────────────────
  async function submitDecision(scenarioId, choiceValue) {
    const nd = { ...myDecisions, [scenarioId]: choiceValue };
    const nc = new Set([...myCompleted, scenarioId]);
    setMyDecisions(nd);
    setMyCompleted(nc);
    setPendingCiChoice(null);

    // Compute reveal result if applicable
    const s = SCENARIOS.find(s => s.id === scenarioId);
    if (s?.type === "reveal") {
      setRevealResult(s.compute(nd));
    } else if (s?.type === "ci") {
      setRevealResult(s.compute(nd, choiceValue));
    } else {
      setRevealResult(null);
    }

    await sSet(`player_${playerNum}`, { decisions: nd, completed: [...nc] });
  }

  // ── Player: acknowledge automatic scenario ───────────────────────────────
  async function ackAutomatic(scenarioId) {
    const nc = new Set([...myCompleted, scenarioId]);
    setMyCompleted(nc);
    setRevealResult(null);
    await sSet(`player_${playerNum}`, { decisions: myDecisions, completed: [...nc] });
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentS    = SCENARIOS[liveGlobalIdx];
  const di          = DAY_INFO[currentS?.day] || DAY_INFO[1];
  const myNW        = computeNW(myDecisions, myCompleted);
  const nwDelta     = myNW - BASE_NW;
  // Has THIS player already submitted THIS scenario?
  const thisDone    = myCompleted.has(currentS?.id);
  const pct         = Math.round((liveGlobalIdx / SCENARIOS.length) * 100);

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (booting) return (
    <div style={{...pg, gap:12, flexDirection:"column"}}>
      <div style={{fontSize:30}}>⏳</div>
      <div style={{color:"#64748b", fontSize:14}}>Loading...</div>
    </div>
  );

  // ── MODE SELECT ───────────────────────────────────────────────────────────
  if (!mode) return (
    <div style={pg}>
      <div style={{...card, maxWidth:400, textAlign:"center"}}>
        <div style={chip}>TLDR 6.0 · Finance Game</div>
        <div style={{fontSize:44, margin:"10px 0 6px"}}>🎮</div>
        <h1 style={{fontSize:32, fontWeight:900, color:"#f8fafc", margin:"0 0 4px", letterSpacing:-1}}>Life in 3 Days</h1>
        <p style={{color:"#64748b", fontSize:13, fontStyle:"italic", margin:"0 0 26px"}}>A Financial Life Simulation</p>
        <div style={{display:"flex", flexDirection:"column", gap:10}}>
          <button style={btnPrimary} onClick={()=>setMode("player")}>📱 I'm a Player — Join Game</button>
          <button style={{...btnPrimary, background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.3)", color:"#a5b4fc"}}
            onClick={()=>setMode("facilitator")}>🎛️ Facilitator Panel</button>
        </div>
      </div>
    </div>
  );

  // ── FACILITATOR AUTH ──────────────────────────────────────────────────────
  if (mode === "facilitator" && !facilAuthed) return (
    <div style={pg}>
      <div style={{...card, maxWidth:360, textAlign:"center"}}>
        <div style={{fontSize:30, marginBottom:12}}>🔒</div>
        <h2 style={{color:"#f8fafc", fontSize:20, margin:"0 0 18px"}}>Facilitator Access</h2>
        <input style={inputSt} type="password" placeholder={`Password`}
          value={facilPass} onChange={e=>setFacilPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter" && facilPass===FACIL_PASS && setFacilAuthed(true)} />
        <button style={{...btnPrimary, marginTop:10}}
          onClick={()=>facilPass===FACIL_PASS && setFacilAuthed(true)}>Enter</button>
        <button style={{...btnGhost, marginTop:8}} onClick={()=>setMode(null)}>← Back</button>
      </div>
    </div>
  );

  // ── FACILITATOR PANEL ─────────────────────────────────────────────────────
  if (mode === "facilitator" && facilAuthed) {
    const fs   = SCENARIOS[globalIdx];
    const fdi  = DAY_INFO[fs?.day] || DAY_INFO[1];
    const doneCount = Object.values(allPlayerData)
      .filter(p => (p.completed||[]).includes(fs?.id)).length;

    return (
      <div style={{...pg, alignItems:"flex-start", overflowY:"auto", paddingTop:16}}>
        <div style={{maxWidth:680, width:"100%", display:"flex", flexDirection:"column", gap:10}}>

          {/* Header */}
          <div style={{...card, padding:"14px 18px"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8}}>
              <div>
                <div style={{color:"#a5b4fc", fontWeight:800, fontSize:12, letterSpacing:1}}>🎛️ FACILITATOR PANEL</div>
                <div style={{color:fdi.color, fontSize:12, marginTop:2}}>{fdi.label} · {fs?.age} · {fs?.tag}</div>
              </div>
              <div style={{display:"flex", gap:8}}>
                <button style={{...btnSm, color:"#fca5a5", background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)"}}
                  onClick={facilReset}>🔄 Reset</button>
                <button style={btnSm} onClick={()=>setMode(null)}>Exit</button>
              </div>
            </div>
          </div>

          {/* Current scenario control */}
          <div style={{...card, padding:"18px"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
              <div>
                <div style={{fontSize:10, color:fdi.color, fontWeight:800, letterSpacing:2, textTransform:"uppercase"}}>{fs?.tag}</div>
                <h2 style={{fontSize:18, fontWeight:900, color:"#f8fafc", margin:"4px 0 0"}}>{fs?.emoji} {fs?.title}</h2>
              </div>
              <div style={{textAlign:"right", flexShrink:0, marginLeft:12}}>
                <div style={{fontSize:10, color:"#64748b"}}>Players done</div>
                <div style={{fontSize:28, fontWeight:900, color:doneCount>=20?"#4ade80":doneCount>0?"#facc15":"#64748b"}}>{doneCount}/20</div>
              </div>
            </div>
            <p style={{color:"#64748b", fontSize:13, lineHeight:1.6, margin:"0 0 12px"}}>{fs?.story}</p>

            {/* Choice options preview */}
            {fs?.choices && (
              <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:12}}>
                {fs.choices.map(c=>(
                  <div key={c.value} style={{background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 12px", fontSize:12, display:"flex", alignItems:"center", gap:6}}>
                    <span>{c.emoji}</span>
                    <span style={{color:"#e2e8f0"}}>{c.label}</span>
                    {(c.cost||c.gain) ? <span style={{color:(c.cost||0)<0?"#f87171":"#4ade80", fontWeight:700}}>
                      {c.cost&&c.cost!==0 ? `-$${Math.abs(c.cost).toLocaleString()}` : c.gain ? `+$${c.gain.toLocaleString()}` : ""}
                    </span> : null}
                  </div>
                ))}
              </div>
            )}
            {fs?.type==="automatic" && (
              <div style={{background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#a5b4fc", marginBottom:12}}>
                📢 {fs.note}
              </div>
            )}

            {/* Nav buttons */}
            <div style={{display:"flex", gap:8}}>
              <button style={{...btnSm, flex:1}} onClick={facilBack} disabled={globalIdx===0}>← Prev</button>
              <button style={{...btnPrimary, flex:2, padding:"11px"}} onClick={facilAdvance} disabled={globalIdx===SCENARIOS.length-1}>
                Unlock Next Scenario →
              </button>
            </div>
            <div style={{textAlign:"center", color:"#334155", fontSize:11, marginTop:6}}>
              {globalIdx+1} / {SCENARIOS.length}
            </div>
          </div>

          {/* Player grid */}
          <div style={{...card, padding:"14px 16px"}}>
            <div style={{color:"#64748b", fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:10}}>LIVE PLAYER BALANCES</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:7}}>
              {Array.from({length:20},(_,i)=>i+1).map(n=>{
                const pd = allPlayerData[n];
                const nw = pd ? computeNW(pd.decisions||{}, new Set(pd.completed||[])) : BASE_NW;
                const done = pd && (pd.completed||[]).includes(fs?.id);
                const delta = nw - BASE_NW;
                return (
                  <div key={n} style={{background:done?"rgba(74,222,128,0.06)":"rgba(255,255,255,0.03)", border:`1px solid ${done?"rgba(74,222,128,0.18)":"rgba(255,255,255,0.06)"}`, borderRadius:10, padding:"9px 11px"}}>
                    <div style={{fontSize:10, color:"#64748b", marginBottom:2}}>#{n} {PLAYER_NAMES[n-1]?.split(" ")[0]}</div>
                    <div style={{fontWeight:900, fontSize:14, color:nw>=BASE_NW?"#4ade80":"#f87171"}}>${nw.toLocaleString()}</div>
                    <div style={{fontSize:10, color:delta>=0?"#4ade80":"#f87171"}}>{delta>=0?"+":""}{delta.toLocaleString()}</div>
                    {done && <div style={{fontSize:9, color:"#4ade80", marginTop:2}}>✓ done</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYER: NUMBER SELECT ─────────────────────────────────────────────────
  if (mode === "player" && playerNum === null) return (
    <div style={pg}>
      <div style={{...card, maxWidth:380, textAlign:"center"}}>
        <div style={chip}>TLDR 6.0</div>
        <div style={{fontSize:38, margin:"10px 0 4px"}}>👤</div>
        <h2 style={{fontSize:24, fontWeight:900, color:"#f8fafc", margin:"0 0 4px"}}>Join the Game</h2>
        <p style={{color:"#64748b", fontSize:13, margin:"0 0 18px"}}>Tap your player number</p>
        <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:7, marginBottom:16}}>
          {Array.from({length:20},(_,i)=>i+1).map(n=>(
            <button key={n}
              style={{...btnSm, padding:"11px 0", fontSize:15, fontWeight:700,
                background:numInput==n?"rgba(99,102,241,0.28)":"rgba(255,255,255,0.04)",
                border:numInput==n?"1px solid #6366f1":"1px solid rgba(255,255,255,0.08)",
                color:numInput==n?"#c4b5fd":"#94a3b8"}}
              onClick={()=>setNumInput(String(n))}>{n}</button>
          ))}
        </div>
        {numInput && parseInt(numInput)>=1 && parseInt(numInput)<=20 && (
          <div style={{marginBottom:14, color:"#4ade80", fontWeight:700, fontSize:16}}>
            👋 Hi, {PLAYER_NAMES[parseInt(numInput)-1]}!
          </div>
        )}
        <button style={{...btnPrimary, opacity:numInput&&parseInt(numInput)>=1&&parseInt(numInput)<=20?1:0.35}}
          disabled={!numInput||parseInt(numInput)<1||parseInt(numInput)>20}
          onClick={joinGame}>Enter the Game →</button>
        <button style={{...btnGhost, marginTop:8}} onClick={()=>setMode(null)}>← Back</button>
      </div>
    </div>
  );

  // ── PLAYER: IN-GAME ───────────────────────────────────────────────────────
  return (
    <div style={{...pg, alignItems:"flex-start", paddingTop:14}}>
      <div style={{maxWidth:430, width:"100%"}}>

        {/* Header */}
        <div style={{...card, padding:"13px 17px", marginBottom:10}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontWeight:900, color:"#f8fafc", fontSize:16}}>{PLAYER_NAMES[playerNum-1]}</div>
              <div style={{color:di.color, fontSize:11, marginTop:1, fontWeight:600}}>{di.label} · Player #{playerNum}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9, color:"#64748b", letterSpacing:1, textTransform:"uppercase"}}>Net Worth</div>
              <div style={{fontSize:26, fontWeight:900, color:myNW>=BASE_NW?"#4ade80":"#f87171"}}>${myNW.toLocaleString()}</div>
              <div style={{fontSize:10, color:nwDelta>=0?"#4ade80":"#f87171"}}>{nwDelta>=0?"+":""}{nwDelta.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{height:4, background:"rgba(255,255,255,0.07)", borderRadius:4, overflow:"hidden", marginBottom:6}}>
          <div style={{height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${di.color},${di.color}77)`, transition:"width .5s"}}/>
        </div>
        <div style={{display:"flex", gap:5, marginBottom:13, alignItems:"center"}}>
          {Object.entries(DAY_INFO).map(([d,info])=>(
            <div key={d} style={{padding:"2px 9px", borderRadius:20,
              background:currentS?.day==d?info.color:"rgba(255,255,255,0.05)",
              color:currentS?.day==d?"#0f172a":"#475569", fontSize:10, fontWeight:700}}>
              {info.label}
            </div>
          ))}
          <div style={{marginLeft:"auto", color:"#334155", fontSize:10}}>{liveGlobalIdx+1}/{SCENARIOS.length}</div>
        </div>

        {/* Scenario card */}
        <div style={{...card, padding:"22px 20px"}}>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:13}}>
            <span style={{fontSize:28}}>{currentS?.emoji}</span>
            <div>
              <div style={{fontSize:9, color:di.color, fontWeight:800, letterSpacing:2, textTransform:"uppercase"}}>{currentS?.tag}</div>
              <h2 style={{fontSize:17, fontWeight:900, color:"#f8fafc", margin:"3px 0 0", lineHeight:1.2}}>{currentS?.title}</h2>
            </div>
          </div>
          <p style={{color:"#94a3b8", fontSize:13, lineHeight:1.7, margin:"0 0 14px"}}>{currentS?.story}</p>
          {currentS?.payoffNote && <div style={payoffBadge}>{currentS.payoffNote}</div>}

          {/* ── ALREADY DONE THIS SCENARIO ── */}
          {thisDone && (
            <div style={{background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:12, padding:"14px", textAlign:"center"}}>
              <div style={{color:"#a5b4fc", fontWeight:700, fontSize:14, marginBottom: revealResult ? 10 : 0}}>
                ✅ Decision recorded!
              </div>
              {revealResult && (
                <div style={{padding:"12px", background:`${revealResult.color}14`, border:`1px solid ${revealResult.color}30`, borderRadius:9, marginBottom:8}}>
                  <div style={{color:"#f8fafc", fontSize:13, fontWeight:600, marginBottom:revealResult.gain!==0?6:0}}>{revealResult.msg}</div>
                  {revealResult.gain!==0 && (
                    <div style={{color:revealResult.color, fontWeight:900, fontSize:22}}>
                      {revealResult.gain>0?"+":""}{revealResult.gain.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
              <div style={{color:"#475569", fontSize:11, marginTop:6}}>⏳ Waiting for next scenario...</div>
            </div>
          )}

          {/* ── NOT YET DONE ── */}
          {!thisDone && (
            <>
              {/* CHOICE (normal + vision board) */}
              {(currentS?.type==="choice") && (
                <div style={{display:"flex", flexDirection:"column", gap:9}}>
                  {currentS.choices.map(c=>(
                    <button key={c.value} style={choiceBtn}
                      onClick={()=>submitDecision(currentS.id, c.value)}>
                      <span style={{fontSize:20}}>{c.emoji}</span>
                      <div style={{flex:1, textAlign:"left"}}>
                        <div style={{color:"#e2e8f0", fontWeight:700, fontSize:14}}>{c.label}</div>
                        <div style={{color:"#64748b", fontSize:12, marginTop:1}}>{c.sub}</div>
                      </div>
                      <span style={{fontWeight:900, fontSize:13, whiteSpace:"nowrap",
                        color:c.cost<0?"#f87171":c.gain?"#4ade80":"#94a3b8"}}>
                        {c.cost&&c.cost!==0 ? `-$${Math.abs(c.cost).toLocaleString()}`
                          : c.gain        ? `+$${c.gain.toLocaleString()}` : "—"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* CI — player self-reports */}
              {currentS?.type==="ci" && (
                <>
                  <div style={{...payoffBadge, background:"rgba(248,113,113,0.06)", borderColor:"rgba(248,113,113,0.2)", color:"#fca5a5", marginBottom:12}}>
                    🎲 Facilitator announces who's affected — then tap your answer!
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:9, marginBottom:12}}>
                    {currentS.choices.map(c=>(
                      <button key={c.value}
                        style={{...choiceBtn, ...(pendingCiChoice===c.value ? choiceBtnSel : {})}}
                        onClick={()=>setPendingCiChoice(c.value)}>
                        <span style={{fontSize:20}}>{c.emoji}</span>
                        <div style={{color:"#e2e8f0", fontWeight:700, fontSize:14}}>{c.label}</div>
                      </button>
                    ))}
                  </div>
                  {pendingCiChoice && (
                    <button style={btnPrimary} onClick={()=>submitDecision(currentS.id, pendingCiChoice)}>
                      Confirm →
                    </button>
                  )}
                </>
              )}

              {/* AUTOMATIC — just acknowledge */}
              {currentS?.type==="automatic" && (
                <div style={{textAlign:"center"}}>
                  <div style={{background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:10, padding:"12px", marginBottom:14, fontSize:13, color:"#a5b4fc", lineHeight:1.6}}>
                    📢 {currentS.note}
                  </div>
                  <div style={{fontSize:34, fontWeight:900, marginBottom:14,
                    color:currentS.gain>=0?"#4ade80":"#f87171"}}>
                    {currentS.gain>=0?"+":"-"}${Math.abs(currentS.gain).toLocaleString()}
                  </div>
                  <button style={btnPrimary} onClick={()=>ackAutomatic(currentS.id)}>Got it! ✓</button>
                </div>
              )}

              {/* REVEAL — compute from past decisions */}
              {currentS?.type==="reveal" && (
                <div style={{textAlign:"center"}}>
                  <button style={{...btnPrimary, background:"linear-gradient(135deg,#f59e0b,#ea580c)"}}
                    onClick={()=>submitDecision(currentS.id, "revealed")}>
                    🎲 Reveal My Outcome!
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Final summary */}
        {liveGlobalIdx===SCENARIOS.length-1 && thisDone && (
          <div style={{...card, marginTop:10, padding:"18px", textAlign:"center"}}>
            <div style={{fontSize:30, marginBottom:6}}>🏁</div>
            <div style={{color:"#facc15", fontWeight:900, fontSize:18, marginBottom:4}}>Journey Complete!</div>
            <div style={{fontSize:36, fontWeight:900, color:myNW>=BASE_NW?"#4ade80":"#f87171"}}>${myNW.toLocaleString()}</div>
            <div style={{color:"#64748b", fontSize:12, marginTop:4}}>{nwDelta>=0?"+":""}{nwDelta.toLocaleString()} from start</div>
          </div>
        )}

        <button style={{...btnGhost, marginTop:10, width:"100%"}}
          onClick={()=>{setPlayerNum(null);setNumInput("");setMyDecisions({});setMyCompleted(new Set());setRevealResult(null);setPendingCiChoice(null);}}>
          ← Change Player
        </button>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const pg={minHeight:"100vh",background:"linear-gradient(135deg,#060c1a 0%,#0d1526 45%,#150822 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Georgia,serif"};
const card={background:"rgba(6,14,28,0.98)",border:"1px solid rgba(99,102,241,0.16)",borderRadius:18,padding:"26px 22px",boxShadow:"0 0 50px rgba(99,102,241,0.06)"};
const chip={display:"inline-block",background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.28)",borderRadius:20,padding:"3px 13px",fontSize:10,fontFamily:"monospace",color:"#a5b4fc",letterSpacing:2,marginBottom:10};
const btnPrimary={background:"linear-gradient(135deg,#6366f1,#7c3aed)",color:"white",border:"none",borderRadius:11,padding:"13px 22px",fontSize:15,fontWeight:700,cursor:"pointer",width:"100%"};
const btnGhost={background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"10px",fontSize:13,color:"#64748b",cursor:"pointer"};
const btnSm={background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:8,padding:"7px 13px",fontSize:12,color:"#94a3b8",cursor:"pointer"};
const inputSt={background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"12px 14px",color:"#f8fafc",fontSize:15,outline:"none",width:"100%",boxSizing:"border-box"};
const payoffBadge={background:"rgba(99,102,241,0.07)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:8,padding:"7px 11px",fontSize:11,color:"#818cf8",marginBottom:13};
const choiceBtn={display:"flex",alignItems:"center",gap:11,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"13px 14px",cursor:"pointer",width:"100%",transition:"background .15s,border .15s"};
const choiceBtnSel={background:"rgba(99,102,241,0.18)",border:"1px solid #6366f1"};
