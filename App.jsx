import { useState, useEffect, useRef } from "react";

const FB_URL = "https://tldr2026-10dae-default-rtdb.asia-southeast1.firebasedatabase.app";

async function sGet(key) {
  try {
    const res = await fetch(FB_URL + "/" + key + ".json");
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}
async function sSet(key, val) {
  try {
    await fetch(FB_URL + "/" + key + ".json", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(val)
    });
  } catch(e) {}
}

// ── COMPUTE FUNCTIONS ────────────────────────────────────────────────────────
function computeCI(d, ciChoice) {
  const insured = d.S1 === "insured" || d.S7 === "cont_insurance" || d.S7 === "new_insurance";
  if (ciChoice === "ci_yes" && !insured) return { gain: -100000, msg: "CI hit and no insurance! -$100,000 lost.", color: "#f87171" };
  if (ciChoice === "ci_yes" && insured)  return { gain: 0, msg: "CI hit but you are insured. Fully covered!", color: "#4ade80" };
  return { gain: 0, msg: "No CI this time. Insurance stays as your safety net.", color: "#4ade80" };
}
function computeS14(d) {
  if (d.S3 === "smallcap") return { gain: -10000, msg: "Your $10,000 is completely wiped out. Company delisted.", color: "#f87171" };
  return { gain: 0, msg: "You stayed away. That was the right call!", color: "#4ade80" };
}
function computeS15(d) {
  if (d.S4 === "tbills") return { gain: 12000, msg: "T-Bills paid out: +$12,000!", color: "#4ade80" };
  return { gain: 0, msg: "No T-Bills — missed out on safe guaranteed returns.", color: "#94a3b8" };
}
function computeS16(d) {
  if (d.S9 === "car") return { gain: 10000, msg: "Car sold for $10,000 back — but net loss ~$80,000 overall including maintenance.", color: "#facc15" };
  return { gain: 0, msg: "No car — you saved smartly! No changes to your savings.", color: "#4ade80" };
}
function computeS17(d) {
  if (d.S5 === "etf") return { gain: 100000, msg: "ETF boom! You bought in early — profits locked in: +$100,000!", color: "#4ade80" };
  return { gain: 0, msg: "You did not invest in the ETF — no profits added.", color: "#94a3b8" };
}
function computeS18(d) {
  if (d.S2 === "hdb")   return { gain: 240000, msg: "BTO sold! You get back $240,000 (capital + $200,000 profit)!", color: "#4ade80" };
  if (d.S2 === "condo") return { gain: 280000, msg: "Condo sold! You get back $280,000 (capital + $200,000 profit)!", color: "#4ade80" };
  return { gain: 0, msg: "No property bought — no gains here.", color: "#94a3b8" };
}
function computeS13(d) {
  if (d.S11 !== "will") return { gain: -10000, msg: "No Will — Grant of Probate required. Legal fees: -$10,000.", color: "#f87171" };
  return { gain: 0, msg: "Will done! Estate transferred smoothly. No legal hassle.", color: "#4ade80" };
}

const SCENARIOS = [
  { id:"S1", day:1, age:"Age 22", tag:"Scenario 1", title:"Protect Yourself First",
    story:"You just landed your first job! Getting insured while young costs $10,000 now — but could save you much more later.",
    type:"choice",
    choices:[
      { label:"Buy Insurance", sub:"HSGM + PA + CI  (-$10,000)", cost:-10000, value:"insured" },
      { label:"Skip It",       sub:"Im young, Ill be fine", cost:0, value:"uninsured" }
    ]},
  { id:"S2", day:1, age:"Age 24", tag:"Scenario 2", title:"Buy Your First Home",
    story:"The BTO ballot comes through! Your choice determines how much you gain when you sell later.",
    type:"choice", payoffNote:"Property profits revealed in Scenario 18!",
    choices:[
      { label:"Buy HDB BTO", sub:"Affordable and stable  (-$40,000)", cost:-40000, value:"hdb" },
      { label:"Buy a Condo", sub:"Higher cost, higher upside  (-$80,000)", cost:-80000, value:"condo" }
    ]},
  { id:"S3", day:1, age:"Age 25", tag:"Scenario 3", title:"Small Cap Tech Equity",
    story:"A hot small cap tech stock — high risk, high reward, or total loss. $10,000 on the line.",
    type:"choice", payoffNote:"Find out what happens in Scenario 14...",
    choices:[
      { label:"Buy Small Cap Tech Equity", sub:"Swing for the fences  (-$10,000)", cost:-10000, value:"smallcap" },
      { label:"Keep Cash Safe",            sub:"Too risky for me", cost:0, value:"no_smallcap" }
    ]},
  { id:"S4", day:1, age:"Age 25", tag:"Scenario 4", title:"T-Bills Investment",
    story:"The market is volatile. T-Bills at 3% offer safe, guaranteed returns. Do you take the safe bet?",
    type:"choice", payoffNote:"T-Bills mature and pay out in Scenario 15!",
    choices:[
      { label:"Buy T-Bills @ 3%", sub:"Safe and steady  (-$10,000)", cost:-10000, value:"tbills" },
      { label:"Do Nothing",       sub:"Ride the volatility", cost:0, value:"no_tbills" }
    ]},
  { id:"S5", day:1, age:"Age 26", tag:"Scenario 5", title:"Tech ETF Opportunity",
    story:"Your friend made 30% on a Tech ETF. Diversified, lower risk — want in for $10,000?",
    type:"choice", payoffNote:"ETF surge profits revealed in Scenario 17!",
    choices:[
      { label:"Buy Tech ETF", sub:"Diversified growth  (-$10,000)", cost:-10000, value:"etf" },
      { label:"Not Ready",    sub:"Maybe next time", cost:0, value:"no_etf" }
    ]},
  { id:"S6", day:2, age:"Age 28", tag:"Scenario 6", title:"Career Check-In — Vision Board",
    story:"Promoted! Income from the last 3 years is added. Those who submitted a Vision Board set clearer goals and earned more.",
    type:"choice",
    choices:[
      { label:"Yes — Vision Board Submitted!", sub:"Clear goals = higher income  (+$180,000)", gain:180000, value:"vb_yes" },
      { label:"No — No Vision Board",          sub:"Still growing, but slower  (+$120,000)",   gain:120000, value:"vb_no" }
    ]},
  { id:"S7", day:2, age:"Age 29", tag:"Scenario 7", title:"Insurance Check-In",
    story:"Time to review your insurance situation.",
    type:"insurance_s7", payoffNote:"Critical if CI strikes in Scenario 12!",
    choices_existing:[
      { label:"Continue Paying Premiums", sub:"Stay protected  (-$20,000)", cost:-20000, value:"cont_insurance" },
      { label:"Cancel Policy",            sub:"Save the money now", cost:0, value:"cancel_insurance" }
    ],
    choices_new:[
      { label:"Buy Insurance Now", sub:"Better late than never  (-$25,000)", cost:-25000, value:"new_insurance" },
      { label:"Skip Again",        sub:"Still not insured", cost:0, value:"cancel_insurance" }
    ]},
  { id:"S8", day:2, age:"Age 30", tag:"Scenario 8", title:"Your Dream Wedding",
    story:"Getting married! Angpaos from guests will NOT fully cover the cost. How much do you spend?",
    type:"choice",
    choices:[
      { label:"Luxury Wedding", sub:"Grand celebration  (-$50,000)", cost:-50000, value:"luxury_wedding" },
      { label:"Basic Wedding",  sub:"Simple and meaningful  (-$25,000)", cost:-25000, value:"simple_wedding" }
    ]},
  { id:"S9", day:2, age:"Age 31", tag:"Scenario 9", title:"New Car Purchase",
    story:"COE is available! A car means convenience — but it is a depreciating asset at $90,000 all in.",
    type:"choice", payoffNote:"Car resale in Scenario 16!",
    choices:[
      { label:"Buy a Car",        sub:"Convenience and status  (-$90,000)", cost:-90000, value:"car" },
      { label:"Public Transport", sub:"Save the money", cost:0, value:"no_car" }
    ]},
  { id:"S10", day:2, age:"Age 33", tag:"Scenario 10", title:"Parents Insurance Premiums",
    story:"Your parents retired and their insurance premiums are rising. The responsibility falls on you — this affects everyone.",
    type:"automatic", gain:-20000,
    note:"Everyone pays $20,000 ($10,000 per parent). This is the sandwich generation reality." },
  { id:"S11", day:2, age:"Age 34", tag:"Scenario 11", title:"Draft Your Parents Will",
    story:"Your parents ask you to help draft their Will to protect the family estate. It costs $1,000 but ensures smooth inheritance later.",
    type:"choice", payoffNote:"No Will means Grant of Probate fees in Scenario 13!",
    choices:[
      { label:"Draft the Will", sub:"Protect the family estate  (-$1,000)", cost:-1000, value:"will" },
      { label:"Skip for Now",   sub:"Too busy right now", cost:0, value:"no_will" }
    ]},
  { id:"S12", day:3, age:"Age 35", tag:"Scenario 12", title:"1 in 4: Critical Illness",
    story:"The facilitator has spun the wheel and selected 7 players with CI. If your name was called out tap YES. If you were NOT selected tap NO. Those with insurance are fully covered — those without lose $100,000.",
    type:"ci", compute: computeCI,
    choices:[
      { label:"Yes — I got CI",          value:"ci_yes" },
      { label:"No — I was not selected", value:"ci_no" }
    ]},
  { id:"S13", day:3, age:"Age 36", tag:"Scenario 13", title:"Inheritance — Grant of Probate",
    story:"Your grandparents have passed. Those who drafted a Will in Scenario 11 transfer the estate smoothly. Those without a Will must go through Grant of Probate — costly and slow.",
    type:"reveal", compute: computeS13 },
  { id:"S14", day:3, age:"Age 37", tag:"Scenario 14", title:"Small Cap Tech Equity Delisted!",
    story:"BREAKING: The small cap tech company has been delisted. All shareholders lose everything.",
    type:"reveal", compute: computeS14 },
  { id:"S15", day:3, age:"Age 38", tag:"Scenario 15", title:"T-Bills Mature!",
    story:"Your T-Bills have matured with 3% compounded returns. Boring wins the long game.",
    type:"reveal", compute: computeS15 },
  { id:"S16", day:3, age:"Age 39", tag:"Scenario 16", title:"Car Resold",
    story:"Time to let go of the car. Only those who bought a car in Scenario 9 can sell it.",
    type:"reveal", compute: computeS16 },
  { id:"S17", day:3, age:"Age 40", tag:"Scenario 17", title:"Tech ETF Surge!",
    story:"The tech ETF has absolutely skyrocketed. Those who invested in Scenario 5 lock in massive profits.",
    type:"reveal", compute: computeS17 },
  { id:"S18", day:3, age:"Age 41", tag:"Scenario 18", title:"Sale of BTO / Condo",
    story:"Property market has grown. Time to cash out — BTO gets back $240,000, Condo gets back $280,000.",
    type:"reveal", compute: computeS18 },
];

