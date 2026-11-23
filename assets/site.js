/* Custom Apps: a one-page site. Views swap in place (no page reloads),
   reveals and previews run only while visible. No libraries. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const views = new Map($$(".view").map((v) => [v.dataset.view, v]));
  const tabs = $(".tabs");
  const pill = $(".tab-pill");
  const titles = { home: "Custom Apps · five little Mac apps" };
  let current = null;

  // ---------- Router: #stash, #stash/use ----------
  function parse() {
    const [view, anchor] = location.hash.replace(/^#\/?/, "").split("/");
    return { view: views.has(view) ? view : "home", anchor };
  }

  function show(name, anchor, animate) {
    const view = views.get(name);
    if (name !== current) {
      // When switching views, the crossfade animates the top of the page by itself.
      if (animate) $$("section:first-child .rv", view).forEach((el) => el.classList.add("in", "now"));
      const swap = () => {
        views.forEach((v) => v.classList.toggle("active", v === view));
        document.body.dataset.app = view.dataset.app || "";
        document.title = titles[name] || `${view.dataset.title} · Custom Apps`;
        current = name;
        markTab(name);
        if (!anchor) scrollTo(0, 0);
      };
      if (animate && !reduce && document.startViewTransition) {
        document.startViewTransition(swap);
      } else {
        swap();
        if (animate && !reduce) { view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter"); }
      }
    }
    if (anchor) requestAnimationFrame(() => document.getElementById(`${name}-${anchor}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));
  }

  function markTab(name) {
    const appTab = views.get(name)?.dataset.app ? name : name === "home" ? "home" : null;
    let active = null;
    $$("a", tabs).forEach((a) => {
      const on = a.dataset.go === appTab;
      a.toggleAttribute("aria-current", on);
      if (on) { a.setAttribute("aria-current", "page"); active = a; }
    });
    movePill(active);
  }

  function movePill(a) {
    if (!a) { pill.style.width = "0px"; return; }
    pill.style.width = a.offsetWidth + "px";
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
    // Keep the active tab in view on small screens.
    const left = a.offsetLeft - tabs.clientWidth / 2 + a.offsetWidth / 2;
    tabs.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }

  addEventListener("hashchange", () => { const r = parse(); show(r.view, r.anchor, true); });
  addEventListener("resize", () => movePill($("a[aria-current]", tabs)), { passive: true });

  // ---------- Reveal on scroll (once) ----------
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealer.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  $$(".rv").forEach((el) => revealer.observe(el));

  // ---------- Previews play only while visible ----------
  const player = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("play", e.isIntersecting));
  });
  $$(".mock").forEach((el) => player.observe(el));

  // ---------- "For everyone / developers" switches ----------
  $$(".seg").forEach((seg) => {
    const scope = seg.closest(".view");
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", seg).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      scope.classList.toggle("show-dev", b.dataset.who === "dev");
    });
  });

  // ---------- Copy buttons on code ----------
  $$("pre[data-copy]").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-soft btn-sm copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/^#.*$/gm, "").trim());
        btn.textContent = "Copied ✓";
      } catch { btn.textContent = "Select and copy"; }
      setTimeout(() => (btn.textContent = "Copy"), 1600);
    });
    pre.after(btn);
  });

  // ---------- Hover glow (mouse/trackpad only) ----------
  // One passive listener; at most one style update per frame, on the card under the cursor.
  if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".card-app, .feat, .panel, .note, .pager a, .dl-list a, .stage, .stats").forEach((el) => el.classList.add("glow"));
    let target = null, x = 0, y = 0, frame = 0;
    addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".glow");
      if (!el) return;
      target = el; x = e.clientX; y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${x - r.left}px`);
        target.style.setProperty("--my", `${y - r.top}px`);
      });
    }, { passive: true });
  }

  // ---------- Start ----------
  document.documentElement.classList.add("js");
  const r = parse();
  show(r.view, r.anchor, false);
  // Fonts/layout settle after first paint; place the tab pill again.
  requestAnimationFrame(() => movePill($("a[aria-current]", tabs)));
})();
