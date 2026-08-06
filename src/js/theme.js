// Active theme registration. A theme is a plain object with the shape:
//   {
//     id: string,
//     name: string,
//     labels: { state: { ok, warn, bad, check, skipped, unk } },
//     statusColorVar(state): string,            // CSS var() expression
//     glyphs: string[],                         // pool for sigils + decor
//     palette: { "--cssvar": "value", ... },    // applied to :root on activation
//     createDecoration(canvas, svgRoot): {      // stateful per-instance
//       sizeCanvas, spawnEmber, drawCanvas,
//       maybeSpawnEmber, buildBackground, tickScene
//     }
//   }

import { grimorium } from "./themes/grimorium.js";
import { cassette } from "./themes/cassette.js";
import { orrery } from "./themes/orrery.js";
import { lcars } from "./themes/lcars.js";

export const THEMES = Object.freeze({
  grimorium,
  cassette,
  orrery,
  lcars
});

export let activeTheme = orrery;

export function setActiveTheme(theme) {
  activeTheme = theme;
}

export function themeById(id) {
  return THEMES[id] ?? orrery;
}

/**
 * Apply a theme's palette to :root, overriding CSS custom properties.
 * Returns the previous palette values keyed by var name (useful for restore).
 */
export function applyTheme(theme, doc = globalThis.document) {
  if (!theme || !theme.palette || !doc?.documentElement) return {};
  const root = doc.documentElement;
  const prev = {};
  for (const [name, value] of Object.entries(theme.palette)) {
    prev[name] = root.style.getPropertyValue(name);
    root.style.setProperty(name, value);
  }
  if (doc.body) doc.body.dataset.theme = theme.id;
  setActiveTheme(theme);
  return prev;
}

/** Display label for a semantic state. Falls back to the raw state name. */
export function stateLabel(state, theme = activeTheme) {
  return (theme && theme.labels && theme.labels.state[state]) ?? state;
}

/**
 * Read a dotted-path label from the theme. Functions are invoked with args.
 * @param {string} path  e.g. "actions.scryAll" or "log.scanStart"
 * @param  {...any} args optional args for function-shaped labels
 */
export function t(path, ...args) {
  return tFrom(activeTheme, path, ...args);
}

/**
 * Strings that used to be hardcoded in template.html and main.js, which meant
 * every theme silently inherited the grimoire's vocabulary no matter what its
 * own labels said — "Banish", "Sigil", "Hold/Sever", "the grimoire to its
 * initial inscription". They live here so a theme can override them, and the
 * values are the originals so the grimoire/cassette/orrery wording is
 * unchanged for anyone who does not.
 */
export const BASE_LABELS = {
  meta: {
    chains: "Chains",
    links:  "Links",
    up:     "Hold",
    down:   "Sever",
    last:   "Last"
  },
  fields: {
    timeout:              "Probe Timeout (ms)",
    parallel:             "Parallel Chains",
    theme:                "Theme",
    name:                 "Name",
    addressPlaceholder:   "192.168.1.10 or example.com",
    linkNamePlaceholder:  "link name",
    sigilNamePlaceholder: "networking"
  },
  titles: {
    addSigil:   "Add a new sigil",
    removeLink: "Remove link"
  },
  empty: {
    noSigils: "No sigils yet. Create one from the shelf, then come back."
  },
  modalTitles: {
    bindSigils: (name) => "Bind sigils — " + name
  },
  confirmMsg: {
    banishChain: (name) => "Banish chain '" + name + "'? This cannot be undone.",
    banishSigil: (name, n) => "Banish sigil '" + name + "'? It will be removed from " + n + " chain(s).",
    reset:       "Reset the grimoire to its initial inscription? (clears card positions and sigils too)"
  }
};

function lookup(root, parts) {
  let v = root;
  for (const p of parts) {
    if (v == null) return undefined;
    v = v[p];
  }
  return v;
}

export function tFrom(theme, path, ...args) {
  const parts = path.split(".");
  let v = theme && theme.labels ? lookup(theme.labels, parts) : undefined;
  if (v === undefined) v = lookup(BASE_LABELS, parts);
  if (typeof v === "function") return v(...args);
  return v ?? path;
}

/**
 * Walk the document for elements marked with `data-label="path.to.string"`
 * and set their textContent from the theme. Also updates the page title from
 * theme.labels.brand.pageTitle if present.
 */
export function applyLabels(theme = activeTheme, doc = globalThis.document) {
  if (!doc) return;
  for (const el of doc.querySelectorAll("[data-label]")) {
    const path = el.dataset.label;
    const v = tFrom(theme, path);
    if (typeof v === "string") el.textContent = v;
  }
  // Placeholders are an attribute, not text, so they need their own hook.
  for (const el of doc.querySelectorAll("[data-label-placeholder]")) {
    const v = tFrom(theme, el.dataset.labelPlaceholder);
    if (typeof v === "string") el.setAttribute("placeholder", v);
  }
  const pageTitle = tFrom(theme, "brand.pageTitle");
  if (typeof pageTitle === "string" && pageTitle !== "brand.pageTitle") {
    doc.title = pageTitle;
  }
}
