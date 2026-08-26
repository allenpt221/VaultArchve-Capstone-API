import express from 'express'
import {
  EntrepConcept,
  EntrepSWOT,
  EntrepMarketResearch,
  EntrepProduction,
  EntrepFinancial,
  GetEntrepConcepts,
  GetEntrepSWOTs,
  GetEntrepMarketResearches,
  GetEntrepProductions,
  GetEntrepFinancials,
  DeleteEntrepConcept,
} from '../controller/EntrepGenerative.controller';
import { verifyToken } from '../middleware/middware';

const router = express.Router();

// POST — generate AI guidance for each stage
router.post('/concept', verifyToken, EntrepConcept);
router.post('/swot', verifyToken, EntrepSWOT);
router.post('/market-research', verifyToken, EntrepMarketResearch);
router.post('/production', verifyToken, EntrepProduction);
router.post('/financial', verifyToken, EntrepFinancial);

// GET — fetch the current user's saved history for each stage
router.get('/concepts', verifyToken, GetEntrepConcepts);
router.get('/swots', verifyToken, GetEntrepSWOTs);
router.get('/market-researches', verifyToken, GetEntrepMarketResearches);
router.get('/productions', verifyToken, GetEntrepProductions);
router.get('/financials', verifyToken, GetEntrepFinancials);

// DELETE — delete a concept, cascading to its SWOT/Market/Production/Financial records
router.delete('/concept/:id', verifyToken, DeleteEntrepConcept);

export default router;