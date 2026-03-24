import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";

interface ThesisProps{
    title: string;
    author: string;
    course: string;
    issueDate: Date;
    abstract: string;
    introduction: string;
    discussion: string;
    references: string;
}

export async function SumbitThesis(req: Request, res: Response){
    try {
        const user_id = req.user?.id;
        const { title, author, course, issueDate, abstract, introduction, discussion, references }: ThesisProps = req.body;

        if(!title || !author || !issueDate || !course || !abstract || !introduction || !discussion || !references){
            res.status(400).json({status: false, message: "All field are required"});
            return;
        }

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
            issue_date: issueDate
        }]);

        if (error) {
              console.error('Supabase error:', error);
              res.status(500).json({ error: 'Failed to create thesis' });
              return
        }

        res.status(200).json({status: true, message: "create successfully",
            data: {
                title,
                author,
                course,
                abstract,
                introduction,
                discussion,
                references
            } 
         });
    } catch (error: any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error'})
        return
    }
}