import express from "express";
import { verifyToken } from "../middleware/middware";
import { checkSaveStatus, getSavedThesis, saveThesis, unsaveThesis } from "../controller/dataAnalytics.controller";

const router = express.Router();

router.post("/saved", verifyToken, saveThesis);
router.delete("/saved/:thesisId", verifyToken, unsaveThesis);
router.get("/saved/:thesisId/status", verifyToken, checkSaveStatus);
router.get("/saved", verifyToken, getSavedThesis);


export default router;