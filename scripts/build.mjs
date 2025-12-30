import fs from "node:fs/promises";
import path from "node:path";

import { fetchContributions } from "./fetchContrib.mjs";
import { generateFarmSvg } from "./generateFarmSvg.mjs";
import { generateStatsSvg } from "./generateStatsSvg.mjs";
import { generateStacksSvg, stackIconPaths } from "./generateStacksSvg.mjs";

const outputPath = path.join("dist", "farm.svg");
const statsPath = path.join("dist", "stats.svg");
const stacksPath = path.join("dist", "stacks.svg");
const deviconBases = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/",
  "https://fastly.jsdelivr.net/gh/devicons/devicon@latest/icons/",
];
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

function prefixSvgIds(svg, prefix) {
  const idMap = new Map();
  let output = svg.replace(/id=["']([^"']+)["']/g, (match, id) => {
    const safeId = `${prefix}-${id}`;
    idMap.set(id, safeId);
    return `id="${safeId}"`;
  });

  output = output.replace(/url\(#([^)]+)\)/g, (match, id) => {
    const mapped = idMap.get(id) || `${prefix}-${id}`;
    return `url(#${mapped})`;
  });
  output = output.replace(
    /xlink:href=["']#([^"']+)["']/g,
    (match, id) => {
      const mapped = idMap.get(id) || `${prefix}-${id}`;
      return `xlink:href="#${mapped}"`;
    },
  );
  output = output.replace(/href=["']#([^"']+)["']/g, (match, id) => {
    const mapped = idMap.get(id) || `${prefix}-${id}`;
    return `href="#${mapped}"`;
  });

  return output;
}

function extractSvgPayload(svg) {
  const cleaned = svg
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "");
  const match = cleaned.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
  if (!match) {
    return null;
  }
  const attrs = match[1];
  const body = match[2];
  const viewBoxMatch = attrs.match(/viewBox=["']([^"']+)["']/i);
  if (!viewBoxMatch) {
    return null;
  }
  return { viewBox: viewBoxMatch[1], body };
}

async function fetchWithRetry(url, attempts = 3, delayMs = 250) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const backoff = delayMs * attempt;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }
  throw lastError;
}

async function fetchDevicon(iconPath) {
  const errors = [];
  for (const base of deviconBases) {
    const url = `${base}${iconPath}`;
    try {
      const response = await fetchWithRetry(url, 2, 300);
      const svg = await response.text();
      const payload = extractSvgPayload(svg);
      if (!payload) {
        throw new Error(`Unable to parse SVG payload`);
      }
      const prefix = `icon-${iconPath.replace(/[^a-z0-9]+/gi, "-")}`;
      const prefixedBody = prefixSvgIds(payload.body, prefix);
      return {
        viewBox: payload.viewBox,
        body: prefixedBody,
      };
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }
  throw new Error(errors.join(" | "));
}

async function loadStackIcons() {
  const icons = {};
  for (const iconPath of stackIconPaths) {
    try {
      icons[iconPath] = await fetchDevicon(iconPath);
    } catch (error) {
      console.warn(`Skipping icon ${iconPath}: ${error.message}`);
    }
  }
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
