/* ============================================================
   USURP — Dev panels (Tweaks + Phase strip)
   ============================================================
   Due pannelli di sviluppo:
   - TweaksPanel: slider per aggiustare timing animazioni
   - PhaseStrip: bottoni per saltare fra le fasi (+ ESC reset)

   I range degli slider sono in data/config.js (TWEAK_RANGES).
   ============================================================ */

const TweaksPanel = ({ open, tweaks, setTweak, onClose, onReplayDeal, onRestartTurn }) => {
  return (
    <div className={"tweaks-panel" + (open ? " open" : "")}>
      <div className="tweaks-head">
        <span>· TWEAKS ·</span>
        <button className="close" onClick={onClose}>×</button>
      </div>

      {/* Deal duration */}
      <div className="tweaks-row">
        <div className="lab">
          <span>DEAL DURATION</span>
          <span className="v">{tweaks.dealDuration}ms</span>
        </div>
        <input type="range"
               min={TWEAK_RANGES.dealDuration.min}
               max={TWEAK_RANGES.dealDuration.max}
               step={TWEAK_RANGES.dealDuration.step}
               value={tweaks.dealDuration}
               onChange={(e) => setTweak("dealDuration", +e.target.value)}/>
      </div>

      {/* Deal stagger */}
      <div className="tweaks-row">
        <div className="lab">
          <span>DEAL STAGGER</span>
          <span className="v">{tweaks.dealStagger}ms</span>
        </div>
        <input type="range"
               min={TWEAK_RANGES.dealStagger.min}
               max={TWEAK_RANGES.dealStagger.max}
               step={TWEAK_RANGES.dealStagger.step}
               value={tweaks.dealStagger}
               onChange={(e) => setTweak("dealStagger", +e.target.value)}/>
      </div>

      <div className="tweaks-row">
        <button className="action" onClick={onReplayDeal}>▶ REPLAY DEAL</button>
      </div>

      {/* Turn seconds */}
      <div className="tweaks-row">
        <div className="lab">
          <span>TURN SECONDS</span>
          <span className="v">{tweaks.turnSeconds}s</span>
        </div>
        <div className="vals">
          {TWEAK_RANGES.turnSeconds.options.map((n) => (
            <button key={n}
                    className={tweaks.turnSeconds === n ? "active" : ""}
                    onClick={() => { setTweak("turnSeconds", n); onRestartTurn(); }}>
              {n}s
            </button>
          ))}
        </div>
      </div>

      {/* Sun dim depth */}
      <div className="tweaks-row">
        <div className="lab">
          <span>SUN DIM DEPTH</span>
          <span className="v">{Math.round(tweaks.sunDimDepth * 100)}%</span>
        </div>
        <input type="range"
               min={TWEAK_RANGES.sunDimDepth.min}
               max={TWEAK_RANGES.sunDimDepth.max}
               step={TWEAK_RANGES.sunDimDepth.step}
               value={tweaks.sunDimDepth}
               onChange={(e) => setTweak("sunDimDepth", +e.target.value)}/>
      </div>

      <div className="tweaks-row">
        <button className="action" onClick={onRestartTurn}>↺ RESTART TURN</button>
      </div>

      {/* Auto-replay */}
      <div className="tweaks-row">
        <div className="lab"><span>AUTO-REPLAY TURN</span></div>
        <div className="vals">
          <button className={tweaks.autoReplayTurn ? "active" : ""}
                  onClick={() => setTweak("autoReplayTurn", true)}>ON</button>
          <button className={!tweaks.autoReplayTurn ? "active" : ""}
                  onClick={() => setTweak("autoReplayTurn", false)}>OFF</button>
        </div>
      </div>
    </div>
  );
};

/* Phase strip — dev navigation fra le 4 fasi */
const PhaseStrip = ({ phase, setPhase }) => (
  <div className="phase-strip">
    {PHASES.map((p) => (
      <button key={p}
              className={"ps-btn " + (phase === p ? "active" : "")}
              onClick={() => setPhase(p)}>
        {p.toUpperCase()}
      </button>
    ))}
    <span className="ps-hint">ESC · RESET</span>
  </div>
);

Object.assign(window, { TweaksPanel, PhaseStrip });
