import express from 'express';
import { verifyToken } from '../middleware/middware';
// import { ProgressiveIntro, ProgressiveScopeLimitation, ProgressiveTrail } from '../controller/generativeAIGroq';
import { DataAnalysis,  DeleteThesisHistory,  DeleteTopicSelections, FullPaperReview, GetDataAnalyses, GetFullPaperReviews, GetLiteratureReviews, GetMethodologies, GetObjectiveOfStudy, GetThesisHistory, GetTopicSelections, LiteratureReview, Methodology, RecommendedAI, SuggestedObjectives, TopicSelection } from '../controller/generativeAI.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });



const router = express.Router();

router.post("/recommendation", verifyToken, RecommendedAI);

router.post('/topic-selection', verifyToken, TopicSelection)
router.post('/objectives', verifyToken, SuggestedObjectives)
router.post('/literature-review', verifyToken, LiteratureReview)
router.post("/methodology", verifyToken, Methodology);
router.post("/data-analysis", verifyToken, DataAnalysis);
router.post("/paper-reviews", verifyToken, upload.any(), FullPaperReview);




router.get("/thesis-history", verifyToken, GetThesisHistory);
router.get("/topic-selections", verifyToken, GetTopicSelections);
router.get("/literature-reviews", verifyToken, GetLiteratureReviews);
router.get("/objectives", verifyToken, GetObjectiveOfStudy);
router.get("/methodologies", verifyToken, GetMethodologies);
router.get("/data-analysis", verifyToken, GetDataAnalyses);
router.get("/paper-reviews", verifyToken, GetFullPaperReviews);





router.delete("/topic-selections", verifyToken, DeleteTopicSelections);
router.delete("/delete-history/:id", verifyToken, DeleteThesisHistory);









export default router;