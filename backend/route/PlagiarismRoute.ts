import { Router, Request, Response } from "express";
import { checkPlagiarism, QuetextApiError, QuetextParseError } from "../lib/Originalityclient";

const router = Router();

const MIN_WORDS = 50;

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((tok) => /\w/.test(tok)).length; // ignore stray punctuation-only tokens
}

router.post("/check", async (req: Request, res: Response) => {
  const { text, title } = req.body as { text?: string; title?: string };

  if (!text || typeof text !== "string" || !text.trim()) {
    console.warn("[plagiarism] rejected: empty or missing 'text' field");
    return res.status(400).json({ error: "Request body must include a non-empty 'text' field." });
  }

  const wordCount = countWords(text);
  console.log(`[plagiarism] incoming request, wordCount=${wordCount}, title=${title ?? "(none)"}`);

  // Results are unreliable under ~50 words for most plagiarism scanners.
  if (wordCount < MIN_WORDS) {
    console.warn(`[plagiarism] rejected: wordCount=${wordCount} < ${MIN_WORDS}, short-circuiting before Quetext call`);
    return res.status(400).json({
      error: `Text is too short for a reliable plagiarism scan (minimum ~${MIN_WORDS} words recommended).`,
      wordCount,
    });
  }

  try {
    console.log("[plagiarism] calling checkPlagiarism()...");
    const result = await checkPlagiarism(text, { title });
    console.log(
      `[plagiarism] Quetext responded: reportId=${result.reportId}, percentDuplicated=${result.score.percentDuplicated}`
    );

    return res.json({
      percentUnique: result.score.percentUnique,
      percentDuplicated: result.score.percentDuplicated,
      flagged: result.score.percentDuplicated >= 20, // adjust threshold to your policy
      matches: result.matches,
      reportId: result.reportId,
    });
  } catch (err) {
    if (err instanceof QuetextParseError) {
      console.error("[plagiarism] QuetextParseError, raw body:", JSON.stringify(err.raw, null, 2));
      const isProd = process.env.NODE_ENV === "production";
      return res.status(502).json({
        error: "Plagiarism provider returned an unrecognized response shape.",
        ...(isProd ? {} : { raw: err.raw }), // dev-only: shows real field names so we can fix extractResult()
      });
    }
    if (err instanceof QuetextApiError) {
      console.error(`[plagiarism] QuetextApiError status=${err.status}`, err.body);

      if (err.status === 429) {
        return res.status(429).json({ error: "Rate limit reached, please retry shortly." });
      }

      // Quetext returns 402 with { balance_words, needed_words } when the
      // account doesn't have enough word-credits left for this scan. Surface
      // this distinctly from a generic provider error so it's clear this is
      // a billing/top-up issue, not a transient outage or bad input.
      if (err.status === 402) {
        console.error(
          `[plagiarism] QuetextApiError: insufficient credits`,
          err.body
        );
        return res.status(402).json({
          error: "Plagiarism provider account is out of credits. Top up your Quetext balance to continue.",
          details: err.body, // includes balance_words / needed_words from Quetext
        });
      }

      return res.status(502).json({ error: "Plagiarism provider error.", details: err.body });
    }

    // Don't swallow the real cause — this is often why "nothing happens"
    // with no clue why.
    console.error("[plagiarism] unexpected error:", err);
    const isProd = process.env.NODE_ENV === "production";
    return res.status(500).json({
      error: "Unexpected error running plagiarism check.",
      ...(isProd ? {} : { message: (err as Error)?.message, stack: (err as Error)?.stack }),
    });
  }
});

export default router;