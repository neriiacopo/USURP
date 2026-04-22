/* USURP — Game Table */
const PlayerCard = ({ role, forfeit }) => {
  const abilities = {
    OBA:   { n: "Oba",   s: "THE SOVEREIGN", a: "SEIZE 3 COWRIES · BLOCK AID", code: "M-77 · Σ" },
    NJALA: { n: "Njala", s: "THE FAMINE",    a: "STRIKE · 3 COWRIES",          code: "M-82 · ⌇" },
    KORO:  { n: "Koro",  s: "THE REAVER",    a: "STEAL 2 COWRIES",             code: "M-64 · ⊛" },
    GRIOT: { n: "Griot", s: "KEEPER OF NAMES",a: "EXCHANGE IDENTITY",           code: "M-55 · ⌬" },
    IYA:   { n: "Iya",   s: "THE MOTHER",    a: "BLOCK STRIKE",                code: "M-91 · ☽" },
  };
  const d = abilities[role];
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

const Opponent = ({ pos, name, house, cowries, cards, seated, accused }) => (
  <div className={"opp " + pos + (seated ? " seated" : "")}>
    <div className="opp-cards">
      {cards.map((c, i) => <div key={i} className={"mini-card" + (c === "forfeit" ? " forfeit" : "")}/>)}
    </div>
    <div className="opp-name">{name}</div>
    <div className="opp-sub">{house}</div>
    <div className="opp-cowries"><span className="sym"/>{String(cowries).padStart(2,'0')}</div>
    {accused && <div style={{position:'absolute', bottom:-20, fontFamily:'var(--font-mono)', fontSize:'9px', letterSpacing:'0.22em', color:'var(--verm-300)'}}>· ACCUSED ·</div>}
  </div>
);

const TableScreen = ({ role1 = "OBA", role2 = "NJALA", pile = 28 }) => {
  return (
    <div className="table-stage">
      <div className="table-arena">
        <div className="round-label">· ROUND 04 · THE SEAT TURNS ·</div>
        <div className="turn-banner"><span className="ring"/>THE SEAT · HOUSE ADJEI · 00:24</div>

        <Opponent pos="tl"    name="HOUSE ONWU"    house="Ω · 2 FACES"   cowries={4}  cards={["back","back"]} seated={false} accused={false}/>
        <Opponent pos="top"   name="HOUSE TEMBO"   house="Θ · 2 FACES"   cowries={9}  cards={["back","back"]} seated={false} accused={false}/>
        <Opponent pos="tr"    name="HOUSE OKONKWO" house="Ψ · 1 FACE"    cowries={3}  cards={["back","forfeit"]} seated={false} accused={true}/>
        <Opponent pos="left"  name="HOUSE BANDA"   house="Δ · 2 FACES"   cowries={6}  cards={["back","back"]} seated={false} accused={false}/>
        <Opponent pos="right" name="HOUSE KWENA"   house="Ξ · 2 FACES"   cowries={11} cards={["back","back"]} seated={false} accused={false}/>

        <div className="reserve">
          <div className="pile"><div className="n">◐ {pile}</div></div>
          <div className="lab">· THE RESERVE ·</div>
        </div>
      </div>

      <div className="hand-rack">
        <div className="hand-left player-panel">
          <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.26em', color:'var(--sun-300)', marginBottom:'6px'}}>· YOUR HOUSE ·</div>
          <h3 className="title">Adjei, the Morning</h3>
          <div className="cowries-big">
            <span className="sym"/>
            <span className="val">◐ 07</span>
            <span className="lab">COWRIES</span>
          </div>
          <div style={{marginTop:'12px', display:'flex', gap:'8px'}}>
            <span className="chip" style={{background:'rgba(62,138,122,0.12)', borderColor:'rgba(62,138,122,0.3)', color:'var(--cel-300)'}}>2 FACES</span>
            <span className="chip">SEATED</span>
          </div>
        </div>

        <div className="hand-cards">
          <PlayerCard role={role1}/>
          <PlayerCard role={role2}/>
        </div>

        <div className="hand-right actions-dock">
          <div className="eyebrow"><span>· DECLARE ·</span><span style={{color:'var(--ink-faint)'}}>00:24</span></div>
          <div className="actions-grid">
            <button className="act"><span className="glyph">◐</span>INCOME · 1</button>
            <button className="act"><span className="glyph">◐</span>AID · 2</button>
            <button className="act seize"><span className="glyph">◐</span>SEIZE · 3</button>
            <button className="act"><span className="glyph">⊛</span>REAVE · 2</button>
            <button className="act strike"><span className="glyph">⌇</span>STRIKE · 3</button>
            <button className="act coup"><span className="glyph">⚊</span>COUP · 7</button>
          </div>
          <div style={{marginTop:'12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
            <button className="act" style={{padding:'10px'}}><span className="glyph" style={{fontSize:'14px'}}>⌬</span>EXCHANGE</button>
            <button className="act" style={{padding:'10px'}}><span className="glyph" style={{fontSize:'14px'}}>☽</span>BLOCK</button>
          </div>
        </div>
      </div>
    </div>
  );
};
Object.assign(window, { TableScreen, PlayerCard, Opponent });
