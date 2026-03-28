import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";

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
        

        // ✅ Get file from multer (upload.any())
        const files = req.files as Express.Multer.File[];
        const thesis_file = files?.[0];

        // Validate text fields
        if (!title || !author || !issueDate || !course || !abstract || !conclusion || !introduction || !discussion || !references) {
            res.status(400).json({ status: false, message: "All fields are required" });
            return;
        }

        // Validate file
        if (!thesis_file) {
            res.status(400).json({ status: false, message: "PDF file is required" });
            return;
        }

        // Validate PDF file type
        if (thesis_file.mimetype !== "application/pdf") {
            res.status(400).json({ status: false, message: "Only PDF files are allowed" });
            return;
        }

        // Upload PDF to Supabase Storage
        const fileName = `${user_id}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("thesis-files")
            .upload(fileName, thesis_file.buffer, {
                contentType: "application/pdf",
                upsert: false,
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            res.status(500).json({ status: false, error: "Failed to upload PDF file" });
            return;
        }

        // Get public URL of the uploaded file
        const { data: urlData } = supabase.storage
            .from("thesis-files")
            .getPublicUrl(uploadData.path);

        const thesis_file_url = urlData.publicUrl; // properly declared here

        // Save thesis record to database
        const {  data: thesis, error: thesisError } = await supabase
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


            if (thesisError || !thesis?.[0]) {
                console.error("Failed to insert thesis:", thesisError);
                return res.status(500).json({ error: "Failed to create thesis" });
            }

            const { error: thesisDataError } = await supabase
                .from("ThesisData")
                .insert([{
                    thesis_id: thesis[0].id
                }]);

            if (thesisDataError) {
                console.error("Failed to insert ThesisData:", thesisDataError);
                return res.status(500).json({ error: "Failed to create ThesisData record" });
            }


        if (thesisError) {
            console.error('Supabase error:', thesisError);

            // Rollback: remove uploaded file if DB insert fails
            await supabase.storage.from("thesis-files").remove([fileName]);

            res.status(500).json({ error: 'Failed to create thesis' });
            return;
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

export async function getThesis(req: Request, res: Response){
    try {
        const { data: thesis, error } = await supabase
        .from("Thesis")
        .select("*");

        if (error) {
            res.status(500).json({ error: 'Failed to fetch thesis' });
            return;
        }

        res.status(200).json(thesis)
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}


export async function getRandomThesis(req: Request, res: Response){
    try {
        
        const { data, error } = await supabase
        .from("Thesis")
        .select("*")
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