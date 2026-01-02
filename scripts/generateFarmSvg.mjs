function quantile(sorted, q) {
  if (!sorted.length) {
    return 0;
  }
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  if (next === undefined) {
    return sorted[base];
  }
  return sorted[base] + rest * (next - sorted[base]);
}

function buildThresholds(values) {
  if (!values.length) {
    return [0, 0, 0];
  }
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length < 4) {
    const max = sorted[sorted.length - 1];
    return [max * 0.25, max * 0.5, max * 0.75];
  }
  return [
    quantile(sorted, 0.25),
    quantile(sorted, 0.5),
    quantile(sorted, 0.75),
  ];
}

function levelForCount(count, thresholds) {
  if (count <= 0) {
    return 0;
  }
  if (count <= thresholds[0]) return 1;
  if (count <= thresholds[1]) return 2;
  if (count <= thresholds[2]) return 3;
  return 4;
}

function dayOfWeek(dateString) {
  return new Date(`${dateString}T00:00:00Z`).getUTCDay();
}

function normalizeWeek(week) {
  const normalized = Array.from({ length: 7 }, () => ({ date: null, count: 0 }));
  for (const day of week) {
    if (!day?.date) {
      continue;
    }
    const index = dayOfWeek(day.date);
    normalized[index] = day;
  }
  return normalized;
}

