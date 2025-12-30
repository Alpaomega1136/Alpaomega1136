import fs from "node:fs/promises";
import path from "node:path";

import { fetchContributions } from "./fetchContrib.mjs";
import { generateFarmSvg } from "./generateFarmSvg.mjs";
import { generateStatsSvg } from "./generateStatsSvg.mjs";
import { generateStacksSvg } from "./generateStacksSvg.mjs";

const outputPath = path.join("dist", "farm.svg");
const statsPath = path.join("dist", "stats.svg");
const stacksPath = path.join("dist", "stacks.svg");
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

async function build() {
  const weeks = await fetchContributions();
  const dragonAsset = await readDragonAsset();
  const svg = generateFarmSvg(weeks, {
    dragonImage: dragonAsset?.dataUri,
    dragonRatio: dragonAsset?.ratio,
  });
  const statsSvg = generateStatsSvg(weeks);
  const stacksSvg = generateStacksSvg(weeks);

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
