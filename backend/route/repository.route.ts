import express from 'express';
import multer from 'multer';
import { SumbitThesis } from '../controller/repository.controller';
import { adminOnly, verifyToken } from '../middleware/middware';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', verifyToken, adminOnly, upload.any(), SumbitThesis);


export default router; 