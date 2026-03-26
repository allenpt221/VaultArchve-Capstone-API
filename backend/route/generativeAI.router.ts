import express from 'express';
import { RecommendedAI } from '../controller/generativeAI.controller';
import { verifyToken } from '../middleware/middware';



const router = express.Router();

router.post("/recommendation", verifyToken, RecommendedAI);



export default router;