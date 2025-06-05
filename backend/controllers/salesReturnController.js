
import asyncHandler from 'express-async-handler';
import SalesReturn from '../models/salesReturnModel.js';
import SalesOrder from '../models/salesOrderModel.js';
import SKU from '../models/skuModel.js';
import Transaction from '../models/transactionModel.js';

// @desc    Create new sales return
// @route   POST /api/sales-returns
// @access  Private
export const createSalesReturn = asyncHandler(async (req, res) => {
  const { salesOrder, customer, returnDate, reason, actionRequired, items, totalAmount, notes } = req.body;

  // Validate sales order exists
  const order = await SalesOrder.findById(salesOrder);
  if (!order) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  // Validate return quantities
  for (let returnItem of items) {
    const orderItem = order.items.find(item => item.sku.toString() === returnItem.sku.toString());
    if (!orderItem) {
      res.status(400);
      throw new Error('Item not found in original order');
    }

    if (returnItem.quantity > orderItem.quantity) {
      res.status(400);
      throw new Error(`Return quantity exceeds ordered quantity for SKU ${returnItem.sku}`);
    }
  }

  const salesReturn = await SalesReturn.create({
    salesOrder,
    customer,
    returnDate,
    reason,
    actionRequired,
    items,
    totalAmount,
    notes,
    createdBy: req.user._id
  });

  const populatedReturn = await SalesReturn.findById(salesReturn._id)
    .populate('salesOrder', 'orderNumber')
    .populate('customer', 'name email')
    .populate('items.sku', 'name sku');

  res.status(201).json(populatedReturn);
});

// @desc    Get all sales returns
// @route   GET /api/sales-returns
// @access  Private
export const getSalesReturns = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const returns = await SalesReturn.find()
    .populate('salesOrder', 'orderNumber')
    .populate('customer', 'name email')
    .populate('items.sku', 'name sku')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await SalesReturn.countDocuments();

  res.json({
    returns,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalReturns: total
  });
});

// @desc    Process sales return
// @route   PUT /api/sales-returns/:id/process
// @access  Private
export const processSalesReturn = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const salesReturn = await SalesReturn.findById(req.params.id);
  if (!salesReturn) {
    res.status(404);
    throw new Error('Sales return not found');
  }

  if (status === 'approved') {
    // Add items back to inventory
    for (let item of salesReturn.items) {
      await SKU.findByIdAndUpdate(item.sku, {
        $inc: { currentStock: item.quantity }
      });

      // Create transaction record
      await Transaction.create({
        type: 'inbound',
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
        referenceType: 'SalesReturn',
        referenceId: salesReturn._id,
        notes: `Returned from Sales Return ${salesReturn.returnNumber}`,
        createdBy: req.user._id
      });
    }
  }

  salesReturn.status = status;
  salesReturn.processedBy = req.user._id;
  salesReturn.processedAt = new Date();

  const updatedReturn = await salesReturn.save();
  res.json(updatedReturn);
});
