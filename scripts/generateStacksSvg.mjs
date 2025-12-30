const tileDefaults = {
  size: 68,
  gap: 12,
  radius: 14,
  icon: 30,
  labelWidth: 180,
  sectionGap: 18,
};

const stacksSections = [
  {
    title: "Languages",
    tiles: [
      { label: "Python", icon: "python/python-original.svg" },
      { label: "HTML", icon: "html5/html5-original.svg" },
      { label: "CSS", icon: "css3/css3-original.svg" },
      { label: "JavaScript", icon: "javascript/javascript-original.svg" },
      { label: "C", icon: "c/c-original.svg" },
      { label: "C++", icon: "cplusplus/cplusplus-original.svg" },
      { label: "Haskell", icon: "haskell/haskell-original.svg" },
      { label: "Java", icon: "java/java-original.svg" },
      { label: "C#", icon: "csharp/csharp-original.svg" },
    ],
  },
  {
    title: "Tools",
    tiles: [
      { label: "Git", icon: "git/git-original.svg" },
      { label: "GitHub", icon: "github/github-original.svg" },
      { label: "Maven", icon: "maven/maven-original.svg" },
      { label: "Blender", icon: "blender/blender-original.svg" },
    ],
  },
  {
    title: "Frameworks & Engines",
    tiles: [
      { label: "React", icon: "react/react-original.svg" },
      { label: "Unity", icon: "unity/unity-original.svg" },
    ],
  },
];

export const stackIconPaths = stacksSections
  .flatMap((section) => section.tiles.map((tile) => tile.icon))
  .filter(Boolean);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseViewBox(viewBox) {
  if (!viewBox) {
    return null;
  }
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 4 || parts.some((value) => Number.isNaN(value))) {
    return null;
  }
  return {
    minX: parts[0],
    minY: parts[1],
    width: parts[2],
    height: parts[3],
  };
}

export function generateStacksSvg(weeks, options = {}) {
  const { icons = {}, minWeeks = weeks.length } = options;
  const cell = 12;
  const gap = 3;
  const padX = 36;
  const totalWeeks = Math.max(weeks.length, minWeeks);
  const gridWidth = totalWeeks * (cell + gap) - gap;
  const width = gridWidth + padX * 2;
  const titleY = 32;
  const tileSize = tileDefaults.size;
  const tileGap = tileDefaults.gap;
  const labelWidth = tileDefaults.labelWidth;
  const contentX = padX + labelWidth;
  const contentWidth = width - padX - contentX;
  const maxCols = Math.max(1, Math.floor((contentWidth + tileGap) / (tileSize + tileGap)));

  let cursorY = 58;
  const sectionBlocks = [];

  for (const section of stacksSections) {
    const tiles = [];
    const cols = Math.min(maxCols, section.tiles.length);
    const rows = Math.ceil(section.tiles.length / cols);
    const tilesHeight = rows * tileSize + (rows - 1) * tileGap;
    const headerY = cursorY + 18;

    section.tiles.forEach((tile, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = contentX + col * (tileSize + tileGap);
      const y = cursorY + row * (tileSize + tileGap);
      const iconData = icons[tile.icon];
      const label = escapeXml(tile.label);
      const labelY = y + tileSize - 12;
      const iconX = x + (tileSize - tileDefaults.icon) / 2;
      const iconY = y + 10;
      let iconMarkup = `<text class="tile-fallback" x="${x + tileSize / 2}" y="${y + tileSize / 2 + 4}">${label}</text>`;
      if (iconData?.viewBox && iconData?.body) {
        const viewBox = parseViewBox(iconData.viewBox);
        if (viewBox) {
          const iconBox = tileDefaults.icon;
          const scale = Math.min(iconBox / viewBox.width, iconBox / viewBox.height);
          const scaledWidth = viewBox.width * scale;
          const scaledHeight = viewBox.height * scale;
          const translateX = iconX + (iconBox - scaledWidth) / 2;
          const translateY = iconY + (iconBox - scaledHeight) / 2;
          iconMarkup = `<g class="tile-icon" transform="translate(${translateX} ${translateY}) scale(${scale}) translate(${-viewBox.minX} ${-viewBox.minY})">${iconData.body}</g>`;
        }
      }
      tiles.push(
        `<g class="tile-group">
          <rect class="tile" x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" rx="${tileDefaults.radius}" />
          ${iconMarkup}
          <text class="tile-text" x="${x + tileSize / 2}" y="${labelY}">${label}</text>
        </g>`,
      );
    });

    sectionBlocks.push(
      `<text class="section-title" x="${padX}" y="${headerY}">${escapeXml(section.title)}</text>
      ${tiles.join("\n      ")}`,
    );
    cursorY += tilesHeight + tileDefaults.sectionGap;
  }

  const height = cursorY + 10;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
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
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.35" />
    </filter>
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
        fill: #161b22;
        stroke: #21262d;
        stroke-width: 1;
        filter: url(#shadow);
      }
      .tile-text {
        fill: #c9d1d9;
        font-size: 11px;
        font-weight: 700;
        text-anchor: middle;
      }
      .tile-icon {
        image-rendering: auto;
      }
      .tile-fallback {
        fill: #c9d1d9;
        font-size: 12px;
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
