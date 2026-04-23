/* ============================================================
   USURP — App root
   ============================================================
   Phase state machine: landing → auth → lobby → court
   - Gestisce transizioni fra le fasi
   - Persiste la fase in localStorage
   - Ascolta messaggi host per edit-mode (Tweaks panel)
   - Montaggio finale su #root

   Dipendenze (caricate PRIMA di questo file in index.html):
     data/config.js     → PHASES, TWEAK_DEFAULTS, STORAGE_KEYS
     data/*.js          → tutti i dati di gioco
     jsx/sigils.jsx     → Sigil, BigSun
     jsx/table.jsx      → TableScreen
     jsx/screens/*.jsx  → Stage, AuthCard, LobbyCard
     jsx/tweaks.jsx     → TweaksPanel, PhaseStrip
   ============================================================ */

const App = () => {
  const { useState, useEffect } = React;

  /* ── Stato principale: fase corrente ── */
  // Persistenza disabilitata di default per partire sempre da "landing".
  // Per riattivare: sostituisci "landing" con
  //   PHASES.includes(localStorage.getItem(STORAGE_KEYS.phase))
  //     ? localStorage.getItem(STORAGE_KEYS.phase)
  //     : "landing"
  const [phase, setPhase] = useState("landing");

  /* ── Stato delle card fluttuanti: 'hidden' | 'in' | 'out' ── */
  const [authState, setAuthState] = useState("hidden");
  const [lobbyState, setLobbyState] = useState("hidden");

  /* ── Config regolabili a runtime ── */
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const setTweak = (k, v) => {
    setTweaks((t) => ({ ...t, [k]: v }));
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { [k]: v } },
      "*"
    );
  };

  /* ── Trigger per animazione di distribuzione + chiave turno ── */
  const [dealing, setDealing] = useState(false);
  const [turnKey, setTurnKey] = useState(0);

  /* ── Tweaks panel aperto? (controllato dall'host) ── */
  const [tweaksOpen, setTweaksOpen] = useState(false);

  /* Persist fase */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.phase, phase);
  }, [phase]);

  /* Edit-mode protocol con l'host — listener prima, poi announce */
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode")   setTweaksOpen(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  /* Boot sequence: landing → auth (dopo 3s) */
  useEffect(() => {
    if (phase === "landing") {
      setAuthState("hidden");
      setLobbyState("hidden");
      const t = setTimeout(() => setPhase("auth"), 3000);
      return () => clearTimeout(t);
    }
    if (phase === "auth")   { setAuthState("in");     setLobbyState("hidden"); }
    if (phase === "lobby")  { setAuthState("hidden"); setLobbyState("in");     }
    if (phase === "court")  { setAuthState("hidden"); setLobbyState("hidden"); }
  }, [phase]);

  /* ── Transizioni fra fasi ── */
  const goAuthToLobby = () => {
    setAuthState("out");
    setTimeout(() => setPhase("lobby"), 520);
  };

  const goLobbyToCourt = () => {
    setLobbyState("out");
    setTimeout(() => {
      setPhase("court");
      // Dopo il paint del court, scatena la deal + timer turno
      setTimeout(() => {
        setDealing(true);
        const total = tweaks.dealDuration + 12 * tweaks.dealStagger + 400;
        setTimeout(() => {
          setDealing(false);
          setTurnKey((k) => k + 1);
        }, total);
      }, 260);
    }, 520);
  };

  /* Se atterriamo su 'court' direttamente (es. refresh), parte comunque un turno */
  useEffect(() => {
    if (phase === "court" && !dealing) setTurnKey((k) => k + 1);
    // eslint-disable-next-line
  }, [phase]);

  /* Auto-replay del turno per vedere il sun-dim continuo */
  useEffect(() => {
    if (phase !== "court" || !tweaks.autoReplayTurn || dealing) return;
    const t = setTimeout(
      () => setTurnKey((k) => k + 1),
      (tweaks.turnSeconds + 1) * 1000
    );
    return () => clearTimeout(t);
  }, [phase, turnKey, tweaks.turnSeconds, tweaks.autoReplayTurn, dealing]);

  /* Replay manuale della deal (triggerato dal TweaksPanel) */
  const replayDeal = () => {
    if (phase !== "court") return;
    setDealing(false);
    setTimeout(() => {
      setDealing(true);
      const total = tweaks.dealDuration + 12 * tweaks.dealStagger + 400;
      setTimeout(() => {
        setDealing(false);
        setTurnKey((k) => k + 1);
      }, total);
    }, 40);
  };

  const restartTurn = () => setTurnKey((k) => k + 1);

  /* Dev: ESC per reset alla landing */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setPhase("landing");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onCloseTweaks = () => {
    setTweaksOpen(false);
    window.parent.postMessage({ type: "__edit_mode_deactivate" }, "*");
  };

  /* ── Render ── */
  return (
    <div className="home-app" data-phase={phase}>
      <Stage phase={phase} dealing={dealing} turnKey={turnKey} tweaks={tweaks}/>

      {/* AuthCard: mounted da landing fino a out */}
      {(phase === "landing" || phase === "auth" || authState === "out") && (
        <AuthCard onEnter={goAuthToLobby} state={authState}/>
      )}

      {/* LobbyCard: mounted in lobby + durante exit */}
      {(phase === "lobby" || lobbyState === "out") && (
        <LobbyCard onOpenCourt={goLobbyToCourt} state={lobbyState}/>
      )}

      <TweaksPanel
        open={tweaksOpen}
        tweaks={tweaks}
        setTweak={setTweak}
        onClose={onCloseTweaks}
        onReplayDeal={replayDeal}
        onRestartTurn={restartTurn}
      />

      <PhaseStrip phase={phase} setPhase={setPhase}/>
    </div>
  );
};

/* ── Mount ── */
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
