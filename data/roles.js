/* ============================================================
   USURP — Role / card definitions
   ============================================================
   I 5 ruoli del gioco con nome, epiteto, abilità testuale e
   codice seriale (lore flavor). Modifica qui i testi che
   appaiono sulle carte.
   ============================================================ */

const ROLE_DEFS = {
  OBA: {
    name: "Oba",
    epithet: "THE SOVEREIGN",
    ability: "SEIZE 3 COWRIES · BLOCK AID",
    code: "M-77 · Σ",
    color: "#e1b968", // sun
  },
  NJALA: {
    name: "Njala",
    epithet: "THE FAMINE",
    ability: "STRIKE · 3 COWRIES",
    code: "M-82 · ⌇",
    color: "#e05a34", // vermilion
  },
  KORO: {
    name: "Koro",
    epithet: "THE REAVER",
    ability: "STEAL 2 COWRIES",
    code: "M-64 · ⊛",
    color: "#72bfaf", // celadon
  },
  GRIOT: {
    name: "Griot",
    epithet: "KEEPER OF NAMES",
    ability: "EXCHANGE IDENTITY",
    code: "M-55 · ⌬",
    color: "#7d8ed8", // lapis
  },
  IYA: {
    name: "Iya",
    epithet: "THE MOTHER",
    ability: "BLOCK STRIKE",
    code: "M-91 · ☽",
    color: "#f3b85c", // sun-300
  },
};

const ROLE_NAMES = ["OBA", "NJALA", "KORO", "GRIOT", "IYA"];

Object.assign(window, { ROLE_DEFS, ROLE_NAMES });
