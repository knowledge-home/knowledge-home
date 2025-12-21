/* =========================================================
   charts.js (no libraries)
   - Uses CSS variables for aurora colors
   - Smooth animated render
========================================================= */

function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
}

function dprSize(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    canvas.width = w;
    canvas.height = h;
    return { w, h, dpr };
}

function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
}

function drawBarChart(canvas, values, t) {
    const ctx = canvas.getContext("2d");
    const { w, h, dpr } = dprSize(canvas);

    ctx.clearRect(0, 0, w, h);

    const grid = "rgba(255,255,255,.14)";
    const fillMain = "rgba(255,255,255,.85)";
    const glow = "rgba(72,168,255,.14)";

    // grid
    ctx.globalAlpha = 1;
    for (let i = 1; i <= 4; i++) {
        const y = (h / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
    }

    const max = Math.max(...values, 1);
    const pad = 18 * dpr;
    const bw = (w - pad * 2) / values.length;

    values.forEach((v, i) => {
        const x = pad + i * bw + bw * 0.18;
        const barW = bw * 0.64;
        const targetH = ((h - pad * 2) * v) / max;

        // animate height
        const barH = targetH * t;
        const y = h - pad - barH;

        ctx.fillStyle = fillMain;
        roundRect(ctx, x, y, barW, barH, 10 * dpr);
        ctx.fill();

        ctx.fillStyle = glow;
        roundRect(ctx, x, y, barW, barH, 10 * dpr);
        ctx.fill();
    });
}

function drawDonut(canvas, parts, t) {
    const ctx = canvas.getContext("2d");
    const { w, h, dpr } = dprSize(canvas);

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const r = Math.min(w, h) * 0.32;
    const thick = r * 0.45;

    const total = parts.reduce((a, b) => a + b, 0) || 1;

    // Pull aurora palette from CSS (fallbacks included)
    const c1 = cssVar("--aGreen", "rgba(92,246,181,.38)");
    const c2 = cssVar("--aBlue", "rgba(72,168,255,.34)");
    const c3 = cssVar("--aViolet", "rgba(168,95,255,.28)");
    const c4 = cssVar("--aPink", "rgba(255,120,205,.20)");
    const colors = [c1, c2, c3, c4];

    let start = -Math.PI / 2;
    const fullSweep = Math.PI * 2 * t; // animate sweep

    parts.forEach((p, i) => {
        const ang = (p / total) * Math.PI * 2;
        const end = start + ang;

        // clamp by animated sweep
        const drawEnd = Math.min(end, (-Math.PI / 2) + fullSweep);
        if (drawEnd <= start) return;

        ctx.beginPath();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = thick;
        ctx.lineCap = "round";
        ctx.arc(cx, cy, r, start, drawEnd);
        ctx.stroke();

        start = end;
    });

    // center label
    ctx.fillStyle = "rgba(247,248,251,.86)";
    ctx.font = `${16 * dpr}px ui-sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Allocation", cx, cy + 6 * dpr);
}

(function initCharts() {
    // Supports both your older IDs and the current donate placeholder ID
    const bar = document.querySelector("#chartBar") || document.querySelector("#chartBar1");
    const donut = document.querySelector("#chartDonut") || document.querySelector("#donutChart");
    const bar2 = document.querySelector("#chartBar2");

    if (!donut && !bar && !bar2) return;

    const barCanvas = bar;
    const donutCanvas = donut;
    const bar2Canvas = bar2;

    const renderFrame = (ts, startTs) => {
        const p = Math.min(1, (ts - startTs) / 700);     // 0..1
        const ease = 1 - Math.pow(1 - p, 3);             // easeOutCubic

        if (barCanvas) drawBarChart(barCanvas, [22, 34, 18, 40, 28, 46, 32], ease);
        if (donutCanvas) drawDonut(donutCanvas, [60, 25, 10, 5], ease);
        if (bar2Canvas) drawBarChart(bar2Canvas, [12, 18, 10, 22, 20, 28, 26], ease);

        if (p < 1) requestAnimationFrame((t2) => renderFrame(t2, startTs));
    };

    const render = () => requestAnimationFrame((t) => renderFrame(t, t));

    render();
    window.addEventListener("resize", render, { passive: true });
})();
