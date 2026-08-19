import express from "express";
import { verifyToken } from "../middleware/middware";
import { checkSaveStatus, getSavedThesis, saveThesis, unsaveThesis } from "../controller/dataAnalytics.controller";

const route = express.Router();

route.post("/saved", verifyToken, saveThesis);
route.delete("/saved/:thesisId", verifyToken, unsaveThesis);
route.get("/saved/:thesisId/status", verifyToken, checkSaveStatus);
route.get("/saved", verifyToken, getSavedThesis);


export default route;