import express from 'express';
import { SumbitThesis } from '../controller/repository.controller';
import { adminOnly, verifyToken } from '../middleware/middware';

const router = express.Router();

router.post('/create', verifyToken, adminOnly, SumbitThesis);


export default router; 