export function generateFarmSvg(weeks, options = {}) {
  const { dragonImage, dragonRatio = 1.5, minWeeks = weeks.length } = options;
  const cell = 12;
  const gap = 3;
  const totalWeeks = Math.max(weeks.length, minWeeks);
  const gridWidth = totalWeeks * (cell + gap) - gap;
  const gridHeight = 7 * (cell + gap) - gap;
  const padX = 36;
  const padY = 28;
  const gridX = padX;
  const gridY = padY;
  const svgWidth = gridWidth + padX * 2;
  const svgHeight = gridHeight + padY * 2;

  const counts = weeks.flat().map((day) => day.count);
  const nonZero = counts.filter((count) => count > 0);
  const thresholds = buildThresholds(nonZero);

  const emptyWeek = Array.from({ length: 7 }, () => ({ date: null, count: 0 }));
  const cells = [];
  const baseCells = [];
  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const rawWeek = weeks[weekIndex] ?? emptyWeek;
    const week = normalizeWeek(rawWeek);
    for (let dayIndex = 0; dayIndex < week.length; dayIndex += 1) {
      const day = week[dayIndex];
      const level = levelForCount(day.count, thresholds);
      const x = gridX + weekIndex * (cell + gap);
      const y = gridY + dayIndex * (cell + gap);
      baseCells.push(
        `<rect class="cell base" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" ry="3" />`,
      );
      cells.push(
        `<rect class="cell l${level}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" ry="3" />`,
      );
    }
  }

  const greens = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
  const burns = ["#0e1319", "#10151b", "#11161c", "#12171d", "#13181e"];

  const duration = 22;
  const revealEnd = 60;
  const fireStart = 60;
  const fireEnd = 88;
  const resetStart = fireEnd + 1;
  const exitEnd = 96;
  const glowWidth = 52;
  const glowTravel = gridWidth + glowWidth;
  const dragonExit = gridWidth + 160;
  const dragonOffsetX = -58;
  const dragonY = gridY + gridHeight * 0.58;
  const useDragonImage = Boolean(dragonImage);
  const dragonDisplayWidth = Math.round(Math.min(gridHeight * 1.8, 210));
  const dragonDisplayHeight = Math.round(dragonDisplayWidth / dragonRatio);
  const dragonImageX = Math.round(-dragonDisplayWidth * 0.6);
  const dragonImageY = Math.round(-dragonDisplayHeight * 0.58);

  const dragonBodyPath =
    "M-36,10 C-28,-10 -2,-20 26,-16 C52,-12 58,14 36,30 C10,44 -22,32 -36,16 Z";
  const dragonBellyPath =
    "M-12,10 C-6,-2 8,-8 22,-6 C34,-4 36,12 24,20 C10,30 -4,22 -12,12 Z";
  const dragonHeadPath =
    "M26,-18 C44,-32 72,-22 74,-2 C76,16 50,18 30,6 Z";
  const dragonJawPath = "M32,4 L70,10 L34,14 Z";
  const dragonWingPath =
    "M-10,-6 C-24,-26 -54,-30 -76,-14 C-50,-8 -30,2 -14,14 Z";
  const dragonWingMembranePath =
    "M-14,-4 C-28,-18 -46,-20 -58,-10 C-40,-6 -26,2 -18,8 Z";
  const dragonTailPath = "M-34,18 C-54,30 -66,42 -76,52";
  const dragonHornPath = "M44,-30 L50,-46 L56,-28 Z";
  const dragonSpikesPath =
    "M-2,-18 L2,-30 L6,-18 Z M8,-14 L12,-24 L16,-14 Z M18,-10 L22,-20 L26,-10 Z";
  const dragonClawPath = "M-2,20 L6,26 L2,30 L-6,22 Z";

  const style = `
    svg {
      font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
    }
    .bg {
      fill: #0d1117;
    }
    .cell {
      shape-rendering: geometricPrecision;
    }
    .base {
      fill: #161b22;
    }
    #greenLayer {
      transform-box: fill-box;
      transform-origin: center;
    }
    #greenLayer .l0 { fill: ${greens[0]}; }
    #greenLayer .l1 { fill: ${greens[1]}; }
    #greenLayer .l2 { fill: ${greens[2]}; }
    #greenLayer .l3 { fill: ${greens[3]}; }
    #greenLayer .l4 { fill: ${greens[4]}; }
    #burnedLayer .l0 { fill: ${burns[0]}; }
    #burnedLayer .l1 { fill: ${burns[1]}; }
    #burnedLayer .l2 { fill: ${burns[2]}; }
    #burnedLayer .l3 { fill: ${burns[3]}; }
    #burnedLayer .l4 { fill: ${burns[4]}; }
    .reveal-rect {
      animation: reveal ${duration}s linear infinite;
    }
    .reveal-glow {
      fill: url(#revealGrad);
      opacity: 0;
      animation: glow ${duration}s linear infinite;
      mix-blend-mode: screen;
    }
    .burned-fill {
      fill: #0c1016;
    }
    .burn-sweep {
      animation: burn ${duration}s linear infinite;
      transform-origin: left center;
      transform-box: fill-box;
    }
    .dragon {
      animation: dragonSweep ${duration}s linear infinite;
      transform-origin: left center;
      transform-box: fill-box;
    }
    .dragon-image {
      filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.35));
    }
    .dragon-body {
      fill: #3a3f46;
    }
    .dragon-belly {
      fill: #4a515a;
      opacity: 0.9;
    }
    .dragon-wing {
      fill: #2c3238;
    }
    .dragon-wing-membrane {
      fill: #353b43;
      opacity: 0.95;
    }
    .dragon-head {
      fill: #3a3f46;
    }
    .dragon-jaw {
      fill: #4a515a;
    }
    .dragon-eye {
      fill: #f5f7fb;
    }
    .dragon-tail {
      stroke: #3a3f46;
      stroke-width: 3;
      fill: none;
      stroke-linecap: round;
    }
    .dragon-horn {
      fill: #606770;
    }
    .dragon-spike {
      fill: #5b626b;
    }
    .dragon-claw {
      fill: #2c3238;
    }

    @keyframes reveal {
      0% { width: 0px; }
      ${revealEnd}% { width: ${gridWidth}px; }
      ${fireEnd}% { width: ${gridWidth}px; }
      ${resetStart}% { width: 0px; }
      100% { width: 0px; }
    }
    @keyframes glow {
      0% { transform: translateX(0px); opacity: 0; }
      6% { opacity: 0.45; }
      ${revealEnd - 2}% { opacity: 0.45; }
      ${revealEnd}% { transform: translateX(${glowTravel}px); opacity: 0; }
      100% { transform: translateX(${glowTravel}px); opacity: 0; }
    }
    @keyframes burn {
      0%, ${fireStart}% { transform: translateX(0px); }
      ${fireEnd}% { transform: translateX(${gridWidth}px); }
      100% { transform: translateX(${gridWidth}px); }
    }
    @keyframes dragonSweep {
      0%, ${fireStart}% { transform: translateX(0px); opacity: 0; }
      ${fireStart + 2}% { opacity: 1; }
      ${fireEnd}% { transform: translateX(${gridWidth}px); opacity: 1; }
      ${exitEnd}% { transform: translateX(${dragonExit}px); opacity: 0.7; }
      100% { transform: translateX(${dragonExit}px); opacity: 0; }
    }
  `;

  const dragonMarkup = useDragonImage
    ? `<image class="dragon-image" href="${dragonImage}" x="${dragonImageX}" y="${dragonImageY}" width="${dragonDisplayWidth}" height="${dragonDisplayHeight}" preserveAspectRatio="xMidYMid meet" transform="rotate(-90 ${dragonImageX + dragonDisplayWidth / 2} ${dragonImageY + dragonDisplayHeight / 2})" />`
    : `
      <g transform="translate(${dragonOffsetX}, 0)">
        <path class="dragon-wing" d="${dragonWingPath}" />
        <path class="dragon-wing-membrane" d="${dragonWingMembranePath}" />
        <path class="dragon-tail" d="${dragonTailPath}" />
        <path class="dragon-spike" d="${dragonSpikesPath}" />
        <path class="dragon-body" d="${dragonBodyPath}" />
        <path class="dragon-belly" d="${dragonBellyPath}" />
        <path class="dragon-head" d="${dragonHeadPath}" />
        <path class="dragon-jaw" d="${dragonJawPath}" />
        <circle class="dragon-eye" cx="52" cy="-6" r="1.8" />
        <path class="dragon-claw" d="${dragonClawPath}" />
        <path class="dragon-horn" d="${dragonHornPath}" />
      </g>
    `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${svgWidth}"
  height="${svgHeight}"
  viewBox="0 0 ${svgWidth} ${svgHeight}"
  role="img"
  aria-label="Contribution farm animation"
