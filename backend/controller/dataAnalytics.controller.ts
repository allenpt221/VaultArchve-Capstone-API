import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";
import redis from "../lib/ioredis";
import { downloadLimiter } from "../lib/ratelimit";

interface DownloadProps{
    thesis_id: string;
    filename: string;
}

interface queryProps{
    year: string;
    department: string;
    sort: string;
    order: "asc" | "desc";
}

export async function incrementView(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ message: "ID is required" });

        // 1️⃣ Get current views
        const { data: thesisData, error: fetchError } = await supabase
            .from("ThesisDataAnalytics")
            .select("views")
            .eq("thesis_id", id)
            .single();

        if (fetchError || !thesisData) {
            return res.status(404).json({ message: "Page not found" });
        }

        // 2️⃣ Increment views
        const { data: updatedPage, error: updateError } = await supabase
            .from("ThesisDataAnalytics")
            .update({ views: thesisData.views + 1 })
            .eq("thesis_id", id)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({ message: "Failed to increment views", error: updateError });
        }
        

        return res.status(200).json({
            message: "View count incremented",
            views: updatedPage.views,
        });

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function downloadThesis(req: Request<DownloadProps>, res: Response) {
    try {
        const { thesis_id } = req.params;
        const filename = req.query.filename as string;
        const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown";

        if (!thesis_id || !filename) {
            return res.status(400).json({ message: "Thesis ID and filename are required" });
        }

        const { success, remaining } = await downloadLimiter.limit(`download:${ip}:${thesis_id}`);

        if (!success) {
            return res.status(429).json({
                message: "Too many downloads. Please try again later.",
                remaining,
            });
        }

        const { data: thesisData, error: fetchError } = await supabase
            .from("ThesisDataAnalytics")
            .select("downloads")
            .eq("thesis_id", thesis_id)
            .single();

        if (fetchError || !thesisData) {
            return res.status(404).json({ message: "Thesis not found" });
        }

        // 2️⃣ Increment downloads
        await supabase
            .from("ThesisDataAnalytics")
            .update({ downloads: (thesisData.downloads || 0) + 1 })
            .eq("thesis_id", thesis_id);

        // 4️⃣ Generate signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from("thesis-files")
            .createSignedUrl(filename, 60);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error(signedUrlError);
            return res.status(500).json({ message: "Failed to generate download link" });
        }

        return res.status(200).json({ url: signedUrlData.signedUrl });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export async function getFilteredThesis(req: Request, res: Response) {
  try {
    const {
      search,
      year,
      department,
      sort = "issue_date",
      order = "desc",
      page = "1",
      per_page = "10",
    } = req.query as {
      search?: string;
      year?: string;
      department?: string;
      sort?: string;
      order?: "asc" | "desc";
      page?: string;
      per_page?: string;
    };

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const perPage     = Math.min(100, Math.max(1, parseInt(per_page, 10) || 10));

    const allowedSortColumns = ["issue_date", "title", "author", "views"];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : "issue_date";

    // Fetch ALL matching rows first — no .range() — so search works across every page
    let query = supabase
      .from("Thesis")
      .select('*, ThesisDataAnalytics(views, downloads)', { count: 'exact' })
      .order(sortColumn, { ascending: order === "asc" });

    // Search across ALL records before paginating
    if (search && search.trim() !== "") {
      query = query.or(`title.ilike.%${search.trim()}%,author.ilike.%${search.trim()}%`);
    }

    if (year && year !== "all") {
      query = query
        .gte("issue_date", `${year}-01-01`)
        .lt("issue_date",  `${Number(year) + 1}-01-01`);
    }

    if (department && department !== "all") {
      query = query.eq("course", department);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Paginate in memory AFTER all filters are applied
    const total    = data.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const from     = (currentPage - 1) * perPage;
    const paginated = data.slice(from, from + perPage);

    return res.status(200).json({
      data:         paginated,
      total,
      current_page: currentPage,
      last_page:    lastPage,
      per_page:     perPage,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
