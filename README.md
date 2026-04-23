# USURP — The Rite of Cowries

Gioco React (stile Coup) con 4 fasi: **landing → auth → lobby → court**.
Setup senza build: apri `index.html` nel browser e parte.

---

## Struttura del progetto

```
usurp/
├── index.html              Shell HTML: solo <link> ai CSS e <script> ai JSX
├── README.md               Questo file
│
├── data/                   ← DATI (modifica qui per cambiare il contenuto)
│   ├── config.js           Fasi dell'app, tweaks di default, chiavi storage
│   ├── actions.js          Le 7 azioni del gioco (INCOME, AID, SEIZE, …)
│   ├── roles.js            I 5 ruoli/carte (OBA, NJALA, KORO, GRIOT, IYA)
│   ├── players.js          Roster default delle case (seat 0 = "you")
│   └── courts.js           Lista corti della lobby + scribe + decreto
│
├── css/                    ← STILI
│   ├── tokens.css          Design tokens (colori, font, bottoni base)
│   ├── prototype.css       Stili dei prototipi iniziali (screens vecchi)
│   ├── game.css            HUD, rack azioni, scribe rail (GameScreen)
│   └── home/               home.css originale spezzato per funzione
│       ├── stage.css       Background, hero, nav, court container
│       ├── floaters.css    Regole comuni a auth-card e lobby-card + fade
│       ├── auth.css        Scheda login
│       ├── lobby.css       Scheda lobby (3 colonne, lista corti)
│       ├── deal.css        Animazione distribuzione carte + sun-dim
│       ├── tweaks.css      Pannello tweaks + phase strip (dev)
│       ├── atmosphere.css  Costellazioni, orbite, motes (court)
│       ├── arena.css       Layout radiale avversari, turn highlight
│       └── fx.css          Action banner, coin flow, flash, exchange
│
└── jsx/                    ← COMPONENTI REACT
    ├── sigils.jsx          Sigilli SVG (OBA/NJALA/KORO/GRIOT/IYA + BigSun)
    ├── table.jsx           TableScreen (motore di gioco, 712 righe)
    ├── tweaks.jsx          TweaksPanel + PhaseStrip (dev)
    ├── app.jsx             Root App, phase state machine, mount
    ├── screens/
    │   ├── stage.jsx       Stage persistente (hero + court + nav)
    │   ├── auth.jsx        AuthCard fluttuante (login)
    │   └── lobby.jsx       LobbyCard fluttuante (lista corti)
    └── legacy/             Prototipi non più montati, preservati per riferimento
        ├── game.jsx        GameScreen alternativo (poligono)
        ├── states.jsx      StatesScreen (4 momenti rituali)
        ├── auth.old.jsx    Versione vecchia di AuthScreen
        └── lobby.old.jsx   Versione vecchia di LobbyScreen
```

---

## Cosa modificare per…

### Cambiare il costo o il guadagno di un'azione
`data/actions.js` → modifica `cost` o `gain` dell'azione.
Esempio: per rendere SEIZE più potente, imposta `gain: 4` in `seize`.

### Aggiungere un nuovo tavolo in lobby
`data/courts.js` → aggiungi un oggetto in `LOBBY_COURTS`.

### Cambiare i nomi delle case o i cowries iniziali
`data/players.js` → modifica `DEFAULT_SEATS`.

### Cambiare il testo delle carte (abilità, epiteto)
`data/roles.js` → modifica `ROLE_DEFS.OBA.ability`, ecc.

### Cambiare le animazioni di default
`data/config.js` → `TWEAK_DEFAULTS` (si può anche fare a runtime dal pannello Tweaks).

### Cambiare il look di uno schermo
- Auth → `css/home/auth.css`
- Lobby → `css/home/lobby.css`
- Court (tavolo) → `css/home/arena.css` + `css/home/fx.css`
- Sfondo/atmosfera → `css/home/atmosphere.css`

### Aggiungere un nuovo screen
1. Crea `jsx/screens/nuovo.jsx` con `Object.assign(window, { NuovoScreen });` in fondo.
2. Aggiungi `<link>` CSS in `index.html` se serve.
3. Aggiungi `<script type="text/babel" src="jsx/screens/nuovo.jsx">` in `index.html` **prima** di `jsx/app.jsx`.
4. Aggiungi la fase in `data/config.js` → `PHASES`.
5. In `jsx/app.jsx` gestisci il mount della card.

---

## Ordine di caricamento (critico)

I file JSX non usano `import`/`export`: condividono le variabili via `window`.
L'ordine in `index.html` **conta**:

1. `data/*.js` — costanti pure, nessuna dipendenza
2. `jsx/sigils.jsx` — Sigil e BigSun
3. `jsx/table.jsx` — TableScreen (usa Sigil, ACTION_DEFS)
4. `jsx/screens/*.jsx` — usano TableScreen, BigSun, dati
5. `jsx/tweaks.jsx` — usa TWEAK_RANGES, PHASES
6. `jsx/app.jsx` — usa tutto quanto sopra e monta su `#root` (deve essere **ultimo**)

---

## Comandi utili (durante dev)

| Tasto | Azione |
|-------|--------|
| `ESC` | Reset alla fase `landing` |
| `↵ Enter` (in auth) | Procedi a lobby |
| Click fase (strip in basso) | Salta a quella fase |

Il pannello **Tweaks** appare se l'host iframe manda `__activate_edit_mode`.

---

## Note sulla riorganizzazione

- **`home.css` da 2132 righe è stato spezzato in 9 file** (`css/home/*.css`) per funzione; ogni blocco di commento `/* ─── ... ─── */` dell'originale corrisponde a un file.
- **I dati sono stati estratti** da `index.html`/`table.jsx`/`game.jsx` in `data/*.js`. Prima la lista corti era inline in `index.html` (riga 279-320); ora è in `data/courts.js`.
- **Duplicazioni unificate**: `ACTIONS` (game.jsx) e `ACTION_DEFS` (table.jsx) erano due definizioni diverse delle stesse 7 azioni. Ora c'è **una sola** in `data/actions.js` che espone entrambi i formati.
- **I componenti inline nell'`index.html` originale** (Stage, AuthCard, LobbyCard, TweaksPanel, PhaseStrip, App) sono ora file separati in `jsx/screens/` e `jsx/`.
- **`table.jsx` non è stato refattorizzato** (resta il mega-componente da 712 righe). Per spezzarlo servirebbe la "riorganizzazione profonda": estrarre turn engine, IA, animazioni monete, overlay in hook/moduli separati.
