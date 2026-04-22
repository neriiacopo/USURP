/* USURP — Game Table (court / board game screen)
   Turn logic, action declarations, and animated FX per the Coup ruleset.
   ──────────────────────────────────────────────────────────────────────
   Actions map to Coup roles as:
     SEIZE (Tassa)      → OBA      (Duca)
     REAVE (Furto)      → KORO     (Capitano), blockable by KORO or GRIOT
     EXCHANGE (Scambio) → GRIOT    (Ambasciatore)
     STRIKE (Assassinio)→ NJALA    (Assassino), blockable by IYA
     AID   (Aiuto)      → blockable by OBA
     INCOME (Entrata)   → no block, no challenge
     COUP  (Colpo)      → no block, no challenge; forced at 10+ cowries
*/

const ACTION_DEFS = {
  income:   { id: "income",   label: "INCOME",   glyph: "◐", cost: 0, gain: 1, kind: "base",    role: null,    blockableBy: [],               hostile: false, challengeable: false, targeted: false },
  aid:      { id: "aid",      label: "AID",      glyph: "◐", cost: 0, gain: 2, kind: "base",    role: null,    blockableBy: ["OBA"],          hostile: false, challengeable: false, targeted: false },
  seize:    { id: "seize",    label: "SEIZE",    glyph: "◐", cost: 0, gain: 3, kind: "claim",   role: "OBA",   blockableBy: [],               hostile: false, challengeable: true,  targeted: false },
  reave:    { id: "reave",    label: "REAVE",    glyph: "⊛", cost: 0, gain: 2, kind: "claim",   role: "KORO",  blockableBy: ["KORO","GRIOT"], hostile: true,  challengeable: true,  targeted: true  },
  exchange: { id: "exchange", label: "EXCHANGE", glyph: "⌬", cost: 0, gain: 0, kind: "claim",   role: "GRIOT", blockableBy: [],               hostile: false, challengeable: true,  targeted: false },
  strike:   { id: "strike",   label: "STRIKE",   glyph: "⌇", cost: 3, gain: 0, kind: "hostile", role: "NJALA", blockableBy: ["IYA"],          hostile: true,  challengeable: true,  targeted: true  },
  coup:     { id: "coup",     label: "COUP",     glyph: "⚊", cost: 7, gain: 0, kind: "hostile", role: null,    blockableBy: [],               hostile: true,  challengeable: false, targeted: true  },
};

const PlayerCard = ({ role, forfeit }) => {
  const abilities = {
    OBA:   { n: "Oba",   s: "THE SOVEREIGN", a: "SEIZE 3 COWRIES · BLOCK AID", code: "M-77 · Σ" },
    NJALA: { n: "Njala", s: "THE FAMINE",    a: "STRIKE · 3 COWRIES",          code: "M-82 · ⌇" },
    KORO:  { n: "Koro",  s: "THE REAVER",    a: "STEAL 2 COWRIES",             code: "M-64 · ⊛" },
    GRIOT: { n: "Griot", s: "KEEPER OF NAMES",a: "EXCHANGE IDENTITY",          code: "M-55 · ⌬" },
    IYA:   { n: "Iya",   s: "THE MOTHER",    a: "BLOCK STRIKE",                code: "M-91 · ☽" },
  };
  const d = abilities[role] || abilities.OBA;
  const cls = "player-card" + (role === "NJALA" ? " njala" : "") + (forfeit ? " forfeit" : "");
  return (
    <div className={cls}>
      <div className="holo-strip" style={role === "NJALA" ? { background: "repeating-linear-gradient(0deg, #ef7c5a 0, #fff 2px, #e05a34 4px, #7a1d12 6px, #ef7c5a 8px)", backgroundSize:'100% 200%'} : {}}/>
      <div className="head"><span>OP · {d.code.split(' ')[0]}</span><span>◐ × 3</span></div>
      <div className="sigil-wrap"><Sigil name={role} size={70} /></div>
      <div>
        <div className="name">{d.n}</div>
        <div className="sub">{d.s}</div>
        <div className="ab">{d.a}</div>
      </div>
      <div className="foot"><span>{d.code}</span><span>SEAL · ADJEI</span></div>
    </div>
  );
};

