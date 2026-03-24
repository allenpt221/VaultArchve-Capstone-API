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
}

export async function SumbitThesis(req: Request, res: Response) {
    try {
        const user_id = req.user?.id;
        const { title, author, course, issueDate, abstract, introduction, discussion, references }: ThesisProps = req.body;

        // ✅ Get file from multer (upload.any())
        const files = req.files as Express.Multer.File[];
        const thesis_file = files?.[0];

        // Validate text fields
        if (!title || !author || !issueDate || !course || !abstract || !introduction || !discussion || !references) {
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
        const { error } = await supabase
            .from("Thesis")
            .insert([{
                admin_id: user_id,
                title,
                author,
                course,
                abstract,
                introduction,
                discussion,
                references,
                issue_date: issueDate,
                thesis_file_url,
                thesis_file_name: thesis_file.originalname,
            }]);

        if (error) {
            console.error('Supabase error:', error);

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