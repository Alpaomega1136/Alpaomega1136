const tileDefaults = {
  size: 56,
  gap: 12,
  radius: 14,
};

const sections = [
  {
    title: "Data Structures & Algorithms",
    tiles: [
      { label: "C", bg: "#4f6bd8", fg: "#ffffff" },
      { label: "C++", bg: "#00599c", fg: "#ffffff" },
      { label: "Rust", bg: "#b7410e", fg: "#ffffff" },
    ],
  },
  {
    title: "Web Development",
    tiles: [
      { label: "HTML", bg: "#e34f26", fg: "#ffffff" },
      { label: "CSS", bg: "#1572b6", fg: "#ffffff" },
      { label: "JS", bg: "#f7df1e", fg: "#1f2328" },
      { label: "TS", bg: "#3178c6", fg: "#ffffff" },
      { label: "Go", bg: "#00add8", fg: "#ffffff" },
      { label: "Py", bg: "#3776ab", fg: "#ffffff" },
      { label: "PG", bg: "#336791", fg: "#ffffff" },
      { label: "Mongo", bg: "#13aa52", fg: "#ffffff" },
      { label: "React", bg: "#61dafb", fg: "#0b111a" },
      { label: "Vite", bg: "#646cff", fg: "#ffffff" },
      { label: "Next", bg: "#111111", fg: "#ffffff" },
      { label: "TW", bg: "#06b6d4", fg: "#ffffff" },
      { label: "Ex", bg: "#333333", fg: "#ffffff" },
      { label: "Node", bg: "#539e43", fg: "#ffffff" },
      { label: "Fire", bg: "#ffca28", fg: "#1f2328" },
      { label: "Redis", bg: "#d82c20", fg: "#ffffff" },
      { label: "Docker", bg: "#2496ed", fg: "#ffffff" },
      { label: "Nginx", bg: "#009639", fg: "#ffffff" },
      { label: "NPM", bg: "#cb3837", fg: "#ffffff" },
      { label: "Git", bg: "#f05032", fg: "#ffffff" },
      { label: "Linux", bg: "#fdd835", fg: "#1f2328" },
      { label: "Graph", bg: "#e10098", fg: "#ffffff" },
      { label: "Prisma", bg: "#0c344b", fg: "#ffffff" },
      { label: "Supa", bg: "#3ecf8e", fg: "#0b111a" },
    ],
  },
  {
    title: "Data Science",
    tiles: [
      { label: "Py", bg: "#3776ab", fg: "#ffffff" },
      { label: "NP", bg: "#4dabcf", fg: "#ffffff" },
      { label: "PD", bg: "#6f62ff", fg: "#ffffff" },
      { label: "SK", bg: "#f7931e", fg: "#1f2328" },
    ],
  },
];

function textSize(label) {
  if (label.length >= 6) return 12;
  if (label.length === 5) return 13;
  if (label.length === 4) return 14;
  if (label.length === 3) return 15;
  return 16;
}

export function generateStacksSvg(weeks) {
  const cell = 12;
  const gap = 3;
  const padX = 36;
  const gridWidth = weeks.length * (cell + gap) - gap;
  const width = gridWidth + padX * 2;
  const titleY = 32;
  const sectionGap = 18;
  const rowGap = tileDefaults.gap;
  const tileSize = tileDefaults.size;
  const cols = 6;
  const gridX = padX;

  let cursorY = 56;
  const sectionBlocks = [];

  for (const section of sections) {
    const headerY = cursorY;
    cursorY += 20;
    const tiles = [];
    const rows = Math.ceil(section.tiles.length / cols);
    const gridWidthTiles = cols * tileSize + (cols - 1) * tileDefaults.gap;
    const offsetX = Math.round(gridX + (Math.max(0, width - padX * 2 - gridWidthTiles) / 2));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const tile = section.tiles[index];
        if (!tile) continue;
        const x = offsetX + col * (tileSize + tileDefaults.gap);
        const y = cursorY + row * (tileSize + rowGap);
        const fontSize = textSize(tile.label);
        tiles.push(
          `<g transform="translate(${x}, ${y})">
            <rect class="tile" width="${tileSize}" height="${tileSize}" rx="${tileDefaults.radius}" fill="${tile.bg}" />
            <text class="tile-text" x="${tileSize / 2}" y="${tileSize / 2 + fontSize / 3}" font-size="${fontSize}" fill="${tile.fg}">${tile.label}</text>
          </g>`,
        );
      }
    }
    const blockHeight = rows * tileSize + (rows - 1) * rowGap;
    sectionBlocks.push(
      `<text class="section-title" x="${gridX}" y="${headerY}">${section.title}</text>
      ${tiles.join("\n      ")}`,
    );
    cursorY += blockHeight + sectionGap;
  }

  const height = cursorY + 8;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  role="img"
  aria-label="Frequently used tech stacks"
>
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1016" />
      <stop offset="100%" stop-color="#0f141b" />
    </linearGradient>
    <style><![CDATA[
      svg {
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
      }
      .bg {
        fill: url(#panel);
      }
      .title {
        fill: #e6edf3;
        font-size: 20px;
        font-weight: 700;
      }
      .section-title {
        fill: #c9d1d9;
        font-size: 13px;
        font-weight: 600;
      }
      .tile {
        stroke: rgba(255, 255, 255, 0.08);
        stroke-width: 1;
      }
      .tile-text {
        font-weight: 700;
        text-anchor: middle;
      }
    ]]></style>
  </defs>

  <rect class="bg" x="0" y="0" width="${width}" height="${height}" rx="18" />
  <text class="title" x="${padX}" y="${titleY}">Frequently Used Tech Stacks</text>
  ${sectionBlocks.join("\n  ")}
</svg>
`;
}
