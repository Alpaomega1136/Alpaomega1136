function parseDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatRange(start, end) {
  if (!start || !end) {
    return "No data";
  }
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  if (sameYear && sameMonth) {
    return `${monthDay.format(start)} - ${monthDay.format(end)}`;
  }
  if (sameYear) {
    return `${monthDay.format(start)} - ${monthDay.format(end)}`;
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function computeStreaks(days) {
  let currentStreak = 0;
  let currentStart = null;
  let currentEnd = null;
  if (days.length) {
    const last = days[days.length - 1];
    if (last.count > 0) {
      currentEnd = last.date;
      let index = days.length - 1;
      while (index >= 0 && days[index].count > 0) {
        currentStreak += 1;
        index -= 1;
      }
      currentStart = days[index + 1]?.date ?? last.date;
    }
  }

  let longestStreak = 0;
  let longestStart = null;
  let longestEnd = null;
  let runStart = null;
  let runCount = 0;

  for (const day of days) {
    if (day.count > 0) {
      if (runCount === 0) {
        runStart = day.date;
      }
      runCount += 1;
      if (runCount > longestStreak) {
        longestStreak = runCount;
        longestStart = runStart;
        longestEnd = day.date;
      }
    } else {
      runCount = 0;
      runStart = null;
    }
  }

  return {
    currentStreak,
    currentStart,
    currentEnd,
    longestStreak,
    longestStart,
    longestEnd,
  };
}

export function generateStatsSvg(weeks) {
  const cell = 12;
  const gap = 3;
  const padX = 36;
  const padY = 20;
  const gridWidth = weeks.length * (cell + gap) - gap;
  const width = gridWidth + padX * 2;
  const height = 128;

  const days = weeks.flat();
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const firstDate = days[0]?.date;
  const lastDate = days[days.length - 1]?.date;
  const totalRange = firstDate
    ? `${formatDate(parseDate(firstDate))} - Present`
    : "No data";

  const streaks = computeStreaks(days);
  const currentRange =
    streaks.currentStreak > 0
      ? formatRange(parseDate(streaks.currentStart), parseDate(streaks.currentEnd))
      : "No streak";
  const longestRange =
    streaks.longestStreak > 0
      ? formatRange(parseDate(streaks.longestStart), parseDate(streaks.longestEnd))
      : "No streak";

  const cardX = 14;
  const cardY = 38;
  const cardWidth = width - cardX * 2;
  const cardHeight = 76;
  const columnWidth = cardWidth / 3;
  const numberY = cardY + 30;
  const labelY = cardY + 50;
  const subY = cardY + 68;

  const titleX = cardX;
  const iconX = titleX;
  const iconY = 12;
  const titleTextX = iconX + 26;
  const dividerX1 = cardX + columnWidth;
  const dividerX2 = cardX + columnWidth * 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
  role="img"
  aria-label="GitHub stats"
>
  <defs>
    <style><![CDATA[
      svg {
        font-family: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
      }
      .bg {
        fill: #0d1117;
      }
      .card {
        fill: #0f141b;
        stroke: #2b3a52;
        stroke-width: 1.2;
      }
      .title {
        fill: #c9d1d9;
        font-size: 16px;
        font-weight: 600;
      }
      .icon-blue {
        fill: #58a6ff;
      }
      .icon-soft {
        fill: #1f6feb;
      }
      .icon-light {
        fill: #79c0ff;
      }
      .stat-number {
        fill: #58a6ff;
        font-size: 26px;
        font-weight: 700;
      }
      .stat-label {
        fill: #79c0ff;
        font-size: 12px;
        font-weight: 600;
      }
      .stat-sub {
        fill: #8b949e;
        font-size: 11px;
      }
      .divider {
        stroke: #273040;
        stroke-width: 1;
      }
    ]]></style>
  </defs>

  <rect class="bg" x="0" y="0" width="${width}" height="${height}" />

  <g>
    <rect class="icon-soft" x="${iconX}" y="${iconY}" width="6" height="18" rx="2" />
    <rect class="icon-blue" x="${iconX + 8}" y="${iconY + 4}" width="6" height="14" rx="2" />
    <rect class="icon-light" x="${iconX + 16}" y="${iconY + 1}" width="6" height="17" rx="2" />
    <text class="title" x="${titleTextX}" y="${iconY + 14}">GitHub Stats</text>
  </g>

  <rect class="card" x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="10" />
  <line class="divider" x1="${dividerX1}" y1="${cardY + 10}" x2="${dividerX1}" y2="${cardY + cardHeight - 10}" />
  <line class="divider" x1="${dividerX2}" y1="${cardY + 10}" x2="${dividerX2}" y2="${cardY + cardHeight - 10}" />

  <g text-anchor="middle">
    <text class="stat-number" x="${cardX + columnWidth / 2}" y="${numberY}">${total}</text>
    <text class="stat-label" x="${cardX + columnWidth / 2}" y="${labelY}">Total Contributions</text>
    <text class="stat-sub" x="${cardX + columnWidth / 2}" y="${subY}">${totalRange}</text>

    <text class="stat-number" x="${cardX + columnWidth * 1.5}" y="${numberY}">${streaks.currentStreak}</text>
    <text class="stat-label" x="${cardX + columnWidth * 1.5}" y="${labelY}">Current Streak</text>
    <text class="stat-sub" x="${cardX + columnWidth * 1.5}" y="${subY}">${currentRange}</text>

    <text class="stat-number" x="${cardX + columnWidth * 2.5}" y="${numberY}">${streaks.longestStreak}</text>
    <text class="stat-label" x="${cardX + columnWidth * 2.5}" y="${labelY}">Longest Streak</text>
    <text class="stat-sub" x="${cardX + columnWidth * 2.5}" y="${subY}">${longestRange}</text>
  </g>
</svg>
`;
}
