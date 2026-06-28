"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middware_1 = require("../middleware/middware");
const generativeAIGroq_1 = require("../controller/generativeAIGroq");
const router = express_1.default.Router();
router.post("/recommendation", middware_1.verifyToken, generativeAIGroq_1.RecommendedAI);
router.post("/progressive", middware_1.verifyToken, generativeAIGroq_1.ProgressiveTrail);
router.post("/progressive/introduction", middware_1.verifyToken, generativeAIGroq_1.ProgressiveIntro);
router.post("/progressive/scopelimitation", middware_1.verifyToken, generativeAIGroq_1.ProgressiveScopeLimitation);
exports.default = router;
