/* USURP — Live Game Window
   Polygonal arena sized to player count (3–6 sides).
   Each polygon side is one seat; each interior triangle slice is one action.
*/

const SHAPE_NAMES = {
  3: "· TRIANGLE COURT · 3 HOUSES ·",
  4: "· QUADRATURE · 4 HOUSES ·",
  5: "· PENTACLE · 5 HOUSES ·",
  6: "· HEXAGONAL SEAT · 6 HOUSES ·",
};

const ACTIONS = [
  { id: "income",   label: "INCOME",       it: "RENDITA",         cost: 0, gain: 1, kind: "base"    },
  { id: "aid",      label: "AID",          it: "AIUTI INTL",      cost: 0, gain: 2, kind: "base"    },
  { id: "seize",    label: "SEIZE",        it: "TASSAZIONE",      cost: 0, gain: 3, kind: "claim"   },
  { id: "reave",    label: "REAVE",        it: "FURTO",           cost: 0, gain: 2, kind: "claim"   },
  { id: "exchange", label: "EXCHANGE",     it: "SCAMBIO",         cost: 0, gain: 0, kind: "claim"   },
  { id: "strike",   label: "STRIKE",       it: "ASSASSINIO",      cost: 3, gain: 0, kind: "hostile" },
  { id: "coup",     label: "COUP",         it: "COLPO DI STATO",  cost: 7, gain: 0, kind: "hostile" },
];

/* Helpers */
const polygonPoints = (n, radius, cx=0, cy=0, rotOffset=0) => {
  // Seat on bottom centered → first vertex at bottom-left, rotate so mid-edge is at angle 90deg (down)
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rotOffset + (i / n) * Math.PI * 2 - Math.PI/2;
    pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }
  return pts;
};

const edgeMidpoints = (verts) => verts.map((v, i) => {
  const nx = verts[(i+1) % verts.length];
  return [(v[0] + nx[0]) / 2, (v[1] + nx[1]) / 2, Math.atan2(nx[1] - v[1], nx[0] - v[0])];
});

