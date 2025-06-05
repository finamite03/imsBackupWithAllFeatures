
import express from 'express';
import {
  createSalesReturn,
  getSalesReturns,
  processSalesReturn
} from '../controllers/salesReturnController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSalesReturn)
  .get(protect, getSalesReturns);

router.route('/:id/process')
  .put(protect, manager, processSalesReturn);

export default router;
