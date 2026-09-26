import axios from "axios";

const BASE_URL = "https://www.quetext.com/api/v2";

const quetextHttp = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export interface PlagiarismMatch {
  url: string;
  matchedWords: number;
  percentage: number;
}

export interface PlagiarismScore {
  percentUnique: number;
  percentDuplicated: number;
}

export interface PlagiarismResult {
  success: boolean;
  score: PlagiarismScore;
  matches: PlagiarismMatch[];
  reportId: string | null;
  raw: unknown; // full API response, kept in case you need fields not modeled above
}

export interface PlagiarismCheckOptions {
  /** A URL to exclude from matching (e.g. your own site, if re-checking your own content). */
  excludedUrl?: string;
  /** Optional label to help you find this scan later in the dashboard. */
  title?: string;
  /**
   * Quetext's POST /report only returns a submission id, not a finished
   * report — the score/matches arrive from a follow-up poll. This is on by
   * default now that it's confirmed; set to false only if you want the raw
   * submission id back immediately without waiting.
   */
  waitForCompletion?: boolean;
  /** Max time to spend polling, in ms. Default 60s. */
  pollTimeoutMs?: number;
}

export class QuetextApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "QuetextApiError";
  }
}

/**
 * Thrown when the response body doesn't contain any of the score/match field
 * names we know about. This is intentionally loud instead of defaulting to
 * 0% duplicated — a silent default here is what causes "no plagiarism found"
 * results that are actually just "we didn't recognize the response shape."
 *
 * IMPORTANT: this also fires when `matches`/`sources` exists but every parsed
 * match came out as 0% and 0 words — that's the signature of "we found the
 * array, but our per-match field-name guesses (percentage/matchedWords) are
 * wrong," which previously produced a silent 0% instead of an error.
 */
export class QuetextParseError extends Error {
  constructor(message: string, public readonly raw: unknown) {
    super(message);
    this.name = "QuetextParseError";
  }
}

function getApiKey(): string {
  const key = process.env.QUETEXT_API_KEY;
  if (!key) {
    throw new Error(
      "QUETEXT_API_KEY is not set. Add it to your environment / .env file."
    );
  }
  return key;
}

/**
 * CONFIRMED from a real response: POST /report only returns
 *   { status: true, data: { id: "..." } }
 * i.e. Quetext queues the scan and hands back a submission id — the score
 * and matches are NOT in this response. You must poll a follow-up endpoint
 * with that id until the report is finished. Everything below reads through
 * a `data` envelope, since that's what Quetext wraps responses in.
 */
function extractReportId(body: any): string | null {
  return body?.data?.id ?? body?.reportId ?? body?.id ?? null;
}

function isPending(body: any): boolean {
  const d = body?.data ?? body;
  const status = d?.status ?? d?.state;
  if (typeof status === "string") {
    return ["pending", "processing", "queued", "in_progress"].includes(
      status.toLowerCase()
    );
  }
  // No score/match fields anywhere yet -> still processing.
  return (
    d?.score == null &&
    d?.uniquePercentage == null &&
    d?.plagiarismPercentage == null &&
    d?.matches == null &&
    d?.sources == null
  );
}

function normalizeMatches(rawMatches: any[]): PlagiarismMatch[] {
  if (rawMatches.length > 0) {
    console.log("[quetext] raw match item sample:", JSON.stringify(rawMatches[0], null, 2));
  }
  return rawMatches.map((m) => {
    const urlField = m?.url ?? m?.source ?? m?.sourceUrl ?? m?.link ?? "";
    // Quetext nests the actual link under source.url (confirmed: { source: { url, id } })
    const url = typeof urlField === "string" ? urlField : (urlField?.url ?? urlField?.href ?? "");

    return {
      url,
      // CONFIRMED real field: input_token_count (older guesses kept as fallback
      // in case a different Quetext endpoint/shape uses them instead).
      matchedWords: m?.input_token_count ?? m?.matchedWords ?? m?.wordCount ?? m?.words ?? 0,
      // CONFIRMED real field: percent_similar (0-100).
      percentage: m?.percent_similar ?? m?.percentage ?? m?.percentMatched ?? m?.matchPercentage ?? m?.percent ?? 0,
    };
  });
}

/**
 * Turns the finished-report body into a PlagiarismResult.
 *
 * Fix vs. the previous version: an aggregate percentDuplicated is no longer
 * silently defaulted to 0 just because none of the guessed top-level field
 * names matched. If matches/sources exist, we derive percentDuplicated from
 * them. And if matches exist but every single one parsed to 0% / 0 words
 * (a sign our per-match field-name guesses in normalizeMatches are wrong),
 * we throw QuetextParseError instead of returning a falsely-clean result.
 */
