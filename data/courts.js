/* ============================================================
   USURP — Lobby courts
   ============================================================
   Le corti (tavoli) mostrate nella lobby. Modifica qui per
   aggiungere/rimuovere/cambiare tavoli, poste, stati.
   ============================================================ */

const LOBBY_COURTS = [
  {
    code: "USU·4K2·9",
    name: "THE SAVANNA CUT",
    sub:  "HIGH STAKES · 5 SEATS",
    filled: 3,
    stake: "◐ 10 ANTE",
    status: "OPEN",
  },
  {
    code: "USU·7H1·3",
    name: "MERIDIAN PIT",
    sub:  "STANDARD · 4 SEATS",
    filled: 4,
    stake: "◐ 05 ANTE",
    status: "FULL",
  },
  {
    code: "USU·2D8·0",
    name: "THE LOW RITE",
    sub:  "NOVICE · 3 SEATS",
    filled: 1,
    stake: "◐ 02 ANTE",
    status: "OPEN",
  },
  {
    code: "USU·9F5·7",
    name: "DUSK CHAMBER",
    sub:  "BLITZ · 15s · 4 SEATS",
    filled: 2,
    stake: "◐ 05 ANTE",
    status: "OPEN",
  },
  {
    code: "USU·1B6·4",
    name: "THE BONE SEAT",
    sub:  "RITUAL · 6 SEATS",
    filled: 5,
    stake: "◐ 20 ANTE",
    status: "OPEN",
  },
];

/* Feed dello "scribe" laterale della lobby */
const LOBBY_SCRIBE = [
  { t: "03:51 · MERIDIAN PIT",   h: "HOUSE ONWU",   txt: "seized the Suncrown. Three unseated." },
  { t: "03:42 · DUSK CHAMBER",   h: "HOUSE BANDA",  txt: "recanted — one face forfeit." },
  { t: "03:30 · THE BONE SEAT",  h: "HOUSE KWENA",  txt: "declared a coup. ◐ −7." },
  { t: "03:14 · SAVANNA CUT",    h: "HOUSE TEMBO",  txt: "upheld OBA. Accusation defeated." },
  { t: "02:58 · LOW RITE",       h: "HOUSE DIALLO", txt: "unseated." },
];

/* Decreti del sistema */
const LOBBY_DECREE =
  "Season VII opens on the third moon. Ante doubled across all High Rite tables.";

/* Statistiche del giocatore in aside */
const PLAYER_STANDING = {
  wins: 142,
  losses: 88,
  facesClaimed: 417,
  cowries: 2304,
};

Object.assign(window, { LOBBY_COURTS, LOBBY_SCRIBE, LOBBY_DECREE, PLAYER_STANDING });
