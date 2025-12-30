import fs from "node:fs/promises";
import path from "node:path";

import { fetchContributions } from "./fetchContrib.mjs";
import { generateFarmSvg } from "./generateFarmSvg.mjs";
import { generateStatsSvg } from "./generateStatsSvg.mjs";
import { generateStacksSvg, stackIconPaths } from "./generateStacksSvg.mjs";

const outputPath = path.join("dist", "farm.svg");
const statsPath = path.join("dist", "stats.svg");
const stacksPath = path.join("dist", "stacks.svg");
const deviconBase =
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/";
const dragonPath = path.join("assets", "dragon.png");

function getPngSize(buffer) {
  const signature =
    buffer.length >= 8 && buffer.readUInt32BE(0) === 0x89504e47;
  if (!signature || buffer.length < 24) {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function readDragonAsset() {
  try {
    const buffer = await fs.readFile(dragonPath);
    const size = getPngSize(buffer);
    const ratio = size?.width && size?.height ? size.width / size.height : 1.5;
    return {
      dataUri: `data:image/png;base64,${buffer.toString("base64")}`,
      ratio,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function fetchDevicon(iconPath) {
  const response = await fetch(`${deviconBase}${iconPath}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Devicon fetch failed (${response.status}) for ${iconPath}: ${text}`,
    );
  }
  const svg = await response.text();
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

async function loadStackIcons() {
  const icons = {};
  await Promise.all(
    stackIconPaths.map(async (iconPath) => {
      try {
        icons[iconPath] = await fetchDevicon(iconPath);
      } catch (error) {
        console.warn(`Skipping icon ${iconPath}: ${error.message}`);
      }
    }),
  );
  return icons;
}

async function build() {
  const weeks = await fetchContributions();
  const dragonAsset = await readDragonAsset();
  const stackIcons = await loadStackIcons();
  const svg = generateFarmSvg(weeks, {
    dragonImage: dragonAsset?.dataUri,
    dragonRatio: dragonAsset?.ratio,
  });
  const statsSvg = generateStatsSvg(weeks);
  const stacksSvg = generateStacksSvg(weeks, { icons: stackIcons });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, svg, "utf8");
  await fs.writeFile(statsPath, statsSvg, "utf8");
  await fs.writeFile(stacksPath, stacksSvg, "utf8");
  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${statsPath}`);
  console.log(`Wrote ${stacksPath}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
