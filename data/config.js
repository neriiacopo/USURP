/* ============================================================
   USURP — Global config
   ============================================================
   Valori regolabili senza toccare la logica dei componenti.
   Il pannello "Tweaks" modifica questi valori a runtime.
   ============================================================ */

/* Fasi dell'app in ordine lineare */
const PHASES = ["landing", "auth", "lobby", "court"];

/* Valori di default per animazioni e timing */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  dealDuration: 1500,   // ms — durata animazione distribuzione carte
  dealStagger:  55,     // ms — ritardo fra una carta e la successiva
  turnSeconds:  20,     // s  — durata di un turno
  sunDimDepth:  0.8,    // 0–1 — quanto si affievolisce il sole a fine turno
  autoReplayTurn: true, // auto-restart del turno per demo continua
}; /*EDITMODE-END*/

/* Intervalli accettati dagli slider del pannello Tweaks */
const TWEAK_RANGES = {
  dealDuration: { min: 600,  max: 3000, step: 100 },
  dealStagger:  { min: 30,   max: 220,  step: 5   },
  sunDimDepth:  { min: 0.2,  max: 0.95, step: 0.05 },
  turnSeconds:  { options: [10, 20, 30, 45, 60] },
};

/* Chiavi di localStorage — centralizzate per evitare typo */
const STORAGE_KEYS = {
  phase:      "usurp:home:phase",
  gameN:      "usurp:gameN",
};

/* ════════════════════════════════════════════════════════
   MAZZO — 15 carte ruolo per partita (3 per ogni ruolo).
   Variante "Coup standard": con 6 giocatori × 2 carte = 12
   carte in mano, restano 3 nel mazzo disponibili per
   l'azione EXCHANGE (pesca → sostituisci o tieni).
   Per tornare a "12 carte" strette (niente pesca) basta
   ridurre le distribuzioni qui sotto.
   ════════════════════════════════════════════════════════ */
const DECK_COMPOSITION = {
  OBA:   3,
  NJALA: 3,
  KORO:  3,
  GRIOT: 3,
  IYA:   3,
};

Object.assign(window, { PHASES, TWEAK_DEFAULTS, TWEAK_RANGES, STORAGE_KEYS, DECK_COMPOSITION });
