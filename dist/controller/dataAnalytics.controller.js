"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementView = incrementView;
exports.downloadThesis = downloadThesis;
exports.getFilteredThesis = getFilteredThesis;
exports.saveThesis = saveThesis;
exports.unsaveThesis = unsaveThesis;
exports.checkSaveStatus = checkSaveStatus;
exports.getSavedThesis = getSavedThesis;
const supa_client_1 = require("../supabase/supa-client");
const ratelimit_1 = require("../lib/ratelimit");
async function incrementView(req, res) {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ message: "ID is required" });
        const { data: thesisData, error: fetchError } = await supa_client_1.supabase
            .from("ThesisDataAnalytics")
            .select("views")
            .eq("thesis_id", id)
            .single();
        if (fetchError || !thesisData) {
            return res.status(404).json({ message: "Page not found" });
        }
        const { data: updatedPage, error: updateError } = await supa_client_1.supabase
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function downloadThesis(req, res) {
    try {
        const { thesis_id } = req.params;
        const filename = req.query.filename;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!thesis_id || !filename) {
            return res.status(400).json({ message: "Thesis ID and filename are required" });
        }
        const { success, remaining, reset } = await ratelimit_1.downloadLimiter.limit(`download:${userId}`);
        if (!success) {
            return res.status(429).json({
                message: "Too many downloads. Please try again later.",
                remaining,
                retryAfter: Math.ceil((reset - Date.now()) / 1000) + " seconds",
            });
        }
        const { data: thesisData, error: fetchError } = await supa_client_1.supabase
            .from("ThesisDataAnalytics")
            .select("downloads")
            .eq("thesis_id", thesis_id)
            .single();
        if (fetchError || !thesisData) {
            return res.status(404).json({ message: "Thesis not found" });
        }
        await supa_client_1.supabase
            .from("ThesisDataAnalytics")
            .update({ downloads: (thesisData.downloads || 0) + 1 })
            .eq("thesis_id", thesis_id);
        const { data: signedUrlData, error: signedUrlError } = await supa_client_1.supabase
            .storage
            .from("thesis-files")
            .createSignedUrl(filename, 60);
        if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error(signedUrlError);
            return res.status(500).json({ message: "Failed to generate download link" });
        }
        return res.status(200).json({ url: signedUrlData.signedUrl });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
