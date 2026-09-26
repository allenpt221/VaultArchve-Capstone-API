import axios from "axios";

const BASE_URL = process.env.QUETEXT_BASE_URL;

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
  raw: unknown;
}

export interface PlagiarismCheckOptions {
  /** A URL to exclude from matching. */
  excludedUrl?: string;

  /** Optional label to help you find this scan later in the dashboard. */
  title?: string;

  /**
   * POST /report only returns a submission id.
   * When true, the code polls until the report is completed.
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

export class QuetextParseError extends Error {
  constructor(
    message: string,
    public readonly raw: unknown
  ) {
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
 * Extract the report/submission ID from a Quetext response.
 */
function extractReportId(body: any): string | null {
  return (
    body?.data?.id ??
    body?.reportId ??
    body?.id ??
    null
  );
}

/**
 * Determines whether a Quetext response is still processing.
 */
function isPending(body: any): boolean {
  const d = body?.data ?? body;
  const status = d?.status ?? d?.state;

  if (typeof status === "string") {
    return [
      "pending",
      "processing",
      "queued",
      "in_progress",
    ].includes(status.toLowerCase());
  }

  return (
    d?.score == null &&
    d?.uniquePercentage == null &&
    d?.plagiarismPercentage == null &&
    d?.matches == null &&
    d?.sources == null
  );
}

/**
 * Normalize Quetext match/source objects.
 */
function normalizeMatches(
  rawMatches: any[]
): PlagiarismMatch[] {
  if (rawMatches.length > 0) {
    console.log(
      "[quetext] raw match item sample:",
      JSON.stringify(rawMatches[0], null, 2)
    );
  }

  return rawMatches.map((m) => {
    const urlField =
      m?.url ??
      m?.source ??
      m?.sourceUrl ??
      m?.link ??
      "";

    const url =
      typeof urlField === "string"
        ? urlField
        : urlField?.url ??
          urlField?.href ??
          "";

    return {
      url,

      // Confirmed Quetext field:
      // input_token_count
      matchedWords:
        m?.input_token_count ??
        m?.matchedWords ??
        m?.wordCount ??
        m?.words ??
        0,

      // Confirmed Quetext field:
      // percent_similar
      percentage:
        m?.percent_similar ??
        m?.percentage ??
        m?.percentMatched ??
        m?.matchPercentage ??
        m?.percent ??
        0,
    };
  });
}

/**
 * Convert the completed Quetext response into our application format.
 */
function extractResult(
  body: any
): PlagiarismResult {
  const d = body?.data ?? body;

  const scoreCandidates = {
    percentUnique:
      typeof d?.score === "object"
        ? d?.score?.percentUnique
        : undefined,

    percentDuplicated:
      typeof d?.score === "number"
        ? d.score
        : d?.score?.percentDuplicated ??
          d?.plagiarismPercentage,
  };

  const rawMatches =
    d?.matches ??
    d?.sources;

  const foundScore =
    scoreCandidates.percentUnique != null ||
    scoreCandidates.percentDuplicated != null;

  const foundMatches =
    Array.isArray(rawMatches);

  const matches =
    foundMatches
      ? normalizeMatches(rawMatches)
      : [];

  const allMatchesEmpty =
    matches.length > 0 &&
    matches.every(
      (m) =>
        m.percentage === 0 &&
        m.matchedWords === 0
    );

  if (
    (!foundScore && !foundMatches) ||
    (!foundScore && allMatchesEmpty)
  ) {
    throw new QuetextParseError(
      "Quetext response did not contain any recognized score/match fields " +
        "(checked both top level and body.data), or matches were present but " +
        "every one parsed to 0% / 0 words. Log `raw` below (and rawMatches[0], " +
        "already logged above as '[quetext] raw match item sample') to find the " +
        "real field names and update extractResult()/normalizeMatches() accordingly.",
      body
    );
  }

  let percentDuplicated =
    scoreCandidates.percentDuplicated;

  if (percentDuplicated == null) {
    percentDuplicated =
      matches.length > 0
        ? Math.min(
            100,
            matches.reduce(
              (sum, m) =>
                sum + m.percentage,
              0
            )
          )
        : 0;
  }

  const percentUnique =
    scoreCandidates.percentUnique ??
    Math.max(
      0,
      100 - percentDuplicated
    );

  return {
    success: Boolean(
      body?.status ??
        body?.success ??
        true
    ),

    score: {
      percentUnique,
      percentDuplicated,
    },

    matches,

    reportId:
      extractReportId(body),

    raw: body,
  };
}

/**
 * Fetch a completed/pending report by ID.
 */
async function fetchReportStatus(
  reportId: string
) {
  const res =
    await quetextHttp.get(
      `/report/${reportId}`,
      {
        headers: {
          "X-API-Key": getApiKey(),
        },
      }
    );

  return res.data;
}

/**
 * Submits text to Quetext for a plagiarism scan.
 */
export async function checkPlagiarism(
  content: string,
  options: PlagiarismCheckOptions = {}
): Promise<PlagiarismResult> {
  if (
    !content ||
    !content.trim()
  ) {
    throw new Error(
      "checkPlagiarism: content must be a non-empty string."
    );
  }

  try {
    const res =
      await quetextHttp.post(
        "/report",
        {
          text: content,
          excludedUrl:
            options.excludedUrl,
          title: options.title,
        },
        {
          headers: {
            "X-API-Key":
              getApiKey(),
          },
        }
      );

    let body = res.data;

    console.log(
      "[quetext] initial response:",
      JSON.stringify(body)
    );

    /*
     * Poll until the report is completed.
     */
    if (
      (options.waitForCompletion ??
        true) &&
      isPending(body)
    ) {
      const reportId =
        extractReportId(body);

      if (!reportId) {
        throw new QuetextParseError(
          "Report looks pending but no reportId/id field was found to poll with.",
          body
        );
      }

      const timeoutMs =
        options.pollTimeoutMs ??
        60_000;

      const start =
        Date.now();

      let delay = 1000;

      while (
        Date.now() - start <
        timeoutMs
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              delay
            )
        );

        body =
          await fetchReportStatus(
            reportId
          );

        console.log(
          "[quetext] poll response:",
          JSON.stringify(body)
        );

        if (!isPending(body)) {
          break;
        }

        delay = Math.min(
          delay * 1.5,
          8000
        );
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
  } catch (err: unknown) {
    /*
     * Preserve Quetext parsing errors.
     */
    if (
      err instanceof
      QuetextParseError
    ) {
      throw err;
    }

    /*
     * Handle Axios-style errors WITHOUT using:
     *
     * axios.isAxiosError(...)
     *
     * This avoids compatibility problems with the installed
     * Axios typings.
     */
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err
    ) {
      const errorWithResponse =
        err as {
          response: {
            status: number;
            data: unknown;
          };
        };

      throw new QuetextApiError(
        `Quetext plagiarism scan failed (status ${errorWithResponse.response.status})`,
        errorWithResponse.response.status,
        errorWithResponse.response.data
      );
    }

    /*
     * Handle normal JavaScript Errors.
     */
    if (
      err instanceof Error
    ) {
      throw new QuetextApiError(
        `Quetext plagiarism scan failed: ${err.message}`,
        0,
        null
      );
    }

    /*
     * Handle anything else thrown that isn't an Error object.
     */
    throw new QuetextApiError(
      "Quetext plagiarism scan failed: no response received.",
      0,
      null
    );
  }
}
