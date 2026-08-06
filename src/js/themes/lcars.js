// LCARS theme. Star Trek TNG "Library Computer Access/Retrieval System"
// aesthetic, in the spirit of the Pi-hole LCARS skin: flat black canvas,
// solid rounded "pill" controls in the canonical LCARS palette (golden
// tanoi orange, apricot, lavender, ice blue, mars red), bold condensed
// caps, right-justified labels. Rectilinear — chains render as rounded
// panels on the default grid, not as spheres on orbits.
//
// Palette discipline: orange peel is the structural/chrome hue. State is
// carried by the LCARS secondary hues — anakiwa (online), sunflower (caution),
// chestnut rose (offline), golden tanoi (scanning), lilac (standby). No green
// and no saturated red; see the note on the palette block below.

import { hash32 } from "../state.js";
import { svg as svgEl } from "../render.js";

export const lcars = {
  id: "lcars",
  name: "LCARS",

  // Starfleet computer nomenclature.
  labels: {
    state: {
      ok:      "ONLINE",
      warn:    "CAUTION",
      bad:     "OFFLINE",
      check:   "SCANNING",
      skipped: "STANDBY",
      unk:     "NO DATA"
    },
    brand: {
      name:      "LCARS",
      sub:       "// library computer",
      pageTitle: "LCARS // library computer access"
    },
    actions: {
      scryAll:         "◉ SCAN",
      scryAllRunning:  "◉ SCANNING…",
      inscribe:        "CONFIG",
      group:           "SECTORS",
      reArrange:       "ALIGN",
      edit:            "MODIFY",
      banish:          "PURGE",
      saveApply:       "ENGAGE",
      save:            "ENGAGE",
      cancel:          "ABORT",
      close:           "CLOSE",
      bind:            "LINK",
      addChain:        "+ ADD NODE",
      addLink:         "+ ADD PROBE",
      addSigil:        "+ ADD TAG",
      rescry:          "◉ PING",
      reset:           "FACTORY RESET",
      purge:           "CLEAR",
      exportLabel:     "EXPORT",
      importLabel:     "IMPORT",
      apply:           "EXECUTE",
      trust:           "ACCESS"
    },
    nouns: {
      chain:    "node",
      chains:   "nodes",
      link:     "probe",
      links:    "probes",
      sigil:    "Tag",
      sigils:   "Tags",
      log:      "COMPUTER LOG",
      addressLabel: "Address",
      chainNameLabel: "Node ID",
      haltLabel: "Halt on Fault",
      siteSettings: "System Settings"
    },
    modalTitles: {
      inscribe:      "System Configuration",
      inscribeChain: "Configure Node",
      transcribeOut: "Export Config",
      transcribeIn:  "Import Config",
      transcribe:    "Transfer",
      sigilNew:      "New Tag",
      sigilEdit:     "Edit Tag",
      sigilDefault:  "Tag",
      trust:         "Access Authorization",
      bindSigils:    (name) => "LINK TAGS // " + name
    },
    // Topbar counters. These match the state labels exactly rather than
    // inventing a second vocabulary — a card that reads ONLINE is counted
    // under ONLINE.
    meta: {
      chains: "NODES",
      links:  "PROBES",
      up:     "ONLINE",
      down:   "OFFLINE",
      last:   "LAST SWEEP"
    },
    fields: {
      timeout:              "Probe Timeout (ms)",
      parallel:             "Parallel Probes",
      theme:                "Interface",
      name:                 "Designation",
      addressPlaceholder:   "192.168.1.10 or example.com",
      linkNamePlaceholder:  "probe designation",
      sigilNamePlaceholder: "engineering"
    },
    titles: {
      addSigil:   "Register a new tag",
      removeLink: "Remove probe"
    },
    confirmMsg: {
      banishChain: (name) => "Purge node '" + name + "'? This cannot be undone.",
      banishSigil: (name, n) => "Purge tag '" + name + "'? It will be removed from " + n + " node(s).",
      reset:       "Restore factory configuration? Node positions and tags are cleared."
    },
    empty: {
      noSigils:        "No tags registered. Create one from the rail, then return.",
      noChainsHead:    "no nodes registered.",
      pressHint:       "press CONFIG to begin.",
      noChainsForScry: "no nodes with probes — configure some",
      noLinksOnCard:   "no probes",
      noLinksInPanel:  "No probes configured. Use CONFIG to add some."
    },
    explainers: {
      chainDescription: "A node is a probe sequence — DNS → ALB → Caddy → origin. When a probe fails, downstream probes go to standby, and the row reports which probe is offline.",
      backupNote:       "Register hosts and the probes that monitor them."
    },
    log: {
      scanInFlight:  "scan already running",
      scanStart:     (n) => "scan initiated // " + n + " nodes",
      scanEnd:       (n) => "scan complete // " + n + " nodes",
      inscribed:     (chains, links) => "config saved // " + chains + " nodes, " + links + " probes",
      chainInscribed: (name) => "node configured // " + name,
      chainBanished: (name) => "node purged // " + name,
      chainBound:    (chain, sigil) => chain + " linked to " + sigil,
      sigilBound:    (name) => "tag created // " + name,
      sigilUpdated:  (name) => "tag updated // " + name,
      sigilBanished: (name) => "tag purged // " + name,
      groupingOn:    "grouping by sector",
      groupingOff:   "free placement",
      reflowed:      "sectors realigned",
      arranged:      "nodes aligned to grid",
      filterCleared: "filter cleared",
      filterActive:  (name) => "filter active // " + name,
      transcribed:   "config received // review and execute",
      awakens:       (date) => "LCARS online // " + date,
      scryHint:      "press SCAN (or spacebar) to probe all nodes",
      dragHint:      "drag nodes by their header bar — drop on a tag to link",
      sigilHint:     "drag a tag onto a node to link, click a tag to filter",
      groupHint:     "toggle SECTORS to group nodes by their first tag"
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

  // Geometric / readout glyphs. LCARS shuns pictograms in favor of solid
  // blocks, discs, and directional markers — these read as console markers
  // rather than occult or industrial symbols.
  glyphs: [
    "◉","◎","●","○","◐","◑","◒","◓","◆","◇","■","□","▪","▫",
    "▰","▱","▮","▯","▲","▶","▼","◀","⬢","⬡","⬠","⬟",
    "⊕","⊗","⊞","⊟","⊠","↻","↺","⇄","⇆","≡","∷","⌬","⏣","⎔"
  ],

  // Canonical Okuda LCARS hues mapped onto the shared var names.
  //
  // The governing constraint: LCARS has no traffic-light semantic. The TNG-era
  // palette is a narrow band of warm pastels plus two blues on black, and it
  // contains no green at all. Mapping ok->green / bad->saturated red imports a
  // convention from another design language, and because a state color fills
  // every card header, that trio ends up dominating the screen and reading as
  // primary RGB rather than as LCARS.
  //
  // So state is carried by the LCARS secondary family instead, ordered
  // cool -> warm -> hot: anakiwa (nominal), sunflower (caution), chestnut rose
  // (fault). That is both more faithful and more legible than green/red, which
  // partially collapses under deuteranopia. Every state fill keeps >= 4.4:1
  // against the black label text it carries; chestnut rose at 5.7:1 is actually
  // an improvement on the 4.3:1 the old pure red managed.
  //
  // Orange peel stays the structural chrome. The serif var is repointed at a
  // condensed sans so headings read as LCARS lettering — a full page reload on
  // theme switch restores the default elsewhere.
  palette: {
    "--bg-0":           "#000000",
    "--bg-1":           "#000000",
    "--bg-2":           "#08080c",
    "--vellum":         "#ffcc99",   // tanoi
    "--vellum-dim":     "#886699",   // muted plum (no data)
    "--ink":            "#ccddff",   // periwinkle — readout text, clear of ok
    "--ink-dim":        "#cc99cc",   // lilac
    "--ink-faint":      "#554466",   // eggplant, dimmed
    "--gold":           "#ff9900",   // orange peel — primary chrome
    "--gold-dim":       "#cc7700",
    "--gold-bright":    "#ffcc66",   // golden tanoi (scanning)
    "--amber":          "#ffcc00",   // sunflower (caution)
    "--brown":          "#cc99cc",   // lilac
    "--brown-deep":     "#664466",   // eggplant
    "--moss":           "#cc99cc",   // lilac
    "--verdant":        "#99ccff",   // anakiwa (online)
    "--verdant-bright": "#bbddff",
    "--sienna":         "#cc6666",   // chestnut rose (offline)
    "--rust":           "#cc6699",   // hopbush
    "--slate":          "#cc99cc",   // lilac (standby)
    "--slate-dim":      "#4a3a55",
    "--panel":          "rgba(0, 0, 0, 0.92)",
    "--panel-edge":     "rgba(255, 153, 0, 0.6)",
    "--serif":          "'Antonio', 'Oswald', 'Roboto Condensed', 'Helvetica Neue', 'Arial Narrow', Arial, sans-serif"
  },

  /**
   * LCARS decoration: a still, flat-black scene. No embers, no scanlines.
   * The canvas stays clear; the SVG layer scatters faint LCARS-style
   * numeric readouts ("47-296", "1701-D") and a couple of thin rule bars,
   * deterministically placed and kept at very low opacity so they back the
   * panels without competing with them.
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

    function spawnEmber() { /* lcars is still */ }
    function maybeSpawnEmber() { /* lcars is still */ }
    function tickScene() { /* lcars is still */ }

    function drawCanvas(t, dt) {
      // Flat black; just clear so any prior theme's pixels are gone.
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    function readout(seed) {
      // Deterministic LCARS-flavored readout token from a seed.
      const a = hash32("a" + seed) % 90 + 10;     // 10..99
      const b = hash32("b" + seed) % 9000 + 1000; // 1000..9999
      const suffix = ["", "-A", "-B", "-C", "-D"][hash32("c" + seed) % 5];
      const prefix = ["", "", "LCARS ", "STN ", "SEC "][hash32("p" + seed) % 5];
      return prefix + a + "-" + b + suffix;
    }

    function buildBackground() {
      while (svgRoot.firstChild) svgRoot.removeChild(svgRoot.firstChild);
      const w = window.innerWidth, h = window.innerHeight;
      svgRoot.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svgRoot.setAttribute("width", w);
      svgRoot.setAttribute("height", h);

      // A few faint full-width rule bars — the LCARS horizontal divider.
      const rules = svgEl("g");
      for (let i = 1; i <= 3; i++) {
        const y = (h * i) / 4;
        rules.appendChild(svgEl("line", {
          x1: 0, y1: y, x2: w, y2: y,
          class: "bg-sigil-stroke", "stroke-width": 0.5, opacity: 0.07
        }));
      }
      svgRoot.appendChild(rules);

      // Faint rounded "data tab" bars — the LCARS color-block motif. Solid
      // fills in the palette family, kept low-opacity so cards stay legible.
      const tabFills = ["var(--gold)", "var(--brown)", "var(--amber)", "var(--verdant)", "var(--slate)"];
      const tabs = svgEl("g");
      const tabCount = Math.round((w * h) / 260000);
      for (let i = 0; i < tabCount; i++) {
        const sx = hash32("tx" + i + "-" + w);
        const sy = hash32("ty" + i + "-" + h);
        const bw = 40 + (sx % 90);
        const x = 24 + (sx % (w - 160));
        const y = 60 + (sy % (h - 120));
        const tab = svgEl("rect", {
          x, y, width: bw, height: 12, rx: 6, ry: 6,
          fill: tabFills[sx % tabFills.length],
          opacity: 0.05 + ((sy % 40) / 2000)
        });
        tabs.appendChild(tab);
      }
      svgRoot.appendChild(tabs);

      // Scattered numeric readouts, deterministic placement, very faint.
      const layer = svgEl("g");
      const count = Math.round((w * h) / 120000);
      for (let i = 0; i < count; i++) {
        const seedX = hash32("lx" + i + "-" + w + "-" + h);
        const seedY = hash32("ly" + i + "-" + w + "-" + h);
        const x = 30 + (seedX % (w - 160));
        const y = 30 + (seedY % (h - 60));
        const size = 11 + (seedY % 7);
        const opacity = 0.05 + ((seedY % 50) / 1600);
        const tEl = svgEl("text", {
          x, y, class: "bg-readout",
          "font-size": size, opacity,
          fill: (seedX % 4 === 0) ? "var(--brown)" : "var(--gold)"
        });
        tEl.textContent = readout(i + "-" + w);
        layer.appendChild(tEl);
      }
      svgRoot.appendChild(layer);
    }

    return { sizeCanvas, spawnEmber, drawCanvas, maybeSpawnEmber, buildBackground, tickScene };
  }
};
