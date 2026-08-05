import express from 'express';
import { verifyToken } from '../middleware/middware';
// import { ProgressiveIntro, ProgressiveScopeLimitation, ProgressiveTrail } from '../controller/generativeAIGroq';
import { DeleteMethodology, DeleteTopicSelections, GetLiteratureReviews, GetMethodologies, GetTopicSelections, LiteratureReview, Methodology, RecommendedAI, TopicSelection } from '../controller/generativeAI.controller';
import route from './auth.route';



const router = express.Router();

router.post("/recommendation", verifyToken, RecommendedAI);

router.post('/topic-selection', verifyToken, TopicSelection)
router.post('/literature-review', verifyToken, LiteratureReview)
router.post("/methodology", verifyToken, Methodology);


router.get("/literature-reviews", verifyToken, GetLiteratureReviews);
router.get("/topic-selections", verifyToken, GetTopicSelections);
router.get("/methodologies", verifyToken, GetMethodologies);



router.delete("/topic-selections", verifyToken, DeleteTopicSelections);
router.delete("/methodology", verifyToken, DeleteMethodology);








export default router;