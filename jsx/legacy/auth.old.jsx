/* USURP — Auth screen */
const AuthScreen = () => {
  return (
    <div className="auth-stage">
      <div className="auth-hero">
        <div className="hero-sun"><BigSun size={280} /></div>
        <div className="hero-copy">
          <h1>The Suncrown is vacant.<br/><em>Five Houses. Ten faces.</em></h1>
          <div className="tagmeta">· USURP · THE RITE OF COWRIES · A GAME FROM BCN ·</div>
        </div>
      </div>
      <div className="auth-form">
        <span className="bk-a"></span><span className="bk-b"></span>
        <div className="eyebrow">· THE COURT AWAITS ·</div>
        <h2>Declare your House.</h2>
        <div className="fld">
          <div className="lab"><span>HOUSE NAME</span><span style={{color:'var(--ink-faint)'}}>3–24 CHARS</span></div>
          <input type="text" defaultValue="ADJEI" />
        </div>
        <div className="fld">
          <div className="lab"><span>SEAL PHRASE</span><span style={{color:'var(--ink-faint)'}}>MEMORIZE</span></div>
          <input type="password" defaultValue="•••••••••••" />
        </div>
        <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'14px 18px', fontSize:'12px'}}>
          ENTER THE COURT →
        </button>
        <div className="auth-divider"><div className="line"/><span>OR</span><div className="line"/></div>
        <button className="btn btn-ghost" style={{width:'100%', justifyContent:'center', padding:'12px 18px'}}>
          ◐  CLAIM A COURT-CODE
        </button>
        <div style={{marginTop:'32px', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--ink-faint)', letterSpacing:'0.18em', textAlign:'center'}}>
          NEW TO THE RITE? · <span style={{color:'var(--sun-300)'}}>READ THE DOCTRINE</span>
        </div>
      </div>
    </div>
  );
};
Object.assign(window, { AuthScreen });