/* ── Central polygonal board with radial action slices ───────────── */
const PolygonBoard = ({ players, activeAction, challengedAction, phase, turnName, timer }) => {
  const n = players.length;
  const size = 640;
  const cx = size/2, cy = size/2;

  // Outer polygon — seats sit on the mid-edge outward.
  // Rotate so the BOTTOM edge is the YOU seat (first player).
  const rotate = Math.PI/n - Math.PI/2; // mid of side 0 points down
  const outerR = 185;
  const verts = polygonPoints(n, outerR, cx, cy, rotate);
  const innerR = 62;
  const iverts = polygonPoints(n, innerR, cx, cy, rotate);

  // Action slices: N triangles formed by (center, vert_i, vert_i+1)
  // We map up to 6 actions to 6 slices; if n<6 some actions live on-side in the action dock.
  const sliceActions = ACTIONS.slice(0, n);
  const extraActions = ACTIONS.slice(n);

  const polyPathOuter = verts.map((v,i) => (i===0?"M":"L") + v[0] + "," + v[1]).join(" ") + " Z";

  return (
    <div className="poly-board" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <radialGradient id="boardGlow" cx="50%" cy="50%">
            <stop offset="0%"  stopColor="rgba(125,142,216,0.25)"/>
            <stop offset="60%" stopColor="rgba(13,18,48,0)"/>
          </radialGradient>
          <linearGradient id="sliceActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#e1b968"/>
            <stop offset="100%" stopColor="#b5863a"/>
          </linearGradient>
          <linearGradient id="sliceHostile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#e05a34"/>
            <stop offset="100%" stopColor="#7a1d12"/>
          </linearGradient>
          <pattern id="starfield" patternUnits="userSpaceOnUse" width="80" height="80">
            <circle cx="12" cy="18" r="0.8" fill="#b8cfff" opacity="0.7"/>
            <circle cx="54" cy="36" r="0.6" fill="#e8d28a" opacity="0.8"/>
            <circle cx="30" cy="64" r="0.7" fill="#d2dcf4" opacity="0.6"/>
            <circle cx="68" cy="10" r="0.5" fill="#b8cfff" opacity="0.9"/>
          </pattern>
        </defs>

        {/* Glow halo */}
        <circle cx={cx} cy={cy} r={outerR+70} fill="url(#boardGlow)"/>

        {/* Outer polygon fill */}
        <path d={polyPathOuter} fill="rgba(13,18,48,0.55)" stroke="rgba(166,181,232,0.2)" strokeWidth="1"/>
        <path d={polyPathOuter} fill="url(#starfield)" opacity="0.35"/>

        {/* Radial slices — one per side (= one per player / action) */}
        {verts.map((v, i) => {
          const v2 = verts[(i+1) % n];
          const a = sliceActions[i];
          const isActive   = a && activeAction === a.id;
          const isHostile  = a && challengedAction === a.id;
          const fill = isHostile ? "url(#sliceHostile)" : isActive ? "url(#sliceActive)" : "transparent";
          const stroke = isHostile ? "#ef7c5a" : isActive ? "#f3b85c" : "rgba(166,181,232,0.25)";
          return (
            <g key={i}>
              <path
                d={`M ${cx} ${cy} L ${v[0]} ${v[1]} L ${v2[0]} ${v2[1]} Z`}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive || isHostile ? 1.5 : 0.8}
                opacity={isActive || isHostile ? 0.92 : 1}
                style={{ transition: "all .35s var(--ease-ritual)" }}
              />
            </g>
          );
        })}

        {/* Action labels — centered on each slice (mid-edge pulled inward) */}
        {verts.map((v, i) => {
          const v2 = verts[(i+1) % n];
          const a = sliceActions[i];
          if (!a) return null;
          const mx = (v[0] + v2[0]) / 2, my = (v[1] + v2[1]) / 2;
          // pull toward center — smaller N (wider slices) needs labels further out
          const pullFactor = n <= 3 ? 0.82 : n === 4 ? 0.74 : 0.64;
          const lx = cx + (mx - cx) * pullFactor;
          const ly = cy + (my - cy) * pullFactor;
          const isActive  = activeAction === a.id;
          const isHostile = challengedAction === a.id;
          const color = isHostile ? "#fff1ea" : isActive ? "#2a1605" : "#d2dcf4";
          return (
            <g key={"lab"+i}>
              <text x={lx} y={ly-4}
                    fill={color}
                    fontFamily="var(--font-mono)" fontSize="10" fontWeight="700"
                    letterSpacing="2.2" textAnchor="middle"
                    style={{ textTransform: "uppercase" }}>
                {a.label}
              </text>
              <text x={lx} y={ly+10}
                    fill={isActive||isHostile ? "rgba(42,22,5,0.7)" : "rgba(184,207,255,0.5)"}
                    fontFamily="var(--font-mono)" fontSize="7.5"
                    letterSpacing="1.8" textAnchor="middle">
                {a.kind === "base" ? "· BASE ·" : a.kind === "claim" ? "· CLAIM ·" : "· HOSTILE ·"}
              </text>
            </g>
          );
        })}

        {/* Inner polygon (phase disc) */}
        <path d={iverts.map((v,i)=>(i===0?"M":"L")+v[0]+","+v[1]).join(" ")+" Z"}
              fill="rgba(6,10,30,0.92)" stroke="#7d8ed8" strokeWidth="1.2"/>
        <circle cx={cx} cy={cy} r={innerR-14} fill="rgba(13,18,48,0.9)" stroke="rgba(229,193,143,0.3)" strokeWidth="0.8"/>

        {/* Phase wedge pie indicator (timer) */}
        {(() => {
          const frac = Math.max(0, Math.min(1, timer/30));
          const end = -Math.PI/2 + frac * Math.PI * 2;
          const lx = cx + Math.cos(-Math.PI/2) * (innerR-16);
          const ly = cy + Math.sin(-Math.PI/2) * (innerR-16);
          const ex = cx + Math.cos(end) * (innerR-16);
          const ey = cy + Math.sin(end) * (innerR-16);
          const large = frac > 0.5 ? 1 : 0;
          return (
            <path d={`M ${cx} ${cy} L ${lx} ${ly} A ${innerR-16} ${innerR-16} 0 ${large} 1 ${ex} ${ey} Z`}
                  fill="rgba(125,142,216,0.18)" stroke="#7d8ed8" strokeWidth="0.6"/>
          );
        })()}

        <text x={cx} y={cy-6} textAnchor="middle" fill="#d2dcf4"
              fontFamily="var(--font-mono)" fontSize="9" fontWeight="700" letterSpacing="2.4">
          {phase}
        </text>
        <text x={cx} y={cy+10} textAnchor="middle" fill="#e8d28a"
              fontFamily="var(--font-mono)" fontSize="12" fontWeight="800" letterSpacing="1.8">
          {turnName}
        </text>
        <text x={cx} y={cy+24} textAnchor="middle" fill="rgba(125,142,216,0.7)"
              fontFamily="var(--font-mono)" fontSize="8" letterSpacing="2">
          {String(Math.max(0,timer)).padStart(2,"0")}s
        </text>

        {/* Seat vertex markers */}
        {verts.map((v,i) => (
          <circle key={"vm"+i} cx={v[0]} cy={v[1]} r="3"
                  fill="#0b0a18" stroke="#7d8ed8" strokeWidth="1"/>
        ))}
      </svg>

      {/* Seats positioned along each polygon edge */}
      {verts.map((v, i) => {
        const v2 = verts[(i+1) % n];
        const mx = (v[0] + v2[0]) / 2, my = (v[1] + v2[1]) / 2;
        const edgeAngle = Math.atan2(v2[1] - v[1], v2[0] - v[0]);
        // outward normal
        const nx = Math.cos(edgeAngle - Math.PI/2);
        const ny = Math.sin(edgeAngle - Math.PI/2);
        const p = players[i];
        if (!p) return null;
        const pushOut = p.you ? 100 : 72;
        const sx = mx + nx * pushOut;
        const sy = my + ny * pushOut;
        // Seats always upright (no rotation) — just positioned around the polygon.
        return (
          <div key={"seat"+i} className={"seat " + (p.you ? "seat-you " : "") + (p.active ? "seat-active " : "") + (p.accused ? "seat-accused " : "")}
               style={{ left: sx, top: sy, transform: `translate(-50%,-50%)` }}>
            <Seat player={p} />
          </div>
        );
      })}

      {/* Extra actions sidebar (for n<6 action-count) — rendered outside polygon by parent */}
      {false && extraActions.length > 0 && (
        <div className="extra-actions">
          <div className="extra-head">· OFF-BOARD ·</div>
          {extraActions.map(a => (
            <div key={a.id} className={"extra-act " + a.kind + (activeAction === a.id ? " on" : "")}>
              <span>{a.label}</span>
              <span className="cost">{a.cost ? `−${a.cost}` : `+${a.gain}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Seat block (player around the table) ──────────────────────── */
const Seat = ({ player }) => {
  const { name, house, cowries, cards, you, active, accused, seat } = player;
  return (
    <div className="seat-inner">
      {/* Cards */}
      <div className="seat-cards">
        {cards.map((c, i) => (
          <div key={i} className={"seat-card " + (c.state === "forfeit" ? "forfeit " : "") + (you ? "face-up " : "")}>
            {you ? (
              <>
                <div className="sc-top"><span>{c.role?.slice(0,3)}</span><span>M·{50+i*11}</span></div>
                <div className="sc-sigil"><Sigil name={c.role} size={34}/></div>
                <div className="sc-name">{c.role}</div>
                <div className="sc-strip"/>
              </>
            ) : c.state === "forfeit" ? (
              <div className="sc-revealed">
                <Sigil name={c.role} size={26}/>
                <div className="sc-forfeit-x">×</div>
              </div>
            ) : (
              <div className="sc-back"><span>USURP</span></div>
            )}
          </div>
        ))}
      </div>
      {/* Coin row — sketch's orange dots */}
      <div className="seat-coins">
        {Array.from({length: Math.min(cowries, 12)}).map((_, i) => (
          <span key={i} className="coin-dot"/>
        ))}
        {cowries > 12 && <span className="coin-overflow">+{cowries - 12}</span>}
      </div>
      {/* Name */}
      <div className="seat-id">
        <div className="seat-name">{name}</div>
        <div className="seat-meta">
          <span className="seat-house">{house}</span>
          <span className="seat-cowries">◐ {String(cowries).padStart(2,"0")}</span>
        </div>
      </div>
      {accused && <div className="seat-badge">· ACCUSED ·</div>}
      {active && <div className="seat-turn">· THE SEAT ·</div>}
    </div>
  );
};

/* ── Full game screen ───────────────────────────────────────────── */
const GameScreen = () => {
  const [playerCount, setPlayerCount] = React.useState(() => {
    const saved = localStorage.getItem("usurp:gameN");
    return saved ? parseInt(saved) : 6;
  });
  const [timer, setTimer] = React.useState(24);
  const [activeAction, setActiveAction] = React.useState("exchange");
  const [challengedAction, setChallengedAction] = React.useState(null);
  const [phase, setPhase] = React.useState("· CHALLENGE WINDOW ·");

  React.useEffect(() => { localStorage.setItem("usurp:gameN", playerCount); }, [playerCount]);

  React.useEffect(() => {
    const t = setInterval(() => setTimer(v => v > 0 ? v - 1 : 30), 1000);
    return () => clearInterval(t);
  }, []);

  // Build player roster (seat 0 is you, at bottom edge)
  const allPlayers = [
    { name: "HOUSE ADJEI",    house: "Σ · 2 FACES",  cowries: 7,  cards:[{role:"OBA",state:"up"}, {role:"IYA",state:"up"}], you: true,  active: true,  accused: false, seat: 0 },
    { name: "HOUSE KWENA",    house: "Ξ · 2 FACES",  cowries: 11, cards:[{state:"back"},{state:"back"}], active: false, accused: false, seat: 1 },
    { name: "HOUSE OKONKWO",  house: "Ψ · 1 FACE",   cowries: 3,  cards:[{state:"back"},{role:"NJALA",state:"forfeit"}], active: false, accused: true, seat: 2 },
    { name: "HOUSE TEMBO",    house: "Θ · 2 FACES",  cowries: 9,  cards:[{state:"back"},{state:"back"}], active: false, accused: false, seat: 3 },
    { name: "HOUSE ONWU",     house: "Ω · 2 FACES",  cowries: 4,  cards:[{state:"back"},{state:"back"}], active: false, accused: false, seat: 4 },
    { name: "HOUSE BANDA",    house: "Δ · 2 FACES",  cowries: 6,  cards:[{state:"back"},{state:"back"}], active: false, accused: false, seat: 5 },
  ];
  const players = allPlayers.slice(0, playerCount);

  const log = [
    { t: "NOW",     txt: "HOUSE ADJEI declares ", hot: "EXCHANGE", verm: false },
    { t: "-00:02",  txt: "HOUSE OKONKWO opens challenge window…",  verm: true  },
    { t: "-00:14",  txt: "HOUSE KWENA seized 3 cowries (tax).",    cel: true   },
    { t: "-00:28",  txt: "HOUSE ONWU took aid · +2.",                          },
    { t: "-00:41",  txt: "HOUSE TEMBO forfeited NJALA.",            verm: true },
  ];

  return (
    <div className="game-screen">
      {/* HUD top row */}
      <div className="game-hud">
        <div className="hud-left">
          <div className="hud-round">· ROUND 04 · RITE OF COWRIES ·</div>
          <div className="hud-count">
            <span className="lab">COURT</span>
            <span className="num">{playerCount}</span>
            <span className="lab">HOUSES</span>
            <div className="hud-stepper">
              {[3,4,5,6].map(n => (
                <button key={n}
                        className={"step " + (n === playerCount ? "on" : "")}
                        onClick={() => setPlayerCount(n)}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="hud-center">
          <div className="hud-shape-label">{SHAPE_NAMES[playerCount]}</div>
        </div>
        <div className="hud-right">
          <span className="chip" style={{background:"rgba(125,142,216,0.12)",borderColor:"rgba(125,142,216,0.3)",color:"var(--lapis-300)"}}>SEATED</span>
          <span className="chip">◐ 07 COWRIES</span>
        </div>
      </div>

      {/* Main arena row: polygon board center + scribe panel right */}
      <div className="game-body">
        <div className="arena-wrap">
          <PolygonBoard
            players={players}
            activeAction={activeAction}
            challengedAction={challengedAction}
            phase={phase}
            turnName={players.find(p=>p.active)?.name || "—"}
            timer={timer}
          />
        </div>

        <aside className="scribe-rail">
          <div className="scribe-eyebrow">· THE SCRIBE ·</div>
          {log.map((l, i) => (
            <div key={i} className={"scribe-row " + (l.verm ? "verm " : "") + (l.cel ? "cel " : "")}>
              <div className="t">{l.t}</div>
              <div>{l.txt}{l.hot && <b> {l.hot}</b>}</div>
            </div>
          ))}

          <div className="rail-divider"/>

          <div className="scribe-eyebrow" style={{marginTop:0}}>· RESERVE ·</div>
          <div className="reserve-mini">
            <div className="rm-pile"><div className="rm-n">28</div></div>
            <div className="rm-lab">cowries in the pot</div>
          </div>

          <div className="rail-divider"/>

          <div className="scribe-eyebrow" style={{marginTop:0}}>· DECK ·</div>
          <div className="deck-counts">
            {["OBA","NJALA","KORO","GRIOT","IYA"].map(r => (
              <div key={r} className="deck-line">
                <span className="dc-name">{r}</span>
                <span className="dc-bar"><span className="dc-fill" style={{width: (40 + Math.random()*50) + "%"}}/></span>
                <span className="dc-n">{2 + Math.floor(Math.random()*2)}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Bottom action rack — your declaration surface */}
      <div className="game-rack">
        <div className="rack-hand">
          <div className="rack-eyebrow">· YOUR HAND ·</div>
          <div className="rack-you">
            <div className="you-name">ADJEI, THE MORNING</div>
            <div className="you-coins">
              <span className="coin-blob"/>
              <span className="val">◐ 07</span>
              <span className="coin-lab">cowries</span>
            </div>
          </div>
        </div>

        <div className="rack-actions">
          <div className="rack-eyebrow-row">
            <span>· DECLARE · </span>
            <span>tap a slice to declare · opponents may challenge within {timer}s</span>
          </div>
          <div className="action-bar">
            {ACTIONS.map(a => (
              <button key={a.id}
                      className={"act-btn " + a.kind + (activeAction === a.id ? " on " : "") + (challengedAction === a.id ? " hostile " : "")}
                      onClick={() => {
                        setChallengedAction(null);
                        setActiveAction(a.id);
                        setPhase("· CHALLENGE WINDOW ·");
                        setTimer(30);
                      }}>
                <span className="ab-lab">{a.label}</span>
                <span className="ab-it">{a.it}</span>
                <span className="ab-val">{a.cost ? `PAY ${a.cost}` : `+${a.gain}`}</span>
              </button>
            ))}
          </div>
          <div className="rack-responses">
            <button className="resp chal" onClick={() => { setChallengedAction(activeAction); setPhase("· CHALLENGED ·"); setTimer(15); }}>
              <span>CHALLENGE</span><em>BOICOTTA · dispute the claim</em>
            </button>
            <button className="resp block" onClick={() => setPhase("· BLOCK DECLARED ·")}>
              <span>BLOCK</span><em>claim a counter-role</em>
            </button>
            <button className="resp pass" onClick={() => { setChallengedAction(null); setPhase("· RESOLVING ·"); }}>
              <span>ALLOW</span><em>let it resolve</em>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { GameScreen, PolygonBoard, Seat, ACTIONS });
