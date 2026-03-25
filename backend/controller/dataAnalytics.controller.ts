import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";

interface DownloadProps{
    thesis_id: string;
    filename: string;
}

export async function incrementView(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ message: "ID is required" });

        // 1️⃣ Get current views
        const { data: thesisData, error: fetchError } = await supabase
            .from("ThesisData")
            .select("views")
            .eq("thesis_id", id)
            .single();

        if (fetchError || !thesisData) {
            return res.status(404).json({ message: "Page not found" });
        }

        // 2️⃣ Increment views
        const { data: updatedPage, error: updateError } = await supabase
            .from("ThesisData")
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
        const { thesis_id, filename } = req.params;

        if (!thesis_id || !filename) {
            return res.status(400).json({ message: "Thesis ID and filename are required" });
        }

        const { data: thesisData, error: fetchError } = await supabase
            .from("ThesisData")
            .select("downloads")
            .eq("thesis_id", thesis_id)
            .single();

        // If row does not exist, create it
        if (fetchError || !thesisData) {
            await supabase
                .from("ThesisData")
                .insert({ thesis_id, downloads: 1, views: 0 });
        } else {
            // Increment downloads
            await supabase
                .from("ThesisData")
                .update({ downloads: (thesisData.downloads || 0) + 1 })
                .eq("thesis_id", thesis_id);
        }

        // Generate signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from("thesis-files")
            .createSignedUrl(filename, 60);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error(signedUrlError);
            return res.status(500).json({ message: "Failed to generate download link" });
        }

        // Redirect to signed URL
        res.redirect(signedUrlData.signedUrl);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}