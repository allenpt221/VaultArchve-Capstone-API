"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const repository_controller_1 = require("../controller/repository.controller");
const middware_1 = require("../middleware/middware");
const dataAnalytics_controller_1 = require("../controller/dataAnalytics.controller");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/create', middware_1.verifyToken, middware_1.adminOnly, upload.any(), repository_controller_1.SumbitThesis);
router.get('/getthesis', repository_controller_1.getThesis);
router.get('/sort', dataAnalytics_controller_1.getFilteredThesis);
router.get('/getbyid/:id', repository_controller_1.getRepoById);
router.delete('/thesis/delete/:id', repository_controller_1.deleteId);
router.put('/thesis/update/:id', middware_1.verifyToken, middware_1.adminOnly, upload.any(), repository_controller_1.UpdateThesis);
// dataAnalytics
router.put('/views/:id', middware_1.verifyToken, dataAnalytics_controller_1.incrementView);
router.get('/download/:thesis_id', dataAnalytics_controller_1.downloadThesis);
router.get('/features', repository_controller_1.getRandomThesis);
router.get('/viewsdownloads', repository_controller_1.getRepoViewAndDownloads);
exports.default = router;