function extractResult(body: any): PlagiarismResult {
  const d = body?.data ?? body; // Quetext wraps the real payload under `data`

  // CONFIRMED from a completed report: `data.score` is a plain number
  // (e.g. 79), not an object — it's the aggregate duplication score.
  // NOTE: `data.percentage` also exists in real responses but is the
  // scan-completion percentage (100 once status is "completed"), NOT the
  // duplication percentage. Do not read percentDuplicated from it.
  const scoreCandidates = {
    percentUnique:
      typeof d?.score === "object" ? d?.score?.percentUnique : undefined,
    percentDuplicated:
      typeof d?.score === "number" ? d.score : d?.score?.percentDuplicated ?? d?.plagiarismPercentage,
  };
  const rawMatches = d?.matches ?? d?.sources;

  const foundScore =
    scoreCandidates.percentUnique != null || scoreCandidates.percentDuplicated != null;
  const foundMatches = Array.isArray(rawMatches);
  const matches = foundMatches ? normalizeMatches(rawMatches) : [];

  // Matches array exists but every entry parsed to nothing usable -> our
  // field-name guesses for percentage/matchedWords are almost certainly
  // wrong for this account/response shape. Don't report this as "clean."
  const allMatchesEmpty =
    matches.length > 0 && matches.every((m) => m.percentage === 0 && m.matchedWords === 0);

  if ((!foundScore && !foundMatches) || (!foundScore && allMatchesEmpty)) {
    throw new QuetextParseError(
      "Quetext response did not contain any recognized score/match fields " +
        "(checked both top level and body.data), or matches were present but " +
        "every one parsed to 0% / 0 words. Log `raw` below (and rawMatches[0], " +
        "already logged above as '[quetext] raw match item sample') to find the " +
        "real field names and update extractResult()/normalizeMatches() accordingly.",
      body
    );
  }

  // Derive percentDuplicated from matches when no explicit aggregate score
  // field was found, instead of defaulting to 0.
  let percentDuplicated = scoreCandidates.percentDuplicated;
  if (percentDuplicated == null) {
    percentDuplicated =
      matches.length > 0
        ? Math.min(100, matches.reduce((sum, m) => sum + m.percentage, 0))
        : 0;
  }
  const percentUnique = scoreCandidates.percentUnique ?? Math.max(0, 100 - percentDuplicated);

  return {
    success: Boolean(body?.status ?? body?.success ?? true),
    score: {
      percentUnique,
      percentDuplicated,
    },
    matches,
    reportId: extractReportId(body),
    raw: body,
  };
}

async function fetchReportStatus(reportId: string) {
  // NOTE: this path is a best-effort guess (Quetext's docs are behind a
  // partner login). If this 404s, check quetext.com/developers-api for the
  // real "get report" endpoint and swap it in here.
  const res = await quetextHttp.get(`/report/${reportId}`, {
    headers: { "X-API-Key": getApiKey() },
  });
  return res.data;
}

/**
 * Submits text to Quetext for a plagiarism scan and returns the report.
 * Throws QuetextApiError on non-2xx responses (including 429 rate limits).
 * Throws QuetextParseError if the response shape doesn't match any known
 * field names, or if matches were found but all parsed empty (see
 * extractResult) — check `raw` on that error to find the actual field
 * names and update scoreCandidates/normalizeMatches above accordingly.
 */
export async function checkPlagiarism(
  content: string,
  options: PlagiarismCheckOptions = {}
): Promise<PlagiarismResult> {
  if (!content || !content.trim()) {
    throw new Error("checkPlagiarism: content must be a non-empty string.");
  }

  try {
    const res = await quetextHttp.post(
      "/report",
      {
        text: content,
        excludedUrl: options.excludedUrl,
        title: options.title,
      },
      {
        headers: { "X-API-Key": getApiKey() },
      }
    );

    let body = res.data;
    console.log("[quetext] initial response:", JSON.stringify(body));

    if ((options.waitForCompletion ?? true) && isPending(body)) {
      const reportId = extractReportId(body);
      if (!reportId) {
        throw new QuetextParseError(
          "Report looks pending but no reportId/id field was found to poll with.",
          body
        );
      }

      const timeoutMs = options.pollTimeoutMs ?? 60_000;
      const start = Date.now();
      let delay = 1000;

      while (Date.now() - start < timeoutMs) {
        await new Promise((r) => setTimeout(r, delay));
        body = await fetchReportStatus(reportId);
        console.log("[quetext] poll response:", JSON.stringify(body));
        if (!isPending(body)) break;
        delay = Math.min(delay * 1.5, 8000); // exponential backoff, capped
      }

      if (isPending(body)) {
        throw new QuetextApiError(
          `Quetext report ${reportId} did not finish within ${timeoutMs}ms.`,
          0,
          body
        );
      }
    }

    return extractResult(body);
  } catch (err) {
    if (err instanceof QuetextParseError) throw err;

    if (axios.isAxiosError(err) && err.response) {
      // 429 = rate limit (10 req / 5s per account); surface status so callers can back off / retry.
      throw new QuetextApiError(
        `Quetext plagiarism scan failed (status ${err.response.status})`,
        err.response.status,
        err.response.data
      );
    }
    throw new QuetextApiError(
      "Quetext plagiarism scan failed: no response received.",
      0,
      null
    );
  }
}