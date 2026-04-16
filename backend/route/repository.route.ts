import express from 'express';
import multer from 'multer';
import { getRandomThesis, getRepoById, getThesis, SumbitThesis } from '../controller/repository.controller';
import { adminOnly, verifyToken } from '../middleware/middware';
import { downloadThesis, incrementView, sortThesisByYear } from '../controller/dataAnalytics.controller';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', verifyToken, adminOnly, upload.any(), SumbitThesis);
router.get('/getthesis', getThesis)
router.get('/getyear', sortThesisByYear);
router.get('/getbyid/:id', getRepoById);




// dataAnalytics
router.put('/views/:id', verifyToken, incrementView);
router.get('/download/:thesis_id/:filename', downloadThesis);
router.get('/features', getRandomThesis);



export default router; 