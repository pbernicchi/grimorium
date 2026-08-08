// Chain runner. Pure orchestration over a statusMap; no DOM access.
// The caller wires UI updates via opts callbacks (onTick, onChainTick, log).

import { runLink as defaultRunLink } from "./probes.js";
import { fmtLatency } from "./state.js";

const IDENTITY = (s) => s;
// Label lookup, injected like stateLabel so this module stays DOM- and
// theme-free. Defaults reproduce the original hardcoded strings, so a caller
// that does not pass `t` behaves exactly as before.
const DEFAULT_T = (path, ...a) => ({
  "log.probing":          () => "divining…",
  "log.scanStart":        (n) => "the rite begins // " + n + " chains",
  "log.scanEnd":          (n) => "the rite concludes // " + n + " chains scryed",
  "empty.noChainsForScry": () => "no chains with links — inscribe some"
}[path] ?? (() => path))(...a);

/**
 * Run a single chain end-to-end, mutating the provided statusMap.
 * Honors chain.haltOnFail (default true): on first "bad" result, downstream
 * links get state "skipped" without being probed.
 *
 * @param {object}   chain      { id, name, links: [{ id, name, probe, target, expect }], haltOnFail? }
 * @param {Map}      statusMap  mutable; key linkId -> { state, latency, detail, ts }
 * @param {object}   opts
 * @param {number}   opts.timeoutMs
 * @param {function} [opts.onTick]   (linkId) — fires after each link status write
 * @param {function} [opts.log]      (msg, tag) — fires for progress logging
 * @param {function} [opts.runLink]  override probe runner (defaults to probes.runLink)
 */
export async function runChain(chain, statusMap, opts = {}) {
  const {
    timeoutMs = 5000,
    onTick = noop,
    log = noop,
    runLink = defaultRunLink,
    stateLabel = IDENTITY,
    t = DEFAULT_T
  } = opts;
  const now = () => Date.now();

  for (const link of chain.links) {
    statusMap.set(link.id, { state: "check", latency: null, detail: t("log.probing"), ts: now() });
    onTick(link.id);
  }

  let broke = false;
  for (let i = 0; i < chain.links.length; i++) {
    const link = chain.links[i];
    if (broke) {
      statusMap.set(link.id, { state: "skipped", latency: null, detail: "upstream link failed", ts: now() });
      onTick(link.id);
      continue;
    }
    log(chain.name + " · " + link.name + " (" + link.probe + ") " + link.target, "dim");
    const result = await runLink(link, timeoutMs);
    statusMap.set(link.id, { ...result, ts: now() });
    const tag = result.state === "ok" ? "ok"
              : result.state === "warn" ? "warn"
              : result.state === "bad" ? "bad" : "info";
    log(chain.name + " · " + link.name + " — " + stateLabel(result.state)
        + " (" + fmtLatency(result.latency) + ") " + (result.detail ?? ""), tag);
    onTick(link.id);
    if (result.state === "bad" && chain.haltOnFail !== false) broke = true;
  }
}

/**
 * Run a single link (re-probe), mutating statusMap.
 * Same opts shape as runChain.
 */
export async function rescryLink(chain, link, statusMap, opts = {}) {
  const {
    timeoutMs = 5000,
    onTick = noop,
    log = noop,
    runLink = defaultRunLink,
    stateLabel = IDENTITY,
    t = DEFAULT_T
  } = opts;
  const now = () => Date.now();
  log(chain.name + " · " + link.name + " — " + t("log.probing"), "dim");
  statusMap.set(link.id, { state: "check", latency: null, detail: t("log.probing"), ts: now() });
  onTick(link.id);
  const r = await runLink(link, timeoutMs);
  statusMap.set(link.id, { ...r, ts: now() });
  const tag = r.state === "ok" ? "ok" : r.state === "warn" ? "warn" : r.state === "bad" ? "bad" : "info";
  log(chain.name + " · " + link.name + " — " + stateLabel(r.state)
      + " (" + fmtLatency(r.latency) + ") " + (r.detail ?? ""), tag);
  onTick(link.id);
  return r;
}

/**
 * Scan many chains with bounded parallelism. Skips chains with no links.
 * Primes every link to "check" before launching probes so the UI can show
 * pending state immediately.
 *
 * @param {Array}   chains
 * @param {Map}     statusMap
 * @param {object}  opts
 * @param {number}  opts.timeoutMs
 * @param {number}  opts.parallel       max concurrent chains (1..32, default 6)
 * @param {function}[opts.onTick]       (linkId) — fires after each link status write
 * @param {function}[opts.onChainTick]  (chain)  — fires after each chain completes
 * @param {function}[opts.log]
 * @param {function}[opts.runLink]
 * @returns {Promise<{done: number, scanned: number}>}
 */
export async function scanAll(chains, statusMap, opts = {}) {
  const { parallel = 6, onChainTick = noop, log = noop, t = DEFAULT_T } = opts;
  const eligible = chains.filter(c => c.links.length > 0);
  if (!eligible.length) {
    log(t("empty.noChainsForScry"), "warn");
    return { done: 0, scanned: 0 };
  }

  log(t("log.scanStart", eligible.length), "info");

  // Prime everything to "check" so the UI shows divining state immediately.
  const now = Date.now();
  for (const c of eligible) {
    for (const l of c.links) {
      statusMap.set(l.id, { state: "check", latency: null, detail: t("log.probing"), ts: now });
    }
    onChainTick(c);
  }

  const concurrency = Math.max(1, Math.min(parallel, 32));
  const queue = [...eligible];
  let done = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const c = queue.shift();
      await runChain(c, statusMap, opts);
      done++;
      onChainTick(c);
    }
  }));

  log(t("log.scanEnd", done), "info");
  return { done, scanned: eligible.length };
}

function noop() {}
