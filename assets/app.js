/* MikiZip website. © 2026 Mihajlo Stojanovski. All rights reserved.
   No framework, no tracking. Reads the release from assets/release.js. */
(() => {
  "use strict";

  const R = window.MIKIZIP_RELEASE || {
    version: "1.3.1",
    base: "https://github.com/mist1985/MikiZipPublic/releases/download/v1.3.1/",
    files: {},
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    for (const kid of kids) if (kid != null) el.append(kid);
    return el;
  };
  const mb = (bytes) => (bytes / 1e6).toFixed(1) + " MB";

  /* ---------------------------------------------------------------- platforms */
  const PLATFORMS = {
    mac: { key: "mac", name: "macOS", short: "Apple silicon", detail: "Apple silicon (M1 or newer)", tab: "mac" },
    windows: { key: "windows", name: "Windows", short: "64-bit", detail: "64-bit Windows", tab: "windows" },
    "linux-x64": { key: "linux-x64", name: "Linux", short: "x86-64", detail: "x86-64 · Python 3.9+", tab: "linux" },
    "linux-arm64": { key: "linux-arm64", name: "Linux", short: "ARM64", detail: "ARM64 · Python 3.9+", tab: "linux" },
  };
  const file = (key) => R.files[key] || null;
  const url = (key) => (file(key) ? R.base + file(key).name : "https://github.com/mist1985/MikiZipPublic/releases/latest");

  function webglRenderer() {
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "";
    } catch (_) {
      return "";
    }
  }

  async function detect() {
    const ua = navigator.userAgent || "";
    const uad = navigator.userAgentData;
    const platform = (uad && uad.platform) || navigator.platform || "";
    const touchMac = /Mac/i.test(platform) && navigator.maxTouchPoints > 1; // iPadOS says "Mac"
    if ((uad && uad.mobile) || /Android|iPhone|iPad|iPod/i.test(ua) || touchMac) {
      return { os: "mobile", device: /Android/i.test(ua) ? "Android phone" : "iPhone or iPad" };
    }
    let os = "unknown";
    if (/Win/i.test(platform) || /Windows NT/i.test(ua)) os = "windows";
    else if (/Mac/i.test(platform)) os = "mac";
    else if (/CrOS/i.test(ua)) os = "chromeos";
    else if (/Linux|X11/i.test(platform + " " + ua)) os = "linux";

    let arch = "";
    if (uad && uad.getHighEntropyValues) {
      try {
        arch = (await uad.getHighEntropyValues(["architecture"])).architecture || "";
      } catch (_) { /* not allowed: fine */ }
    }
    if (!arch && /aarch64|arm64|armv8/i.test(ua)) arch = "arm";
    let intelMac = false;
    if (os === "mac") intelMac = arch === "x86" || /Intel/i.test(webglRenderer());
    return { os, arch, intelMac };
  }

  function bigButton(key, label) {
    const p = PLATFORMS[key];
    const f = file(key);
    const a = h("a", { class: "btn btn--big", href: url(key), "data-dl": key },
      h("span", { class: "btn__label" }, label || `Download for ${p.name}`),
      h("span", { class: "btn__meta" }, `v${R.version} · ${f ? mb(f.size) : ""} · ${p.detail}`));
    return a;
  }

  function otherLinks(exclude) {
    const box = $("[data-others]");
    box.replaceChildren(h("span", { class: "get__others-title" }, "Also for"));
    for (const key of Object.keys(PLATFORMS)) {
      if (exclude.includes(key)) continue;
      const p = PLATFORMS[key];
      box.append(h("a", { href: url(key), "data-dl": key }, `${p.name} · ${p.short}`));
    }
    box.append(h("a", { href: "#platforms" }, "All downloads & checksums"));
  }

  function renderHero(d) {
    const primary = $("[data-primary]");
    const note = $("[data-note]");
    primary.replaceChildren();
    note.innerHTML = "";
    let shown = [];
    if (d.os === "mac") {
      primary.append(bigButton("mac"));
      shown = ["mac"];
      note.innerHTML = d.intelMac
        ? "<b>This looks like an Intel Mac.</b> The macOS version needs Apple silicon (M1 or newer), so it won’t run here yet."
        : "Detected: <b>macOS</b>. Your Mac will ask once whether to trust it (steps below).";
    } else if (d.os === "windows") {
      primary.append(bigButton("windows"));
      shown = ["windows"];
      note.innerHTML = d.arch === "arm"
        ? "Detected: <b>Windows on ARM</b>. The 64-bit version runs through Windows 11’s built-in x64 emulation."
        : "Detected: <b>Windows</b>. No administrator rights needed.";
    } else if (d.os === "linux" || d.os === "chromeos") {
      const first = d.arch === "arm" ? "linux-arm64" : "linux-x64";
      const second = first === "linux-x64" ? "linux-arm64" : "linux-x64";
      primary.append(bigButton(first));
      const alt = bigButton(second, `${PLATFORMS[second].name} ${PLATFORMS[second].short}`);
      alt.classList.add("btn--ghost");
      alt.classList.remove("btn--big");
      primary.append(alt);
      shown = [first, second];
      note.innerHTML = d.os === "chromeos"
        ? "Detected: <b>ChromeOS</b>. MikiZip runs in the Linux development environment (Settings → Developers → Linux)."
        : `Detected: <b>Linux${d.arch ? " (" + (d.arch === "arm" ? "ARM" : "x86-64") + ")" : ""}</b>. Pick the other one if your processor differs.`;
    } else if (d.os === "mobile") {
      const link = location.href.split("#")[0];
      const copy = h("button", { class: "btn btn--big", type: "button" },
        h("span", { class: "btn__label" }, "Copy the link for your computer"),
        h("span", { class: "btn__meta" }, `MikiZip is a desktop app · v${R.version}`));
      copy.addEventListener("click", () => copyText(link, copy, "Link copied"));
      const mail = h("a", { class: "btn btn--ghost btn--small", href: `mailto:?subject=${encodeURIComponent("MikiZip download")}&body=${encodeURIComponent(link)}` }, "Email it to me");
      primary.append(copy, mail);
      note.innerHTML = `You’re on an <b>${d.device}</b>. MikiZip runs on macOS, Windows and Linux: open this page on your computer to download it.`;
    } else {
      primary.append(bigButton("mac", "macOS"), bigButton("windows", "Windows"), bigButton("linux-x64", "Linux"));
      $$(".btn", primary).forEach((b, i) => i && b.classList.add("btn--ghost"));
      shown = ["mac", "windows", "linux-x64"];
    }
    otherLinks(shown);

    // Point the install guide at the visitor's system and mark it.
    const tab = d.os === "mac" ? "mac" : d.os === "windows" ? "windows" : (d.os === "linux" || d.os === "chromeos") ? "linux" : null;
    if (tab) {
      selectTab(tab);
      const btn = $(`[data-os="${tab}"]`);
      if (btn && !$(".here", btn)) btn.append(h("span", { class: "here" }, "yours"));
    }
    renderPlatforms(d);
  }

  /* After a download starts: say what happens next, and thank them (once per visit). */
  const thanks = $("[data-thanks]");
  let thanked = false;
  try { thanked = sessionStorage.getItem("mikizip-thanked") === "1"; } catch (_) { /* private mode */ }
  function openThanks() {
    if (!thanks || thanked) return;
    thanked = true;
    try { sessionStorage.setItem("mikizip-thanked", "1"); } catch (_) { /* fine */ }
    thanks.hidden = false;
    requestAnimationFrame(() => thanks.classList.add("is-open"));
  }
  function closeThanks() {
    if (!thanks) return;
    thanks.classList.remove("is-open");
    setTimeout(() => (thanks.hidden = true), 450);
  }
  if (thanks) {
    $("[data-thanks-close]", thanks).addEventListener("click", closeThanks);
    $("[data-thanks-steps]", thanks).addEventListener("click", closeThanks);
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeThanks(); });
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-dl]");
    if (!a) return;
    selectTab(PLATFORMS[a.dataset.dl].tab);
    const note = $("[data-note]");
    if (note && a.closest(".get")) {
      note.innerHTML = `<b>Downloading ${file(a.dataset.dl) ? file(a.dataset.dl).name : "MikiZip"}.</b> Next: <a href="#install">open it, three quick steps ↓</a>`;
    }
    setTimeout(openThanks, 900); // after the browser's own download UI has appeared
  });

  /* ---------------------------------------------------------------- platform cards + checksums */
  function renderPlatforms(d) {
    const grid = $("[data-platforms]");
    const checks = $("[data-checks]");
    grid.replaceChildren();
    checks.replaceChildren();
    const yours = d.os === "mac" ? "mac" : d.os === "windows" ? "windows"
      : (d.os === "linux" || d.os === "chromeos") ? (d.arch === "arm" ? "linux-arm64" : "linux-x64") : null;
    Object.values(PLATFORMS).forEach((p, i) => {
      const f = file(p.key);
      const card = h("article", { class: "dl reveal" + (p.key === yours ? " is-yours" : ""), style: `--i:${i}` },
        p.key === yours ? h("span", { class: "dl__yours" }, "Your system") : null,
        h("h3", {}, p.key.startsWith("linux") ? `${p.name} ${p.short}` : p.name),
        h("p", {}, p.detail),
        f ? h("p", { class: "mono" }, f.name) : null,
        h("a", { class: "btn btn--small" + (p.key === yours ? "" : " btn--ghost"), href: url(p.key), "data-dl": p.key },
          `Download · ${f ? mb(f.size) : "latest"}`));
      grid.append(card);
      if (f) {
        const copy = h("button", { class: "copy", type: "button" }, "Copy");
        copy.addEventListener("click", () => copyText(f.sha256, copy, "SHA-256 copied"));
        checks.append(h("div", { class: "check" }, h("span", {}, f.name), h("span", { title: f.sha256 }, f.sha256), copy));
      }
    });
    checks.append(h("p", { class: "fine", html:
      "Check a file: <code>shasum -a 256 FILE</code> on macOS and Linux, <code>certutil -hashfile FILE SHA256</code> on Windows." }));
    observe($$(".reveal", grid));
  }

  $$("[data-release-version-text]").forEach((el) => (el.textContent = "v" + R.version));
  $$("[data-file-name]").forEach((el) => {
    const f = file(el.dataset.fileName);
    if (!f) return;
    const a = h("a", { href: url(el.dataset.fileName), "data-dl": el.dataset.fileName }, el.dataset.fileName.startsWith("linux") ? el.textContent : f.name);
    el.replaceChildren(a);
  });

  /* ---------------------------------------------------------------- tabs */
  function selectTab(os) {
    $$("[data-tabs] [role=tab]").forEach((b) => {
      const on = b.dataset.os === os;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      $("#" + b.getAttribute("aria-controls")).hidden = !on;
    });
  }
  $$("[data-tabs] [role=tab]").forEach((b, i, all) => {
    b.addEventListener("click", () => selectTab(b.dataset.os));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = all[(i + d + all.length) % all.length];
      selectTab(next.dataset.os);
      next.focus();
    });
  });
  selectTab("mac");

  /* ---------------------------------------------------------------- copy + toast */
  let toastEl;
  function toast(msg) {
    if (!toastEl) document.body.append((toastEl = h("div", { class: "toast", role: "status" })));
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }
  async function copyText(text, btn, msg) {
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add("is-done");
      toast(msg);
      setTimeout(() => btn.classList.remove("is-done"), 1600);
    } catch (_) {
      toast("Copy not allowed here. Select the text instead");
    }
  }

  /* ---------------------------------------------------------------- copyable commands */
  $$("[data-copy]").forEach((btn) => {
    // data-cmd holds what to paste: the command with a trailing space, ready for a dragged-in path.
    const cmd = $("[data-cmd]", btn.closest(".cmd")).dataset.cmd;
    btn.setAttribute("aria-label", `Copy: ${cmd.trim()}`);
    btn.addEventListener("click", async () => {
      await copyText(cmd, btn, cmd.endsWith(" ") ? `Copied “${cmd.trim()}”: now paste it and drag in your file` : `Copied “${cmd}”`);
      btn.textContent = "Copied";
      clearTimeout(btn._t);
      btn._t = setTimeout(() => (btn.textContent = "Copy"), 1600);
    });
  });
  $$(".cmds .reveal").forEach((el, i) => el.style.setProperty("--i", i));

  /* ---------------------------------------------------------------- reveal on scroll */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 })
    : null;
  function observe(els) {
    els.forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
  }
  $$(".tags .reveal").forEach((el, i) => el.style.setProperty("--i", i));
  $$(".rules .reveal").forEach((el, i) => el.style.setProperty("--i", i % 3));
  observe($$(".reveal"));

  const nav = $(".nav");
  addEventListener("scroll", () => nav.classList.toggle("is-scrolled", scrollY > 8), { passive: true });

  /* ---------------------------------------------------------------- "Just, zip it." */
  // Letters arrive wide and loose; a zipper pull then sweeps across and snaps each letter
  // tight as it passes (a tiny overshoot, like a tooth clicking in), closing the teeth behind it.
  const squeeze = $("[data-squeeze]");
  const zipper = $("[data-zipper]");
  function zipHeadline() {
    if (!squeeze || !zipper) return;
    const chars = [];
    $$(".squeeze__line", squeeze).forEach((line) => {
      const text = line.textContent;
      line.textContent = "";
      for (const c of text) {
        const span = h("span", { class: "ch" }, c === " " ? "\u00a0" : c);
        line.append(span);
        chars.push(span);
      }
    });
    if (reduced) {
      chars.forEach((c) => c.classList.add("is-zipped"));
      zipper.style.setProperty("--z", "100%");
      const card = $(".coffee--hero");
      if (card) card.classList.add("is-in");
      return;
    }
    squeeze.classList.add("is-loose", "is-hidden");
    zipper.style.setProperty("--z", "0%");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      chars.forEach((c, i) => { c.style.transitionDelay = `${i * 45}ms`; });
      squeeze.classList.remove("is-hidden");                  // 1. letters rise in, wide
      setTimeout(() => {
        chars.forEach((c) => (c.style.transitionDelay = "0ms"));
        const zr = zipper.getBoundingClientRect();
        const t0 = performance.now(), dur = 1250;
        const ease = (k) => 1 - Math.pow(1 - k, 3);
        const tick = (now) => {                                // 2. the pull sweeps, letters snap tight
          const k = Math.min(1, (now - t0) / dur);
          const x = zr.left + ease(k) * zr.width;
          zipper.style.setProperty("--z", (ease(k) * 100).toFixed(2) + "%");
          for (const c of chars) {
            if (c.classList.contains("is-zipped")) continue;
            const r = c.getBoundingClientRect();
            if (r.left + r.width * 0.5 <= x || k >= 1) {
              c.classList.add("is-zipped", "is-hit");
              setTimeout(() => c.classList.remove("is-hit"), 160);
            }
          }
          if (k < 1) requestAnimationFrame(tick);
          else {
            squeeze.classList.remove("is-loose");
            const card = $(".coffee--hero");
            if (card) setTimeout(() => card.classList.add("is-in"), 250);
          }
        };
        requestAnimationFrame(tick);
      }, 700 + chars.length * 45);
    }));
  }
  zipHeadline();

  /* ---------------------------------------------------------------- stats count up */
  const counter = "IntersectionObserver" in window && !reduced ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counter.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1100);
        el.textContent = Math.round((1 - Math.pow(1 - k, 3)) * to);
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = "0";
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 }) : null;
  if (counter) $$("[data-count]").forEach((el) => counter.observe(el));
  $$(".stats .reveal").forEach((el, i) => el.style.setProperty("--i", i));

  /* ---------------------------------------------------------------- sticky download dock */
  // Visible only while the hero's download button is off screen and the page's own
  // download / support sections are not in view: always one click away, never in the way.
  const dock = $("[data-dock]");
  if (dock && "IntersectionObserver" in window) {
    const seen = new Map();
    const update = () => {
      const heroGone = seen.get("hero") === false && scrollY > 200;
      const busy = seen.get("platforms") || seen.get("support") || seen.get("foot");
      dock.classList.toggle("is-up", heroGone && !busy);
      dock.hidden = !(heroGone && !busy);
    };
    const watch = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target.dataset.watch, e.isIntersecting);
      update();
    });
    [["hero", "[data-primary]"], ["platforms", "#platforms"], ["support", "#support"], ["foot", ".foot"]].forEach(([k, sel]) => {
      const el = $(sel);
      if (el) { el.dataset.watch = k; watch.observe(el); }
    });
    $("[data-dock-link]", dock).addEventListener("click", (e) => {
      e.preventDefault();
      $("#download").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      setTimeout(() => { const b = $("[data-primary] .btn"); if (b) b.focus({ preventScroll: true }); }, 600);
    });
  }

  /* ---------------------------------------------------------------- terminal replay */
  const term = $("[data-term]");
  const BANNER = [
    "****************************************************************************",
    "*                                                                          *",
    "*          ||\\      /||  ||  ||   //  ||  ////////  ||  ||////\\\\           *",
    "*          || \\    / ||  ||  ||  //   ||       //   ||  ||     ||          *",
    "*          ||  \\  /  ||  ||  ||<<     ||     //     ||  ||//////           *",
    "*          ||   \\/   ||  ||  ||  \\\\   ||   //       ||  ||                 *",
    "*          ||        ||  ||  ||   \\\\  ||  ////////  ||  ||                 *",
    "*                                                                          *",
    "*                         ///  Just, zip it!  \\\\\\                          *",
    "*                                                                          *",
    "@Version    " + R.version,
    "@Copyright  (c) 2026 Mihajlo Stojanovski",
    "@Contact    mihajlo.stojanovski@yahoo.com",
    "@Support    https://buymeacoffee.com/mihajlo",
    "*                           All rights reserved.                           *",
    "****************************************************************************",
  ].map((l) => (l[0] === "@" ? "*   |||  " + l.slice(1).padEnd(60) + "|||   *" : l));
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const human = (b) => (b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : b >= 1e3 ? (b / 1e3).toFixed(1) + " KB" : b + " B");
  const secs = (s) => s.toFixed(1) + "s";

  // The CLI's line since 1.3.2: a spinner that always turns, then speed + ETA once data
  // moves, or "working" + elapsed time while a step reports no progress.
  const SPIN = "|/-\\";
  let spinFrame = 0;
  function barLine(label, frac, done, total, speed, eta) {
    const width = 30;
    const filled = Math.floor(Math.round(frac * 1000) / 1000 * width);
    const spin = `<span class="c">${SPIN[spinFrame++ % 4]}</span> `;
    const tail = speed > 0 ? `${human(speed)}/s  ETA ${eta}` : `working  elapsed ${eta}`;
    return "  " + spin + label.padEnd(11) + " " +
      `<span class="c">${"█".repeat(filled)}</span><span class="d">${"░".repeat(width - filled)}</span> ` +
      `<span class="b">${(frac * 100).toFixed(1).padStart(5)}%</span>  ` +
      `${human(done)}/${human(total)}  ${tail}`;
  }

  // Two real runs recorded on 2026-09-29 (36.2 MB text file): zip, then max.
  const RUNS = [
    { cmd: "mikizip zip sample.txt", phases: [{ label: "Zipping", total: 36194404, seconds: 0.9, curve: 1 }],
      done: "✓ sample.txt.zip  1 file, 36.2 MB → 13.7 MB (62% smaller), verified, 1.0s" },
    { cmd: "mikizip max sample.txt", phases: [
        { label: "Max-zipping", total: 36194404, seconds: 21.6, curve: 1.6 },
        { label: "Checking", total: 11238881, seconds: 0.12, curve: 1 },
        { label: "Verifying", total: 36194404, seconds: 0.37, curve: 1 }],
      done: "✓ sample.txt.mkz  1 file, 36.2 MB → 11.2 MB (69% smaller), verified, 23.1s" },
  ];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lines = [];
  const paint = (live = "") => { term.innerHTML = lines.join("\n") + (live ? "\n" + live : ""); };

  function fitTerm() {
    const w = term.clientWidth - 40;
    const size = Math.max(6, Math.min(14, w / (78 * 0.6)));
    term.style.fontSize = size + "px";
  }

  async function replay() {
    fitTerm();
    addEventListener("resize", fitTerm, { passive: true });
    if (reduced) {
      lines = [`<span class="m">$</span> ${RUNS[1].cmd}`, ...BANNER.map(esc), "", `<span class="g">${esc(RUNS[1].done)}</span>`];
      return paint();
    }
    await sleep(1600);
    for (;;) {
      for (const run of RUNS) {
        lines = [];
        let typed = "";
        for (const ch of run.cmd) {
          typed += ch;
          paint(`<span class="m">$</span> ${esc(typed)}<span class="caret"></span>`);
          await sleep(45 + Math.random() * 70);
        }
        await sleep(350);
        lines.push(`<span class="m">$</span> ${esc(run.cmd)}`, ...BANNER.map(esc), "");
        paint();
        await sleep(500);
        for (const ph of run.phases) {
          const ms = Math.max(700, Math.min(4200, ph.seconds * 190)); // replayed faster than real time
          const t0 = performance.now();
          for (;;) {
            const k = Math.min(1, (performance.now() - t0) / ms);
            const frac = 1 - Math.pow(1 - k, ph.curve); // ease-out: xz slows down as its dictionary fills
            const elapsed = Math.max(0.05, k * ph.seconds);
            const done = Math.round(frac * ph.total);
            const speed = done / elapsed;
            // Nothing moved yet: the CLI shows the elapsed time instead of an estimate.
            const eta = done <= 0 ? secs(elapsed) : secs(Math.max(0, (ph.total - done) / Math.max(speed, 1)));
            paint(barLine(ph.label, frac, done, ph.total, speed, eta));
            if (k >= 1) break;
            await sleep(90);
          }
          await sleep(120);
        }
        lines.push(`<span class="g">${esc(run.done)}</span>`);
        paint(`<span class="m">$</span> <span class="caret"></span>`);
        await sleep(4200);
      }
    }
  }
  if (io) {
    const once = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { once.disconnect(); replay(); } }, { threshold: 0.2 });
    once.observe(term);
  } else replay();

  /* ---------------------------------------------------------------- go */
  // The static fallback link stays until detection finishes (a few milliseconds).
  detect().then(renderHero, () => renderHero({ os: "unknown" }));
})();
