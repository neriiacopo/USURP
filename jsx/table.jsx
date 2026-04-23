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

/* ACTION_DEFS è ora definito in data/actions.js e disponibile su window.
   Modifica costi/guadagni/ruoli lì, non qui. */

const PlayerCard = ({ role, forfeit, justForfeit }) => {
  // I testi delle carte (nome, epiteto, abilità, codice) vivono in
  // data/roles.js → ROLE_DEFS. Modifica lì per cambiarli.
  const d = ROLE_DEFS[role] || ROLE_DEFS.OBA;
  const cls = "player-card"
    + (role === "NJALA" ? " njala" : "")
    + (forfeit ? " forfeit" : "")
    + (justForfeit ? " just-forfeit" : "");
  return (
    <div className={cls}>
      <div className="holo-strip" style={role === "NJALA" ? { background: "repeating-linear-gradient(0deg, #ef7c5a 0, #fff 2px, #e05a34 4px, #7a1d12 6px, #ef7c5a 8px)", backgroundSize:'100% 200%'} : {}}/>
      <div className="head"><span>OP · {d.code.split(' ')[0]}</span><span>◐ × 3</span></div>
      <div className="sigil-wrap"><Sigil name={role} size={70} /></div>
      <div>
        <div className="name">{d.name}</div>
        <div className="sub">{d.epithet}</div>
        <div className="ab">{d.ability}</div>
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
  // ── Match start: build shuffled deck & deal 2 random cards to each seat ──
  // The deck lives in DECK_COMPOSITION (data/config.js). Each player gets 2
  // random roles drawn without replacement; the remainder stays in the deck
  // and can be drawn by EXCHANGE. Seats are hardcoded in data/players.js
  // but their starting roles are replaced here. useMemo keeps the deal
  // stable across re-renders.
  const shuffleArr = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const initialDeal = React.useMemo(() => {
    const pool = [];
    Object.entries(DECK_COMPOSITION || { OBA:3, NJALA:3, KORO:3, GRIOT:3, IYA:3 })
      .forEach(([role, n]) => { for (let i = 0; i < n; i++) pool.push(role); });
    const deck = shuffleArr(pool);
    const seats = DEFAULT_SEATS.map(s => ({
      ...s,
      accused: false,                     // wipe hardcoded "accused" flavor
      cards: [
        { role: deck.pop(), state: s.you ? 'up' : 'back' },
        { role: deck.pop(), state: s.you ? 'up' : 'back' },
      ],
    }));
    return { seats, deck };
  }, []);

  const [players, setPlayers]  = React.useState(initialDeal.seats);
  const [deck, setDeck]        = React.useState(initialDeal.deck);
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
  // Reaction window: UI state for who can challenge/block right now,
  // plus a ref that declareAction/handleBlock await on until the window
  // resolves (either via a player click, AI decision, or timeout).
  const [reactionUI, setReactionUI] = React.useState(null);
  const reactionRef = React.useRef(null);
  // Pickers for the main player: when YOU lose a face (bluff caught,
  // STRIKE, COUP) you choose which card to turn up; when YOU EXCHANGE,
  // you see a drawn role and choose whether to swap one of yours for it.
  const [lossPicker, setLossPicker] = React.useState(null);         // { options, onPick }
  const [exchangePicker, setExchangePicker] = React.useState(null); // { yourCards, drawn, onSwap, onKeep }

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

  // ── Bluff / challenge / block helpers ────────────────────────
  // Does player `pid` actually hold (non-forfeit) card with `role`?
  // This is the single source of truth for "bluff vs. reveal" resolution.
  const playerHasRole = (pid, role) => {
    if (!role) return false;
    const p = playersRef.current.find(x => x.id === pid);
    if (!p) return false;
    return p.cards.some(c => c.role === role && c.state !== 'forfeit' && c.state !== 'justForfeit');
  };

  // When an AI blocks, they claim a role from def.blockableBy.
  // Prefer an owned role (truth), else bluff with any of them.
  const aiPickBlockRole = (ai, blockableBy) => {
    const owned = blockableBy.find(r => ai.cards.some(c => c.role === r && c.state !== 'forfeit'));
    return owned || blockableBy[Math.floor(Math.random() * blockableBy.length)];
  };

  // AI probability models — tuned so challenges are rare but real.
  const aiChallengeProb = (ai, actor, def) => {
    if (!def.challengeable) return 0;
    const actorAlive = actor.cards.filter(c => c.state !== 'forfeit').length;
    const aiHoldsClaim = def.role && ai.cards.some(c => c.role === def.role && c.state !== 'forfeit');
    let p = 0.08;
    if (aiHoldsClaim) p += 0.22;  // "I hold the Oba myself — they're probably bluffing"
    if (actorAlive === 1) p += 0.14; // tempting to knock out a 1-face house
    return Math.min(p, 0.5);
  };
  const aiBlockProb = (ai, actor, def) => {
    if (!def.blockableBy.length) return 0;
    const hasBlockRole = ai.cards.some(c => def.blockableBy.includes(c.role) && c.state !== 'forfeit');
    return hasBlockRole ? 0.72 : 0.18; // truthful blocks common, bluffs occasional
  };
  const aiCounterChallengeProb = (actor, blocker, claimedRole) => {
    const blockerAlive = blocker.cards.filter(c => c.state !== 'forfeit').length;
    const actorHoldsClaim = actor.cards.some(c => c.role === claimedRole && c.state !== 'forfeit');
    let p = 0.12;
    if (actorHoldsClaim) p += 0.22;
    if (blockerAlive === 1) p += 0.14;
    return Math.min(p, 0.5);
  };

  // Open a reaction window. Returns a Promise that resolves with
  //   { kind: 'challenge', by }                     — someone challenged
  //   { kind: 'block', by, claimedRole }            — someone blocked
  //   null                                          — allowed to proceed
  // ctx.mode is either 'action' (reacting to a freshly-declared action)
  // or 'block' (original actor may counter-challenge a pending block).
  const openReactionWindow = (windowMs, ctx) => {
    return new Promise(resolve => {
      let finished = false;
      const aiTimers = [];
      const finish = (payload) => {
        if (finished) return;
        finished = true;
        aiTimers.forEach(id => clearTimeout(id));
        clearInterval(tickId);
        clearTimeout(mainId);
        setChallengeTimer(0);
        setReactionUI(null);
        reactionRef.current = null;
        resolve(payload);
      };
      reactionRef.current = { resolve: finish, ctx };
      setChallengeTimer(Math.ceil(windowMs / 1000));
      const tickId = setInterval(() => setChallengeTimer(t => Math.max(0, t - 1)), 1000);
      const mainId = setTimeout(() => finish(null), windowMs);

      // What can YOU do in this window?
      const ps = playersRef.current;
      const you = ps.find(p => p.id === 'you');
      const youAlive = you && you.alive !== false && you.cards.some(c => c.state !== 'forfeit');
      let ui = null;
      if (ctx.mode === 'action') {
        const { actor, target, def } = ctx;
        if (actor.id !== 'you' && youAlive) {
          const canChallenge = !!def.challengeable;
          const canBlock = def.blockableBy.length > 0 && (!def.targeted || target?.id === 'you');
          if (canChallenge || canBlock) ui = { mode: 'action', canChallenge, canBlock };
        }
      } else if (ctx.mode === 'block') {
        const { actorId } = ctx;
        if (actorId === 'you' && youAlive) ui = { mode: 'block' };
      }
      setReactionUI(ui);

      // Schedule AI reactions (each AI decides independently; first to fire wins).
      if (ctx.mode === 'action') {
        const { actor, target, def } = ctx;
        if (def.challengeable) {
          ps.filter(p => p.id !== actor.id && p.id !== 'you' && p.alive !== false).forEach(c => {
            if (Math.random() < aiChallengeProb(c, actor, def)) {
              const when = 1500 + Math.random() * Math.max(500, windowMs - 3000);
              aiTimers.push(setTimeout(() => finish({ kind: 'challenge', by: c.id }), when));
            }
          });
        }
        if (def.blockableBy.length > 0) {
          const blockCandidates = def.targeted
            ? ps.filter(p => p.id === target?.id && p.id !== 'you' && p.alive !== false)
            : ps.filter(p => p.id !== actor.id && p.id !== 'you' && p.alive !== false);
          blockCandidates.forEach(b => {
            if (Math.random() < aiBlockProb(b, actor, def)) {
              const when = 1800 + Math.random() * Math.max(500, windowMs - 3200);
              const claim = aiPickBlockRole(b, def.blockableBy);
              aiTimers.push(setTimeout(() => finish({ kind: 'block', by: b.id, claimedRole: claim }), when));
            }
          });
        }
      } else if (ctx.mode === 'block') {
        const { actorId, blockerId, claimedRole } = ctx;
        if (actorId !== 'you') {
          const actor = ps.find(p => p.id === actorId);
          const blocker = ps.find(p => p.id === blockerId);
          if (actor && blocker && Math.random() < aiCounterChallengeProb(actor, blocker, claimedRole)) {
            const when = 1200 + Math.random() * Math.max(500, windowMs - 2500);
            aiTimers.push(setTimeout(() => finish({ kind: 'challenge', by: actor.id }), when));
          }
        }
      }
    });
  };

  // Resolve a block: optionally counter-challenged by the original actor.
  // Returns true if the block stands (action is denied), false if it fails
  // (block was a bluff → action proceeds).
  const handleBlock = async (reaction, actor, def) => {
    const { by: blockerId, claimedRole } = reaction;
    const blocker = playersRef.current.find(p => p.id === blockerId);
    addLog(`${blocker.name} BLOCKS — claims the <b>${claimedRole}</b>.`, null, 'cel');
    setDeclared(prev => prev ? { ...prev, blockedBy: blockerId, blockRole: claimedRole } : prev);
    await delay(500);

    const cc = await openReactionWindow(4000, { mode: 'block', actorId: actor.id, blockerId, claimedRole });
    if (cc && cc.kind === 'challenge') {
      const challenger = playersRef.current.find(p => p.id === cc.by);
      addLog(`${challenger.name} challenges the block!`, null, 'verm');
      await delay(500);
      if (playerHasRole(blockerId, claimedRole)) {
        addLog(`${blocker.name} REVEALS the <b>${claimedRole}</b>. ${challenger.name} loses a face.`, null, 'verm');
        await flashWord('challenge', 'REVEALED.', `· ${challenger.name} LOSES A FACE ·`);
        await forfeitCard(cc.by);
        return true;   // block stands — action denied
      }
      addLog(`${blocker.name} was BLUFFING — holds no <b>${claimedRole}</b>. A face is unseated.`, null, 'verm');
      await flashWord('challenge', 'BLUFF.', `· ${blocker.name} LOSES A FACE ·`);
      await forfeitCard(blockerId);
      return false;    // block fails — action proceeds
    }
    addLog(`${actor.name} stands down. The ${def.label} is denied.`, null, '');
    await delay(400);
    return true;       // block stood unchallenged
  };

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

    // ── Reaction window: challenge the action, or block it ──
    // Consequences follow Coup rules:
    //   Challenge → reveal. If actor holds the claimed role, the
    //     challenger forfeits a face; otherwise the actor forfeits
    //     a face and the action is cancelled.
    //   Block    → the blocker claims a blocking role. The original
    //     actor then gets a brief counter-challenge window, same
    //     reveal-vs-bluff consequences apply. An unchallenged block
    //     stands and the action is denied.
    let cancelled = false;
    let blocked = false;

    if (def.challengeable || def.blockableBy.length > 0) {
      const reaction = await openReactionWindow(5000, { mode: 'action', actor, target, def });

      if (reaction && reaction.kind === 'challenge') {
        const challenger = playersRef.current.find(p => p.id === reaction.by);
        addLog(`${challenger.name} CHALLENGES ${actor.name}'s ${def.label} claim!`, null, 'verm');
        await delay(500);
        if (playerHasRole(actorId, def.role)) {
          addLog(`${actor.name} REVEALS the <b>${def.role}</b>. ${challenger.name} loses a face.`, null, 'verm');
          await flashWord('challenge', 'REVEALED.', `· ${challenger.name} LOSES A FACE ·`);
          await forfeitCard(reaction.by);
        } else {
          addLog(`${actor.name} was BLUFFING — holds no <b>${def.role}</b>. A face is unseated.`, null, 'verm');
          await flashWord('challenge', 'BLUFF.', `· ${actor.name} LOSES A FACE ·`);
          await forfeitCard(actorId);
          cancelled = true;
        }
      } else if (reaction && reaction.kind === 'block') {
        blocked = await handleBlock(reaction, actor, def);
      }
    } else {
      await delay(450);
    }

    if (!cancelled && !blocked) {
      await resolveAction(actionId, actorId, targetId);
    } else {
      await delay(350);
      endTurn();
    }
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
      await delay(600);
      setExchangeFx(false);
      if (actorId === 'you') {
        // Main player: show the drawn card and let them swap or keep.
        await runExchangeForYou();
      } else {
        // AI exchange is purely cosmetic in the prototype — their hand
        // stays unchanged and no deck interaction is shown.
        addLog(`${players.find(p=>p.id===actorId).name} exchanges — a new face.`, null, "cel");
      }
    } else if (actionId === 'strike') {
      await flashWord('strike', 'STRIKE.', `· ${playersRef.current.find(p=>p.id===targetId)?.name} FORFEITS A FACE ·`);
      addLog(`${playersRef.current.find(p=>p.id===actorId).name} strikes ${playersRef.current.find(p=>p.id===targetId)?.name}.`, "STRIKE", "verm");
      await forfeitCard(targetId);
    } else if (actionId === 'coup') {
      await flashWord('coup', 'COUP.', `· ${playersRef.current.find(p=>p.id===targetId)?.name} IS UNSEATED ·`);
      addLog(`${playersRef.current.find(p=>p.id===actorId).name} stages a COUP on ${playersRef.current.find(p=>p.id===targetId)?.name}.`, "COUP", "verm");
      await forfeitCard(targetId);
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

  // Forfeit one face. For YOU (when more than one live card remains) open
  // the loss-picker modal so the player chooses which card to reveal; for
  // AI (and for YOU when only one face is left) auto-pick the first live
  // slot. Returns a Promise that resolves once the flip animation has
  // settled — callers should `await forfeitCard(...)` so downstream
  // phases (end-of-turn, next reaction) don't race with the animation.
  const forfeitCard = async (playerId) => {
    const p = playersRef.current.find(x => x.id === playerId);
    if (!p) return;
    const liveCards = p.cards
      .map((c, i) => ({ role: c.role, state: c.state, idx: i }))
      .filter(c => c.state !== 'forfeit' && c.state !== 'justForfeit');
    if (liveCards.length === 0) return;

    let chosenIdx;
    if (playerId === 'you' && liveCards.length > 1) {
      chosenIdx = await new Promise(resolve => {
        setLossPicker({
          options: liveCards,
          onPick: (idx) => { setLossPicker(null); resolve(idx); },
        });
      });
    } else {
      chosenIdx = liveCards[0].idx;
    }

    // Transitional state — the .forfeit dim shouldn't apply during the flip
    setPlayers(prev => prev.map(pp => {
      if (pp.id !== playerId) return pp;
      const cards = pp.cards.slice();
      cards[chosenIdx] = { ...cards[chosenIdx], state: 'justForfeit', justForfeit: true };
      return { ...pp, cards };
    }));

    // Settle to permanent 'forfeit' after the animation window
    await new Promise(resolve => setTimeout(() => {
      setPlayers(prev => prev.map(pp => {
        if (pp.id !== playerId) return pp;
        return {
          ...pp,
          cards: pp.cards.map(c =>
            c.state === 'justForfeit'
              ? { ...c, state: 'forfeit', justForfeit: false }
              : c
          ),
        };
      }));
      resolve();
    }, 1700));
  };

  // ── EXCHANGE for the main player ───────────────────────────────
  // Draw one card from the deck, present it next to your live faces,
  // and let you swap one of them for it or keep your hand. The card
  // that leaves your hand is shuffled back into the deck.
  const runExchangeForYou = async () => {
    if (deck.length === 0) {
      addLog(`The deck is closed — no face to draw.`, null, "");
      await delay(400);
      return;
    }
    const drawnRole = deck[deck.length - 1];
    const withoutDrawn = deck.slice(0, -1);
    const you = playersRef.current.find(p => p.id === 'you');
    const yourLive = you.cards
      .map((c, i) => ({ role: c.role, idx: i, state: c.state }))
      .filter(c => c.state !== 'forfeit' && c.state !== 'justForfeit');
    if (yourLive.length === 0) return; // already unseated — shouldn't happen mid-turn

    const pick = await new Promise(resolve => {
      setExchangePicker({
        yourCards: yourLive,
        drawn: drawnRole,
        onSwap: (cardIdx) => { setExchangePicker(null); resolve({ swap: true, cardIdx }); },
        onKeep: ()          => { setExchangePicker(null); resolve({ swap: false }); },
      });
    });

    if (pick.swap) {
      const oldRole = you.cards[pick.cardIdx].role;
      setPlayers(prev => prev.map(p => {
        if (p.id !== 'you') return p;
        const cards = p.cards.slice();
        cards[pick.cardIdx] = { ...cards[pick.cardIdx], role: drawnRole };
        return { ...p, cards };
      }));
      setDeck(shuffleArr([oldRole, ...withoutDrawn]));
      addLog(`You swap a face for the <b>${drawnRole}</b>.`, null, "cel");
    } else {
      setDeck(shuffleArr([drawnRole, ...withoutDrawn]));
      addLog(`You hold your hand. The Griot's draw returns to the deck.`, null, "");
    }
    await delay(300);
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

  // ── Player reaction handlers (resolve the open reaction window) ──
  const onChallenge = () => {
    if (!reactionRef.current) return;
    reactionRef.current.resolve({ kind: 'challenge', by: 'you' });
  };
  const onBlock = () => {
    if (!reactionRef.current) return;
    const ctx = reactionRef.current.ctx;
    if (!ctx || ctx.mode !== 'action' || !ctx.def.blockableBy.length) return;
    const blockableBy = ctx.def.blockableBy;
    const you = playersRef.current.find(p => p.id === 'you');
    // Claim a role you actually hold if possible (safer against a
    // counter-challenge); otherwise bluff with the first option.
    const owned = blockableBy.find(r => you && you.cards.some(c => c.role === r && c.state !== 'forfeit'));
    const claimedRole = owned || blockableBy[0];
    reactionRef.current.resolve({ kind: 'block', by: 'you', claimedRole });
  };
  const onAllow = () => {
    if (!reactionRef.current) return;
    reactionRef.current.resolve(null);
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

  // YOU is "alive" (seated) as long as at least one face is not forfeited.
  // Transitional 'justForfeit' still counts as live; only 'forfeit' burns a seat.
  // When false, every action/reaction button disables and the rack shows
  // the UNSEATED badge — spectator mode for the player's house.
  const youAlive = you && you.cards.some(c => c.state !== 'forfeit');
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

        {/* ── Block banner (shown while a block is pending / being counter-challenged) ── */}
        {declared && declared.blockedBy && (
          <div className="action-banner" style={{top: '92px'}}>
            <span className="who">{players.find(p=>p.id===declared.blockedBy)?.name}</span>
            {' BLOCKS — CLAIMS '}
            <span className="act">{declared.blockRole}</span>
            <span className="sub">{`· BLOCKS THE ${ACTION_DEFS[declared.actionId].label} ·`}</span>
          </div>
        )}

        {/* ── Reaction window (drives ALL player-side challenges & blocks) ── */}
        {reactionUI && (
          <div className="challenge-window">
            {reactionUI.mode === 'action' && (
              <>
                {reactionUI.canChallenge && (
                  <button className="cw-btn chal" onClick={onChallenge}>CHALLENGE</button>
                )}
                {reactionUI.canBlock && (
                  <button className="cw-btn block" onClick={onBlock}>BLOCK</button>
                )}
                <button className="cw-btn pass" onClick={onAllow}>ALLOW</button>
              </>
            )}
            {reactionUI.mode === 'block' && (
              <>
                <button className="cw-btn chal" onClick={onChallenge}>CHALLENGE BLOCK</button>
                <button className="cw-btn pass" onClick={onAllow}>ACCEPT</button>
              </>
            )}
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

        {/* ── Loss picker (YOU chooses which face to forfeit) ── */}
        {lossPicker && (
          <div className="fx-modal">
            <div className="fx-modal-inner">
              <div className="fx-modal-title">· FORFEIT A FACE ·</div>
              <div className="fx-modal-sub">Choose which card to turn up.</div>
              <div className="fx-modal-cards">
                {lossPicker.options.map(o => (
                  <button key={o.idx} className="fx-modal-card" onClick={() => lossPicker.onPick(o.idx)}>
                    <div className="fx-modal-card-role">{o.role}</div>
                    <div className="fx-modal-card-epithet">{ROLE_DEFS[o.role]?.epithet || ''}</div>
                    <div className="fx-modal-card-sub">· REVEAL ·</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Exchange picker (YOU draws 1 and swaps or keeps) ── */}
        {exchangePicker && (
          <div className="fx-modal">
            <div className="fx-modal-inner">
              <div className="fx-modal-title">· GRIOT'S EXCHANGE ·</div>
              <div className="fx-modal-sub">Swap one of your faces for the drawn role, or hold your hand.</div>
              <div className="fx-modal-cards">
                {exchangePicker.yourCards.map(c => (
                  <button key={c.idx} className="fx-modal-card" onClick={() => exchangePicker.onSwap(c.idx)}>
                    <div className="fx-modal-card-role">{c.role}</div>
                    <div className="fx-modal-card-epithet">{ROLE_DEFS[c.role]?.epithet || ''}</div>
                    <div className="fx-modal-card-sub">· SWAP FOR DRAWN ·</div>
                  </button>
                ))}
                <div className="fx-modal-card drawn">
                  <div className="fx-modal-card-role">{exchangePicker.drawn}</div>
                  <div className="fx-modal-card-epithet">{ROLE_DEFS[exchangePicker.drawn]?.epithet || ''}</div>
                  <div className="fx-modal-card-sub">· DRAWN FROM DECK ·</div>
                </div>
              </div>
              <button className="fx-modal-keep" onClick={exchangePicker.onKeep}>KEEP HAND</button>
            </div>
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
      <div className={"hand-rack" + (!youAlive ? " unseated" : "")}>
        <div className="hand-left player-panel">
          <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.26em', color: youAlive ? 'var(--sun-300)' : 'var(--verm-300)', marginBottom:'6px'}}>
            {youAlive ? '· YOUR HOUSE ·' : '· HOUSE UNSEATED ·'}
          </div>
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
            <span className="chip" style={!youAlive ? {color:'var(--verm-300)', borderColor:'var(--verm-300)'} : {}}>
              {!youAlive ? 'UNSEATED' : (isYourTurn ? 'SEATED' : 'WAITING')}
            </span>
          </div>
        </div>

        <div className={"hand-cards" + (isYourTurn && youAlive ? " is-turn" : "")}>
          <PlayerCard
            role={you.cards[0]?.role}
            forfeit={you.cards[0]?.state==='forfeit'}
            justForfeit={you.cards[0]?.state==='justForfeit'}
          />
          <PlayerCard
            role={you.cards[1]?.role}
            forfeit={you.cards[1]?.state==='forfeit'}
            justForfeit={you.cards[1]?.state==='justForfeit'}
          />
        </div>

        <div className="hand-right actions-dock">
          <div className="eyebrow">
            <span>· DECLARE ·</span>
            <span style={{color: youAlive && isYourTurn ? 'var(--star-gold)' : 'var(--ink-faint)'}}>
              {!youAlive ? 'UNSEATED' : (isYourTurn ? `${mm}:${ss}` : 'WAITING…')}
            </span>
          </div>
          <div className="actions-grid">
            <button className={"act" + (!youAlive || !isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('income')}><span className="glyph">◐</span>INCOME · 1</button>
            <button className={"act" + (!youAlive || !isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('aid')}><span className="glyph">◐</span>AID · 2</button>
            <button className={"act seize" + (!youAlive || !isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('seize')}><span className="glyph">◐</span>SEIZE · 3</button>
            <button className={"act" + (!youAlive || !isYourTurn || forcedCoup ? " disabled" : "")} onClick={() => onYouAction('reave')}><span className="glyph">⊛</span>REAVE · 2</button>
            <button className={"act strike" + (!youAlive || !isYourTurn || forcedCoup || you.cowries < 3 ? " disabled" : "")} onClick={() => onYouAction('strike')}><span className="glyph">⌇</span>STRIKE · 3</button>
            <button className={"act coup" + (!youAlive || !isYourTurn || you.cowries < 7 ? " disabled" : "")} onClick={() => onYouAction('coup')}><span className="glyph">⚊</span>COUP · 7</button>
          </div>
          <div style={{marginTop:'12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
            <button className={"act" + (!youAlive || !isYourTurn || forcedCoup ? " disabled" : "")} style={{padding:'10px'}} onClick={() => onYouAction('exchange')}><span className="glyph" style={{fontSize:'14px'}}>⌬</span>EXCHANGE</button>
            <button className="act" style={{padding:'10px'}} disabled><span className="glyph" style={{fontSize:'14px'}}>☽</span>BLOCK</button>
          </div>
        </div>
      </div>
    </div>
  );
};
Object.assign(window, { TableScreen, PlayerCard, Opponent, ACTION_DEFS });
