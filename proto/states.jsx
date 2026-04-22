/* USURP — Action States */
const StateCard = ({ name, meta, children }) => (
  <div className="state-card">
    <div className="label-strip">
      <div className="name">{name}</div>
      <div className="meta">{meta}</div>
    </div>
    <div className="content">{children}</div>
  </div>
);

const StatesScreen = () => {
  return (
    <div className="state-stage">
      <div style={{marginBottom:'20px'}}>
        <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.28em', color:'var(--sun-300)', marginBottom:'8px'}}>· FOUNDATION 06 · ACTION STATES ·</div>
        <h2 style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontWeight:500, fontSize:'44px', margin:0, color:'var(--bone-100)'}}>Four ritual moments.</h2>
        <div style={{fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--ink-faint)', letterSpacing:'0.06em', marginTop:'10px', maxWidth:'640px', lineHeight:1.6}}>
          Each climactic interaction — accusation, block, reveal, coup — plays the same four-beat rhythm: freeze → inflect → strike → settle.
        </div>
      </div>

      <div className="state-grid">
        <StateCard name="The Accusation" meta="01 · VERMILION · SHAKE · 600ms LOOP">
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
            <div className="shake-target">
              Oba
              <div className="warning">· ACCUSED ·</div>
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.22em', color:'var(--verm-300)', textTransform:'uppercase'}}>"HOUSE OKONKWO NAMES YOU A LIAR."</div>
          </div>
        </StateCard>

        <StateCard name="The Block" meta="02 · CELADON · ORB PULSE · 2s LOOP">
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
            <div className="block-orb">
              <Sigil name="IYA" size={70}/>
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.22em', color:'var(--cel-300)', textTransform:'uppercase'}}>"IYA INTERVENES. THE STRIKE IS STAYED."</div>
          </div>
        </StateCard>

        <StateCard name="The Reveal" meta="03 · SUN · FLIP · 2.6s LOOP">
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
            <div className="flip-stage">
              <div className="flip-card">
                <div className="flip-face flip-back">
                  <div className="flip-back-mark">U</div>
                </div>
                <div className="flip-face flip-front">
                  <Sigil name="OBA" size={56}/>
                  <div className="n">Oba</div>
                  <div className="s">UPHELD</div>
                </div>
              </div>
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.22em', color:'var(--sun-200)', textTransform:'uppercase'}}>"THE FACE IS UPHELD. THE ACCUSER FORFEITS."</div>
          </div>
        </StateCard>

        <StateCard name="The Coup" meta="04 · VERMILION · FLASH · 2.4s LOOP">
          <div className="coup-stage" style={{height:'220px'}}>
            <div className="coup-flash">COUP.</div>
          </div>
        </StateCard>
      </div>

      <div className="state-grid" style={{marginTop:'24px'}}>
        <StateCard name="Cowrie Transfer" meta="05 · SUN · COIN FLY · 1.8s LOOP">
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'18px'}}>
            <div className="coin-line">
              <div className="house">Ω</div>
              <div className="coin"></div>
              <div className="coin"></div>
              <div className="coin"></div>
              <div className="house">Ψ</div>
            </div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.22em', color:'var(--sun-200)', textTransform:'uppercase'}}>"HOUSE ADJEI SEIZES · ◐ +3"</div>
          </div>
        </StateCard>

        <StateCard name="Unseating" meta="06 · BONE · DISSOLVE · 1.4s ONCE">
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'18px'}}>
            <div style={{display:'flex', gap:'10px', opacity:0.6}}>
              <div className="mini-card forfeit" style={{width:56, height:82}}/>
              <div className="mini-card forfeit" style={{width:56, height:82}}/>
            </div>
            <div style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'28px', color:'var(--ink-dim)'}}>House Okonkwo — unseated.</div>
            <div style={{fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.22em', color:'var(--ink-faint)', textTransform:'uppercase'}}>· FOUR REMAIN ·</div>
          </div>
        </StateCard>
      </div>
    </div>
  );
};
Object.assign(window, { StatesScreen });
