import process from "node:process";

const ENDPOINT = "https://api.github.com/graphql";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;
const QUERY = `
  query ($from: DateTime!, $to: DateTime!) {
    viewer {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientGraphqlError(errors) {
  return errors?.some((err) =>
    /Something went wrong while executing your query/i.test(err.message),
  );
}

export async function fetchContributions() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required to fetch contributions.");
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const from = new Date(Date.UTC(year, 0, 1)).toISOString();
  const to = now.toISOString();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { from, to } }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw new Error(`GitHub API error ${response.status}: ${text}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      const message = payload.errors.map((err) => err.message).join("; ");
      if (isTransientGraphqlError(payload.errors) && attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw new Error(`GitHub GraphQL error: ${message}`);
    }

    const weeks =
      payload.data?.viewer?.contributionsCollection?.contributionCalendar?.weeks;
    if (!weeks) {
      throw new Error("Unexpected response shape from GitHub GraphQL API.");
    }

    return weeks.map((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
      })),
    );
  }

  throw new Error("Failed to fetch contributions after retries.");
}
