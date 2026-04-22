/* USURP — Sigil components as React */
const Sigil = ({ name, size = 72 }) => {
  const common = { strokeWidth: 1.5, fill: "none", strokeLinecap: "round" };
  if (name === "OBA") return (
    <svg viewBox="-40 -40 80 80" width={size} height={size}>
      <g stroke="#e1b968" {...common} strokeLinecap="square">
        <circle cx="0" cy="0" r="28" opacity="0.25"/>
        <circle cx="0" cy="0" r="5" fill="#e1b968"/>
        <line x1="0" y1="-28" x2="0" y2="-10"/><line x1="18" y1="-22" x2="7" y2="-8"/>
        <line x1="27" y1="-5" x2="10" y2="-2"/><line x1="24" y1="14" x2="9" y2="5"/>
        <line x1="10" y1="26" x2="4" y2="10"/><line x1="-10" y1="26" x2="-4" y2="10"/>
        <line x1="-24" y1="14" x2="-9" y2="5"/><line x1="-27" y1="-5" x2="-10" y2="-2"/>
        <line x1="-18" y1="-22" x2="-7" y2="-8"/>
      </g>
    </svg>
  );
  if (name === "NJALA") return (
    <svg viewBox="-40 -40 80 80" width={size} height={size}>
      <g stroke="#e05a34" {...common}>
        <path d="M -24 -22 L 0 20 L 24 -22"/>
        <path d="M -14 -22 L 0 8 L 14 -22"/>
        <line x1="-28" y1="-26" x2="28" y2="-26" strokeWidth="1"/>
        <circle cx="0" cy="-26" r="2" fill="#e05a34"/>
      </g>
    </svg>
  );
  if (name === "KORO") return (
    <svg viewBox="-40 -40 80 80" width={size} height={size}>
      <g stroke="#72bfaf" {...common}>
        <path d="M -22 -20 Q -22 5 -4 9 L 14 9"/>
        <path d="M 22 -20 Q 22 5 4 9 L -14 9"/>
        <circle cx="-22" cy="-20" r="3" fill="#72bfaf"/>
        <circle cx="22" cy="-20" r="3" fill="#72bfaf"/>
        <circle cx="0" cy="9" r="3"/>
      </g>
    </svg>
  );
  if (name === "GRIOT") return (
    <svg viewBox="-40 -40 80 80" width={size} height={size}>
      <g stroke="#7d8ed8" {...common}>
        <circle cx="0" cy="0" r="26" opacity="0.3"/>
        <circle cx="0" cy="0" r="20"/>
        <path d="M 0 -14 A 14 14 0 1 1 -10 10 A 9 9 0 1 0 7 4 A 5 5 0 1 1 -1 -2"/>
        <circle cx="-1" cy="-2" r="1.5" fill="#7d8ed8"/>
      </g>
    </svg>
  );
  if (name === "IYA") return (
    <svg viewBox="-40 -40 80 80" width={size} height={size}>
      <g stroke="#f3b85c" {...common}>
        <path d="M -20 -7 A 13 13 0 0 0 -7 5"/>
        <path d="M 20 -7 A 13 13 0 0 1 7 5"/>
        <path d="M -13 15 A 13 13 0 0 0 13 15"/>
        <circle cx="0" cy="-18" r="4"/>
      </g>
    </svg>
  );
  return null;
};

const BigSun = ({ size = 280 }) => (
  <svg viewBox="-100 -100 200 200" width={size} height={size}>
    <circle cx="0" cy="0" r="82" stroke="#e1b968" strokeWidth="0.6" fill="none" opacity="0.25"/>
    <circle cx="0" cy="0" r="62" stroke="#e1b968" strokeWidth="0.6" fill="none" opacity="0.4"/>
    <circle cx="0" cy="0" r="42" stroke="#e1b968" strokeWidth="0.6" fill="none" opacity="0.5"/>
    <circle cx="0" cy="0" r="10" fill="#e1b968"/>
    <g stroke="#e1b968" strokeWidth="1.3" strokeLinecap="square">
      {Array.from({length: 9}).map((_, i) => {
        const a = (i / 9) * Math.PI * 2 - Math.PI/2;
        const x1 = Math.cos(a) * 92, y1 = Math.sin(a) * 92;
        const x2 = Math.cos(a) * 58, y2 = Math.sin(a) * 58;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}/>;
      })}
    </g>
    <g stroke="#d98324" strokeWidth="1.4" fill="none">
      <path d="M 0 -30 L 8 -8 L 30 0 L 8 8 L 0 30 L -8 8 L -30 0 L -8 -8 Z"/>
    </g>
  </svg>
);

Object.assign(window, { Sigil, BigSun });
