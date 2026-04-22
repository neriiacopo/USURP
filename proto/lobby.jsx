/* USURP — Lobby */
const LobbyScreen = () => {
  const courts = [
    { code: "USU·4K2·9", name: "THE SAVANNA CUT",   sub: "HIGH STAKES · 5 SEATS", filled: 3, stake: "◐ 10 ANTE", status: "OPEN" },
    { code: "USU·7H1·3", name: "MERIDIAN PIT",      sub: "STANDARD · 4 SEATS",   filled: 4, stake: "◐ 05 ANTE", status: "FULL" },
    { code: "USU·2D8·0", name: "THE LOW RITE",      sub: "NOVICE · 3 SEATS",     filled: 1, stake: "◐ 02 ANTE", status: "OPEN" },
    { code: "USU·9F5·7", name: "DUSK CHAMBER",      sub: "BLITZ · 15s · 4 SEATS", filled: 2, stake: "◐ 05 ANTE", status: "OPEN" },
    { code: "USU·1B6·4", name: "THE BONE SEAT",     sub: "RITUAL · 6 SEATS",     filled: 5, stake: "◐ 20 ANTE", status: "OPEN" },
  ];
  return (
    <div className="lobby">
      <aside className="lobby-aside">
        <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.28em', color:'var(--ink-faint)', marginBottom:'16px', textTransform:'uppercase'}}>· HOUSE ADJEI ·</div>
        <div className="aside-item active"><span className="dot"/>THE COURTS</div>
        <div className="aside-item"><span className="dot"/>PRIVATE CIRCLE</div>
        <div className="aside-item"><span className="dot"/>CHRONICLE</div>
        <div className="aside-item"><span className="dot"/>DOCTRINE</div>
        <div className="aside-item"><span className="dot"/>TREASURY</div>
        <div style={{height:'1px', background:'var(--hairline-strong)', margin:'20px 0 16px'}}/>
        <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.24em', color:'var(--ink-dim)', marginBottom:'10px'}}>STANDING</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--ink)', lineHeight:'1.8', letterSpacing:'0.06em'}}>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>WINS</span><span style={{color:'var(--sun-300)', fontWeight:700}}>142</span></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>LOSSES</span><span style={{color:'var(--verm-300)', fontWeight:700}}>088</span></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>FACES CLAIMED</span><span style={{color:'var(--brass-300)', fontWeight:700}}>417</span></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>COWRIES</span><span style={{color:'var(--brass-300)', fontWeight:700}}>◐ 2,304</span></div>
        </div>
      </aside>

      <main className="lobby-main">
        <div className="lobby-header">
          <div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.28em', color:'var(--sun-300)', marginBottom:'6px'}}>· SEVEN COURTS CONVENE ·</div>
            <h2>The Meridian</h2>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button className="btn btn-ghost">⌕ FIND A COURT</button>
            <button className="btn btn-primary">+ OPEN A COURT</button>
          </div>
        </div>
        <div className="court-list">
          {courts.map((c, i) => (
            <div key={i} className="court-row" style={c.status==="FULL" ? {opacity:0.55} : {}}>
              <div className="code">{c.code}</div>
              <div>
                <div className="name">{c.name}</div>
                <div className="sub">{c.sub}</div>
              </div>
              <div className="seats">
                {Array.from({length: 5}).map((_, j) => (
                  <div key={j} className={"seat-dot " + (j < c.filled ? "filled":"")}/>
                ))}
              </div>
              <div className="stake">{c.stake}</div>
              <span className={"chip " + (c.status==="FULL"?"":"")} style={c.status==="FULL" ? {background:'rgba(201,61,31,0.1)', borderColor:'rgba(201,61,31,0.3)', color:'var(--verm-300)'} : {}}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </main>

      <aside className="lobby-right">
        <div className="right-eyebrow">· COURT SCRIBE · LAST HOUR ·</div>
        <div className="scribe-line"><span className="t">03:51 · MERIDIAN PIT</span><span className="h">HOUSE ONWU</span> seized the Suncrown. Three unseated.</div>
        <div className="scribe-line"><span className="t">03:42 · DUSK CHAMBER</span><span className="h">HOUSE BANDA</span> recanted — one face forfeit.</div>
        <div className="scribe-line"><span className="t">03:30 · THE BONE SEAT</span><span className="h">HOUSE KWENA</span> declared a coup. ◐ −7.</div>
        <div className="scribe-line"><span className="t">03:14 · SAVANNA CUT</span><span className="h">HOUSE TEMBO</span> upheld OBA. Accusation defeated.</div>
        <div className="scribe-line"><span className="t">02:58 · LOW RITE</span><span className="h">HOUSE DIALLO</span> unseated.</div>
        <div style={{height:'1px', background:'var(--hairline-strong)', margin:'20px 0 16px'}}/>
        <div className="right-eyebrow">· DECREES ·</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--ink)', lineHeight:'1.6', letterSpacing:'0.05em'}}>
          <span style={{color:'var(--sun-300)'}}>→</span> Season VII opens on the third moon. Ante doubled across all High Rite tables.
        </div>
      </aside>
    </div>
  );
};
Object.assign(window, { LobbyScreen });
