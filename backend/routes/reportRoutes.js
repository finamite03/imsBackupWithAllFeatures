import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

import {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getFinancialReport,
  getCustomerReport,
  getSupplierReport
} from '../controllers/reportController.js';

router.get('/sales', protect, getSalesReport);
router.get('/purchase', protect, getPurchaseReport);
router.get('/inventory', protect, getInventoryReport);
router.get('/financial', protect, getFinancialReport);
router.get('/customers', protect, getCustomerReport);
router.get('/suppliers', protect, getSupplierReport);

export default router;