>
  <title>Contribution Farm</title>
  <defs>
    <linearGradient id="revealGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#39d353" stop-opacity="0" />
      <stop offset="50%" stop-color="#39d353" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#39d353" stop-opacity="0" />
    </linearGradient>
    <clipPath id="gridClip">
      <rect x="${gridX}" y="${gridY}" width="${gridWidth}" height="${gridHeight}" rx="6" ry="6" />
    </clipPath>
    <mask id="revealMask" x="0" y="0" width="${svgWidth}" height="${svgHeight}" maskUnits="userSpaceOnUse">
      <rect width="${svgWidth}" height="${svgHeight}" fill="black" />
      <rect class="reveal-rect" x="${gridX}" y="${gridY}" width="0" height="${gridHeight}" fill="white" />
    </mask>
    <mask id="burnMask" x="0" y="0" width="${svgWidth}" height="${svgHeight}" maskUnits="userSpaceOnUse">
      <rect width="${svgWidth}" height="${svgHeight}" fill="black" />
      <rect class="burn-sweep" x="${gridX - gridWidth}" y="${gridY}" width="${gridWidth}" height="${gridHeight}" fill="white" />
    </mask>
    <style><![CDATA[${style}]]></style>
  </defs>

  <rect class="bg" x="0" y="0" width="${svgWidth}" height="${svgHeight}" />

  <g id="baseLayer">
    ${baseCells.join("\n    ")}
  </g>

  <g id="greenLayer" mask="url(#revealMask)">
    ${cells.join("\n    ")}
  </g>

  <g mask="url(#revealMask)" clip-path="url(#gridClip)">
    <rect class="reveal-glow" x="${gridX - glowWidth}" y="${gridY}" width="${glowWidth}" height="${gridHeight}" />
  </g>

  <g id="burnedLayer" mask="url(#burnMask)">
    <rect class="burned-fill" x="${gridX}" y="${gridY}" width="${gridWidth}" height="${gridHeight}" rx="6" ry="6" />
    ${cells.join("\n    ")}
  </g>

  <g transform="translate(${gridX}, ${dragonY})">
    <g class="dragon">
      ${dragonMarkup}
    </g>
  </g>
</svg>
`;
}
