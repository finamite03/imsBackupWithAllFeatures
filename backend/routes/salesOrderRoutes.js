
import express from 'express';
import {
  createSalesOrder,
  getSalesOrders,
  getSalesOrderById,
  updateSalesOrder,
  deleteSalesOrder,
  getSalesOrderStats
} from '../controllers/salesOrderController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSalesOrder)
  .get(protect, getSalesOrders);

router.route('/stats')
  .get(protect, getSalesOrderStats);

router.route('/:id')
  .get(protect, getSalesOrderById)
  .put(protect, updateSalesOrder)
  .delete(protect, manager, deleteSalesOrder);

export default router;
