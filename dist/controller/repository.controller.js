"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SumbitThesis = SumbitThesis;
exports.UpdateThesis = UpdateThesis;
exports.getThesis = getThesis;
exports.getRandomThesis = getRandomThesis;
exports.getRepoById = getRepoById;
exports.getRepoViewAndDownloads = getRepoViewAndDownloads;
exports.deleteId = deleteId;
const supa_client_1 = require("../supabase/supa-client");
const ioredis_1 = __importDefault(require("../lib/ioredis"));
async function SumbitThesis(req, res) {
    try {
        const user_id = req.user?.id;
        const { title, author, course, issueDate, thesis_abstract, thesis_introduction, thesis_conclusion, thesis_discussion, thesis_references, 
        // ENTRE FIELDS
        entrep_intro, entrep_action_plan, entrep_market_product_description, entrep_survey_result, entrep_target_market, entrep_product, entrep_production, } = req.body;
        const files = req.files;
        const thesis_file = files?.[0];
        const isEntrep = course?.toLowerCase().includes("entrepreneurship");
        // FILE VALIDATION
        if (!thesis_file) {
            return res.status(400).json({ status: false, message: "PDF or DOCX file is required" });
        }
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(thesis_file.mimetype)) {
            return res.status(400).json({ status: false, message: "Only PDF and DOCX files are allowed" });
        }
        // COMMON VALIDATION
        if (!title || !author || !issueDate || !course) {
            return res.status(400).json({ status: false, message: "Missing basic thesis info" });
        }
        // CONDITIONAL VALIDATION
        if (isEntrep) {
            if (!entrep_intro ||
                !entrep_action_plan ||
                !entrep_market_product_description ||
                !entrep_survey_result ||
                !entrep_target_market ||
                !entrep_product ||
                !entrep_production) {
                return res.status(400).json({
                    status: false,
                    message: "All entrepreneurship fields are required",
                });
            }
        }
        else {
            if (!thesis_abstract ||
                !thesis_introduction ||
                !thesis_conclusion ||
                !thesis_discussion ||
                !thesis_references) {
                return res.status(400).json({
                    status: false,
                    message: "All thesis fields are required",
                });
            }
        }
        // UPLOAD FILE
        const userIdSafe = user_id ?? "unknown";
        const fileName = `${userIdSafe}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;
        const { data: uploadData, error: uploadError } = await supa_client_1.supabase.storage
            .from("thesis-files")
            .upload(fileName, thesis_file.buffer, {
            contentType: thesis_file.mimetype,
            upsert: false,
        });
        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return res.status(500).json({ status: false, error: "Failed to upload file" });
        }
        const thesis_file_url = uploadData.path;
        // INSERT DATA
        const { data: thesis, error: thesisError } = await supa_client_1.supabase
            .from("Thesis")
            .insert([
            {
                admin_id: user_id,
                title,
                author,
                course,
                thesis_abstract,
                thesis_introduction,
                thesis_conclusion,
                thesis_discussion,
                thesis_references,
                issue_date: issueDate,
                thesis_file_url,
                thesis_file_name: thesis_file.originalname,
                ...(isEntrep && {
                    entrep_intro,
                    entrep_action_plan,
                    entrep_market_product_description,
                    entrep_survey_result,
                    entrep_target_market,
                    entrep_product,
                    entrep_production,
                }),
            },
        ])
            .select();
        if (thesisError || !thesis?.[0]) {
            console.error("Failed to insert thesis:", thesisError);
            await supa_client_1.supabase.storage.from("thesis-files").remove([fileName]);
            return res.status(500).json({ error: "Failed to create thesis" });
        }
        // ANALYTICS
        await supa_client_1.supabase.from("ThesisDataAnalytics").insert([
            {
                thesis_id: thesis[0].id,
                views: 0,
                downloads: 0,
            },
        ]);
        // CACHE CLEAR
        const keys = await ioredis_1.default.keys("thesis:page:*");
        if (keys.length > 0) {
            await ioredis_1.default.del(...keys);
        }
        return res.status(200).json({
            status: true,
            message: "Thesis created successfully",
            data: thesis[0],
        });
    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function UpdateThesis(req, res) {
    try {
        const { id } = req.params;
        const { title, author, course, issueDate, thesis_abstract, thesis_introduction, thesis_discussion, thesis_references, thesis_conclusion, 
        // ENTRE FIELDS
        entrep_intro, entrep_action_plan, entrep_market_product_description, entrep_survey_result, entrep_target_market, entrep_product, entrep_production, } = req.body;
        const files = req.files;
        const thesis_file = files?.[0];
        let thesis_file_url;
        let thesis_file_name;
        if (thesis_file) {
            const allowedTypes = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            if (!allowedTypes.includes(thesis_file.mimetype)) {
                return res.status(400).json({ status: false, message: "Only PDF and DOCX files are allowed" });
            }
            const fileName = `${id}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;
            const { data: uploadData, error: uploadError } = await supa_client_1.supabase.storage
                .from("thesis-files")
                .upload(fileName, thesis_file.buffer, {
                contentType: thesis_file.mimetype,
                upsert: true,
            });
            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                return res.status(500).json({ status: false, error: "Failed to upload file" });
            }
            thesis_file_url = uploadData.path;
            thesis_file_name = thesis_file.originalname;
        }
        const isEntrep = course?.toLowerCase().includes("entrep");
        const { error } = await supa_client_1.supabase
            .from("Thesis")
            .update({
            title,
            author,
            course,
            issue_date: issueDate,
            thesis_abstract,
            thesis_introduction,
            thesis_discussion,
            thesis_references,
            thesis_conclusion,
            ...(thesis_file_url && { thesis_file_url }),
            ...(thesis_file_name && { thesis_file_name }),
            // ✅ ONLY UPDATE IF ENTRE COURSE
            ...(isEntrep && {
                entrep_intro,
                entrep_action_plan,
                entrep_market_product_description,
                entrep_survey_result,
                entrep_target_market,
                entrep_product,
                entrep_production,
            }),
        })
            .eq("id", id);
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const keys = await ioredis_1.default.keys("thesis:page:*");
        if (keys.length > 0) {
            await ioredis_1.default.del(...keys);
        }
        return res.status(200).json({ message: "Thesis updated successfully" });
    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
