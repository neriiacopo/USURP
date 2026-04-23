/* ============================================================
   USURP — AuthCard
   ============================================================
   Scheda fluttuante per il login. Larga ~1/3 viewport.
   Gestisce: input House name + Seal phrase, tasto ENTER,
   transizioni in/out.
   ============================================================ */

const AuthCard = ({ onEnter, state }) => {
  const { useState, useEffect, useRef } = React;

  const [houseName, setHouseName] = useState("ADJEI");
  const [phrase, setPhrase] = useState("•••••••••••");
  const ref = useRef(null);

  /* ENTER per procedere (solo quando la card è "in") */
  useEffect(() => {
    const onKey = (e) => {
      if (state !== "in") return;
      if (e.key === "Enter") {
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onEnter]);

  return (
    <div className={"floater auth-card state-" + state} ref={ref}>
      <span className="bk-a"/><span className="bk-b"/>
      <div className="auth-eyebrow">· THE COURT AWAITS ·</div>
      <h2 className="auth-h2">Declare your<br/><em>House.</em></h2>

      <div className="fld">
        <div className="lab">
          <span>HOUSE NAME</span>
          <span className="faint">3–24 CHARS</span>
        </div>
        <input
          type="text"
          value={houseName}
          onChange={(e) => setHouseName(e.target.value.toUpperCase())}
        />
      </div>
      <div className="fld">
        <div className="lab">
          <span>SEAL PHRASE</span>
          <span className="faint">MEMORIZE</span>
        </div>
        <input
          type="password"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
        />
      </div>

      <button className="btn btn-primary auth-enter" onClick={onEnter}>
        ENTER THE COURT <span className="arr">↵</span>
      </button>

      <div className="auth-divider">
        <div className="line"/><span>OR</span><div className="line"/>
      </div>
      <button className="btn btn-ghost auth-ghost">
        ◐ CLAIM A COURT-CODE
      </button>

      <div className="auth-footnote">
        NEW TO THE RITE? · <span className="amber">READ THE DOCTRINE</span>
      </div>
      <div className="auth-enter-hint">PRESS ↵ ENTER TO PROCEED</div>
    </div>
  );
};

Object.assign(window, { AuthCard });
