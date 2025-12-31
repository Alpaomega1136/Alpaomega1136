import process from "node:process";

const ENDPOINT = "https://api.github.com/graphql";
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 800;
const VIEWER_QUERY = `
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
const USER_QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
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

function resolveLogin() {
  const envUser = process.env.GITHUB_USER || process.env.GITHUB_USERNAME;
  if (envUser) {
    return envUser.trim();
  }
  const owner = process.env.GITHUB_REPOSITORY_OWNER;
  if (owner) {
    return owner.trim();
  }
  const repo = process.env.GITHUB_REPOSITORY;
  if (repo) {
    const [repoOwner] = repo.split("/");
    if (repoOwner) {
      return repoOwner.trim();
    }
  }
  return null;
}

async function runQuery(token, query, variables) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`GitHub API error ${response.status}: ${text}`);
    error.httpStatus = response.status;
    throw error;
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    const message = payload.errors.map((err) => err.message).join("; ");
    const error = new Error(`GitHub GraphQL error: ${message}`);
    error.graphqlErrors = payload.errors;
    throw error;
  }

  const calendar =
    payload.data?.viewer?.contributionsCollection?.contributionCalendar ||
    payload.data?.user?.contributionsCollection?.contributionCalendar;
  const weeks = calendar?.weeks;
  if (!weeks) {
    throw new Error("Unexpected response shape from GitHub GraphQL API.");
  }

  return weeks;
}

async function queryWithRetry(token, query, variables) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await runQuery(token, query, variables);
    } catch (error) {
      lastError = error;
      const transient = isTransientGraphqlError(error.graphqlErrors);
      if ((transient || error.httpStatus) && attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY_MS * attempt);
        continue;
      }
      break;
    }
  }
  throw lastError;
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
  const login = resolveLogin();
  const queries = [];
  if (login) {
    queries.push({
      query: USER_QUERY,
      variables: { login, from, to },
    });
  }
  queries.push({
    query: VIEWER_QUERY,
    variables: { from, to },
  });

  let lastError;
  for (const entry of queries) {
    try {
      const weeks = await queryWithRetry(token, entry.query, entry.variables);
      return weeks.map((week) =>
        week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
        })),
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch contributions after retries.");
}
