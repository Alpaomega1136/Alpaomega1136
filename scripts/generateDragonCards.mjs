import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const stacks = [
  ["Languages", ["Python", "JavaScript", "Java", "C", "C++", "C#", "Haskell"]],
  ["Frontend", ["HTML", "CSS", "React"]],
  ["Creative Tools", ["Git", "GitHub", "Maven", "Blender", "Unity"]],
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function statTexts(statsSvg) {
  const texts = [...statsSvg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((match) =>
    match[1].trim(),
  );
  return {
    total: texts[1] || "-",
    totalLabel: texts[2] || "Total Contributions",
    totalRange: texts[3] || "Year to date",
    current: texts[4] || "-",
    currentLabel: texts[5] || "Current Streak",
    currentRange: texts[6] || "Updated hourly",
    longest: texts[7] || "-",
    longestLabel: texts[8] || "Longest Streak",
    longestRange: texts[9] || "Best run",
  };
}

function shell(width, height, title, subtitle, dragonImage, body) {
  const dragon = dragonImage
    ? `<image class="dragon" href="${dragonImage}" x="${width - 330}" y="-34" width="342" height="216" preserveAspectRatio="xMidYMid slice"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07090c"/>
      <stop offset="58%" stop-color="#10151b"/>
      <stop offset="100%" stop-color="#20110a"/>
    </linearGradient>
    <radialGradient id="fire" cx="76%" cy="78%" r="45%">
      <stop offset="0%" stop-color="#ffb22e" stop-opacity=".85"/>
      <stop offset="34%" stop-color="#f97316" stop-opacity=".32"/>
      <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#f97316" flood-opacity=".72"/>
    </filter>
    <style><![CDATA[
      svg { font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif; }
      .bg { fill: url(#bg); }
      .ring { fill: none; stroke: #f97316; stroke-width: 1.2; opacity: .34; }
      .title { fill: #f8fafc; font-size: 24px; font-weight: 800; }
      .subtitle { fill: #94a3b8; font-size: 13px; }
      .label { fill: #fed7aa; font-size: 12px; font-weight: 700; text-transform: uppercase; }
      .text { fill: #e5e7eb; font-size: 14px; font-weight: 650; }
      .muted { fill: #94a3b8; font-size: 12px; }
      .pill { fill: #121820; stroke: #2b3440; stroke-width: 1; }
      .stat { fill: #111827; stroke: #394150; stroke-width: 1; }
      .number { fill: #fb923c; font-size: 28px; font-weight: 850; filter: url(#glow); }
      .dragon { opacity: .9; }
    ]]></style>
  </defs>
  <rect class="bg" width="${width}" height="${height}" rx="18"/>
  <rect width="${width}" height="${height}" fill="url(#fire)" rx="18"/>
  <circle class="ring" cx="${width - 118}" cy="${height - 52}" r="92"/>
  <circle class="ring" cx="${width - 118}" cy="${height - 52}" r="122"/>
  ${dragon}
  <text class="title" x="34" y="43">${escapeXml(title)}</text>
  <text class="subtitle" x="34" y="66">${escapeXml(subtitle)}</text>
  ${body}
</svg>
`;
}

export function generateDragonStacksSvg(dragonImage) {
  let y = 104;
  const rows = stacks
    .map(([label, items]) => {
      let x = 190;
      const pills = items
        .map((item) => {
          const width = Math.max(54, item.length * 9 + 26);
          const pill = `<rect class="pill" x="${x}" y="${y - 20}" width="${width}" height="32" rx="16"/>
      <text class="text" x="${x + 13}" y="${y + 2}">${escapeXml(item)}</text>`;
          x += width + 10;
          return pill;
        })
        .join("\n      ");
      const row = `<text class="label" x="34" y="${y}">${escapeXml(label)}</text>
      ${pills}`;
      y += 56;
      return row;
    })
    .join("\n  ");

  return shell(
    864,
    272,
    "Dragon-forged Tech Stack",
    "Tools I use to build software, data projects, games, and visual experiments.",
    dragonImage,
    rows,
  );
}

export function generateDragonActivitySvg(dragonImage, stats) {
  const cards = [
    [34, stats.total, stats.totalLabel, stats.totalRange],
    [314, stats.current, stats.currentLabel, stats.currentRange],
    [594, stats.longest, stats.longestLabel, stats.longestRange],
  ]
    .map(
      ([x, number, label, sub]) => `<rect class="stat" x="${x}" y="104" width="236" height="104" rx="14"/>
      <text class="number" x="${x + 22}" y="146">${escapeXml(number)}</text>
      <text class="text" x="${x + 22}" y="172">${escapeXml(label)}</text>
      <text class="muted" x="${x + 22}" y="194">${escapeXml(sub)}</text>`,
    )
    .join("\n  ");

  return shell(
    864,
    244,
    "Dragon Watch",
    "GitHub activity, guarded by the same dragon that burns through the contribution farm.",
    dragonImage,
    cards,
  );
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dragon = await fs.readFile(path.join(root, "assets", "dragon.png"));
  const statsSvg = await fs.readFile(path.join(root, "dist", "stats.svg"), "utf8");
  const dragonImage = `data:image/png;base64,${dragon.toString("base64")}`;
  await fs.mkdir(path.join(root, "dist"), { recursive: true });
  await fs.writeFile(path.join(root, "dist", "dragon-stacks.svg"), generateDragonStacksSvg(dragonImage), "utf8");
  await fs.writeFile(
    path.join(root, "dist", "dragon-activity.svg"),
    generateDragonActivitySvg(dragonImage, statTexts(statsSvg)),
    "utf8",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