async function getFilteredThesis(req, res) {
    try {
        const { search, year, department, sort = "issue_date", order = "desc", } = req.query;
        const allowedSortColumns = ["issue_date", "title", "author", "views"];
        const sortColumn = allowedSortColumns.includes(sort) ? sort : "issue_date";
        const isRelatedSort = ["views", "downloads"].includes(sortColumn);
        let query = supa_client_1.supabase
            .from("Thesis")
            .select('*, ThesisDataAnalytics(views, downloads, saves)', { count: 'exact' });
        if (!isRelatedSort) {
            query = query.order(sortColumn, { ascending: order === "asc" });
        }
        if (search && search.trim() !== "") {
            query = query.or(`title.ilike.%${search.trim()}%,author.ilike.%${search.trim()}%`);
        }
        if (year && year !== "all") {
            query = query
                .gte("issue_date", `${year}-01-01`)
                .lt("issue_date", `${Number(year) + 1}-01-01`);
        }
        if (department && department !== "all") {
            query = query.eq("course", department);
        }
        const { data, error } = await query;
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        let sorted = [...data];
        if (isRelatedSort) {
            sorted.sort((a, b) => {
                const aVal = Array.isArray(a.ThesisDataAnalytics)
                    ? (a.ThesisDataAnalytics[0]?.[sortColumn] ?? 0)
                    : (a.ThesisDataAnalytics?.[sortColumn] ?? 0);
                const bVal = Array.isArray(b.ThesisDataAnalytics)
                    ? (b.ThesisDataAnalytics[0]?.[sortColumn] ?? 0)
                    : (b.ThesisDataAnalytics?.[sortColumn] ?? 0);
                return order === "asc" ? aVal - bVal : bVal - aVal;
            });
        }
        return res.status(200).json({
            data: sorted,
            total: sorted.length,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
}
async function saveThesis(req, res) {
    try {
        const { thesisId } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!thesisId) {
            return res.status(400).json({ message: "Thesis ID is required" });
        }
        const { error: insertError } = await supa_client_1.supabase
            .from("thesisSaved")
            .insert({ user_id: userId, thesis_id: thesisId });
        if (insertError) {
            if (insertError.code === "23505") {
                return res.status(409).json({ message: "Thesis already saved" });
            }
            console.error(insertError);
            return res.status(500).json({ message: "Failed to save thesis", error: insertError });
        }
        // Same proven pattern as incrementView/downloadThesis instead of an RPC call
        const { data: analyticsData, error: fetchError } = await supa_client_1.supabase
            .from("ThesisDataAnalytics")
            .select("saves")
            .eq("thesis_id", thesisId)
            .single();
        if (fetchError || !analyticsData) {
            console.error("Failed to fetch saves count:", fetchError);
        }
        else {
            const { error: updateError } = await supa_client_1.supabase
                .from("ThesisDataAnalytics")
                .update({ saves: (analyticsData.saves || 0) + 1 })
                .eq("thesis_id", thesisId);
            if (updateError) {
                console.error("Failed to increment saves count:", updateError);
            }
        }
        return res.status(200).json({ message: "Thesis saved" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function unsaveThesis(req, res) {
    try {
        const { thesisId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!thesisId) {
            return res.status(400).json({ message: "Thesis ID is required" });
        }
        const { data: deleted, error: deleteError } = await supa_client_1.supabase
            .from("thesisSaved")
            .delete()
            .eq("user_id", userId)
            .eq("thesis_id", thesisId)
            .select();
        if (deleteError) {
            console.error(deleteError);
            return res.status(500).json({ message: "Failed to unsave thesis", error: deleteError });
        }
        if (deleted && deleted.length > 0) {
            // Same proven pattern as incrementView/downloadThesis instead of an RPC call
            const { data: analyticsData, error: fetchError } = await supa_client_1.supabase
                .from("ThesisDataAnalytics")
                .select("saves")
                .eq("thesis_id", thesisId)
                .single();
            if (fetchError || !analyticsData) {
                console.error("Failed to fetch saves count:", fetchError);
            }
            else {
                const { error: updateError } = await supa_client_1.supabase
                    .from("ThesisDataAnalytics")
                    .update({ saves: Math.max((analyticsData.saves || 0) - 1, 0) })
                    .eq("thesis_id", thesisId);
                if (updateError) {
                    console.error("Failed to decrement saves count:", updateError);
                }
            }
        }
        return res.status(200).json({ message: "Thesis unsaved" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function checkSaveStatus(req, res) {
    try {
        const { thesisId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { data, error } = await supa_client_1.supabase
            .from("thesisSaved")
            .select("id")
            .eq("user_id", userId)
            .eq("thesis_id", thesisId)
            .maybeSingle();
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to check save status", error });
        }
        return res.status(200).json({ saved: !!data });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getSavedThesis(req, res) {
    try {
        const userId = req.user?.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const { data, error, count } = await supa_client_1.supabase
            .from("thesisSaved")
            .select('id, createdAt, Thesis(*, ThesisDataAnalytics(views, downloads, saves))', { count: 'exact' })
            .eq("user_id", userId)
            .order("createdAt", { ascending: false })
            .range(from, to);
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to fetch saved thesis", error });
        }
        const totalCount = count ?? 0;
        const totalPages = Math.ceil(totalCount / limit);
        return res.status(200).json({
            savedThesis: {
                savedThesis: data,
                totalCount,
                currentPage: page,
                totalPages,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
