/* ============================================================
   USURP — LobbyCard
   ============================================================
   Scheda fluttuante larga 80% viewport. Mostra la lista delle
   corti disponibili, le statistiche del giocatore e il feed
   dello scribe.

   I dati (corti, scribe, decreto, standing) sono in:
     data/courts.js
   ============================================================ */

const LobbyCard = ({ onOpenCourt, state }) => {
  return (
    <div className={"floater lobby-card state-" + state}>
      <span className="bk-a"/><span className="bk-b"/>
      <div className="lobby-grid">

        {/* ── Aside sinistra: navigazione + standing ── */}
        <aside className="lobby-aside">
          <div className="aside-eyebrow">· HOUSE ADJEI ·</div>
          <div className="aside-item active"><span className="dot"/>THE COURTS</div>
          <div className="aside-item"><span className="dot"/>PRIVATE CIRCLE</div>
          <div className="aside-item"><span className="dot"/>CHRONICLE</div>
          <div className="aside-item"><span className="dot"/>DOCTRINE</div>
          <div className="aside-item"><span className="dot"/>TREASURY</div>
          <div className="aside-divider"/>
          <div className="aside-subhead">STANDING</div>
          <div className="aside-stats">
            <div><span>WINS</span>         <span className="amber">{PLAYER_STANDING.wins}</span></div>
            <div><span>LOSSES</span>       <span className="verm">{String(PLAYER_STANDING.losses).padStart(3,'0')}</span></div>
            <div><span>FACES CLAIMED</span><span className="brass">{PLAYER_STANDING.facesClaimed}</span></div>
            <div><span>COWRIES</span>      <span className="brass">◐ {PLAYER_STANDING.cowries.toLocaleString()}</span></div>
          </div>
        </aside>

        {/* ── Main: header + lista tavoli ── */}
        <main className="lobby-main">
          <div className="lobby-header">
            <div>
              <div className="lobby-eyebrow">· SEVEN COURTS CONVENE ·</div>
              <h2>The Meridian</h2>
            </div>
            <div className="lobby-actions">
              <button className="btn btn-ghost">⌕ FIND A COURT</button>
              <button className="btn btn-primary lobby-open" onClick={onOpenCourt}>
                + OPEN A COURT
              </button>
            </div>
          </div>
          <div className="court-list">
            {LOBBY_COURTS.map((c, i) => (
              <div
                key={i}
                className="court-row"
                style={c.status === "FULL" ? { opacity: 0.55 } : {}}
              >
                <div className="code">{c.code}</div>
                <div>
                  <div className="name">{c.name}</div>
                  <div className="sub">{c.sub}</div>
                </div>
                <div className="seats">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className={"seat-dot " + (j < c.filled ? "filled" : "")}/>
                  ))}
                </div>
                <div className="stake">{c.stake}</div>
                <span
                  className="chip"
                  style={c.status === "FULL" ? {
                    background: "rgba(201,61,31,0.1)",
                    borderColor: "rgba(201,61,31,0.3)",
                    color: "var(--verm-300)",
                  } : {}}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </main>

        {/* ── Aside destra: scribe + decreti ── */}
        <aside className="lobby-right">
          <div className="right-eyebrow">· COURT SCRIBE · LAST HOUR ·</div>
          {LOBBY_SCRIBE.map((e, i) => (
            <div key={i} className="scribe-line">
              <span className="t">{e.t}</span>
              <span className="h">{e.h}</span> {e.txt}
            </div>
          ))}
          <div className="aside-divider"/>
          <div className="right-eyebrow">· DECREES ·</div>
          <div className="decree">
            <span className="amber">→</span> {LOBBY_DECREE}
          </div>
        </aside>
      </div>
    </div>
  );
};

Object.assign(window, { LobbyCard });
