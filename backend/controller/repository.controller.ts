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
        const { title, author, course, issueDate, abstract, introduction, conclusion, discussion, references }: ThesisProps = req.body;

        const files = req.files as Express.Multer.File[];
        const thesis_file = files?.[0];

        if (!title || !author || !issueDate || !course || !abstract || !conclusion || !introduction || !discussion || !references) {
            res.status(400).json({ status: false, message: "All fields are required" });
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!thesis_file) {
            res.status(400).json({ status: false, message: "PDF or DOCX file is required" });
            return;
        }

        if (!allowedTypes.includes(thesis_file.mimetype)) {
            res.status(400).json({ status: false, message: "Only PDF and DOCX files are allowed" });
            return;
        }

        const fileName = `${user_id}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("thesis-files")
            .upload(fileName, thesis_file.buffer, {
                contentType: thesis_file.mimetype,
                upsert: false,
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            res.status(500).json({ status: false, error: "Failed to upload file" });
            return;
        }

        const thesis_file_url = uploadData.path;

        const { data: thesis, error: thesisError } = await supabase
            .from("Thesis")
            .insert([{
                admin_id: user_id,
                title,
                author,
                course,
                abstract,
                introduction,
                conclusion,
                discussion,
                references,
                issue_date: issueDate,
                thesis_file_url,
                thesis_file_name: thesis_file.originalname,
            }])
            .select();

        // ✅ Error check FIRST before analytics insert
        if (thesisError || !thesis?.[0]) {
            console.error("Failed to insert thesis:", thesisError);
            await supabase.storage.from("thesis-files").remove([fileName]);
            return res.status(500).json({ error: "Failed to create thesis" });
        }

        // ✅ Analytics insert AFTER error check with default values
        await supabase.from('ThesisDataAnalytics').insert([{
            thesis_id: thesis[0].id,
            views: 0,
            downloads: 0
        }]);

        // ✅ Invalidate cache so new thesis appears immediately
        const keys = await redis.keys("thesis:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        res.status(200).json({
            status: true,
            message: "Thesis created successfully",
            data: {
                title,
                author,
                course,
                abstract,
                introduction,
                issueDate,
                discussion,
                references,
                thesis_file_url,
                thesis_file_name: thesis_file.originalname,
            }
        });

    } catch (error: any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

export async function UpdateThesis(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { title, author, course, issueDate, abstract, introduction, discussion, references, conclusion }: ThesisProps = req.body;

        const files = req.files as Express.Multer.File[];
        const thesis_file = files?.[0];

        let thesis_file_url: string | undefined;
        let thesis_file_name: string | undefined;

        if (thesis_file) {
            const allowedTypes = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];

            if (!allowedTypes.includes(thesis_file.mimetype)) {
                res.status(400).json({ status: false, message: "Only PDF and DOCX files are allowed" });
                return;
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
                res.status(500).json({ status: false, error: "Failed to upload file" });
                return;
            }

            thesis_file_url = uploadData.path;
            thesis_file_name = thesis_file.originalname;
        }

        const { error } = await supabase
            .from("Thesis")
            .update({
                title,
                author,
                course,
                issue_date: issueDate,
                abstract,
                introduction,
                discussion,
                references,
                conclusion,
                ...(thesis_file_url && { thesis_file_url }),
                ...(thesis_file_name && { thesis_file_name }),
            })
            .eq('id', id);

        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }

        // Invalidate cache
        const keys = await redis.keys("thesis:page:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        res.status(200).json({ message: 'Thesis updated successfully' });
    } catch (error: any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
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
            const { error: storageError } = await supabase.storage
                .from("thesis-files")
                .remove([thesis.thesis_file_url]);

            if (storageError) {
                console.error("Failed to delete file from storage:", storageError);
            }
        }

        // ✅ Delete analytics first (foreign key dependency)
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