async function getThesis(req, res) {
    try {
        const { page, limit } = req.query;
        if (!page || !limit) {
            return res.status(400).json({
                success: false,
                message: 'page and limit are required'
            });
        }
        const cacheKey = `thesis:page:${page}:limit:${limit}`;
        const cached = await ioredis_1.default.get(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, thesis: cached });
        }
        const from = (Number(page) - 1) * Number(limit);
        const to = from + Number(limit) - 1;
        const { data: thesis, error, count } = await supa_client_1.supabase
            .from('Thesis')
            .select('*, ThesisDataAnalytics(views, downloads)', { count: 'exact' })
            .range(from, to);
        if (error)
            throw error;
        const responseData = {
            thesis,
            totalCount: count,
            currentPage: Number(page),
            totalPages: Math.ceil(count / Number(limit)),
        };
        await ioredis_1.default.set(cacheKey, responseData, { ex: 3600 });
        return res.status(200).json({
            success: true,
            thesis: responseData,
        });
    }
    catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getRandomThesis(req, res) {
    try {
        const { data, error } = await supa_client_1.supabase
            .from("Thesis")
            .select("*, ThesisDataAnalytics(views, downloads)")
            .order("created_at", { ascending: Math.random() < 0.5 })
            .limit(4);
        if (error) {
            console.error("Failed to fetch thesis:", error);
            return res.status(500).json({ error: "Failed to fetch thesis" });
        }
        res.status(200).json({ success: true, data, length: data.length });
    }
    catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}
async function getRepoById(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'ID is required' });
        }
        const { data, error } = await supa_client_1.supabase
            .from('Thesis')
            .select('*, ThesisDataAnalytics(views, downloads)')
            .eq('id', id)
            .single();
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        if (!data) {
            return res.status(404).json({ error: 'Not found' });
        }
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getRepoViewAndDownloads(req, res) {
    try {
        const { data, error } = await supa_client_1.supabase
            .from("ThesisDataAnalytics")
            .select("*");
        if (error) {
            console.error("Failed to fetch analytics:", error);
            return res.status(500).json({ status: false, error: "Failed to fetch analytics" });
        }
        return res.status(200).json({ status: true, data });
    }
    catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteId(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }
        const { data: thesis, error: fetchError } = await supa_client_1.supabase
            .from("Thesis")
            .select("thesis_file_url")
            .eq("id", id)
            .single();
        if (fetchError || !thesis) {
            return res.status(404).json({ error: "Thesis not found" });
        }
        if (thesis.thesis_file_url) {
            const { error: storageError } = await supa_client_1.supabase.storage
                .from("thesis-files")
                .remove([thesis.thesis_file_url]);
            if (storageError) {
                console.error("Failed to delete file from storage:", storageError);
            }
        }
        // Delete analytics first (foreign key dependency)
        await supa_client_1.supabase.from('ThesisDataAnalytics').delete().eq('thesis_id', id);
        const { error: deleteError } = await supa_client_1.supabase
            .from("Thesis")
            .delete()
            .eq("id", id);
        if (deleteError) {
            return res.status(500).json({ error: "Failed to delete thesis" });
        }
        const keys = await ioredis_1.default.keys("thesis:page:*");
        if (keys.length > 0) {
            await ioredis_1.default.del(...keys);
        }
        return res.status(200).json({ success: true, message: "Thesis deleted successfully" });
    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
