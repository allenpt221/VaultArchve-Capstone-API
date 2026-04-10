import express from 'express';
import { verifyToken } from '../middleware/middware';
import { ProgressiveIntro, ProgressiveScopeLimitation, ProgressiveTrail, RecommendedAI } from '../controller/generativeAIGroq';



const router = express.Router();

router.post("/recommendation", verifyToken, RecommendedAI);

router.post("/progressive", verifyToken, ProgressiveTrail);
router.post("/progressive/introduction", verifyToken, ProgressiveIntro);
router.post("/progressive/scopelimitation", verifyToken, ProgressiveScopeLimitation);






export default router;