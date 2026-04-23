/* ============================================================
   USURP — Default player roster
   ============================================================
   "Case" di default attorno al tavolo. Modifica qui per
   cambiare nomi, cowries iniziali, mani di partenza.
   Il seat 0 è sempre "you".
   ============================================================ */

const DEFAULT_SEATS = [
  {
    id: "you", name: "HOUSE ADJEI", house: "Σ · 2 FACES",
    cowries: 7, you: true, pos: null,
    cards: [
      { role: "OBA", state: "up" },
      { role: "IYA", state: "up" },
    ],
  },
  {
    id: "kwena", name: "HOUSE KWENA", house: "Ξ · 2 FACES",
    cowries: 11, you: false, pos: "right",
    cards: [
      { role: "KORO",  state: "back" },
      { role: "GRIOT", state: "back" },
    ],
  },
  {
    id: "okonkwo", name: "HOUSE OKONKWO", house: "Ψ · 1 FACE",
    cowries: 3, you: false, pos: "tr", accused: true,
    cards: [
      { role: "GRIOT", state: "back" },
      { role: "NJALA", state: "forfeit" },
    ],
  },
  {
    id: "tembo", name: "HOUSE TEMBO", house: "Θ · 2 FACES",
    cowries: 9, you: false, pos: "top",
    cards: [
      { role: "OBA",   state: "back" },
      { role: "NJALA", state: "back" },
    ],
  },
  {
    id: "onwu", name: "HOUSE ONWU", house: "Ω · 2 FACES",
    cowries: 4, you: false, pos: "tl",
    cards: [
      { role: "KORO", state: "back" },
      { role: "IYA",  state: "back" },
    ],
  },
  {
    id: "banda", name: "HOUSE BANDA", house: "Δ · 2 FACES",
    cowries: 6, you: false, pos: "left",
    cards: [
      { role: "IYA", state: "back" },
      { role: "OBA", state: "back" },
    ],
  },
];

/* Nomi delle forme geometriche del tavolo per player count */
const SHAPE_NAMES = {
  3: "· TRIANGLE COURT · 3 HOUSES ·",
  4: "· QUADRATURE · 4 HOUSES ·",
  5: "· PENTACLE · 5 HOUSES ·",
  6: "· HEXAGONAL SEAT · 6 HOUSES ·",
};

Object.assign(window, { DEFAULT_SEATS, SHAPE_NAMES });