const DAY_INFO = {
  1: { label:"Day 1", sub:"Early Career (Ages 22-26)",    color:"#4ade80" },
  2: { label:"Day 2", sub:"Building Life (Ages 28-34)",   color:"#facc15" },
  3: { label:"Day 3", sub:"Reaping Results (Ages 35-41)", color:"#f97316" },
};

const PLAYER_NAMES = [
  "Damian Cheah","Klavier","Fong Ching Rong","Li Jiaxin","Quan Rui",
  "Titus Wee Jian Kai","Lakhotiya Sonakshi","Dave Santos","Mervell Tan","Zong Xian",
  "Jordan Lim","Kaize Aden Tee","Aloysius Ang Chang Yi","Lucas Koh","Brian Cheah",
  "Winnie Chua Xing Hui","Matthew Aundre Nonis","Ethan New","Chee Mun Hua Chervelle","Ravichandran Yugavaani",
  "Tay Kai Rong Marcus","Izac Tan Yi Jin","Teo Yu Kang Elton","Lee Zi Yen Arianna","Geremia Tan Mun Jun",
  "Ong Shao Kai","Samuel Kwok","Brendon Kwok","Hana Yang"
];
const TOTAL_PLAYERS = 29;

const BASE_NW = 100000;
const FACIL_PASS = "tldr2026";


function WheelCanvas({ wheelAngle, wheelPicked, wheelColors }) {
  var canvasRef = useRef(null);
  var names = PLAYER_NAMES.map(function(n){ var first = n.split(" ")[0]; return first.length > 5 ? first.slice(0,5) : first; });
  var total = names.length;

  useEffect(function() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W = 340; var cx = W/2; var cy = W/2; var r = 155;
    ctx.clearRect(0, 0, W, W);
    var segA = (2 * Math.PI) / total;

    for (var i = 0; i < total; i++) {
      var start = wheelAngle + i * segA - Math.PI/2;
      var end = start + segA;
      var isPicked = wheelPicked.indexOf(i+1) !== -1;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = isPicked ? "#1e293b" : wheelColors[i % wheelColors.length];
      ctx.globalAlpha = isPicked ? 0.35 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#080e1e";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text radiating outward from center
      var midA = start + segA / 2;
      var tx = cx + r * 0.65 * Math.cos(midA);
      var ty = cy + r * 0.65 * Math.sin(midA);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midA - Math.PI / 2);
      ctx.fillStyle = "white";
      ctx.globalAlpha = isPicked ? 0.3 : 1;
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(names[i], 0, 0);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, 2*Math.PI);
    ctx.fillStyle = "#080e1e";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [wheelAngle, wheelPicked]);

  return (
    <div style={{position:"relative", width:"340px", height:"340px", margin:"0 auto 12px"}}>
      <div style={{position:"absolute", top:"-2px", left:"50%", transform:"translateX(-50%)", fontSize:"24px", zIndex:10, lineHeight:"1"}}>▼</div>
      <canvas ref={canvasRef} width="340" height="340" style={{borderRadius:"50%"}} />
    </div>
  );
}

function computeNW(decisions, completed) {
  var nw = BASE_NW;
  for (var idx = 0; idx < SCENARIOS.length; idx++) {
    var s = SCENARIOS[idx];
    if (!completed.has(s.id)) continue;
    if (s.type === "choice" || s.type === "insurance_s7") {
      var allC = (s.choices||[]).concat(s.choices_existing||[]).concat(s.choices_new||[]);
      var ch = allC.find(function(c) { return c.value === decisions[s.id]; });
      if (ch) { nw += (ch.cost || 0); nw += (ch.gain || 0); }
    } else if (s.type === "automatic") {
      nw += s.gain;
    } else if (s.type === "reveal" || s.type === "ci") {
      if (s.compute) {
        var r = s.type === "ci" ? s.compute(decisions, decisions[s.id]) : s.compute(decisions);
        if (r) nw += r.gain;
      }
    }
  }
  return nw;
}

function computeNAV(decisions, completed) {
  var d = decisions; var c = completed;
  var cash = computeNW(decisions, completed);
  var property = 0;
  if (c.has("S2")) {
    if (d.S2 === "hdb")   property = 240000;
    if (d.S2 === "condo") property = 280000;
  }
  if (c.has("S18")) property = 0;
  var etf = 0;
  if (c.has("S5") && d.S5 === "etf") etf = 10000;
  if (c.has("S17")) etf = 0;
  var tbills = 0;
  if (c.has("S4") && d.S4 === "tbills") tbills = 10000;
  if (c.has("S15")) tbills = 0;
  var car = 0;
  if (c.has("S9") && d.S9 === "car") car = 60000;
  if (c.has("S16")) car = 0;
  var insured = (c.has("S1") && d.S1 === "insured") ||
                (c.has("S7") && (d.S7 === "cont_insurance" || d.S7 === "new_insurance"));
  var nav = cash + property + etf + tbills + car;
  return { cash:cash, property:property, etf:etf, tbills:tbills, car:car, insured:insured, nav:nav };
}

function fmt(n) { return "$" + n.toLocaleString(); }
function clr(n) { return n >= 0 ? "#4ade80" : "#f87171"; }

// ── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  var [mode, setMode] = useState(null);
  var [booting, setBooting] = useState(true);
  var [facilAuthed, setFacilAuthed] = useState(false);
  var [facilPass, setFacilPass] = useState("");
  var [globalIdx, setGlobalIdx] = useState(0);
  var [allPlayerData, setAllPlayerData] = useState({});
  var [ciAffected, setCiAffected] = useState([]);
  var [wheelSpinning, setWheelSpinning] = useState(false);
  var [wheelAngle, setWheelAngle] = useState(0);
  var [wheelResult, setWheelResult] = useState(null);
  var [wheelPool, setWheelPool] = useState([]);
  var [wheelPicked, setWheelPicked] = useState([]);
  var [playerNum, setPlayerNum] = useState(null);
  var [numInput, setNumInput] = useState("");
  var [myDecisions, setMyDecisions] = useState({});
  var [myCompleted, setMyCompleted] = useState(new Set());
  var [liveGlobalIdx, setLiveGlobalIdx] = useState(0);
  var [pendingCi, setPendingCi] = useState(null);
  var [revealResult, setRevealResult] = useState(null);
  var [allPlayersNav, setAllPlayersNav] = useState({});
  var [passwordInput, setPasswordInput] = useState("");
  var [passwordError, setPasswordError] = useState("");
  var [settingPassword, setSettingPassword] = useState(false);
  var [awaitingPassword, setAwaitingPassword] = useState(false);
  var [pendingPlayerNum, setPendingPlayerNum] = useState(null);
  var [showPassword, setShowPassword] = useState(false);
  var [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  useEffect(function() {
    sGet("global_idx").then(function(gi) {
      if (gi !== null) { setGlobalIdx(gi); setLiveGlobalIdx(gi); }
      setBooting(false);
    });
  }, []);

  useEffect(function() {
    if (mode !== "facilitator") return;
    function load() {
      var promises = Array.from({length:TOTAL_PLAYERS}, function(_,i) { return sGet("player_" + (i+1)); });
      Promise.all(promises).then(function(results) {
        var all = {};
        results.forEach(function(pd, i) { if (pd) all[i+1] = pd; });
        setAllPlayerData(all);
      });
    }
    load();
    var iv = setInterval(load, 3500);
    return function() { clearInterval(iv); };
  }, [mode]);

  useEffect(function() {
    if (mode !== "player" || playerNum === null) return;
    var lastGi = -1;
    function poll() {
      sGet("global_idx").then(function(gi) {
        if (gi !== null && gi !== lastGi) {
          lastGi = gi; setRevealResult(null); setPendingCi(null); setLiveGlobalIdx(gi);
        }
      });
      sGet("player_" + playerNum).then(function(pd) {
        if (pd) { setMyDecisions(pd.decisions || {}); setMyCompleted(new Set(pd.completed || [])); }
      });
    }
    function fetchAll() {
      var promises = Array.from({length:TOTAL_PLAYERS}, function(_,i) { return sGet("player_" + (i+1)); });
      Promise.all(promises).then(function(results) {
        var all = {};
        results.forEach(function(pd, i) { if (pd) all[i+1] = pd; });
        setAllPlayersNav(all);
      });
    }
    poll(); fetchAll();
    var iv = setInterval(function() { poll(); fetchAll(); }, 3000);
    return function() { clearInterval(iv); };
  }, [mode, playerNum]);

  function facilAdvance() {
    var next = Math.min(globalIdx + 1, SCENARIOS.length - 1);
    setGlobalIdx(next); sSet("global_idx", next);
  }
  function facilBack() {
    var prev = Math.max(globalIdx - 1, 0);
    setGlobalIdx(prev); sSet("global_idx", prev);
  }
  function facilReset() {
    if (!window.confirm("Reset ALL player data and restart?")) return;
    setGlobalIdx(0); setAllPlayerData({}); setCiAffected([]);
    setWheelPool([]); setWheelPicked([]); setWheelResult(null); setWheelAngle(0);
    sSet("global_idx", 0);
    for (var i = 1; i <= TOTAL_PLAYERS; i++) sSet("player_" + i, { decisions:{}, completed:[] });
  }

  async function joinGame() {
    var n = parseInt(numInput);
    if (!n || n < 1 || n > TOTAL_PLAYERS) return;
    setPendingPlayerNum(n); setPasswordInput(""); setConfirmPasswordInput(""); setPasswordError(""); setShowPassword(false);
    var pd = await sGet("player_" + n);
    if (pd && pd.password) { setAwaitingPassword(true); setSettingPassword(false); }
    else { setSettingPassword(true); setAwaitingPassword(false); }
  }

  async function confirmPassword() {
    if (!passwordInput || passwordInput.length < 3) { setPasswordError("Password must be at least 3 characters."); return; }
    if (settingPassword && passwordInput !== confirmPasswordInput) { setPasswordError("Passwords do not match. Please check again."); return; }
    var n = pendingPlayerNum;
    setMyDecisions({}); setMyCompleted(new Set()); setRevealResult(null); setPendingCi(null);
    if (settingPassword) {
      await sSet("player_" + n, { password: passwordInput, decisions:{}, completed:[] });
      setPlayerNum(n);
    } else {
      var pd = await sGet("player_" + n);
      if (!pd || pd.password !== passwordInput) { setPasswordError("Wrong password. Try again!"); return; }
      setMyDecisions(pd.decisions || {}); setMyCompleted(new Set(pd.completed || [])); setPlayerNum(n);
    }
    var gi = await sGet("global_idx");
    if (gi !== null) setLiveGlobalIdx(gi);
    setSettingPassword(false); setAwaitingPassword(false); setPendingPlayerNum(null);
    setPasswordInput(""); setConfirmPasswordInput(""); setPasswordError(""); setShowPassword(false);
  }

  async function submitDecision(scenarioId, choiceValue) {
    var nd = Object.assign({}, myDecisions); nd[scenarioId] = choiceValue;
    var arr = Array.from(myCompleted); arr.push(scenarioId);
    var nc = new Set(arr);
    var s = SCENARIOS.find(function(x) { return x.id === scenarioId; });
    if (s) {
      var allC = (s.choices||[]).concat(s.choices_existing||[]).concat(s.choices_new||[]);
      var chosen = allC.find(function(c) { return c.value === choiceValue; });
      if (chosen && chosen.cost && chosen.cost < 0) {
        var currentCash = computeNW(myDecisions, myCompleted);
        if (currentCash + chosen.cost < 0) return;
      }
    }
    setMyDecisions(nd); setMyCompleted(nc); setPendingCi(null);
    if (s && s.type === "reveal") setRevealResult(s.compute(nd));
    else if (s && s.type === "ci") setRevealResult(s.compute(nd, choiceValue));
    else setRevealResult(null);
    var savedPd = await sGet("player_" + playerNum);
    var savedPw = savedPd ? (savedPd.password || "") : "";
    await sSet("player_" + playerNum, { password: savedPw, decisions: nd, completed: Array.from(nc) });
  }

  async function ackAutomatic(scenarioId) {
    var arr = Array.from(myCompleted); arr.push(scenarioId);
    var nc = new Set(arr); setMyCompleted(nc); setRevealResult(null);
    var savedPd = await sGet("player_" + playerNum);
    var savedPw = savedPd ? (savedPd.password || "") : "";
    await sSet("player_" + playerNum, { password: savedPw, decisions: myDecisions, completed: Array.from(nc) });
  }

  var currentS = SCENARIOS[liveGlobalIdx];
  var di = DAY_INFO[currentS ? currentS.day : 1] || DAY_INFO[1];
  var myNW = computeNW(myDecisions, myCompleted);
  var nwDelta = myNW - BASE_NW;
  var thisDone = myCompleted.has(currentS ? currentS.id : "");
  var pct = Math.round((liveGlobalIdx / SCENARIOS.length) * 100);

  var s = {
    page: { minHeight:"100vh", background:"#080e1e", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px", fontFamily:"Georgia, serif" },
    card: { background:"rgba(8,16,32,0.98)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"18px", padding:"26px 22px" },
    chip: { display:"inline-block", background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.28)", borderRadius:"20px", padding:"3px 13px", fontSize:"10px", fontFamily:"monospace", color:"#a5b4fc", letterSpacing:"2px", marginBottom:"10px" },
    btnP: { background:"linear-gradient(135deg, #6366f1, #7c3aed)", color:"white", border:"none", borderRadius:"11px", padding:"13px 22px", fontSize:"15px", fontWeight:"700", cursor:"pointer", width:"100%" },
    btnG: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"11px", padding:"10px", fontSize:"13px", color:"#64748b", cursor:"pointer", width:"100%" },
    btnS: { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:"8px", padding:"7px 13px", fontSize:"12px", color:"#94a3b8", cursor:"pointer" },
    inp:  { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"10px", padding:"12px 14px", color:"#f8fafc", fontSize:"15px", outline:"none", width:"100%", boxSizing:"border-box" },
    cBtn: { display:"flex", alignItems:"center", gap:"11px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"13px 14px", cursor:"pointer", width:"100%", marginBottom:"9px" },
    badge:{ background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"8px", padding:"7px 11px", fontSize:"11px", color:"#818cf8", marginBottom:"13px" },
  };

  if (booting) return <div style={s.page}><div style={{color:"#64748b"}}>Loading...</div></div>;

  // ── MODE SELECT ────────────────────────────────────────────────────────────
  if (!mode) return (
    <div style={s.page}>
      <div style={Object.assign({}, s.card, {maxWidth:"400px", textAlign:"center"})}>
        <div style={s.chip}>TLDR 6.0</div>
        <div style={{fontSize:"44px", margin:"10px 0 6px"}}>🎮</div>
        <h1 style={{fontSize:"32px", fontWeight:"900", color:"#f8fafc", margin:"0 0 4px", letterSpacing:"-1px"}}>Life in 3 Days</h1>
        <p style={{color:"#64748b", fontSize:"13px", fontStyle:"italic", margin:"0 0 26px"}}>A Financial Life Simulation</p>
        <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
          <button style={s.btnP} onClick={function(){setMode("player");}}>I am a Player — Join Game</button>
          <button style={Object.assign({}, s.btnP, {background:"rgba(99,102,241,0.12)", color:"#a5b4fc"})} onClick={function(){setMode("facilitator");}}>Facilitator Panel</button>
        </div>
      </div>
    </div>
  );

  // ── FACILITATOR AUTH ───────────────────────────────────────────────────────
  if (mode === "facilitator" && !facilAuthed) return (
    <div style={s.page}>
      <div style={Object.assign({}, s.card, {maxWidth:"360px", textAlign:"center"})}>
        <div style={{fontSize:"30px", marginBottom:"12px"}}>🔒</div>
        <h2 style={{color:"#f8fafc", fontSize:"20px", margin:"0 0 18px"}}>Facilitator Access</h2>
        <input style={s.inp} type="password" placeholder="Enter facilitator password"
          value={facilPass} onChange={function(e){setFacilPass(e.target.value);}}
          onKeyDown={function(e){if(e.key==="Enter"&&facilPass===FACIL_PASS)setFacilAuthed(true);}} />
        <button style={Object.assign({}, s.btnP, {marginTop:"10px"})} onClick={function(){if(facilPass===FACIL_PASS)setFacilAuthed(true);}}>Enter</button>
        <button style={Object.assign({}, s.btnG, {marginTop:"8px"})} onClick={function(){setMode(null);}}>Back</button>
      </div>
    </div>
  );

  // ── FACILITATOR PANEL ──────────────────────────────────────────────────────
  if (mode === "facilitator" && facilAuthed) {
    var fs = SCENARIOS[globalIdx];
    var fdi = DAY_INFO[fs ? fs.day : 1] || DAY_INFO[1];
    var doneCount = Object.values(allPlayerData).filter(function(p) { return p.completed && p.completed.indexOf(fs ? fs.id : "") !== -1; }).length;
    var wheelColors = ["#f87171","#fb923c","#facc15","#4ade80","#60a5fa","#a78bfa","#f472b6","#34d399","#f97316","#818cf8","#22d3ee","#e879f9","#a3e635","#fb7185","#fbbf24","#6ee7b7","#93c5fd","#c4b5fd","#fda4af","#86efac","#67e8f9","#d8b4fe","#fca5a5","#fed7aa","#d9f99d","#a7f3d0","#bae6fd","#e9d5ff","#fecdd3"];
    var allNames = PLAYER_NAMES.map(function(name, i) { return {n:i+1, name:name.split(" ")[0]}; });
    var segments = allNames.filter(function(p) { return wheelPicked.indexOf(p.n) === -1; });
    if (segments.length === 0) segments = allNames;
    var segAngle = 360 / segments.length;

    function initWheel() {
      var nums = Array.from({length:TOTAL_PLAYERS}, function(_,i){return i+1;});
      var shuffled = nums.slice().sort(function(){return Math.random()-0.5;});
      var ci7 = shuffled.slice(0,7);
      setWheelPool(ci7); setWheelPicked([]); setCiAffected([]); setWheelResult(null); setWheelAngle(0);
    }
    function spinWheel() {
      if (wheelSpinning || wheelPicked.length >= 7) return;
      if (wheelPool.length === 0) { initWheel(); return; }
      var nextPick = wheelPool.find(function(n){ return wheelPicked.indexOf(n) === -1; });
      if (!nextPick) return;
      var total = PLAYER_NAMES.length;
      var segA = (2 * Math.PI) / total;
      var targetIdx = nextPick - 1;
      var spins = (5 + Math.floor(Math.random()*3)) * 2 * Math.PI;
      var cur = ((wheelAngle % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI);
      var targetSegMid = targetIdx * segA + segA/2;
      var pointerTarget = (2*Math.PI - targetSegMid) % (2*Math.PI);
      var delta = ((pointerTarget - cur) + 2*Math.PI) % (2*Math.PI);
      var targetAngle = wheelAngle + spins + delta;
      var startAngle = wheelAngle;
      var duration = 3500;
      var startTime = null;
      setWheelSpinning(true); setWheelResult(null);
      function animate(now) {
        if (!startTime) startTime = now;
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = startAngle + (targetAngle - startAngle) * eased;
        setWheelAngle(current);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setWheelAngle(targetAngle);
          setWheelSpinning(false);
          setWheelResult(nextPick);
          setWheelPicked(function(prev) {
            var next = prev.concat([nextPick]);
            setCiAffected(next);
            return next;
          });
        }
      }
      requestAnimationFrame(animate);
    }

    return (
      <div style={Object.assign({}, s.page, {alignItems:"flex-start", overflowY:"auto", paddingTop:"16px"})}>
        <div style={{maxWidth:"720px", width:"100%", display:"flex", flexDirection:"column", gap:"10px"}}>

          <div style={Object.assign({}, s.card, {padding:"14px 18px"})}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px"}}>
              <div>
                <div style={{color:"#a5b4fc", fontWeight:"800", fontSize:"12px"}}>FACILITATOR PANEL</div>
                <div style={{color:fdi.color, fontSize:"12px", marginTop:"2px"}}>{fdi.label} — {fs ? fs.age : ""} — {fs ? fs.tag : ""}</div>
              </div>
              <div style={{display:"flex", gap:"8px"}}>
                <button style={Object.assign({}, s.btnS, {color:"#fca5a5", background:"rgba(248,113,113,0.1)"})} onClick={facilReset}>Reset</button>
                <button style={s.btnS} onClick={function(){setMode(null);}}>Exit</button>
              </div>
            </div>
          </div>

          <div style={Object.assign({}, s.card, {padding:"18px"})}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px"}}>
              <div>
                <div style={{fontSize:"10px", color:fdi.color, fontWeight:"800", letterSpacing:"2px", textTransform:"uppercase"}}>{fs ? fs.tag : ""}</div>
                <h2 style={{fontSize:"18px", fontWeight:"900", color:"#f8fafc", margin:"4px 0 0"}}>{fs ? fs.title : ""}</h2>
              </div>
              <div style={{textAlign:"right", flexShrink:"0", marginLeft:"12px"}}>
                <div style={{fontSize:"10px", color:"#64748b"}}>Players done</div>
                <div style={{fontSize:"28px", fontWeight:"900", color:doneCount>=TOTAL_PLAYERS?"#4ade80":doneCount>0?"#facc15":"#64748b"}}>{doneCount}/{TOTAL_PLAYERS}</div>
              </div>
            </div>
            <p style={{color:"#64748b", fontSize:"13px", lineHeight:"1.6", margin:"0 0 12px"}}>{fs ? fs.story : ""}</p>
            {fs && fs.type === "automatic" && <div style={{background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"8px", padding:"10px 12px", fontSize:"12px", color:"#a5b4fc", marginBottom:"12px"}}>{fs.note}</div>}

            {/* CI Spin Wheel */}
            {fs && fs.id === "S12" && (
              <div style={{marginBottom:"12px"}}>
                <div style={{textAlign:"center", marginBottom:"10px"}}>
                  <div style={{color:"#fca5a5", fontWeight:"800", fontSize:"13px", marginBottom:"4px"}}>SPIN THE WHEEL — 7 Players Get CI</div>
                  <div style={{color:"#64748b", fontSize:"11px"}}>{wheelPicked.length}/7 selected</div>
                </div>
                <WheelCanvas wheelAngle={wheelAngle} wheelPicked={wheelPicked} wheelColors={wheelColors} />
                {wheelResult && !wheelSpinning && (
                  <div style={{textAlign:"center", background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.4)", borderRadius:"12px", padding:"10px", marginBottom:"10px"}}>
                    <div style={{color:"#fca5a5", fontSize:"11px", marginBottom:"2px"}}>CI goes to...</div>
                    <div style={{color:"#f8fafc", fontWeight:"900", fontSize:"20px"}}>{"#" + wheelResult + " " + PLAYER_NAMES[wheelResult-1].split(" ")[0] + "!"}</div>
                  </div>
                )}
                <div style={{display:"flex", gap:"8px", marginBottom:"8px"}}>
                  {wheelPool.length === 0 ? (
                    <button style={Object.assign({}, s.btnP, {fontSize:"13px", padding:"10px"})} onClick={initWheel}>Start Wheel</button>
                  ) : (
                    <button style={Object.assign({}, s.btnP, {fontSize:"13px", padding:"10px", opacity:wheelSpinning||wheelPicked.length>=7?0.4:1, background:"linear-gradient(135deg,#dc2626,#991b1b)"})} onClick={spinWheel} disabled={wheelSpinning||wheelPicked.length>=7}>
                      {wheelSpinning ? "Spinning..." : wheelPicked.length >= 7 ? "All 7 Picked!" : "Spin! (" + (7-wheelPicked.length) + " left)"}
                    </button>
                  )}
                  <button style={Object.assign({}, s.btnS, {padding:"10px 14px"})} onClick={initWheel}>Reset</button>
                </div>
                {wheelPicked.length > 0 && (
                  <div style={{background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:"8px", padding:"10px 12px"}}>
                    <div style={{color:"#fca5a5", fontWeight:"700", fontSize:"11px", marginBottom:"6px"}}>CI Affected ({wheelPicked.length}/7):</div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:"5px"}}>
                      {wheelPicked.map(function(n) { return <span key={n} style={{background:"rgba(248,113,113,0.2)", borderRadius:"6px", padding:"3px 8px", fontSize:"11px", color:"#fca5a5", fontWeight:"700"}}>{"#" + n + " " + PLAYER_NAMES[n-1].split(" ")[0]}</span>; })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{display:"flex", gap:"8px"}}>
              <button style={Object.assign({}, s.btnS, {flex:"1"})} onClick={facilBack} disabled={globalIdx === 0}>Prev</button>
              {globalIdx < SCENARIOS.length - 1 ? (
                <button style={Object.assign({}, s.btnP, {flex:"2", padding:"11px"})} onClick={facilAdvance}>Unlock Next Scenario</button>
              ) : (
                <div style={Object.assign({}, s.btnP, {flex:"2", padding:"11px", background:"rgba(74,222,128,0.15)", color:"#4ade80", textAlign:"center", cursor:"default"})}>Game Complete!</div>
              )}
            </div>
            <div style={{textAlign:"center", color:"#334155", fontSize:"11px", marginTop:"6px"}}>{globalIdx + 1} / {SCENARIOS.length}</div>
          </div>

          {/* NAV Table */}
          <div style={Object.assign({}, s.card, {padding:"14px 16px", overflowX:"auto"})}>
            <div style={{color:"#64748b", fontSize:"11px", fontWeight:"700", letterSpacing:"1px", marginBottom:"12px"}}>NET ASSET VALUE — ALL PLAYERS</div>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:"11px"}}>
              <thead>
                <tr style={{borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                  {["Player","Cash","Property","ETF","T-Bills","Car","Insured","NAV"].map(function(h) {
                    return <th key={h} style={{padding:"6px 8px", color:"#64748b", fontWeight:"700", textAlign:"right", whiteSpace:"nowrap"}}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({length:TOTAL_PLAYERS}, function(_,i){return i+1;}).map(function(n) {
                  var pd = allPlayerData[n];
                  var dec = pd ? (pd.decisions || {}) : {};
                  var comp = new Set(pd ? (pd.completed || []) : []);
                  var nav = computeNAV(dec, comp);
                  var done = pd && pd.completed && pd.completed.indexOf(fs ? fs.id : "") !== -1;
                  var allNavVals = Array.from({length:TOTAL_PLAYERS}, function(_,i){return i+1;}).map(function(x){
                    var xpd=allPlayerData[x]; return computeNAV(xpd?(xpd.decisions||{}):{}, new Set(xpd?(xpd.completed||[]):[])).nav;
                  });
                  var maxNav = Math.max.apply(null, allNavVals);
                  var isTop = nav.nav === maxNav && nav.nav > BASE_NW;
                  return (
                    <tr key={n} style={{borderBottom:"1px solid rgba(255,255,255,0.04)", background:isTop?"rgba(250,204,21,0.05)":done?"rgba(74,222,128,0.03)":"transparent"}}>
                      <td style={{padding:"7px 8px", whiteSpace:"nowrap"}}>
                        <span style={{color:isTop?"#facc15":done?"#4ade80":"#94a3b8", fontWeight:"700"}}>{isTop?"👑 ":done?"✓ ":""}{PLAYER_NAMES[n-1].split(" ")[0]}</span>
                        {done && fs && (fs.choices||fs.choices_existing) && dec[fs.id] && (function(){
                          var allC=(fs.choices||[]).concat(fs.choices_existing||[]).concat(fs.choices_new||[]);
                          var ch=allC.find(function(c){return c.value===dec[fs.id];});
                          return ch ? <div style={{fontSize:"9px", color:"#64748b", marginTop:"2px"}}>{ch.label}</div> : null;
                        })()}
                      </td>
                      <td style={{padding:"7px 8px", textAlign:"right", color:"#94a3b8"}}>{fmt(nav.cash)}</td>
                      <td style={{padding:"7px 8px", textAlign:"right", color:nav.property>0?"#4ade80":"#334155"}}>{nav.property>0?fmt(nav.property):"—"}</td>
                      <td style={{padding:"7px 8px", textAlign:"right", color:nav.etf>0?"#a5b4fc":"#334155"}}>{nav.etf>0?fmt(nav.etf):"—"}</td>
                      <td style={{padding:"7px 8px", textAlign:"right", color:nav.tbills>0?"#4ade80":"#334155"}}>{nav.tbills>0?fmt(nav.tbills):"—"}</td>
                      <td style={{padding:"7px 8px", textAlign:"right", color:nav.car>0?"#facc15":"#334155"}}>{nav.car>0?fmt(nav.car):"—"}</td>
                      <td style={{padding:"7px 8px", textAlign:"center", color:nav.insured?"#4ade80":"#f87171"}}>{nav.insured?"✓":"✗"}</td>
                      <td style={{padding:"7px 8px", textAlign:"right", fontWeight:"900", color:clr(nav.nav-BASE_NW)}}>{fmt(nav.nav)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Facilitator Leaderboard */}
          {(function() {
            var allNavs = Array.from({length:TOTAL_PLAYERS}, function(_,i) {
              var n=i+1; var pd=allPlayerData[n];
              var dec=pd?(pd.decisions||{}):{};
              var comp=new Set(pd?(pd.completed||[]):[]);
              return {n:n, name:PLAYER_NAMES[i], nav:computeNAV(dec,comp).nav};
            }).sort(function(a,b){return b.nav-a.nav;});
            var medals=["🥇","🥈","🥉"];
            var podiumBg=["linear-gradient(135deg,#854d0e,#713f12)","linear-gradient(135deg,#1e293b,#0f172a)","linear-gradient(135deg,#431407,#1c0a03)"];
            var podiumColors=["#facc15","#94a3b8","#b45309"];
            var podiumHeight=["80px","60px","48px"];
            var top3=allNavs.slice(0,3);
            return (
              <div style={Object.assign({}, s.card, {padding:"16px"})}>
                <div style={{color:"#64748b", fontSize:"11px", fontWeight:"700", letterSpacing:"1px", marginBottom:"14px", textAlign:"center"}}>LEADERBOARD</div>
                <div style={{display:"flex", alignItems:"flex-end", justifyContent:"center", gap:"6px", marginBottom:"16px"}}>
                  {[top3[1],top3[0],top3[2]].map(function(p,pos) {
                    if (!p) return null;
                    var realRank=pos===0?1:pos===1?0:2;
                    var col=podiumColors[realRank]; var ht=podiumHeight[realRank];
                    return (
                      <div key={p.n} style={{flex:"1", display:"flex", flexDirection:"column", alignItems:"center"}}>
                        <div style={{fontSize:realRank===0?"28px":"22px", marginBottom:"4px"}}>{medals[realRank]}</div>
                        <div style={{color:col, fontWeight:"900", fontSize:"13px", marginBottom:"2px", textAlign:"center"}}>{p.name.split(" ")[0]}</div>
                        <div style={{color:"#4ade80", fontWeight:"800", fontSize:"12px", marginBottom:"4px"}}>{fmt(p.nav)}</div>
                        <div style={{width:"100%", height:ht, background:podiumBg[realRank], borderRadius:"6px 6px 0 0", display:"flex", alignItems:"center", justifyContent:"center"}}>
                          <span style={{color:col, fontWeight:"900", fontSize:"20px"}}>{"#"+(realRank+1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── PLAYER PASSWORD SCREEN ─────────────────────────────────────────────────
  if (mode === "player" && playerNum === null && (settingPassword || awaitingPassword)) return (
    <div style={s.page}>
      <div style={Object.assign({}, s.card, {maxWidth:"360px", textAlign:"center"})}>
        <div style={{fontSize:"36px", marginBottom:"10px"}}>{settingPassword ? "🔐" : "🔑"}</div>
        {settingPassword ? (
          <div>
            <div style={{fontSize:"22px", marginBottom:"6px"}}>👋</div>
            <h2 style={{fontSize:"22px", fontWeight:"900", color:"#f8fafc", margin:"0 0 6px"}}>{"Welcome, " + PLAYER_NAMES[(pendingPlayerNum||1)-1].split(" ")[0] + "!"}</h2>
            <p style={{color:"#a5b4fc", fontSize:"14px", fontWeight:"600", margin:"0 0 4px"}}>Please set your password</p>
            <p style={{color:"#64748b", fontSize:"13px", margin:"0 0 18px"}}>You will need this to log back in.</p>
          </div>
        ) : (
          <div>
            <h2 style={{fontSize:"22px", fontWeight:"900", color:"#f8fafc", margin:"0 0 6px"}}>Welcome Back!</h2>
            <p style={{color:"#94a3b8", fontSize:"14px", margin:"0 0 4px"}}>{PLAYER_NAMES[(pendingPlayerNum||1)-1]}</p>
            <p style={{color:"#64748b", fontSize:"13px", margin:"0 0 18px"}}>Enter your password to continue.</p>
          </div>
        )}
        <div style={{position:"relative", marginBottom:"10px"}}>
          <input style={Object.assign({}, s.inp, {paddingRight:"50px"})}
            type={showPassword ? "text" : "password"}
            placeholder={settingPassword ? "Create password" : "Enter password"}
            value={passwordInput}
            onChange={function(e){setPasswordInput(e.target.value); setPasswordError("");}}
            onKeyDown={function(e){if(e.key==="Enter")confirmPassword();}} />
          <button onClick={function(){setShowPassword(!showPassword);}}
            style={{position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:"14px"}}>
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        {settingPassword && (
          <div style={{position:"relative", marginBottom:"10px"}}>
            <input style={Object.assign({}, s.inp, {paddingRight:"50px"})}
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPasswordInput}
              onChange={function(e){setConfirmPasswordInput(e.target.value); setPasswordError("");}}
              onKeyDown={function(e){if(e.key==="Enter")confirmPassword();}} />
          </div>
        )}
        {settingPassword && passwordInput && (
          <div style={{background:"rgba(255,255,255,0.05)", borderRadius:"8px", padding:"8px 12px", marginBottom:"10px", fontSize:"12px", color:"#94a3b8", textAlign:"left"}}>
            Your password: <strong style={{color:"#f8fafc"}}>{showPassword ? passwordInput : "•".repeat(passwordInput.length)}</strong>
            {confirmPasswordInput && <span style={{marginLeft:"8px", color:passwordInput===confirmPasswordInput?"#4ade80":"#f87171"}}>{passwordInput===confirmPasswordInput?"✓ Match":"✗ No match"}</span>}
          </div>
        )}
        {passwordError && <div style={{color:"#f87171", fontSize:"13px", marginBottom:"10px"}}>{passwordError}</div>}
        <button style={Object.assign({}, s.btnP, {marginTop:"8px"})} onClick={confirmPassword}>
          {settingPassword ? "Set Password and Enter" : "Login"}
        </button>
        <button style={Object.assign({}, s.btnG, {marginTop:"8px"})} onClick={function(){setSettingPassword(false);setAwaitingPassword(false);setPendingPlayerNum(null);setPasswordError("");}}>Back</button>
      </div>
    </div>
  );

  // ── PLAYER NUMBER SELECT ───────────────────────────────────────────────────
  if (mode === "player" && playerNum === null) return (
    <div style={s.page}>
      <div style={Object.assign({}, s.card, {maxWidth:"420px", textAlign:"center"})}>
        <div style={s.chip}>TLDR 6.0</div>
        <div style={{fontSize:"38px", margin:"10px 0 4px"}}>👤</div>
        <h2 style={{fontSize:"24px", fontWeight:"900", color:"#f8fafc", margin:"0 0 4px"}}>Join the Game</h2>
        <p style={{color:"#64748b", fontSize:"13px", margin:"0 0 18px"}}>Tap your player number</p>
        <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px", marginBottom:"16px"}}>
          {Array.from({length:TOTAL_PLAYERS}, function(_,i){return i+1;}).map(function(n) {
            return (
              <button key={n} style={{padding:"10px 0", fontSize:"14px", fontWeight:"700", borderRadius:"8px", cursor:"pointer",
                background:numInput==n?"rgba(99,102,241,0.28)":"rgba(255,255,255,0.04)",
                border:numInput==n?"1px solid #6366f1":"1px solid rgba(255,255,255,0.08)",
                color:numInput==n?"#c4b5fd":"#94a3b8"}}
                onClick={function(){setNumInput(String(n));}}>{n}</button>
            );
          })}
        </div>
        {numInput && parseInt(numInput) >= 1 && parseInt(numInput) <= TOTAL_PLAYERS && (
          <div style={{marginBottom:"14px", color:"#4ade80", fontWeight:"700", fontSize:"15px"}}>
            {"Hi, " + PLAYER_NAMES[parseInt(numInput)-1] + "!"}
          </div>
        )}
        <button style={Object.assign({}, s.btnP, {opacity:numInput&&parseInt(numInput)>=1&&parseInt(numInput)<=TOTAL_PLAYERS?1:0.35})}
          disabled={!numInput||parseInt(numInput)<1||parseInt(numInput)>TOTAL_PLAYERS}
          onClick={joinGame}>Enter the Game</button>
        <button style={Object.assign({}, s.btnG, {marginTop:"8px"})} onClick={function(){setMode(null);}}>Back</button>
      </div>
    </div>
  );

  // ── PLAYER IN-GAME ─────────────────────────────────────────────────────────
  return (
    <div style={Object.assign({}, s.page, {alignItems:"flex-start", paddingTop:"14px"})}>
      <div style={{maxWidth:"430px", width:"100%"}}>
        <div style={Object.assign({}, s.card, {padding:"13px 17px", marginBottom:"10px"})}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontWeight:"900", color:"#f8fafc", fontSize:"16px"}}>{PLAYER_NAMES[playerNum-1]}</div>
              <div style={{color:di.color, fontSize:"11px", marginTop:"1px", fontWeight:"600"}}>{di.label} — Player {"#" + playerNum}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"9px", color:"#64748b", letterSpacing:"1px", textTransform:"uppercase"}}>Cash</div>
              <div style={{fontSize:"26px", fontWeight:"900", color:clr(nwDelta)}}>{fmt(myNW)}</div>
              <div style={{fontSize:"10px", color:clr(nwDelta)}}>{nwDelta >= 0 ? "+" : ""}{nwDelta.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{height:"4px", background:"rgba(255,255,255,0.07)", borderRadius:"4px", overflow:"hidden", marginBottom:"6px"}}>
          <div style={{height:"100%", width:pct+"%", background:di.color, borderRadius:"4px", transition:"width 0.5s"}} />
        </div>
        <div style={{display:"flex", gap:"5px", marginBottom:"13px", alignItems:"center"}}>
          {Object.entries(DAY_INFO).map(function(entry) {
            var d=entry[0]; var info=entry[1];
            return <div key={d} style={{padding:"2px 9px", borderRadius:"20px", background:currentS&&currentS.day==d?info.color:"rgba(255,255,255,0.05)", color:currentS&&currentS.day==d?"#0f172a":"#475569", fontSize:"10px", fontWeight:"700"}}>{info.label}</div>;
          })}
          <div style={{marginLeft:"auto", color:"#334155", fontSize:"10px"}}>{liveGlobalIdx+1}/{SCENARIOS.length}</div>
        </div>

        <div style={Object.assign({}, s.card, {padding:"22px 20px"})}>
          <div style={{display:"flex", alignItems:"center", gap:"10px", marginBottom:"13px"}}>
            <div>
              <div style={{fontSize:"9px", color:di.color, fontWeight:"800", letterSpacing:"2px", textTransform:"uppercase"}}>{currentS?currentS.tag:""}</div>
              <h2 style={{fontSize:"17px", fontWeight:"900", color:"#f8fafc", margin:"3px 0 0", lineHeight:"1.2"}}>{currentS?currentS.title:""}</h2>
            </div>
          </div>
          <p style={{color:"#94a3b8", fontSize:"13px", lineHeight:"1.7", margin:"0 0 14px"}}>{currentS?currentS.story:""}</p>
          {currentS && currentS.payoffNote && <div style={s.badge}>{currentS.payoffNote}</div>}

          {/* ALREADY DONE */}
          {thisDone && (
            <div style={{background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"12px", padding:"14px", textAlign:"center"}}>
              <div style={{color:"#a5b4fc", fontWeight:"700", fontSize:"14px", marginBottom:"8px"}}>Decision recorded!</div>
              {currentS && myDecisions[currentS.id] && (function(){
                var allC=(currentS.choices||[]).concat(currentS.choices_existing||[]).concat(currentS.choices_new||[]);
                var ch=allC.find(function(c){return c.value===myDecisions[currentS.id];});
                return ch ? <div style={{background:"rgba(255,255,255,0.05)", borderRadius:"8px", padding:"8px 12px", marginBottom:revealResult?"10px":"0", fontSize:"13px", color:"#e2e8f0"}}>{"You chose: " + ch.label}</div> : null;
              })()}
              {revealResult && (
                <div style={{padding:"12px", background:"rgba(255,255,255,0.05)", borderRadius:"9px", marginBottom:"8px"}}>
                  <div style={{color:"#f8fafc", fontSize:"13px", fontWeight:"600", marginBottom:revealResult.gain!==0?"6px":"0"}}>{revealResult.msg}</div>
                  {revealResult.gain !== 0 && <div style={{color:revealResult.color, fontWeight:"900", fontSize:"22px"}}>{revealResult.gain>0?"+":""}{revealResult.gain.toLocaleString()}</div>}
                </div>
              )}
              <div style={{color:"#475569", fontSize:"11px", marginTop:"6px"}}>Waiting for next scenario...</div>
            </div>
          )}

          {/* NOT DONE */}
          {!thisDone && currentS && (
            <div>
              {/* STANDARD CHOICE */}
              {currentS.type === "choice" && (
                <div>
                  {currentS.choices.map(function(c) {
                    var cash = computeNW(myDecisions, myCompleted);
                    var wouldGoNegative = c.cost && c.cost < 0 && (cash + c.cost) < 0;
                    return (
                      <div key={c.value}>
                        <button style={Object.assign({}, s.cBtn, wouldGoNegative?{opacity:"0.4",cursor:"not-allowed"}:{})}
                          onClick={function(){if(!wouldGoNegative)submitDecision(currentS.id,c.value);}} disabled={wouldGoNegative}>
                          <div style={{flex:"1", textAlign:"left"}}>
                            <div style={{color:"#e2e8f0", fontWeight:"700", fontSize:"14px"}}>{c.label}</div>
                            <div style={{color:"#64748b", fontSize:"12px", marginTop:"1px"}}>{c.sub}</div>
                          </div>
                          <span style={{fontWeight:"900", fontSize:"13px", whiteSpace:"nowrap", color:c.cost&&c.cost<0?"#f87171":c.gain?"#4ade80":"#94a3b8"}}>
                            {c.cost&&c.cost!==0?("-"+fmt(Math.abs(c.cost))):c.gain?("+"+fmt(c.gain)):"—"}
                          </span>
                        </button>
                        {wouldGoNegative && <div style={{color:"#f87171", fontSize:"11px", textAlign:"center", marginTop:"-6px", marginBottom:"6px"}}>Not enough cash!</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* INSURANCE S7 */}
              {currentS.type === "insurance_s7" && (function() {
                var hadInsurance = myDecisions["S1"] === "insured";
                var choices = hadInsurance ? currentS.choices_existing : currentS.choices_new;
                var storyOverride = hadInsurance
                  ? "You bought insurance in Scenario 1. Pay $20,000 to keep your coverage active — or cancel and lose protection."
                  : "You skipped insurance in Scenario 1. You can buy it now for $25,000, or continue without coverage.";
                return (
                  <div>
                    <p style={{color:"#facc15", fontSize:"13px", lineHeight:"1.6", margin:"0 0 14px", padding:"10px 12px", background:"rgba(250,204,21,0.08)", borderRadius:"8px", border:"1px solid rgba(250,204,21,0.2)"}}>{storyOverride}</p>
                    {choices.map(function(c) {
                      var cash = computeNW(myDecisions, myCompleted);
                      var wouldGoNegative = c.cost && c.cost < 0 && (cash + c.cost) < 0;
                      return (
                        <div key={c.value}>
                          <button style={Object.assign({}, s.cBtn, wouldGoNegative?{opacity:"0.4",cursor:"not-allowed"}:{})}
                            onClick={function(){if(!wouldGoNegative)submitDecision(currentS.id,c.value);}} disabled={wouldGoNegative}>
                            <div style={{flex:"1", textAlign:"left"}}>
                              <div style={{color:"#e2e8f0", fontWeight:"700", fontSize:"14px"}}>{c.label}</div>
                              <div style={{color:"#64748b", fontSize:"12px", marginTop:"1px"}}>{c.sub}</div>
                            </div>
                            <span style={{fontWeight:"900", fontSize:"13px", whiteSpace:"nowrap", color:c.cost&&c.cost<0?"#f87171":"#94a3b8"}}>
                              {c.cost&&c.cost!==0?("-"+fmt(Math.abs(c.cost))):"—"}
                            </span>
                          </button>
                          {wouldGoNegative && <div style={{color:"#f87171", fontSize:"11px", textAlign:"center", marginTop:"-6px", marginBottom:"6px"}}>Not enough cash!</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* CI */}
              {currentS.type === "ci" && (
                <div>
                  <div style={Object.assign({}, s.badge, {background:"rgba(248,113,113,0.06)", borderColor:"rgba(248,113,113,0.2)", color:"#fca5a5", marginBottom:"12px"})}>
                    Facilitator announces who is affected — then tap your answer!
                  </div>
                  {currentS.choices.map(function(c) {
                    return (
                      <button key={c.value} style={Object.assign({}, s.cBtn, pendingCi===c.value?{background:"rgba(99,102,241,0.18)",border:"1px solid #6366f1"}:{})}
                        onClick={function(){setPendingCi(c.value);}}>
                        <div style={{color:"#e2e8f0", fontWeight:"700", fontSize:"14px"}}>{c.label}</div>
                      </button>
                    );
                  })}
                  {pendingCi && <button style={Object.assign({}, s.btnP, {marginTop:"12px"})} onClick={function(){submitDecision(currentS.id,pendingCi);}}>Confirm</button>}
                </div>
              )}

              {/* AUTOMATIC */}
              {currentS.type === "automatic" && (
                <div style={{textAlign:"center"}}>
                  <div style={{background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.18)", borderRadius:"10px", padding:"12px", marginBottom:"14px", fontSize:"13px", color:"#a5b4fc", lineHeight:"1.6"}}>{currentS.note}</div>
                  <div style={{fontSize:"34px", fontWeight:"900", marginBottom:"14px", color:currentS.gain>=0?"#4ade80":"#f87171"}}>{currentS.gain>=0?"+":"-"}{fmt(Math.abs(currentS.gain))}</div>
                  <button style={s.btnP} onClick={function(){ackAutomatic(currentS.id);}}>Got it!</button>
                </div>
              )}

              {/* REVEAL */}
              {currentS.type === "reveal" && !revealResult && (
                <div style={{textAlign:"center"}}>
                  <button style={Object.assign({}, s.btnP, {background:"linear-gradient(135deg, #f59e0b, #ea580c)"})}
                    onClick={function(){submitDecision(currentS.id,"revealed");}}>Reveal My Outcome!</button>
                </div>
              )}
              {currentS.type === "reveal" && revealResult && (
                <div style={{textAlign:"center"}}>
                  <div style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", padding:"20px", marginBottom:"14px"}}>
                    <p style={{color:"#f8fafc", fontWeight:"700", fontSize:"15px", margin:"0 0 8px"}}>{revealResult.msg}</p>
                    {revealResult.gain!==0&&<p style={{color:revealResult.color, fontSize:"30px", fontWeight:"900", margin:"0"}}>{revealResult.gain>0?"+":""}{revealResult.gain.toLocaleString()}</p>}
                  </div>
                  <div style={{color:"#475569", fontSize:"12px"}}>Waiting for next scenario...</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FINAL SCREEN */}
        {liveGlobalIdx === SCENARIOS.length - 1 && thisDone && (function() {
          var nav = computeNAV(myDecisions, myCompleted);
          var allNavs = Array.from({length:TOTAL_PLAYERS}, function(_,i) {
            var n=i+1; var pd=allPlayersNav[n];
            var dec=pd?(pd.decisions||{}):(n===playerNum?myDecisions:{});
            var comp=pd?new Set(pd.completed||[]):(n===playerNum?myCompleted:new Set());
            return {n:n, name:PLAYER_NAMES[i], nav:computeNAV(dec,comp).nav};
          }).sort(function(a,b){return b.nav-a.nav;});
          var myRank = allNavs.findIndex(function(x){return x.n===playerNum;})+1;
          var medals=["🥇","🥈","🥉"];
          var podiumBg=["linear-gradient(135deg,#854d0e,#713f12)","linear-gradient(135deg,#1e293b,#0f172a)","linear-gradient(135deg,#431407,#1c0a03)"];
          var podiumColors=["#facc15","#94a3b8","#b45309"];
          var podiumHeight=["80px","60px","48px"];
          var top3=allNavs.slice(0,3);
          return (
            <div style={Object.assign({}, s.card, {marginTop:"10px", padding:"20px"})}>
              <div style={{textAlign:"center", marginBottom:"16px"}}>
                <div style={{fontSize:"30px", marginBottom:"6px"}}>🏁</div>
                <div style={{color:"#facc15", fontWeight:"900", fontSize:"18px", marginBottom:"4px"}}>Journey Complete!</div>
                <div style={{fontSize:"40px", fontWeight:"900", color:clr(nwDelta)}}>{fmt(myNW)}</div>
                <div style={{color:"#64748b", fontSize:"12px", marginTop:"4px"}}>{nwDelta>=0?"+":""}{nwDelta.toLocaleString()} from start</div>
                <div style={{marginTop:"8px", display:"inline-block", background:"rgba(250,204,21,0.1)", border:"1px solid rgba(250,204,21,0.3)", borderRadius:"20px", padding:"4px 16px", color:"#facc15", fontWeight:"800", fontSize:"14px"}}>
                  {"You are #" + myRank + " out of " + TOTAL_PLAYERS}
                </div>
              </div>

              <div style={{borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:"14px", marginBottom:"14px"}}>
                <div style={{textAlign:"center", color:"#64748b", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", marginBottom:"14px"}}>TOP 3</div>
                <div style={{display:"flex", alignItems:"flex-end", justifyContent:"center", gap:"6px", marginBottom:"10px"}}>
                  {[top3[1],top3[0],top3[2]].map(function(p,pos) {
                    if (!p) return null;
                    var realRank=pos===0?1:pos===1?0:2;
                    var isMe=p.n===playerNum;
                    var col=podiumColors[realRank]; var ht=podiumHeight[realRank];
                    return (
                      <div key={p.n} style={{flex:"1", display:"flex", flexDirection:"column", alignItems:"center"}}>
                        <div style={{fontSize:realRank===0?"28px":"22px", marginBottom:"4px"}}>{medals[realRank]}</div>
                        <div style={{color:isMe?"#facc15":col, fontWeight:"900", fontSize:"12px", marginBottom:"2px", textAlign:"center"}}>{p.name.split(" ")[0]}{isMe?" 👈":""}</div>
                        <div style={{color:"#4ade80", fontWeight:"800", fontSize:"11px", marginBottom:"4px"}}>{fmt(p.nav)}</div>
                        <div style={{width:"100%", height:ht, background:podiumBg[realRank], borderRadius:"6px 6px 0 0", display:"flex", alignItems:"center", justifyContent:"center", border:isMe?"2px solid #facc15":"none"}}>
                          <span style={{color:col, fontWeight:"900", fontSize:"20px"}}>{"#"+(realRank+1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:"14px"}}>
                <div style={{color:"#64748b", fontSize:"10px", fontWeight:"700", letterSpacing:"1px", marginBottom:"10px"}}>YOUR ASSET BREAKDOWN</div>
                {[
                  {label:"Cash", value:nav.cash, color:"#94a3b8"},
                  {label:"Property", value:nav.property, color:"#4ade80"},
                  {label:"ETF", value:nav.etf, color:"#a5b4fc"},
                  {label:"T-Bills", value:nav.tbills, color:"#4ade80"},
                  {label:"Car", value:nav.car, color:"#facc15"},
                ].filter(function(r){return r.value>0;}).map(function(r) {
                  return (
                    <div key={r.label} style={{display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <span style={{color:"#64748b", fontSize:"13px"}}>{r.label}</span>
                      <span style={{color:r.color, fontWeight:"700", fontSize:"13px"}}>{fmt(r.value)}</span>
                    </div>
                  );
                })}
                <div style={{display:"flex", justifyContent:"space-between", padding:"10px 0 0"}}>
                  <span style={{color:"#f8fafc", fontWeight:"800", fontSize:"14px"}}>Total NAV</span>
                  <span style={{color:clr(nav.nav-BASE_NW), fontWeight:"900", fontSize:"16px"}}>{fmt(nav.nav)}</span>
                </div>
                <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0 0"}}>
                  <span style={{color:"#64748b", fontSize:"12px"}}>Insurance</span>
                  <span style={{color:nav.insured?"#4ade80":"#f87171", fontSize:"12px", fontWeight:"700"}}>{nav.insured?"Protected":"Not insured"}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
