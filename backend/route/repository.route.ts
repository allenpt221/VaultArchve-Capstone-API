import express from 'express';
import multer from 'multer';
import { deleteId, getRandomThesis, getRepoById, getRepoViewAndDownloads, getThesis, SumbitThesis } from '../controller/repository.controller';
import { adminOnly, verifyToken } from '../middleware/middware';
import { downloadThesis, getFilteredThesis, incrementView } from '../controller/dataAnalytics.controller';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', verifyToken, adminOnly, upload.any(), SumbitThesis);
router.get('/getthesis', getThesis)
router.get('/sort', getFilteredThesis);
router.get('/getbyid/:id', getRepoById);
router.delete('/thesis/delete/:id', deleteId);





// dataAnalytics
router.put('/views/:id', verifyToken, incrementView);
router.get('/download/:thesis_id', downloadThesis);
router.get('/features', getRandomThesis);
router.get('/viewsdownloads', getRepoViewAndDownloads);




export default router; 