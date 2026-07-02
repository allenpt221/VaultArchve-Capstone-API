import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";
import redis from "../lib/ioredis";
import { sign } from "node:crypto";

interface ThesisProps {
    title: string;
    author: string;
    course: string;
    issueDate: Date;
    abstract: string;
    introduction: string;
    discussion: string;
    references: string;
    conclusion: string;
}

export async function SumbitThesis(req: Request, res: Response) {
    try {
        const user_id = req.user?.id;

        const {
            title,
            author,
            course,
            issueDate,
            thesis_abstract,
            thesis_introduction,
            thesis_conclusion,
            thesis_discussion,
            thesis_references,

            // ENTRE FIELDS
            entrep_intro,
            entrep_action_plan,
            entrep_market_product_description,
            entrep_survey_result,
            entrep_target_market,
            entrep_product,
            entrep_production,
        } = req.body;

        const files = req.files as Express.Multer.File[];
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
            if (
                !entrep_intro ||
                !entrep_action_plan ||
                !entrep_market_product_description ||
                !entrep_survey_result ||
                !entrep_target_market ||
                !entrep_product ||
                !entrep_production
            ) {
                return res.status(400).json({
                    status: false,
                    message: "All entrepreneurship fields are required",
                });
            }
        } else {
            if (
                !thesis_abstract ||
                !thesis_introduction ||
                !thesis_conclusion ||
                !thesis_discussion ||
                !thesis_references
            ) {
                return res.status(400).json({
                    status: false,
                    message: "All thesis fields are required",
                });
            }
        }

        // UPLOAD FILE
        const userIdSafe = user_id ?? "unknown";
        const fileName = `${userIdSafe}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
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
        const { data: thesis, error: thesisError } = await supabase
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
            await supabase.storage.from("thesis-files").remove([fileName]);
            return res.status(500).json({ error: "Failed to create thesis" });
        }

        // ANALYTICS
        await supabase.from("ThesisDataAnalytics").insert([
            {
                thesis_id: thesis[0].id,
                views: 0,
                downloads: 0,
            },
        ]);

        // CACHE CLEAR
        const keys = await redis.keys("thesis:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        return res.status(200).json({
            status: true,
            message: "Thesis created successfully",
            data: thesis[0],
        });

    } catch (error: any) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function UpdateThesis(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const {
            title,
            author,
            course,
            issueDate,
            thesis_abstract,
            thesis_introduction,
            thesis_discussion,
            thesis_references,
            thesis_conclusion,

            entrep_intro,
            entrep_action_plan,
            entrep_market_product_description,
            entrep_survey_result,
            entrep_target_market,
            entrep_product,
            entrep_production,
        } = req.body;

        const files = req.files as Express.Multer.File[];
        const thesis_file = files?.[0];

        let thesis_file_url: string | undefined;
        let thesis_file_name: string | undefined;
        let oldFilePath: string | undefined;

        if (thesis_file) {
            const allowedTypes = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];

            if (!allowedTypes.includes(thesis_file.mimetype)) {
                return res.status(400).json({ status: false, message: "Only PDF and DOCX files are allowed" });
            }

            const { data: existingThesis, error: existingFetchError } = await supabase
                .from("Thesis")
                .select("thesis_file_url")
                .eq("id", id)
                .single();

            if (existingFetchError) {
                console.error("Failed to fetch existing thesis for file swap:", existingFetchError);
            } else {
                oldFilePath = existingThesis?.thesis_file_url;
            }

            const fileName = `${id}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
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

        const { data: updatedRow, error } = await supabase
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
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Only remove the old file once the row update succeeded, and only if a new file actually replaced it
        if (oldFilePath && thesis_file_url && oldFilePath !== thesis_file_url) {
            const { error: oldFileRemoveError, data: oldFileRemoveData } = await supabase.storage
                .from("thesis-files")
                .remove([oldFilePath]);

            if (oldFileRemoveError) {
                console.error("Failed to delete old thesis file from storage:", JSON.stringify(oldFileRemoveError, null, 2));
            } else {
                console.log("Old file removed:", oldFileRemoveData);
            }
        }

        const keys = await redis.keys("thesis:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        return res.status(200).json({ message: "Thesis updated successfully", data: updatedRow });
    } catch (error: any) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export async function getThesis(req: Request, res: Response) {
  try {
    const { page, limit } = req.query as { page: string; limit: string };
    
    if (!page || !limit) {
        return res.status(400).json({
            success: false,
            message: 'page and limit are required'
        });
    }

    const cacheKey = `thesis:page:${page}:limit:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, thesis: cached });
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: thesis, error, count } = await supabase  
      .from('Thesis')
      .select('*, ThesisDataAnalytics(views, downloads)', { count: 'exact' })
      .range(from, to);

    if (error) throw error;  

    const responseData = {
      thesis,
      totalCount: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count! / Number(limit)),
    };

    await redis.set(cacheKey, responseData, { ex: 3600 });

    return res.status(200).json({
      success: true,
      thesis: responseData,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRandomThesis(req: Request, res: Response){
    try {  
        const { data, error } = await supabase
        .from("Thesis")
        .select("*, ThesisDataAnalytics(views, downloads)")
        .order("created_at", { ascending: Math.random() < 0.5 })
        .limit(4);

        if (error) {
           console.error("Failed to fetch thesis:", error);
            return res.status(500).json({ error: "Failed to fetch thesis" });
        }
        res.status(200).json({success: true, data, length: data.length})
    } catch (error:any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

export async function getRepoById(req: Request, res: Response){
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID is required' });
        }
        
        const { data, error } = await supabase
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

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getRepoViewAndDownloads(req: Request, res: Response) {
    try {
        const { data, error } = await supabase
            .from("ThesisDataAnalytics")
            .select("*");

        if (error) {
            console.error("Failed to fetch analytics:", error);
            return res.status(500).json({ status: false, error: "Failed to fetch analytics" });
        }

        return res.status(200).json({ status: true, data });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteId(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }

        const { data: thesis, error: fetchError } = await supabase
            .from("Thesis")
            .select("thesis_file_url")
            .eq("id", id)
            .single();

        if (fetchError || !thesis) {
            return res.status(404).json({ error: "Thesis not found" });
        }

        if (thesis.thesis_file_url) {
            const { error: storageError, data: removeData } = await supabase.storage
                .from("thesis-files")
                .remove([thesis.thesis_file_url]);

            if (storageError) {
                console.error("Failed to delete file from storage:", JSON.stringify(storageError, null, 2));
            } else if (!removeData || removeData.length === 0) {
                console.warn("Storage remove returned no deleted objects for path:", thesis.thesis_file_url);
            } else {
                console.log("Storage file removed:", removeData);
            }
        }

        // Delete analytics first (foreign key dependency)
        await supabase.from('ThesisDataAnalytics').delete().eq('thesis_id', id);

        const { error: deleteError } = await supabase
            .from("Thesis")
            .delete()
            .eq("id", id);

        if (deleteError) {
            return res.status(500).json({ error: "Failed to delete thesis" });
        }

        const keys = await redis.keys("thesis:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        return res.status(200).json({ success: true, message: "Thesis deleted successfully" });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}