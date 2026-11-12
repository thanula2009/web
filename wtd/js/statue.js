/* ==========================================================
   D.S. Senanayake Central College, Mirigama
   statue.js - Ambient Golden Canvas Particles
   Respects prefers-reduced-motion
   ========================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("particles");
  if (!canvas || reduce) return;

  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, parts = [], running = true;

  function resize() {
    var r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = w < 720 ? 12 : 24; // subtle, performant
    parts = [];
    for (var i = 0; i < count; i++) parts.push(make(true));
  }

  function make(anywhere) {
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.5 + 0.5,
      v: Math.random() * 0.22 + 0.08,
      drift: (Math.random() - 0.5) * 0.14,
      a: Math.random() * 0.45 + 0.2,
      p: Math.random() * Math.PI * 2
    };
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.y -= p.v;
      p.x += p.drift;
      p.p += 0.02;
      if (p.y < -10) parts[i] = make(false);
      var alpha = p.a * (0.6 + 0.4 * Math.sin(p.p));
      ctx.beginPath();
      ctx.fillStyle = "rgba(241, 210, 122, " + alpha.toFixed(3) + ")";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  // Pause when off-screen or tab is hidden
  var hero = document.querySelector(".hero");
  if ("IntersectionObserver" in window && hero) {
    new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (visible && !running) {
        running = true;
        requestAnimationFrame(tick);
      }
      if (!visible) running = false;
    }).observe(hero);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  });

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(tick);
})();
