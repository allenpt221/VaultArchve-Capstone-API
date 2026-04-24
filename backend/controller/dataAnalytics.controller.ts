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
            .from("Thesis")
            .select("views")
            .eq("id", id)
            .single();

        if (fetchError || !thesisData) {
            return res.status(404).json({ message: "Page not found" });
        }

        // 2️⃣ Increment views
        const { data: updatedPage, error: updateError } = await supabase
            .from("Thesis")
            .update({ views: thesisData.views + 1 })
            .eq("id", id)
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
            .from("Thesis")
            .select("downloads")
            .eq("id", thesis_id)
            .single();

        if (fetchError || !thesisData) {
            return res.status(404).json({ message: "Thesis not found" });
        }

        // 2️⃣ Increment downloads
        await supabase
            .from("Thesis")
            .update({ downloads: (thesisData.downloads || 0) + 1 })
            .eq("id", thesis_id);

        // 3️⃣ Invalidate cache so reload shows updated downloads
        const keys = await redis.keys("thesis:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }

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
    const { year, department, sort = "issue_date", order = "desc" 
    } = req.query as { year?: string; department?: string; sort?: string; order?: "asc" | "desc"; };

    let query = supabase.from("Thesis").select("*");

    // Filter by year
    if (year && year !== "all") {
      const start = `${year}-01-01`;
      const end = `${Number(year) + 1}-01-01`;

      query = query
        .gte("issue_date", start)
        .lt("issue_date", end);
    }

    // Filter by department
    if (department && department !== "all") {
      query = query.eq("course", department);
    }

    // Safe sorting
    const allowedSortColumns = ["issue_date", "title", "author", "views"];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : "issue_date";

    query = query.order(sortColumn, {
      ascending: order === "asc",
    });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}