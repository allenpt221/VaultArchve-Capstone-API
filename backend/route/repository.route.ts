import express from 'express';
import multer from 'multer';
import { deleteId, ExtractThesisAbstract, getRandomThesis, getRepoById, getRepoViewAndDownloads, getThesis, SumbitThesis, UpdateThesis, uploadPdf } from '../controller/repository.controller';
import { adminOrFaculty, verifyToken } from '../middleware/middware';
import { downloadThesis, getFilteredThesis, incrementView } from '../controller/dataAnalytics.controller';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', verifyToken, adminOrFaculty, upload.any(), SumbitThesis);
router.post("/thesis/extract-abstract", verifyToken, adminOrFaculty, uploadPdf, ExtractThesisAbstract);

router.get('/getthesis', getThesis)
router.get('/sort', getFilteredThesis);
router.get('/getbyid/:id', getRepoById);


router.delete('/thesis/delete/:id', deleteId);
router.put('/thesis/update/:id', verifyToken, adminOrFaculty, upload.any(), UpdateThesis);






// dataAnalytics
router.put('/views/:id', verifyToken, incrementView);
router.get('/download/:thesis_id', verifyToken, downloadThesis);
router.get('/features', getRandomThesis);
router.get('/viewsdownloads', getRepoViewAndDownloads);




export default router; 