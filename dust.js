(function(){
  // Defensive: ensure canvas and 2D context exist before proceeding
  const canvas = document.getElementById("dust");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let particles = [];
  let rafId = null;
  let running = true;
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  // Choose particle count based on viewport area (keeps perf reasonable)
  function getCount() {
    const area = window.innerWidth * window.innerHeight;
    return Math.max(24, Math.min(120, Math.floor(area / 90000)));
  }

  function createParticle(initialInside = true) {
    // positions use CSS pixels; we scale canvas via ctx.setTransform for DPR
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    return {
      x: Math.random() * w,
      y: initialInside ? Math.random() * h : Math.random() * h,
      r: Math.random() * 1.8 + 0.3,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: Math.random() * -0.25 - 0.05,
      alpha: Math.random() * 0.45 + 0.15
    };
  }

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    // Set CSS size
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    // Set bitmap size for sharp rendering on HiDPI screens
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    // Map drawing operations to CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Recreate particles to match new size and count
    const count = getCount();
    particles = [];
    for (let i = 0; i < count; i++) particles.push(createParticle(true));
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Pause when page is hidden to save CPU
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !rafId) draw();
  });

  function draw() {
    if (!running) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      return;
    }

    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 210, ${p.alpha})`;
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      // recycle particle when it drifts off-screen
      if (p.y < -10 || p.x < -10 || p.x > w + 10) {
        Object.assign(p, createParticle(false), { y: h + 10 });
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  // Start loop
  draw();

  // Cleanup listeners on unload
  window.addEventListener("unload", () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
  });
})();
