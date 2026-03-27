import express from 'express';
import { ProgressiveTrail, RecommendedAI } from '../controller/generativeAI.controller';
import { verifyToken } from '../middleware/middware';



const router = express.Router();

router.post("/recommendation", verifyToken, RecommendedAI);

router.post("/progressive", verifyToken, ProgressiveTrail);




export default router;