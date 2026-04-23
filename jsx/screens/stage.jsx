/* ============================================================
   USURP — Stage
   ============================================================
   Il background persistente. Parte come quadrante hero
   (costellazioni + BigSun + copy) e poi rivela il Court
   (TableScreen) sotto.
   ============================================================ */

const Stage = ({ phase, dealing, turnKey, tweaks }) => {
  const heroVisible =
    phase === "landing" || phase === "auth" || phase === "lobby";

  return (
    <div className={"stage stage-" + phase}>
      {/* Court mounted sempre, così può cross-fade */}
      <div className={"stage-court " + (phase === "court" ? "is-live" : "is-dormant")}>
        <TableScreen
          dealing={dealing}
          dealDuration={tweaks.dealDuration}
          dealStagger={tweaks.dealStagger}
          turnSeconds={tweaks.turnSeconds}
          turnKey={turnKey}
          sunDimDepth={tweaks.sunDimDepth}
        />
      </div>

      {/* Hero — quadrante AuthScreen in full-bleed */}
      <div
        className={"stage-hero " + (heroVisible ? "is-live" : "is-gone")}
        aria-hidden={!heroVisible}
      >
        <div className="hero-stars" />
        <div className="hero-vignette" />
        <div className="hero-sun-xl">
          <BigSun size={520} />
        </div>
        <div className="hero-copy-xl">
          <div className="hero-eyebrow">· BCN · USURP · THE RITE OF COWRIES ·</div>
          <h1>
            The Suncrown is&nbsp;vacant.<br/>
            <em>Five Houses. Ten faces.</em>
          </h1>
          <div className="hero-tagline">· ONE SEAT REMAINS · FIVE WILL CONTEND ·</div>
        </div>
      </div>

      {/* Top nav — sempre presente, cambia stile per phase */}
      <nav className="home-nav">
        <div className="nav-mark">
          <svg viewBox="-40 -40 80 80" width="34" height="34">
            <circle cx="0" cy="0" r="30" stroke="#7d8ed8" strokeWidth="0.6" fill="none" opacity="0.4"/>
            <circle cx="0" cy="0" r="22" stroke="#e1b968" strokeWidth="0.8" fill="none" opacity="0.6"/>
            <circle cx="0" cy="0" r="5" fill="#e1b968"/>
            <g stroke="#e1b968" strokeWidth="1.2" strokeLinecap="square">
              {Array.from({ length: 9 }).map((_, i) => {
                const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
                return (
                  <line key={i}
                        x1={Math.cos(a) * 32} y1={Math.sin(a) * 32}
                        x2={Math.cos(a) * 18} y2={Math.sin(a) * 18}/>
                );
              })}
            </g>
          </svg>
          <div>
            <div className="wm">USURP</div>
            <div className="sub">· RITE OF COWRIES ·</div>
          </div>
        </div>
        <div className="nav-status">
          {phase === "court" ? (
            <span><span className="pulse"/> HOUSE ADJEI · COURT LIVE · ◐ 2,304</span>
          ) : (
            <span>A GAME FROM BCN · SEASON VII</span>
          )}
        </div>
      </nav>
    </div>
  );
};

Object.assign(window, { Stage });
