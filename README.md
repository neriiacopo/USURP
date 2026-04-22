# USURP — Design System

An Afrofuturist, web-based rendition of the social deduction game *Coup*, set in the **Meridian Court** — five clans warring for the Suncrown on a post-terrestrial savanna-city at the edge of a collapsing star system.

Studio: **BCN**. Product: **USURP**.

---

## Table of contents
- [What this is](#what-this-is)
- [Content fundamentals](#content-fundamentals)
- [Visual foundations](#visual-foundations)
- [Iconography & motif](#iconography--motif)
- [Lore & role system](#lore--role-system)
- [Files in this system](#files-in-this-system)

---

## What this is

USURP is a **desktop-web-first** multiplayer game of bluff, challenge, and assassination. Five roles, two hidden cards per player, a shrinking cowrie reserve at the center. Every action is an accusation in waiting.

The design system lives in **one CSS file** (`colors_and_type.css`) imported by every surface. No JS framework — just HTML + vanilla CSS + small JS islands for animation. React is used inside the prototype file for interaction logic.

**Everything ritualistic, nothing friendly.** This is a game of betrayal. The UI should feel like a ceremonial tribunal — hieratic, monospaced, carved. Never cute, never bouncy, never gamified-for-children.

---

## Content fundamentals

### Voice
- **Declarative, imperative, second-person-singular.** You do not "get coins"; you **seize cowries**. You do not "lose a card"; you **forfeit a face**.
- **Liturgical, not conversational.** Menu labels read like petitions: *DECLARE · CHALLENGE · BLOCK · REVEAL*.
- **No contractions.** "You are accused" — not "you're accused."
- **Short.** Never more than 8 words on a button. Never more than 14 on a modal header.
- **No emoji.** Glyphs only (see §Iconography).

### Terminology — canonical
| Use | Not |
|---|---|
| Cowries | Coins, gold, money |
| The Court | The lobby, the game, the match |
| A House | A player |
| Face / Face-down | Card / influence |
| Forfeit | Lose, discard |
| The Seat | The turn |
| The Reserve | The bank, the pot |
| Declare | Play, take action |
| Accuse | Challenge |
| Uphold | Reveal (truthful) |
| Recant | Reveal (bluff exposed) |

### Numerals
- Tabular monospace. Always `var(--font-mono)` + `font-variant-numeric: tabular-nums`.
- Cowrie counts render as `◐ 07` — glyph, then two-digit zero-padded count.
- Timers are `MM:SS` in mono, never a progress bar alone.

### Copy examples
- Button: `SEIZE REVENUE`, `DECLARE ASSASSINATION`, `ACCUSE THE HOUSE`
- Modal: `YOU STAND ACCUSED. UPHOLD, OR RECANT AND FORFEIT.`
- Toast: `HOUSE ADJEI RECANTED. ONE FACE FORFEIT.`
- Empty state: `THE COURT IS EMPTY. SUMMON FIVE.`

---

## Visual foundations

### Palette anchor
Warm-earthen: **clay** (umber/terracotta spectrum) as ground, **sun** (ochre/saffron) as primary accent, **vermilion** for hostile action, **celadon** for defensive/cool, **brass** for metallic highlights, **bone** for text on dark.

Background is always dark — `--clay-900` (#1a0e07) or `--clay-800`. Never white. Light surfaces only in the holo-strip or lit cowries.

### Type system
Three faces:
1. **JetBrains Mono** — primary. All UI, numerals, buttons, labels, body.
2. **Cormorant Garamond Italic** — display only. Role names, court proclamations, section titles. Never for UI chrome.
3. **Space Grotesk** — reserved for long-form prose / rules panel.

Tracking is wide (0.18em–0.28em) on any uppercase mono — this is a *ritual terminal*, not a dev terminal.

**Type scale (px):** 10 · 11 · 12 · 13 · 14 · 16 · 20 · 28 · 40 · 56 · 80. Display face starts at 40.

### Spacing & rhythm
8-pt grid. Spacing tokens `--s-1` … `--s-9` at 4, 8, 12, 16, 24, 32, 48, 64, 96. Prefer 16 / 24 / 48 for card and panel rhythm.

### Radii
Minimal. `--r-sm` (4px) for buttons and chips. `--r-card` (14px) for character cards. **Never fully rounded** except the cowrie itself.

### Shadows & glow
Shadows are black-saturated (no blue shadows on dark UI). Glows are colored (`--glow-sun`, `--glow-verm`, `--glow-cel`) and used sparingly — only on active, reveal, or hostile states.

### Hairlines
Everything is framed. Corner brackets (`.brackets`) mark ritualistic containers. Thin gold (`--brass-300` at 14% opacity) is the default hairline; 32% for emphasized frames.

### Texture
Two non-negotiable textures, both subtle:
- **Scanlines** (`.scanlines`) on screens that represent a "view" (the Court table, the reveal modal).
- **Grain** (`.grain`) on every large panel — applied at 45% opacity mix-blend-overlay. Never above 50%.

Both are SVG-inlined, no image assets required.

---

## Iconography & motif

### The four visual motifs
1. **Star charts** — faint constellation lines and dots, used as background on auth and lobby surfaces.
2. **Circuit-board traces** — thin brass lines, right-angle turns, terminating in small nodes — used as decorative divisions inside panels. Never busy — always single-weight 1px.
3. **Cowrie shells** — the currency. Rendered as gilded half-discs with a central slit. See `.cowrie` class.
4. **Adinkra-adjacent sigils** — each role has a single geometric sigil (see `assets/sigils.svg`). Drawn at 1.5px stroke. Symmetric where possible.

### Iconography rules
- **No emoji. Ever.** If a glyph is needed, it is drawn in SVG at 1.5–2px stroke in a single color.
- **Monochrome by default**, tinted by context (gold on dark panels, verm on hostile states).
- **Size grid:** 12, 16, 20, 24, 32, 48. Stroke stays 1.5px regardless of size — icons do not scale stroke.

### The wordmark
`USURP` — JetBrains Mono 800 weight, 0.24em tracking, uppercase. Always followed by a thin diagonal slash and the **Suncrown sigil** (a 9-pointed radial). See `assets/logo.svg`.

---

## Lore & role system

### The world
The Suncrown is vacant. Five clans — the Houses — contend for it through the **Rite of Cowries**: a sequence of declarations, accusations, and forfeitures. A House that forfeits both faces is unseated from the Court forever.

### The Five Houses & their operatives
Each role is re-cast as a clan-operative. Names are lore-flavored but mechanics preserved 1:1 with *Coup*.

| Role | Sigil | Ability | Replaces |
|---|---|---|---|
| **OBA** — The Sovereign | Nine-pointed sun | Seize 3 cowries (tax) | Duke |
| **NJALA** — The Famine | Downward blade | Pay 3 to strike (assassinate) | Assassin |
| **KORO** — The Reaver | Crossed hooks | Steal 2 cowries | Captain |
| **GRIOT** — The Keeper of Names | Circled spiral | Exchange identity | Ambassador |
| **IYA** — The Mother | Three-crescent | Block a strike | Contessa |

### Universal actions (no role required)
- **INCOME** — take 1 cowrie (cannot be blocked)
- **FOREIGN AID** — take 2 cowries (blockable by OBA)
- **COUP** — spend 7 cowries, force an opponent to forfeit a face (unblockable)

At 10+ cowries, COUP is mandatory on the Seat.

---

## Files in this system

| File | What it is |
|---|---|
| `colors_and_type.css` | All tokens. Import once per HTML file. |
| `index.html` | Design-system overview — covers all the preview cards |
| `type.html`, `colors.html`, `spacing.html`, `components.html`, `brand.html` | Individual preview cards for the design-system tab |
| `prototype.html` | Clickable prototype: auth → lobby → table → action states |
| `assets/logo.svg`, `assets/sigils.svg`, `assets/constellations.svg` | Brand marks |
| `SKILL.md` | Skill documentation for re-using this system on future work |

---

## Quick start
```html
<link rel="stylesheet" href="colors_and_type.css">
<body class="grain">
  <div class="panel brackets"><span class="bk-a"></span><span class="bk-b"></span>
    <h1 class="t-display">The Court convenes.</h1>
  </div>
</body>
```
