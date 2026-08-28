// Picard-era LCARS ("Titan"). The 2399/Titan-A revision of LCARS, as drawn by
// the Master Systems Display at mewho.com/lab/titanEPS_1. It is a genuinely
// different design language from the TNG theme in ./lcars.js, not a recolor:
//
//   TNG (lcars.js)          Picard (this file)
//   ------------------      --------------------------------
//   warm pastels on black   cool slate blues, coral accent
//   solid filled blocks     hairline outlines over dark panels
//   black text on bright    bright text on near-black
//   fat pill radii (16px+)  near-square corners (source uses rx:1)
//   wide tracking (0.34em)  tight, near-zero tracking
//   matte, no glow          faint backlit bloom (the source's --glare)
//
// Palette is lifted from the display's own CSS custom properties. Three ramps
// plus an alert set:
//
//   gray   #1E2229 #2F3749 #52596E #6D748C #9EA5BA #DFE1E8   structure, text
//   cyan   #002241 #1C3C55 #2A7193 #37A6D1 #67CAF0           data readouts
//   orange #EF1D10 #E7442A #FF6753 #FF977B                   active / hot
//   alert  #bf1c1c #d82f2f #f84b4b #ff7f7f                   red alert
//
// The governing logic of the source: structure is slate at rest, coral when
// active; cyan carries data; white is emphasis. State is mapped onto that
// rather than onto a traffic light, same reasoning as the TNG theme.
//
// Typeface is Antonio, which lcars.js already inlines into styles.css, so this
// theme adds no font bytes.

import { hash32 } from "../state.js";
import { svg as svgEl } from "../render.js";

