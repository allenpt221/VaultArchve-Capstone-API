import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";
import { checkMeaningfulText, DAILY_PROMPT_LIMIT, openai } from "./generativeAI.controller";
import { checkDailyLimit } from "../lib/checkDailyLimit";

/**
 * POST /entrep-progressive/concept/guidance
 * Takes a raw business idea + optional context and returns AI guidance:
 * feedback, feasibility, refined concept statement options, name/tagline
 * suggestions, and next steps. Saves the response for history.
 */
export async function EntrepConcept(req: Request, res: Response) {
  try {
    const { idea, context } = req.body;
    const user_id = req.user?.id;

    if (!idea) {
      return res.status(400).json({ message: "Business idea is required." });
    }

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const ideaCheck = checkMeaningfulText(idea, { required: true });
    if (!ideaCheck.valid) {
      return res.status(400).json({ error: ideaCheck.error, message: ideaCheck.message });
    }

    const contextCheck = checkMeaningfulText(context);
    if (!contextCheck.valid) {
      return res.status(400).json({ error: contextCheck.error, message: contextCheck.message });
    }

    const { allowed } = await checkDailyLimit(user_id, "entrepConcept", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const prompt = `
      Business idea: ${idea}

      Additional context: ${context?.trim() ? context : "None provided."}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a business advisor helping an undergraduate student turn a general product/service idea into " +
            "a defined value proposition for an entrepreneurship thesis. Given a raw business idea and optional " +
            "context, respond ONLY with a JSON object shaped as: " +
            `{ "guidance": { "feedback": string, "feasibility": "strong" | "needs_refinement" | "too_broad", ` +
            `"refinedConceptStatements": string[], "suggestedNames": { "name": string, "tagline": string, "rationale": string }[], ` +
            `"nextSteps": string[] } }. ` +
            "feedback should be 2-3 sentences covering the problem being solved, the target pain point, and how " +
            "differentiated the idea currently is. refinedConceptStatements should have exactly 3 alternative " +
            "one-paragraph business concept statements, each tying problem, audience, and differentiation together. " +
            "suggestedNames should have exactly 5 company/brand name ideas, each with a short tagline and a one-sentence " +
            "rationale tying the name back to the business's mission. nextSteps should have 2-3 short actionable items " +
            "for moving to the SWOT Analysis stage.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { guidance } = parsed;

    const { error: saveError } = await supabase.from("entrep_concept_responses").insert({
      user_id,
      idea,
      context: context?.trim() ? context : null,
      feedback: guidance.feedback,
      feasibility: guidance.feasibility,
      refined_concept_statements: guidance.refinedConceptStatements,
      suggested_names: guidance.suggestedNames,
      next_steps: guidance.nextSteps,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}


export async function EntrepSWOT(req: Request, res: Response) {
  try {
    const { idea, conceptStatement, notes } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!conceptStatement) {
      return res.status(400).json({ message: "Business concept statement is required." });
    }

    const conceptCheck = checkMeaningfulText(conceptStatement, { required: true });
    if (!conceptCheck.valid) {
      return res.status(400).json({ error: conceptCheck.error, message: conceptCheck.message });
    }

    const notesCheck = checkMeaningfulText(notes);
    if (!notesCheck.valid) {
      return res.status(400).json({ error: notesCheck.error, message: notesCheck.message });
    }

    const { allowed } = await checkDailyLimit(user_id, "entrepSWOT", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const prompt = `
      Business concept statement: ${conceptStatement}

      Student's rough SWOT notes: ${notes?.trim() ? notes : "None provided."}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a business advisor helping an undergraduate student complete a SWOT analysis for their " +
            "entrepreneurship thesis, based on their finalized business concept. Respond ONLY with a JSON object " +
            "shaped as: " +
            `{ "guidance": { "strengths": string[], "weaknesses": string[], "opportunities": string[], ` +
            `"threats": string[], "soStrategies": string[], "woStrategies": string[], "stContingencies": string[] } }. ` +
            "strengths, weaknesses, opportunities, and threats should each have 3-5 specific, concrete items tied to " +
            "the concept. soStrategies should have 2-3 items combining specific strengths with specific " +
            "opportunities. woStrategies should have 2-3 items showing how weaknesses can be improved using " +
            "opportunities. stContingencies should have 2-3 items showing how strengths defend against threats. " +
            "If the student gave rough notes, refine and build on them instead of ignoring them.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { guidance } = parsed;

    const { error: saveError } = await supabase.from("entrep_swot_responses").insert({
      user_id,
      idea,
      concept_statement: conceptStatement,
      notes: notes?.trim() ? notes : null,
      strengths: guidance.strengths,
      weaknesses: guidance.weaknesses,
      opportunities: guidance.opportunities,
      threats: guidance.threats,
      so_strategies: guidance.soStrategies,
      wo_strategies: guidance.woStrategies,
      st_contingencies: guidance.stContingencies,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function EntrepMarketResearch(req: Request, res: Response) {
  try {
    const { idea, conceptStatement, notes } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!conceptStatement) {
      return res.status(400).json({ message: "Business concept statement is required." });
    }

    const conceptCheck = checkMeaningfulText(conceptStatement, { required: true });
    if (!conceptCheck.valid) {
      return res.status(400).json({ error: conceptCheck.error, message: conceptCheck.message });
    }

    const notesCheck = checkMeaningfulText(notes);
    if (!notesCheck.valid) {
      return res.status(400).json({ error: notesCheck.error, message: notesCheck.message });
    }

    const { allowed } = await checkDailyLimit(user_id, "entrepMarketResearch", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const prompt = `
      Business concept statement: ${conceptStatement}

      Student's rough market notes: ${notes?.trim() ? notes : "None provided."}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a business advisor helping an undergraduate student define their target market and design a " +
            "market research survey for their entrepreneurship thesis, based on their finalized business concept. " +
            "Respond ONLY with a JSON object shaped as: " +
            `{ "guidance": { "primaryMarket": string, "secondaryMarket": string, "segmentationJustification": string, ` +
            `"surveySections": { "id": string, "title": string, "questions": string[] }[] } }. ` +
            "primaryMarket should be 1-2 sentences describing the core target segment (demographics, location, " +
            "behavior). secondaryMarket should be 1-2 sentences describing a viable secondary segment. " +
            "segmentationJustification should be 2-3 sentences explaining why these segments make sense given the " +
            "concept. surveySections should have exactly 9 sections, using single-letter ids 'A' through 'I', " +
            "covering in order: Demographic Profile, Awareness & Exposure, Purchase Behavior, Product Preferences, " +
            "Pricing Sensitivity, Satisfaction with Alternatives, Loyalty/Repeat Intent, Marketing Channel " +
            "Effectiveness, and Suggestions & Feedback. Each section should have 2-4 specific survey questions " +
            "tailored to this business concept, not generic placeholders.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { guidance } = parsed;

    const { error: saveError } = await supabase.from("entrep_market_responses").insert({
      user_id,
      idea,
      concept_statement: conceptStatement,
      notes: notes?.trim() ? notes : null,
      primary_market: guidance.primaryMarket,
      secondary_market: guidance.secondaryMarket,
      segmentation_justification: guidance.segmentationJustification,
      survey_sections: guidance.surveySections,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function EntrepProduction(req: Request, res: Response) {
  try {
    const { idea, conceptStatement, suppliers, dailyOutput, operatingDaysPerWeek, variants } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!conceptStatement) {
      return res.status(400).json({ message: "Business concept statement is required." });
    }

    const conceptCheck = checkMeaningfulText(conceptStatement, { required: true });
    if (!conceptCheck.valid) {
      return res.status(400).json({ error: conceptCheck.error, message: conceptCheck.message });
    }

    if (!Array.isArray(suppliers) || suppliers.length === 0) {
      return res.status(400).json({ message: "At least one supplier is required." });
    }

    if (!dailyOutput) {
      return res.status(400).json({ message: "Daily output is required." });
    }

    const { allowed } = await checkDailyLimit(user_id, "entrepProduction", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const supplierSummary = suppliers
      .map((s: any) => `${s.name} (${s.materials}, qty: ${s.quantity})`)
      .join("; ");

    const prompt = `
      Business concept statement: ${conceptStatement}

      Suppliers: ${supplierSummary}
      Daily output target: ${dailyOutput}
      Operating days per week: ${operatingDaysPerWeek || "Not specified"}
      Product variants: ${variants || "Not specified"}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a business advisor helping an undergraduate student outline the production/service delivery " +
            "process for their entrepreneurship thesis, based on their finalized business concept and the real " +
            "supplier and output data they've gathered. Respond ONLY with a JSON object shaped as: " +
            `{ "guidance": { "processSteps": string[], "feasibilityNote": string } }. ` +
            "processSteps should have 4-7 concrete, ordered steps describing how the product/service moves from " +
            "sourcing to the end customer, specific to this business (not generic manufacturing steps). " +
            "feasibilityNote should be 2-3 sentences commenting on whether the stated daily output and operating " +
            "schedule seem realistic given the suppliers and business type, flagging any obvious gaps or risks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { guidance } = parsed;

    const { error: saveError } = await supabase.from("entrep_production_responses").insert({
      user_id,
      idea,
      concept_statement: conceptStatement,
      suppliers,
      daily_output: dailyOutput,
      operating_days_per_week: operatingDaysPerWeek || null,
      variants: variants || null,
      process_steps: guidance.processSteps,
      feasibility_note: guidance.feasibilityNote,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function EntrepFinancial(req: Request, res: Response) {
  try {
    const { idea, conceptStatement, notes } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!conceptStatement) {
      return res.status(400).json({ message: "Business concept statement is required." });
    }

    const conceptCheck = checkMeaningfulText(conceptStatement, { required: true });
    if (!conceptCheck.valid) {
      return res.status(400).json({ error: conceptCheck.error, message: conceptCheck.message });
    }

    const notesCheck = checkMeaningfulText(notes);
    if (!notesCheck.valid) {
      return res.status(400).json({ error: notesCheck.error, message: notesCheck.message });
    }

    const { allowed } = await checkDailyLimit(user_id, "entrepFinancial", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const prompt = `
      Business concept statement: ${conceptStatement}

      Student's rough financial notes: ${notes?.trim() ? notes : "None provided."}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a business advisor helping an undergraduate student complete the FINAL stage of their " +
            "entrepreneurship thesis: the financial plan. This caps off their full business plan (concept, SWOT, " +
            "market research, production, and now finances), so the guidance should feel like a capstone — " +
            "thorough enough to drop directly into a thesis chapter, not a quick tip. Respond ONLY with a JSON " +
            "object shaped as: " +
            `{ "guidance": { "startupCostCategories": { "category": string, "examples": string[], "note": string }[], ` +
            `"pricingStrategy": string, "revenueModelNote": string, "viabilitySummary": string, "breakEvenNote": string, ` +
            `"fundingOptions": { "source": string, "fitNote": string }[], "keyMetricsToTrack": string[], ` +
            `"riskFlags": string[], "thirtyDayActionPlan": string[], "recommendation": string, "closingSummary": string } }. ` +
            "startupCostCategories should have 4-6 realistic cost categories for this specific business (e.g. " +
            "equipment, permits, initial inventory, marketing launch), each with 2-4 concrete examples of line " +
            "items and a short note on typical scale of cost. pricingStrategy should be 2-3 sentences naming a " +
            "pricing approach (cost-plus, value-based, competitive, etc.) that fits this business type and why. " +
            "revenueModelNote should be 2-3 sentences on how the business actually earns money — one-time sales, " +
            "subscriptions, commissions, etc. — and any secondary revenue streams worth considering. " +
            "viabilitySummary should be 3-4 sentences on what would make this business financially sustainable, " +
            "referencing typical margins and cost structures for this kind of business. breakEvenNote should " +
            "explain in 2-3 sentences the break-even formula (fixed costs divided by contribution margin per " +
            "unit) and what data the student needs to gather to calculate their real number. fundingOptions " +
            "should list 2-4 funding sources realistic for a student-run business at this scale (e.g. personal " +
            "savings, family/friends, small business grants, microloans, crowdfunding), each with a one-sentence " +
            "note on fit. keyMetricsToTrack should list 3-5 specific financial metrics this business should " +
            "monitor once operating (e.g. gross margin, customer acquisition cost, monthly burn rate), tailored " +
            "to the business type. riskFlags should list 2-3 specific financial risks likely for this kind of " +
            "business. thirtyDayActionPlan should list 3-5 concrete, ordered actions the student should take in " +
            "the next month to firm up their real numbers (e.g. get quotes from suppliers, survey target " +
            "customers on willingness to pay). recommendation should be 1-2 sentences of overall next-step " +
            "advice. closingSummary should be 2-3 sentences summarizing the business's overall financial outlook " +
            "and tying together how the concept, market position, and production plan support (or challenge) its " +
            "financial viability, as a fitting close to the full thesis. If the student gave rough notes, refine " +
            "and build on them instead of ignoring them.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { guidance } = parsed;

    const { error: saveError } = await supabase.from("entrep_financial_responses").insert({
      user_id,
      idea,
      concept_statement: conceptStatement,
      notes: notes?.trim() ? notes : null,
      startup_cost_categories: guidance.startupCostCategories,
      pricing_strategy: guidance.pricingStrategy,
      revenue_model_note: guidance.revenueModelNote,
      viability_summary: guidance.viabilitySummary,
      break_even_note: guidance.breakEvenNote,
      funding_options: guidance.fundingOptions,
      key_metrics_to_track: guidance.keyMetricsToTrack,
      risk_flags: guidance.riskFlags,
      thirty_day_action_plan: guidance.thirtyDayActionPlan,
      recommendation: guidance.recommendation,
      closing_summary: guidance.closingSummary,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL CONCEPT RESPONSES FOR THE USER
export async function GetEntrepConcepts(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/entrep-concepts?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("entrep_concept_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your concept history. Please try again.",
      });
    }

    return res.status(200).json({
      concepts: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL SWOT RESPONSES FOR THE USER
export async function GetEntrepSWOTs(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/entrep-swots?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("entrep_swot_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your SWOT history. Please try again.",
      });
    }

    return res.status(200).json({
      swots: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL MARKET RESEARCH RESPONSES FOR THE USER
export async function GetEntrepMarketResearches(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/entrep-market-researches?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("entrep_market_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your market research history. Please try again.",
      });
    }

    return res.status(200).json({
      marketResearches: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL PRODUCTION RESPONSES FOR THE USER
export async function GetEntrepProductions(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/entrep-productions?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("entrep_production_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your production history. Please try again.",
      });
    }

    return res.status(200).json({
      productions: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL FINANCIAL RESPONSES FOR THE USER
export async function GetEntrepFinancials(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/entrep-financials?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("entrep_financial_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your financial history. Please try again.",
      });
    }

    return res.status(200).json({
      financials: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /entrep-progressive/concept/history/:id
 * Deletes one saved Concept-stage response, and cascades to delete any
 * SWOT / Market / Production / Financial responses tied to the same idea.
 */
export async function DeleteEntrepConcept(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;
    const { id } = req.params;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch the concept first so we know its idea (used to cascade delete
    // downstream stage responses built on top of it).
    const { data: concept, error: fetchError } = await supabase
      .from("entrep_concept_responses")
      .select("idea")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !concept) {
      return res.status(404).json({ message: "Concept response not found" });
    }

    const { idea } = concept;

    const { error: deleteConceptError } = await supabase
      .from("entrep_concept_responses")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

    if (deleteConceptError) {
      console.error(deleteConceptError);
      return res.status(500).json({ message: "Failed to delete concept response", error: deleteConceptError });
    }

    const cascadeResults = await Promise.allSettled([
      supabase.from("entrep_swot_responses").delete().eq("idea", idea).eq("user_id", user_id),
      supabase.from("entrep_market_responses").delete().eq("idea", idea).eq("user_id", user_id),
      supabase.from("entrep_production_responses").delete().eq("idea", idea).eq("user_id", user_id),
      supabase.from("entrep_financial_responses").delete().eq("idea", idea).eq("user_id", user_id),
    ]);

    cascadeResults.forEach((result, i) => {
      if (result.status === "rejected") {
        console.log(`Cascade delete failed for table index ${i}:`, result.reason);
      }
    });

    return res.status(200).json({ message: "Concept and related stage responses deleted" });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}