const Opponent = ({ opp, isTurn, dim, targetable, dead, onClick }) => {
  const { pos, id, name, house, cowries, cards, accused, cowrieBump } = opp;
  const classes = [
    "opp", pos,
    isTurn ? "is-turn" : "",
    dim ? "dim" : "",
    targetable ? "targetable" : "",
    dead ? "dead" : "",
  ].filter(Boolean).join(" ");
  return (
    <div className={classes} data-player-id={id} onClick={targetable ? () => onClick(id) : undefined}>
      <div className="opp-cards">
        {cards.map((c, i) => (
          <div
            key={i}
            className={"mini-card" + (c.state === "forfeit" ? " forfeit" : "") + (c.state === "justForfeit" ? " just-forfeit" : "")}
            data-card-idx={i}
            data-role={c.role || ""}
          />
        ))}
      </div>
      <div className="opp-name">{name}</div>
      <div className="opp-sub">{house}</div>
      <div className={"opp-cowries" + (cowrieBump ? " bump" : "")}><span className="sym"/>{String(cowries).padStart(2,'0')}</div>
      {accused && <div style={{position:'absolute', bottom:-20, fontFamily:'var(--font-mono)', fontSize:'9px', letterSpacing:'0.22em', color:'var(--verm-300)'}}>· ACCUSED ·</div>}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────
   TableScreen — the board game screen
   ────────────────────────────────────────────────────────────────────── */
const TableScreen = ({
  role1 = "OBA", role2 = "IYA", pile = 28,
  dealing = false, dealDuration = 1600, dealStagger = 90,
  turnSeconds = 30, turnKey = 0, sunDimDepth = 0.75,
}) => {
  // ── Seat order (you at idx 0, then clockwise around the arena) ──
  const SEATS = [
    { id: 'you',     name: 'HOUSE ADJEI',   house: 'Σ · 2 FACES',  cowries: 7,  cards: [{role: role1, state: 'up'}, {role: role2, state: 'up'}], you: true,  pos: null },
    { id: 'kwena',   name: 'HOUSE KWENA',   house: 'Ξ · 2 FACES',  cowries: 11, cards: [{role: 'KORO',  state: 'back'}, {role: 'GRIOT', state: 'back'}], you: false, pos: 'right' },
    { id: 'okonkwo', name: 'HOUSE OKONKWO', house: 'Ψ · 1 FACE',   cowries: 3,  cards: [{role: 'GRIOT', state: 'back'}, {role: 'NJALA', state: 'forfeit'}], you: false, pos: 'tr', accused: true },
    { id: 'tembo',   name: 'HOUSE TEMBO',   house: 'Θ · 2 FACES',  cowries: 9,  cards: [{role: 'OBA',   state: 'back'}, {role: 'NJALA', state: 'back'}], you: false, pos: 'top' },
    { id: 'onwu',    name: 'HOUSE ONWU',    house: 'Ω · 2 FACES',  cowries: 4,  cards: [{role: 'KORO',  state: 'back'}, {role: 'IYA',   state: 'back'}], you: false, pos: 'tl' },
    { id: 'banda',   name: 'HOUSE BANDA',   house: 'Δ · 2 FACES',  cowries: 6,  cards: [{role: 'IYA',   state: 'back'}, {role: 'OBA',   state: 'back'}], you: false, pos: 'left' },
  ];

  const [players, setPlayers]  = React.useState(SEATS);
  const [reserve, setReserve]  = React.useState(pile);
  const [reserveBump, setReserveBump] = React.useState(false);
  const [youCowrieBump, setYouCowrieBump] = React.useState(false);
  const [currentTurn, setCurrentTurn] = React.useState(0); // index into players
  const [phase, setPhase]      = React.useState('turn-start'); // turn-start | action-select | target-select | declared | resolving | turn-end
  const [declared, setDeclared] = React.useState(null); // { actionId, actorId, targetId }
  const [challengeTimer, setChallengeTimer] = React.useState(0);
  const [coinFlows, setCoinFlows] = React.useState([]);
  const [flashFx, setFlashFx]  = React.useState(null); // { kind, word, sub }
  const [exchangeFx, setExchangeFx] = React.useState(false);
  const [logEntries, setLogEntries] = React.useState([
    { id: 0, txt: "THE COURT CONVENES.", hot: null, cls: "cel" },
  ]);

  // Turn timer drives the sun's dim. Restart whenever turnKey changes.
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    setElapsed(0);
    const t0 = performance.now();
    let raf;
    const tick = () => {
      const e = Math.min((performance.now() - t0) / 1000, turnSeconds);
      setElapsed(e);
      if (e < turnSeconds) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [turnKey, turnSeconds, currentTurn]);

  const progress = Math.min(elapsed / turnSeconds, 1);
  const sunIntensity = 1 - progress * sunDimDepth;
  const remaining = Math.max(0, Math.ceil(turnSeconds - elapsed));
  const mm = String(Math.floor(remaining / 60)).padStart(2,'0');
  const ss = String(remaining % 60).padStart(2,'0');

  // Refs
  const arenaRef = React.useRef(null);
  const logIdRef = React.useRef(1);
  const targetSelectorRef = React.useRef(null); // { actionId, resolve }
  const playersRef = React.useRef(players);
  React.useEffect(() => { playersRef.current = players; }, [players]);

  const currentPlayer = players[currentTurn];
  const isYourTurn = currentPlayer && currentPlayer.id === 'you' && currentPlayer.alive !== false;

  // ── Helpers ──
  const addLog = (txt, hot = null, cls = "") => {
    setLogEntries(prev => {
      const next = [{ id: logIdRef.current++, txt, hot, cls }, ...prev];
      return next.slice(0, 6);
    });
  };

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  // ── Turn engine (run when currentTurn or phase changes) ──
  // Use a ref for the AI timer so a state-driven re-render of this effect
  // (e.g. phase transitioning from turn-start → action-select) does NOT
  // cancel the pending timer. We cancel only when a new turn supersedes it.
  const aiTimerRef = React.useRef(null);
  React.useEffect(() => {
    if (dealing) return;
    if (phase !== 'turn-start') return;
    const actor = players[currentTurn];
    if (!actor || actor.alive === false) {
      advanceTurn();
      return;
    }
    addLog(`${actor.name} takes the seat.`, null, "cel");
    if (actor.you) {
      // Wait for the player to click an action
      setPhase('action-select');
    } else {
      // AI picks an action after a beat.
      // DO NOT setPhase('action-select') before the timeout — doing so
      // re-runs this effect with a stale cleanup and cancels the timer.
      // declareAction() will advance the phase to 'declared' when it fires.
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      const actorId = actor.id;
      aiTimerRef.current = setTimeout(async () => {
        aiTimerRef.current = null;
        const freshPlayers = playersRef.current;
        const freshActor = freshPlayers.find(p => p.id === actorId);
        if (!freshActor || freshActor.alive === false) { advanceTurn(); return; }
        const pick = aiPickAction(freshActor, freshPlayers);
        await declareAction(pick.actionId, freshActor.id, pick.targetId);
      }, 1400);
    }
  }, [currentTurn, phase, dealing]);

  // Cancel any pending AI timer on unmount
  React.useEffect(() => () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, []);

  // ── Action declaration ──
  const declareAction = async (actionId, actorId, targetId = null) => {
    const def = ACTION_DEFS[actionId];
    if (!def) return;
    setDeclared({ actionId, actorId, targetId });
    setPhase('declared');
    const actor = players.find(p => p.id === actorId);
    const target = targetId ? players.find(p => p.id === targetId) : null;
    const verbLine =
      actionId === 'income'   ? `claims <b>INCOME</b>.` :
      actionId === 'aid'      ? `calls for <b>FOREIGN AID</b>.` :
      actionId === 'seize'    ? `declares <b>SEIZE</b> by the Oba.` :
      actionId === 'reave'    ? `declares <b>REAVE</b> on ${target?.name}.` :
      actionId === 'exchange' ? `invokes the Griot — <b>EXCHANGE</b>.` :
      actionId === 'strike'   ? `lifts the Njala — <b>STRIKE</b> on ${target?.name}.` :
      actionId === 'coup'     ? `unleashes a <b>COUP</b> on ${target?.name}.` : '';
    addLog(`${actor.name} ${verbLine}`, null, def.hostile ? "verm" : "");

    // Challenge window (prototype: brief window, auto-allow)
    if (def.challengeable || def.blockableBy.length > 0) {
      // Give a 1800ms reactive window
      setChallengeTimer(2);
      const tickId = setInterval(() => {
        setChallengeTimer(t => Math.max(0, t - 1));
      }, 900);
      await delay(1800);
      clearInterval(tickId);
      setChallengeTimer(0);
    } else {
      await delay(450);
    }

    // Resolve
    await resolveAction(actionId, actorId, targetId);
  };

  // ── Resolution with animations ──
  const resolveAction = async (actionId, actorId, targetId) => {
    setPhase('resolving');
    const def = ACTION_DEFS[actionId];
    const arena = arenaRef.current;
    if (!arena) { endTurn(); return; }

    // Pay cost first (if any) — coins fly actor → reserve
    if (def.cost > 0) {
      await flyCoins(actorId, 'reserve', def.cost, false);
      applyCowries(actorId, -def.cost);
      reserveAdjust(def.cost);
    }

    if (actionId === 'income' || actionId === 'aid' || actionId === 'seize') {
      // Gain coins from reserve → actor
      await flyCoins('reserve', actorId, def.gain, false);
      applyCowries(actorId, def.gain);
      reserveAdjust(-def.gain);
      if (actionId === 'seize') await flashWord('seize', 'SEIZED', `+${def.gain} COWRIES · BY THE OBA`);
      addLog(`${playersRef.current.find(p=>p.id===actorId).name} gains +${def.gain} cowries.`, null, "");
    } else if (actionId === 'reave') {
      // 2 coins fly target → actor
      const targetP = players.find(p => p.id === targetId);
      const amount = Math.min(2, targetP ? targetP.cowries : 0);
      if (amount > 0) {
        await flyCoins(targetId, actorId, amount, true);
        applyCowries(targetId, -amount);
        applyCowries(actorId, amount);
      }
      addLog(`${players.find(p=>p.id===actorId).name} reaves +${amount} from ${targetP?.name}.`, null, "verm");
    } else if (actionId === 'exchange') {
      // Card whirl animation
      setExchangeFx(true);
      await flashWord('exchange', 'EXCHANGE', '· A NEW FACE CLAIMED ·');
      await delay(800);
      setExchangeFx(false);
      addLog(`${players.find(p=>p.id===actorId).name} exchanges — a new face.`, null, "cel");
    } else if (actionId === 'strike') {
      await flashWord('strike', 'STRIKE.', `· ${players.find(p=>p.id===targetId)?.name} FORFEITS A FACE ·`);
      forfeitCard(targetId);
      addLog(`${players.find(p=>p.id===actorId).name} strikes ${players.find(p=>p.id===targetId)?.name}.`, "STRIKE", "verm");
    } else if (actionId === 'coup') {
      await flashWord('coup', 'COUP.', `· ${players.find(p=>p.id===targetId)?.name} IS UNSEATED ·`);
      forfeitCard(targetId);
      addLog(`${players.find(p=>p.id===actorId).name} stages a COUP on ${players.find(p=>p.id===targetId)?.name}.`, "COUP", "verm");
    }

    await delay(450);
    endTurn();
  };

  const endTurn = () => {
    setDeclared(null);
    setPhase('turn-end');
    setTimeout(() => {
      advanceTurn();
    }, 350);
  };

  const advanceTurn = () => {
    // Alive if they still have any non-forfeit card. Cards in the transitional
    // 'justForfeit' state (mid-animation) count as still alive for the turn cycle.
    const updated = playersRef.current.map(p => {
      const aliveCount = p.cards.filter(c => c.state !== 'forfeit').length;
      return { ...p, alive: aliveCount > 0 };
    });
    setPlayers(updated);
    setCurrentTurn(ct => {
      for (let i = 1; i <= updated.length; i++) {
        const idx = (ct + i) % updated.length;
        if (updated[idx].alive !== false) return idx;
      }
      return ct;
    });
    setPhase('turn-start');
  };

  // ── State mutators ──
  const reserveAdjust = (delta) => {
    setReserve(r => Math.max(0, r + delta));
    setReserveBump(true);
    setTimeout(() => setReserveBump(false), 700);
  };

  const applyCowries = (playerId, delta) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return { ...p, cowries: Math.max(0, p.cowries + delta), cowrieBump: true };
    }));
    if (playerId === 'you') {
      setYouCowrieBump(true);
      setTimeout(() => setYouCowrieBump(false), 700);
    }
    setTimeout(() => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, cowrieBump: false } : p));
    }, 700);
  };

  const forfeitCard = (playerId) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      const cards = p.cards.slice();
      const firstUp = cards.findIndex(c => c.state !== 'forfeit' && c.state !== 'justForfeit');
      if (firstUp === -1) return p;
      // Use transitional state 'justForfeit' so the .forfeit dimming doesn't apply during the flip animation
      cards[firstUp] = { ...cards[firstUp], state: 'justForfeit', justForfeit: true };
      return { ...p, cards };
    }));
    // After animation, settle to permanent 'forfeit' state
    setTimeout(() => {
      setPlayers(prev => prev.map(p => {
        if (p.id !== playerId) return p;
        return { ...p, cards: p.cards.map(c => c.state === 'justForfeit' ? { ...c, state: 'forfeit', justForfeit: false } : c) };
      }));
    }, 1700);
  };

  // ── Coin flow animation: spawn N coins flying sx,sy → tx,ty ──
  const flyCoins = (fromId, toId, count, lapis = false) => {
    const arena = arenaRef.current;
    if (!arena) return Promise.resolve();
    const ab = arena.getBoundingClientRect();
    const srcPt = getAnchor(fromId, ab);
    const tgtPt = getAnchor(toId, ab);
    if (!srcPt || !tgtPt) return Promise.resolve();
    const flows = [];
    for (let i = 0; i < count; i++) {
      flows.push({
        id: `${Date.now()}-${Math.random()}-${i}`,
        sx: srcPt.x + (Math.random()*14 - 7),
        sy: srcPt.y + (Math.random()*14 - 7),
        tx: tgtPt.x + (Math.random()*10 - 5),
        ty: tgtPt.y + (Math.random()*10 - 5),
        delay: i * 130,
        dur: 900,
        lapis,
      });
    }
    setCoinFlows(prev => [...prev, ...flows]);
    const totalDur = 900 + count * 130;
    // Clean up flows when done
    setTimeout(() => {
      setCoinFlows(prev => prev.filter(f => !flows.some(ff => ff.id === f.id)));
    }, totalDur + 200);
    return delay(totalDur - 200);
  };

  const getAnchor = (who, arenaBox) => {
    const arena = arenaRef.current;
    if (!arena) return null;
    if (who === 'reserve') {
      const el = arena.querySelector('.reserve .pile');
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width/2 - arenaBox.left, y: b.top + b.height/2 - arenaBox.top };
    }
    if (who === 'you') {
      const el = document.querySelector('.rack-you .coins-big, .rack-you .cowries-big, .hand-left .cowries-big');
      if (el) {
        const b = el.getBoundingClientRect();
        return { x: b.left + b.width/2 - arenaBox.left, y: b.top + b.height/2 - arenaBox.top };
      }
      // fallback — bottom-center of arena
      const ab = arena.getBoundingClientRect();
      return { x: ab.width / 2, y: ab.height - 20 };
    }
    // Opponent
    const oppEl = arena.querySelector(`.opp[data-player-id="${who}"]`);
    if (!oppEl) return null;
    const b = oppEl.getBoundingClientRect();
    return { x: b.left + b.width/2 - arenaBox.left, y: b.top + b.height/2 - arenaBox.top };
  };

  // ── Flash overlay (STRIKE!, COUP!, etc.) ──
  const flashWord = async (kind, word, sub) => {
    setFlashFx({ kind, word, sub });
    await delay(1350);
    setFlashFx(null);
  };

  // ── AI action chooser ──
  const aiPickAction = (actor, ps) => {
    const alive = ps.filter(p => p.id !== actor.id && p.alive !== false);
    const pickTarget = () => {
      if (alive.length === 0) return null;
      // Prefer players with the most cowries, or accused/1-face
      const sorted = alive.slice().sort((a,b) => {
        const aScore = a.cowries + (a.accused ? 2 : 0) + (a.cards.filter(c=>c.state!=='forfeit').length===1 ? 3 : 0);
        const bScore = b.cowries + (b.accused ? 2 : 0) + (b.cards.filter(c=>c.state!=='forfeit').length===1 ? 3 : 0);
        return bScore - aScore;
      });
      return sorted[0].id;
    };
    // Mandatory coup at 10+
    if (actor.cowries >= 10 && alive.length > 0) {
      return { actionId: 'coup', targetId: pickTarget() };
    }
    const r = Math.random();
    if (actor.cowries >= 7 && r < 0.4 && alive.length > 0) return { actionId: 'coup', targetId: pickTarget() };
    if (actor.cowries >= 3 && r < 0.22 && alive.length > 0) return { actionId: 'strike', targetId: pickTarget() };
    if (r < 0.35) return { actionId: 'seize' };
    if (r < 0.55) return { actionId: 'aid' };
    if (r < 0.7 && alive.length > 0) return { actionId: 'reave', targetId: pickTarget() };
    if (r < 0.85) return { actionId: 'exchange' };
    return { actionId: 'income' };
  };

  // ── Player click handler for actions ──
  const onYouAction = (actionId) => {
    if (!isYourTurn || phase !== 'action-select') return;
    const def = ACTION_DEFS[actionId];
    if (!def) return;
    // Forced coup at 10+
    if (players[0].cowries >= 10 && actionId !== 'coup') {
      addLog(`<b>10+ cowries held — COUP is mandatory.</b>`, null, "verm");
      return;
    }
    if (def.cost > players[0].cowries) {
      addLog(`Not enough cowries for ${def.label} (need ${def.cost}).`, null, "verm");
      return;
    }
    if (def.targeted) {
      setPhase('target-select');
      targetSelectorRef.current = { actionId };
      addLog(`Select a target for <b>${def.label}</b>.`, null, "");
    } else {
      declareAction(actionId, 'you', null);
    }
  };

  const onOpponentClick = (oppId) => {
    if (phase !== 'target-select' || !targetSelectorRef.current) return;
    const { actionId } = targetSelectorRef.current;
    targetSelectorRef.current = null;
    declareAction(actionId, 'you', oppId);
  };

  // ── Player-triggered challenge (prototype: visual only) ──
  const onChallenge = () => {
    if (!declared) return;
    addLog(`<b>HOUSE ADJEI</b> calls challenge on ${ACTION_DEFS[declared.actionId].label}!`, null, "verm");
    // In prototype: briefly shake, then proceed (actor "had the card")
    setChallengeTimer(0);
  };

  // ── Deal overlay ──
  const [deals, setDeals] = React.useState([]);
  React.useEffect(() => {
    if (!dealing || !arenaRef.current) { setDeals([]); return; }
    const arena = arenaRef.current;
    const ab = arena.getBoundingClientRect();
    const targets = [];
    arena.querySelectorAll('.opp').forEach(opp => {
      const cards = opp.querySelectorAll('.mini-card');
      cards.forEach((c, i) => targets.push({ el: c, idx: i }));
    });
    document.querySelectorAll('.hand-cards .player-card').forEach((c, i) => {
      targets.push({ el: c, idx: i, player: true });
    });
    const sun = arena.querySelector('.reserve .pile');
    if (!sun) return;
    const sb = sun.getBoundingClientRect();
    const sx = sb.left + sb.width/2 - ab.left;
    const sy = sb.top + sb.height/2 - ab.top;
    const shuffled = targets
      .map((t, i) => ({ t, order: (i % 6) * 2 + Math.floor(i / 6) }))
      .sort((a, b) => a.order - b.order)
      .map(x => x.t);
    const list = shuffled.map((t, i) => {
      const tb = t.el.getBoundingClientRect();
      return {
        id: i,
        sx, sy,
        tx: tb.left + tb.width/2 - ab.left,
        ty: tb.top + tb.height/2 - ab.top,
        w: Math.min(tb.width, 80),
        h: Math.min(tb.height, 110),
        delay: i * dealStagger,
        player: !!t.player,
      };
    });
    setDeals(list);
    const done = setTimeout(() => setDeals([]), dealDuration + list.length * dealStagger + 400);
    return () => clearTimeout(done);
  }, [dealing, dealDuration, dealStagger]);
  const hideReal = dealing && deals.length > 0;

  // ── Render ──
  const you = players[0];
  const targeted = phase === 'target-select';

  const forcedCoup = you.cowries >= 10;

  return (
    <div className="table-stage" data-dealing={hideReal ? "true" : "false"}>
      <div className="table-arena" ref={arenaRef} style={{"--sun-intensity": sunIntensity, "--turn-progress": progress}}>
        {/* ── Floating sky layers ── */}
        <div className="sky-layer" aria-hidden="true"/>
        <div className="sky-motes" aria-hidden="true">
          <span className="mote" style={{left:'12%', top:'22%', animationDelay:'0s'}}/>
          <span className="mote m2" style={{left:'78%', top:'18%', animationDelay:'2s'}}/>
          <span className="mote" style={{left:'28%', top:'68%', animationDelay:'4s'}}/>
          <span className="mote m2" style={{left:'85%', top:'62%', animationDelay:'1.5s'}}/>
          <span className="mote" style={{left:'46%', top:'12%', animationDelay:'3s'}}/>
          <span className="mote m2" style={{left:'8%', top:'44%', animationDelay:'5s'}}/>
        </div>
        <div className="arena-depth" aria-hidden="true"/>

        <div className="orbit-layer" aria-hidden="true">
          <div className="orbit-glow"/>
          <div className="orbit outer"/>
          <div className="orbit inner"/>
          <div className="bead b1"/>
          <div className="bead b2"/>
        </div>

        <div className="round-label">· ROUND 04 · THE SEAT TURNS ·</div>
        <div className="turn-banner">
          <span className="ring" style={{opacity: 0.4 + 0.6*(1-progress)}}/>
          {currentPlayer ? `${currentPlayer.you ? 'THE SEAT · ' : 'IN SEAT · '}${currentPlayer.name}` : 'THE SEAT'} · {mm}:{ss}
        </div>

        {/* ── Opponents ── */}
        {players.filter(p => !p.you).map(opp => (
          <Opponent
            key={opp.id}
            opp={opp}
            isTurn={currentPlayer && currentPlayer.id === opp.id}
            dim={currentPlayer && currentPlayer.id !== opp.id && !targeted}
            targetable={targeted && opp.alive !== false}
            dead={opp.alive === false}
            onClick={onOpponentClick}
          />
        ))}

        {/* ── Central reserve (sun) ── */}
        <div className="reserve">
          <div className={"pile sun-pile" + (reserveBump ? " bump" : "")}><div className="n">◐ {reserve}</div></div>
          <div className="lab">· THE RESERVE ·</div>
        </div>

        {/* ── Action banner ── */}
        {declared && phase === 'declared' && (() => {
          const d = ACTION_DEFS[declared.actionId];
          const actor = players.find(p=>p.id===declared.actorId);
          const target = declared.targetId ? players.find(p=>p.id===declared.targetId) : null;
          return (
            <div className={"action-banner" + (d.hostile ? " hostile" : "")}>
              <span className="who">{actor.name}</span> DECLARES <span className="act">{d.label}</span>
              {target && <span> ON <span className="who">{target.name}</span></span>}
              <span className="sub">
                {d.role ? `CLAIMS THE ${d.role}` : d.challengeable ? '· CONTESTABLE ·' : '· UNCONTESTABLE ·'}
              </span>
            </div>
          );
        })()}

        {/* ── Target selection prompt ── */}
        {targeted && (
          <div className="action-banner hostile">
            <span className="act">CHOOSE A TARGET</span>
            <span className="sub">· TAP A HOUSE ·</span>
          </div>
        )}

        {/* ── Challenge window (brief reactive moment) ── */}
        {declared && phase === 'declared' && (ACTION_DEFS[declared.actionId].challengeable || ACTION_DEFS[declared.actionId].blockableBy.length > 0) && declared.actorId !== 'you' && challengeTimer > 0 && (
          <div className="challenge-window">
            {ACTION_DEFS[declared.actionId].challengeable && (
              <button className="cw-btn chal" onClick={onChallenge}>CHALLENGE</button>
            )}
            {ACTION_DEFS[declared.actionId].blockableBy.length > 0 && (
              <button className="cw-btn block" onClick={() => { setChallengeTimer(0); addLog(`<b>HOUSE ADJEI</b> moves to BLOCK.`, null, "cel"); }}>BLOCK</button>
            )}
            <button className="cw-btn pass" onClick={() => setChallengeTimer(0)}>ALLOW</button>
            <span className="cw-timer">{challengeTimer}s</span>
          </div>
        )}

        {/* ── Flash FX ── */}
        {flashFx && (
          <div className={"fx-flash " + flashFx.kind}>
            <div className="word">{flashFx.word}</div>
            {flashFx.sub && <div className="sub">{flashFx.sub}</div>}
          </div>
        )}

        {/* ── Exchange whirl ── */}
        {exchangeFx && (
          <div className="fx-exchange-cards">
            <div className="mc"/>
            <div className="mc"/>
          </div>
        )}

        {/* ── Coin fly overlay ── */}
        {coinFlows.length > 0 && (
          <div className="coin-fly-layer">
            {coinFlows.map(f => (
              <div key={f.id}
                   className={"coin-fly" + (f.lapis ? " lapis" : "")}
                   style={{
                     "--sx": f.sx + "px",
                     "--sy": f.sy + "px",
                     "--tx": f.tx + "px",
                     "--ty": f.ty + "px",
                     "--delay": f.delay + "ms",
                     "--dur": f.dur + "ms",
                   }}/>
            ))}
          </div>
        )}

        {/* ── Arena log (mini) ── */}
        <div className="arena-log">
          <div className="al-title">· THE SCRIBE ·</div>
          {logEntries.map(e => (
            <div key={e.id} className={"al-row " + (e.cls || "")}
                 dangerouslySetInnerHTML={{ __html: e.txt + (e.hot ? ` <b>· ${e.hot} ·</b>` : '') }}/>
          ))}
        </div>

        {/* ── Deal overlay (preserved) ── */}
        {deals.length > 0 && (
          <div className="deal-layer" aria-hidden="true">
            {deals.map(d => (
              <div key={d.id}
                   className={"deal-card" + (d.player ? " deal-player" : "")}
                   style={{
                     "--sx": d.sx + "px", "--sy": d.sy + "px",
                     "--tx": d.tx + "px", "--ty": d.ty + "px",
                     "--w": d.w + "px", "--h": d.h + "px",
                     "--delay": d.delay + "ms",
                     "--dur": dealDuration + "ms",
                   }}/>
            ))}
          </div>
        )}
      </div>

      {/* ── Hand rack (YOU) ── */}
      <div className="hand-rack">
        <div className="hand-left player-panel">
          <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.26em', color:'var(--sun-300)', marginBottom:'6px'}}>· YOUR HOUSE ·</div>
          <h3 className="title">Adjei, the Morning</h3>
          <div className="cowries-big">
            <span className="sym"/>
            <span className={"val" + (youCowrieBump ? " bump" : "")}>◐ {String(you.cowries).padStart(2, '0')}</span>
            <span className="lab">COWRIES</span>
          </div>
          <div style={{marginTop:'12px', display:'flex', gap:'8px'}}>
            <span className="chip" style={{background:'rgba(62,138,122,0.12)', borderColor:'rgba(62,138,122,0.3)', color:'var(--cel-300)'}}>
              {you.cards.filter(c=>c.state!=='forfeit').length} FACES
            </span>
            <span className="chip">{isYourTurn ? 'SEATED' : 'WAITING'}</span>
          </div>
        </div>

        <div className={"hand-cards" + (isYourTurn ? " is-turn" : "")}>
          <PlayerCard role={you.cards[0]?.role} forfeit={you.cards[0]?.state==='forfeit'}/>
          <PlayerCard role={you.cards[1]?.role} forfeit={you.cards[1]?.state==='forfeit'}/>
        </div>

        <div className="hand-right actions-dock">
          <div className="eyebrow"><span>· DECLARE ·</span><span style={{color: isYourTurn ? 'var(--star-gold)' : 'var(--ink-faint)'}}>{isYourTurn ? `${mm}:${ss}` : 'WAITING…'}</span></div>
          <div className="actions-grid">
            <button className={"act" + (!isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('income')}><span className="glyph">◐</span>INCOME · 1</button>
            <button className={"act" + (!isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('aid')}><span className="glyph">◐</span>AID · 2</button>
            <button className={"act seize" + (!isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('seize')}><span className="glyph">◐</span>SEIZE · 3</button>
            <button className={"act" + (!isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('reave')}><span className="glyph">⊛</span>REAVE · 2</button>
            <button className={"act strike" + (!isYourTurn || forcedCoup || you.cowries < 3 ? " disabled" : "")} onClick={() => onYouAction('strike')}><span className="glyph">⌇</span>STRIKE · 3</button>
            <button className={"act coup" + (!isYourTurn || you.cowries < 7 ? " disabled" : "")} onClick={() => onYouAction('coup')}><span className="glyph">⚊</span>COUP · 7</button>
          </div>
          <div style={{marginTop:'12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
            <button className={"act" + (!isYourTurn || forcedCoup ? " disabled" : "")} style={{padding:'10px'}} onClick={() => onYouAction('exchange')}><span className="glyph" style={{fontSize:'14px'}}>⌬</span>EXCHANGE</button>
            <button className="act" style={{padding:'10px'}} disabled><span className="glyph" style={{fontSize:'14px'}}>☽</span>BLOCK</button>
          </div>
        </div>
      </div>
    </div>
  );
};
Object.assign(window, { TableScreen, PlayerCard, Opponent, ACTION_DEFS });