export const titan = {
  id: "titan",
  name: "LCARS (Picard)",

  // 2399 Starfleet engineering nomenclature. Deliberately distinct from the
  // TNG theme's vocabulary so the two themes do not read as the same skin.
  labels: {
    state: {
      ok:      "NOMINAL",
      warn:    "DEGRADED",
      bad:     "FAULT",
      check:   "TRACING",
      skipped: "HOLDING",
      unk:     "NO SIGNAL"
    },
    brand: {
      name:      "LCARS",
      sub:       "// eps systems display",
      pageTitle: "LCARS // eps systems display"
    },
    actions: {
      scryAll:         "◆ TRACE ALL",
      scryAllRunning:  "◆ TRACING…",
      inscribe:        "SYSTEMS",
      group:           "SECTIONS",
      reArrange:       "ALIGN",
      edit:            "MODIFY",
      banish:          "DECOUPLE",
      saveApply:       "COMMIT",
      save:            "COMMIT",
      cancel:          "DISCARD",
      close:           "CLOSE",
      bind:            "ASSIGN",
      addChain:        "+ ADD SUBSYSTEM",
      addLink:         "+ ADD TRACE",
      addSigil:        "+ ADD SECTION",
      rescry:          "◆ RETRACE",
      reset:           "RESTORE DEFAULTS",
      purge:           "CLEAR",
      exportLabel:     "EXPORT",
      importLabel:     "IMPORT",
      apply:           "COMMIT",
      trust:           "ACCESS"
    },
    nouns: {
      chain:    "subsystem",
      chains:   "subsystems",
      link:     "trace",
      links:    "traces",
      sigil:    "Section",
      sigils:   "Sections",
      log:      "SYSTEMS LOG",
      addressLabel: "Address",
      chainNameLabel: "Subsystem",
      haltLabel: "Halt on Fault",
      siteSettings: "Display Settings"
    },
    modalTitles: {
      inscribe:      "Systems Configuration",
      inscribeChain: "Configure Subsystem",
      transcribeOut: "Export Configuration",
      transcribeIn:  "Import Configuration",
      transcribe:    "Transfer",
      sigilNew:      "New Section",
      sigilEdit:     "Edit Section",
      sigilDefault:  "Section",
      trust:         "Access Authorization",
      bindSigils:    (name) => "ASSIGN SECTIONS // " + name
    },
    // Counters mirror the state labels exactly — a row reading NOMINAL is
    // counted under NOMINAL.
    meta: {
      chains: "SUBSYSTEMS",
      links:  "TRACES",
      up:     "NOMINAL",
      down:   "FAULT",
      last:   "LAST TRACE"
    },
    fields: {
      timeout:              "Trace Timeout (ms)",
      parallel:             "Parallel Traces",
      theme:                "Display",
      name:                 "Designation",
      addressPlaceholder:   "192.168.1.10 or example.com",
      linkNamePlaceholder:  "trace designation",
      sigilNamePlaceholder: "engineering"
    },
    titles: {
      addSigil:   "Register a new section",
      removeLink: "Remove trace"
    },
    confirmMsg: {
      banishChain: (name) => "Decouple subsystem '" + name + "'? This cannot be undone.",
      banishSigil: (name, n) => "Delete section '" + name + "'? It will be removed from " + n + " subsystem(s).",
      reset:       "Restore default configuration? Subsystem positions and sections are cleared."
    },
    empty: {
      noSigils:        "No sections registered. Create one from the rail, then return.",
      noChainsHead:    "no subsystems registered.",
      pressHint:       "press SYSTEMS to begin.",
      noChainsForScry: "no subsystems with traces — configure some",
      noLinksOnCard:   "no traces",
      noLinksInPanel:  "No traces configured. Use SYSTEMS to add some."
    },
    explainers: {
      chainDescription: "A subsystem is an ordered trace — DNS → ALB → Caddy → origin. When a trace faults, everything downstream holds, and the row reports which trace failed.",
      backupNote:       "Register hosts and the traces that monitor them."
    },
    log: {
      probing:       "tracing…",
      scanInFlight:  "trace already running",
      scanStart:     (n) => "trace initiated // " + n + " subsystems",
      scanEnd:       (n) => "trace complete // " + n + " subsystems",
      inscribed:     (chains, links) => "config committed // " + chains + " subsystems, " + links + " traces",
      chainInscribed: (name) => "subsystem configured // " + name,
      chainBanished: (name) => "subsystem decoupled // " + name,
      chainBound:    (chain, sigil) => chain + " assigned to " + sigil,
      sigilBound:    (name) => "section created // " + name,
      sigilUpdated:  (name) => "section updated // " + name,
      sigilBanished: (name) => "section deleted // " + name,
      groupingOn:    "grouping by section",
      groupingOff:   "free placement",
      reflowed:      "sections realigned",
      arranged:      "subsystems aligned to grid",
      filterCleared: "filter cleared",
      filterActive:  (name) => "filter active // " + name,
      transcribed:   "config received // review and commit",
      awakens:       (date) => "LCARS online // " + date,
      scryHint:      "press TRACE ALL (or spacebar) to trace all subsystems",
      dragHint:      "drag subsystems by their header bar — drop on a section to assign",
      sigilHint:     "drag a section onto a subsystem to assign, click a section to filter",
      groupHint:     "toggle SECTIONS to group subsystems by their first section"
    }
  },

  statusColorVar(state) {
    switch (state) {
      case "ok":      return "var(--verdant)";
      case "warn":    return "var(--amber)";
      case "bad":     return "var(--sienna)";
      case "check":   return "var(--gold-bright)";
      case "skipped": return "var(--slate)";
      default:        return "var(--vellum-dim)";
    }
  },

  // Thin geometric markers. The Picard-era display leans on outlined shapes,
  // diamonds and hairline rules where TNG used solid discs and blocks.
  glyphs: [
    "◆","◇","◈","▣","▢","▤","▥","▦","▧","▨","▩",
    "◧","◨","◩","◪","⬒","⬓","⬔","⬕","⟡","⟐","⌗",
    "⊹","⋄","⌸","⌹","⌺","⌻","⌼","⎊","⎉","⏢","⏥",
    "⇱","⇲","⇴","⊚","⊛","≣","⋮","⋯"
  ],

  // Mapped from the Titan display's own ramps. State escalates cool -> warm
  // -> alert: cyanLighter (nominal), orangeLight (degraded), red-alert bright
  // (fault). Every one clears 4.5:1 against the panel ground, measured:
  // #67CAF0 10.5, #FF977B 9.3, #F84B4B 5.7, #DFE1E8 15.0, #9EA5BA 8.0.
  //
  // Structural chrome follows the source's logic rather than TNG's: slate at
  // rest (--gold-dim), coral when active (--gold). That inversion is why this
  // reads as Picard and not as a blue TNG.
  palette: {
    "--bg-0":           "#05070b",
    "--bg-1":           "#05070b",
    "--bg-2":           "#0a0c12",
    "--vellum":         "#dfe1e8",   // grayLightest — brightest readout
    "--vellum-dim":     "#6d748c",   // grayLight (no signal)
    "--ink":            "#9ea5ba",   // grayLighter — body text
    "--ink-dim":        "#6d748c",   // grayLight
    "--ink-faint":      "#2f3749",   // grayDark
    "--gold":           "#ff6753",   // orange — active chrome
    "--gold-dim":       "#2f3749",   // grayDark — chrome at rest
    "--gold-bright":    "#dfe1e8",   // grayLightest (tracing / highlight)
    "--amber":          "#ff977b",   // orangeLight (degraded)
    "--brown":          "#2a7193",   // cyan — secondary chrome
    "--brown-deep":     "#1c3c55",   // cyanDark
    "--moss":           "#37a6d1",   // cyanLight
    "--verdant":        "#67caf0",   // cyanLighter (nominal)
    "--verdant-bright": "#a8e2ff",   // cyan ramp extended one stop for hover
    "--sienna":         "#f84b4b",   // red alert bright (fault)
    "--rust":           "#e7442a",   // orangeDark
    "--slate":          "#9ea5ba",   // grayLighter (holding)
    "--slate-dim":      "#2f3749",   // grayDark
    "--panel":          "rgba(5, 7, 11, 0.94)",
    "--panel-edge":     "rgba(255, 103, 83, 0.5)",
    "--serif":          "'Antonio', 'Oswald', 'Roboto Condensed', 'Helvetica Neue', 'Arial Narrow', Arial, sans-serif"
  },

  /**
   * Picard-era decoration: a still EPS schematic behind the panels. The canvas
   * stays clear (no embers, no scanlines); the SVG layer draws the three
   * motifs the source display is built from — a hairline graticule, stacked
   * "alert bar" strips, and numeric conduit callouts. All deterministic and
   * very low opacity, so it backs the cards without competing with them.
   */
  createDecoration(canvas, svgRoot) {
    const ctx = canvas.getContext("2d", { alpha: true });
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    function sizeCanvas() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnEmber() { /* titan is still */ }
    function maybeSpawnEmber() { /* titan is still */ }
    function tickScene() { /* titan is still */ }

    function drawCanvas() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    // Deterministic conduit designation. Titan-A is NCC-80102, so the
    // callouts read as EPS junctions and deck references on that hull.
    function readout(seed) {
      const kind = hash32("k" + seed) % 4;
      const a = hash32("a" + seed) % 90 + 10;
      const b = hash32("b" + seed) % 9000 + 1000;
      if (kind === 0) return "EPS " + a + "-" + b;
      if (kind === 1) return "DECK " + (hash32("d" + seed) % 17 + 1);
      if (kind === 2) return "JCT " + b;
      return "NCC-80102";
    }

    function buildBackground() {
      while (svgRoot.firstChild) svgRoot.removeChild(svgRoot.firstChild);
      const w = window.innerWidth, h = window.innerHeight;
      svgRoot.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svgRoot.setAttribute("width", w);
      svgRoot.setAttribute("height", h);

      // Graticule: a hairline instrument grid. Every fourth line is a major
      // division, which is what keeps it reading as a measuring surface
      // rather than as graph paper.
      const grid = svgEl("g");
      const step = 120;
      let n = 0;
      for (let x = step; x < w; x += step, n++) {
        grid.appendChild(svgEl("line", {
          x1: x, y1: 0, x2: x, y2: h,
          stroke: "var(--brown-deep)", "stroke-width": 1,
          opacity: n % 4 === 0 ? 0.34 : 0.14
        }));
      }
      n = 0;
      for (let y = step; y < h; y += step, n++) {
        grid.appendChild(svgEl("line", {
          x1: 0, y1: y, x2: w, y2: y,
          stroke: "var(--brown-deep)", "stroke-width": 1,
          opacity: n % 4 === 0 ? 0.34 : 0.14
        }));
      }
      svgRoot.appendChild(grid);

      // Alert bars: stacked hairline strips, filled slate and stroked one
      // stop darker — the #alertBars motif, which is what gives the source
      // its layered-instrument texture.
      // Placed on a jittered grid rather than by raw hash — pure hashing
      // clumps them into one corner at typical viewport sizes.
      const bars = svgEl("g");
      const cols = Math.max(2, Math.round(w / 460));
      const rowsOfStacks = Math.max(1, Math.round(h / 420));
      const stacks = cols * rowsOfStacks;
      const cellW = w / cols, cellH = h / rowsOfStacks;
      for (let s = 0; s < stacks; s++) {
        const sx = hash32("bx" + s + "-" + w);
        const sy = hash32("by" + s + "-" + h);
        const x = Math.round((s % cols) * cellW + 30 + (sx % Math.max(1, cellW / 3)));
        const y = Math.round(Math.floor(s / cols) * cellH + 70 + (sy % Math.max(1, cellH / 3)));
        const bw = 90 + (sx % 70);
        const rows = 5 + (sy % 6);
        for (let r = 0; r < rows; r++) {
          bars.appendChild(svgEl("rect", {
            x, y: y + r * 9, width: bw, height: 5, rx: 1, ry: 1,
            fill: "var(--slate-dim)",
            stroke: "var(--brown-deep)", "stroke-width": 1,
            opacity: 0.5 - r * 0.03
          }));
        }
      }
      svgRoot.appendChild(bars);

      // Conduit callouts, cyan with the occasional coral one — the source's
      // ratio, where warm marks the few active runs.
      const layer = svgEl("g");
      const count = Math.round((w * h) / 150000);
      for (let i = 0; i < count; i++) {
        const seedX = hash32("tx" + i + "-" + w + "-" + h);
        const seedY = hash32("ty" + i + "-" + w + "-" + h);
        const x = 30 + (seedX % Math.max(1, w - 170));
        const y = 30 + (seedY % Math.max(1, h - 60));
        const tEl = svgEl("text", {
          x, y, class: "bg-readout",
          "font-size": 10 + (seedY % 5),
          opacity: 0.05 + ((seedY % 40) / 1400),
          fill: (seedX % 6 === 0) ? "var(--gold)" : "var(--moss)"
        });
        tEl.textContent = readout(i + "-" + w);
        layer.appendChild(tEl);
      }
      svgRoot.appendChild(layer);
    }

    return { sizeCanvas, spawnEmber, drawCanvas, maybeSpawnEmber, buildBackground, tickScene };
  }
};
