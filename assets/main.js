/* Custom Apps website: navigation, blobs, scroll reveals and the live app mockups.
   Everything is readable without JavaScript or GSAP; animation is layered on top. */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  // Add ?static to the address to see the site with no motion.
  const animate = hasGSAP && !reduce && !/[?&]static\b/.test(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Mobile nav ----------
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "✕" : "☰";
    });
  }

  // ---------- "Everyone / Developers" switch ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const audienceButtons = $$(".audience button");
  function setAudience(who) {
    document.body.classList.toggle("show-dev", who === "dev");
    audienceButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.who === who)));
    store.set("audience", who);
  }
  if (audienceButtons.length) {
    audienceButtons.forEach((b) => b.addEventListener("click", () => setAudience(b.dataset.who)));
    setAudience(store.get("audience") === "dev" ? "dev" : "everyone");
  }

  // ---------- Copy buttons on code blocks ----------
  $$("pre[data-copy]").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-ghost";
    btn.style.cssText = "padding:6px 12px;font-size:.8rem;margin-top:10px";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText.replace(/^#.*$/gm, "").trim());
        btn.textContent = "Copied ✓";
      } catch (e) { btn.textContent = "Select and copy"; }
      setTimeout(() => (btn.textContent = "Copy"), 1600);
    });
    pre.after(btn);
  });

  if (!animate) { runMockupsStatic(); return; }

  document.documentElement.classList.add("js-anim");
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // ---------- Wandering blobs ----------
  $$(".blob").forEach((blob) => {
    const wander = () => {
      gsap.to(blob, {
        x: gsap.utils.random(-180, 180), y: gsap.utils.random(-140, 140),
        scale: gsap.utils.random(0.85, 1.25), rotation: gsap.utils.random(-30, 30),
        duration: gsap.utils.random(7, 13), ease: "sine.inOut", onComplete: wander,
      });
    };
    wander();
  });
  const blobLayer = $(".blobs");
  if (blobLayer && window.matchMedia("(pointer: fine)").matches) {
    const qx = gsap.quickTo(blobLayer, "x", { duration: 1.6, ease: "power3.out" });
    const qy = gsap.quickTo(blobLayer, "y", { duration: 1.6, ease: "power3.out" });
    window.addEventListener("pointermove", (e) => {
      qx((e.clientX / innerWidth - 0.5) * 60);
      qy((e.clientY / innerHeight - 0.5) * 60);
    });
  }

  // ---------- Intro ----------
  const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro.from(".nav", { y: -40, opacity: 0, duration: 0.7 })
    .from(".hero h1 .line, .app-hero h1", { y: 70, opacity: 0, duration: 1, stagger: 0.12 }, "-=0.3")
    .from(".hero .lead, .app-hero .lead, .app-hero .icon, .app-hero .eyebrow, .hero .eyebrow", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
    .from(".hero .btn-row > *, .app-hero .btn-row > *, .app-hero .meta > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.06 }, "-=0.5")
    .from(".hero-icons a", { y: 60, scale: 0.6, rotation: (i) => (i % 2 ? 14 : -14), opacity: 0, duration: 1, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.6")
    .from(".mock-stage > *", { y: 50, scale: 0.92, opacity: 0, duration: 1.1, ease: "expo.out" }, "-=1");

  // Gentle floating icons
  $$(".hero-icons a").forEach((a, i) => {
    gsap.to(a, { y: -10, duration: 2.2 + i * 0.3, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.4 + i * 0.2 });
  });

  // ---------- Scroll reveals ----------
  if (window.ScrollTrigger) {
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out", overwrite: true }),
    });
    // Tiles tilt in from alternating sides
    $$(".app-tile").forEach((tile, i) => {
      gsap.from(tile, {
        scrollTrigger: { trigger: tile, start: "top 90%" },
        x: i % 2 ? 60 : -60, rotation: i % 2 ? 3 : -3, opacity: 0, duration: 1, ease: "power3.out",
      });
    });
    // Count-up numbers
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => (el.textContent = Math.round(obj.v) + (el.dataset.suffix || "")),
      });
    });
  } else {
    gsap.to(".reveal", { opacity: 1, y: 0, duration: 0.8, stagger: 0.05 });
  }

  // Magnetic primary buttons
  $$(".btn-primary").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4 });
    });
    btn.addEventListener("pointerleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
  });

  runFerry();
  runClipper();
  runNowPlaying();
  runOrbit();

  // =============================================================
  // Mockups
  // =============================================================

  function runFerry() {
    const panel = $("#ferry-mock");
    if (!panel) return;
    const area = $("#fp-area"), line = $("#fp-line"), pct = $("#fp-pct"), bar = $("#fp-bar"),
      speedEl = $("#fp-speed"), copied = $("#fp-copied"), left = $("#fp-left");
    const total = 40, W = 300, H = 92, pts = [];
    const state = { p: 0 };
    let t = 0;
    function draw() {
      const p = state.p;
      // speed: quick ramp then a wavy plateau around 400 MB/s
      const speed = Math.min(1, p * 12) * (390 + 30 * Math.sin(t / 3) + 12 * Math.sin(t * 1.7));
      t += 1;
      pts.push([p, speed]);
      const toX = (x) => x * W, toY = (s) => H - (s / 520) * H;
      let d = "";
      pts.forEach(([x, s], i) => (d += (i ? "L" : "M") + toX(x).toFixed(1) + " " + toY(s).toFixed(1)));
      line.setAttribute("d", d);
      area.setAttribute("d", d + ` L${toX(p).toFixed(1)} ${H} L0 ${H} Z`);
      pct.textContent = Math.round(p * 100) + "%";
      bar.style.width = p * 100 + "%";
      speedEl.textContent = Math.round(speed) + " MB/s";
      copied.textContent = (p * total).toFixed(1) + " of " + total + " GB";
      const secs = Math.max(0, Math.round(((1 - p) * total * 1000) / Math.max(speed, 1)));
      left.textContent = p >= 1 ? "Done" : secs >= 60 ? Math.round(secs / 60) + " min" : secs + " sec";
    }
    const loop = () => {
      pts.length = 0; t = 0; state.p = 0;
      gsap.to(state, { p: 1, duration: 9, ease: "none", onUpdate: draw, onComplete: () => gsap.delayedCall(2.2, loop) });
    };
    ScrollTrigger.create({ trigger: panel, start: "top 85%", once: true, onEnter: loop });
  }

  function runClipper() {
    const desk = $("#clipper-desk");
    if (!desk) return;
    const a = $(".win-a", desk), b = $(".win-b", desk), ghost = $(".snap-ghost", desk), cur = $(".cursor", desk),
      lock = $(".lock-badge", desk), keys = $$("#clipper-keys kbd");
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1, paused: true, defaults: { ease: "power3.inOut" } });
    tl.set([a, b], { clearProps: "all" }).set(ghost, { opacity: 0, left: "0%" }).set(lock, { opacity: 0 })
      .set(cur, { left: "30%", top: "30%" })
      // drag window A to the left edge
      .to(cur, { left: "2%", top: "40%", duration: 1.1 })
      .to(a, { left: "-6%", top: "36%", duration: 1.1 }, "<")
      .to(ghost, { opacity: 1, duration: 0.25 }, "-=0.3")
      .to(a, { left: "0%", top: "16px", width: "50%", height: "calc(100% - 16px)", borderRadius: 0, duration: 0.45, ease: "back.out(1.3)" })
      .to(ghost, { opacity: 0, duration: 0.3 }, "<")
      // keyboard: ⌃⌥→ snaps window B right
      .to(keys, { y: 3, background: "#dbe8ff", duration: 0.12, stagger: 0.05 }, "+=0.4")
      .to(b, { left: "50%", top: "16px", width: "50%", height: "calc(100% - 16px)", borderRadius: 0, duration: 0.5, ease: "back.out(1.3)" })
      .to(keys, { y: 0, duration: 0.2, clearProps: "background" }, "+=0.15")
      // drag the shared edge: both follow
      .to(cur, { left: "49%", top: "55%", duration: 0.7 })
      .to(a, { width: "62%", duration: 0.9 }).to(b, { left: "62%", width: "38%", duration: 0.9 }, "<")
      .to(cur, { left: "61%", duration: 0.9 }, "<")
      .to(a, { width: "50%", duration: 0.8 }).to(b, { left: "50%", width: "50%", duration: 0.8 }, "<")
      .to(cur, { left: "49%", duration: 0.8 }, "<")
      // lock window B
      .to(lock, { opacity: 1, y: 0, duration: 0.3 }, "+=0.3")
      .to(b, { x: -24, duration: 0.25, ease: "power1.out" }, "+=0.4")
      .to(b, { x: 0, duration: 0.6, ease: "elastic.out(1,0.4)" })
      .to(lock, { opacity: 0, duration: 0.3 }, "+=0.8");
    ScrollTrigger.create({ trigger: desk, start: "top 85%", onEnter: () => tl.play(), onLeaveBack: () => tl.pause() });
  }

  function runNowPlaying() {
    const player = $("#np-mock");
    if (!player) return;
    $$(".eq i", player).forEach((bar, i) => {
      gsap.to(bar, { height: () => gsap.utils.random(20, 100) + "%", duration: () => gsap.utils.random(0.25, 0.5), repeat: -1, yoyo: true, repeatRefresh: true, delay: i * 0.05, ease: "sine.inOut" });
    });
    gsap.to(".np-art", { rotation: 360, duration: 14, repeat: -1, ease: "none" });
    const prog = { s: 62 }, len = 214;
    const fill = $(".np-bar i", player), now = $("#np-now"), rest = $("#np-rest");
    const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
    gsap.to(prog, {
      s: len, duration: 40, ease: "none", repeat: -1,
      onUpdate: () => { fill.style.width = (prog.s / len) * 100 + "%"; now.textContent = fmt(prog.s); rest.textContent = "-" + fmt(len - prog.s); },
    });
  }

  function runOrbit() {
    const card = $("#orbit-mock");
    if (!card) return;
    const ring = $("#orbit-ring"), dot = $("#orbit-dot"), timeEl = $("#orbit-time"), label = $("#orbit-label"),
      chips = $$(".modes span", card), task = $("#orbit-task");
    const R = 100, C = 2 * Math.PI * R;
    ring.style.strokeDasharray = C;
    const modes = [
      { name: "Focus", min: 25, color: "#8B5CF6", label: "Deep work", task: "Biology revision" },
      { name: "Short Break", min: 5, color: "#14B8A6", label: "Stretch & breathe", task: "Coffee time" },
      { name: "Long Break", min: 15, color: "#3B82F6", label: "Well earned", task: "Walk outside" },
    ];
    let i = 0;
    const st = { left: 1 };
    function render() {
      const m = modes[i];
      const secs = Math.ceil(st.left * m.min * 60);
      timeEl.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0");
      ring.style.strokeDashoffset = C * (1 - st.left);
      const ang = (1 - st.left) * Math.PI * 2;
      dot.setAttribute("cx", 115 + R * Math.cos(ang));
      dot.setAttribute("cy", 115 + R * Math.sin(ang));
    }
    function next() {
      const m = modes[i];
      chips.forEach((c, k) => c.classList.toggle("on", k === i));
      card.style.setProperty("--mode", m.color);
      ring.style.stroke = m.color;
      label.textContent = m.label;
      task.textContent = m.task;
      st.left = 1;
      gsap.fromTo(card, { scale: 0.98 }, { scale: 1, duration: 0.6, ease: "elastic.out(1,0.5)" });
      gsap.to(st, { left: 0, duration: 7, ease: "none", onUpdate: render, onComplete: () => { i = (i + 1) % modes.length; gsap.delayedCall(0.6, next); } });
    }
    ScrollTrigger.create({ trigger: card, start: "top 85%", once: true, onEnter: next });
  }

  // Without GSAP (offline or reduced motion) the mockups still show a sensible still frame.
  function runMockupsStatic() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const bar = document.getElementById("fp-bar"); if (bar) bar.style.width = "46%";
    set("fp-pct", "46%"); set("fp-speed", "412 MB/s"); set("fp-copied", "18.4 of 40 GB"); set("fp-left", "52 sec");
    const area = document.getElementById("fp-area"), line = document.getElementById("fp-line");
    if (area && line) {
      const d = "M0 92 L20 25 L45 22 L70 30 L95 24 L120 28 L138 22";
      line.setAttribute("d", d); area.setAttribute("d", d + " L138 92 L0 92 Z");
    }
    const ring = document.getElementById("orbit-ring");
    if (ring) { const C = 2 * Math.PI * 100; ring.style.strokeDasharray = C; ring.style.strokeDashoffset = C * 0.3; }
  }
})();
