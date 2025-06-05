
import asyncHandler from 'express-async-handler';
import SalesOrder from '../models/salesOrderModel.js';
import SKU from '../models/skuModel.js';
import Transaction from '../models/transactionModel.js';

// @desc    Dispatch sales order
// @route   PUT /api/sales-orders/:id/dispatch
// @access  Private
export const dispatchOrder = asyncHandler(async (req, res) => {
  const { dispatchedItems } = req.body;
  
  const order = await SalesOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  if (order.status !== 'pending_dispatch') {
    res.status(400);
    throw new Error('Order is not ready for dispatch');
  }

  // Validate stock and update inventory
  for (let dispatchItem of dispatchedItems) {
    const sku = await SKU.findById(dispatchItem.sku);
    if (!sku) {
      res.status(404);
      throw new Error(`SKU not found: ${dispatchItem.sku}`);
    }

    if (sku.currentStock < dispatchItem.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${sku.name}. Available: ${sku.currentStock}, Required: ${dispatchItem.quantity}`);
    }

    // Update stock
    await SKU.findByIdAndUpdate(dispatchItem.sku, {
      $inc: { 
        currentStock: -dispatchItem.quantity,
        reservedStock: -dispatchItem.quantity 
      }
    });

    // Create transaction record
    await Transaction.create({
      type: 'outbound',
      sku: dispatchItem.sku,
      quantity: dispatchItem.quantity,
      unitPrice: order.items.find(item => item.sku.toString() === dispatchItem.sku.toString())?.unitPrice || 0,
      totalAmount: dispatchItem.quantity * (order.items.find(item => item.sku.toString() === dispatchItem.sku.toString())?.unitPrice || 0),
      referenceType: 'SalesOrder',
      referenceId: order._id,
      notes: `Dispatched from Sales Order ${order.orderNumber}`,
      createdBy: req.user._id
    });
  }

  // Update order status
  order.dispatchedItems = dispatchedItems;
  order.status = 'dispatched';
  order.dispatchStatus = 'completed';
  
  const updatedOrder = await order.save();
  
  res.json({
    message: 'Order dispatched successfully',
    order: updatedOrder
  });
});
