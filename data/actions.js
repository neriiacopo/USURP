/* ============================================================
   USURP — Action definitions (single source of truth)
   ============================================================
   Ogni azione del gioco è definita qui. Modifica qui costi,
   guadagni, ruolo richiesto e regole di blocco — tutti i
   componenti (GameScreen, TableScreen, action bar) leggono
   da questo file.

   Mapping ruoli Coup:
     SEIZE (Tassa)       → OBA    (Duca)
     REAVE (Furto)       → KORO   (Capitano), blockable KORO/GRIOT
     EXCHANGE (Scambio)  → GRIOT  (Ambasciatore)
     STRIKE (Assassinio) → NJALA  (Assassino), blockable IYA
     AID   (Aiuto)       → blockable OBA
     INCOME (Entrata)    → no block, no challenge
     COUP  (Colpo)       → no block, no challenge; forced at 10+
   ============================================================ */

const ACTION_DEFS = {
  income: {
    id: "income", label: "INCOME", it: "RENDITA", glyph: "◐",
    cost: 0, gain: 1, kind: "base",
    role: null, blockableBy: [],
    hostile: false, challengeable: false, targeted: false,
  },
  aid: {
    id: "aid", label: "AID", it: "AIUTI INTL", glyph: "◐",
    cost: 0, gain: 2, kind: "base",
    role: null, blockableBy: ["OBA"],
    hostile: false, challengeable: false, targeted: false,
  },
  seize: {
    id: "seize", label: "SEIZE", it: "TASSAZIONE", glyph: "◐",
    cost: 0, gain: 3, kind: "claim",
    role: "OBA", blockableBy: [],
    hostile: false, challengeable: true, targeted: false,
  },
  reave: {
    id: "reave", label: "REAVE", it: "FURTO", glyph: "⊛",
    cost: 0, gain: 2, kind: "claim",
    role: "KORO", blockableBy: ["KORO", "GRIOT"],
    hostile: true, challengeable: true, targeted: true,
  },
  exchange: {
    id: "exchange", label: "EXCHANGE", it: "SCAMBIO", glyph: "⌬",
    cost: 0, gain: 0, kind: "claim",
    role: "GRIOT", blockableBy: [],
    hostile: false, challengeable: true, targeted: false,
  },
  strike: {
    id: "strike", label: "STRIKE", it: "ASSASSINIO", glyph: "⌇",
    cost: 3, gain: 0, kind: "hostile",
    role: "NJALA", blockableBy: ["IYA"],
    hostile: true, challengeable: true, targeted: true,
  },
  coup: {
    id: "coup", label: "COUP", it: "COLPO DI STATO", glyph: "⚊",
    cost: 7, gain: 0, kind: "hostile",
    role: null, blockableBy: [],
    hostile: true, challengeable: false, targeted: true,
  },
};

/* Lista ordinata, utile per iterare nell'action bar */
const ACTIONS = [
  ACTION_DEFS.income,
  ACTION_DEFS.aid,
  ACTION_DEFS.seize,
  ACTION_DEFS.reave,
  ACTION_DEFS.exchange,
  ACTION_DEFS.strike,
  ACTION_DEFS.coup,
];

Object.assign(window, { ACTION_DEFS, ACTIONS });
