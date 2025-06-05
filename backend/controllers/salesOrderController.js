
import asyncHandler from 'express-async-handler';
import SalesOrder from '../models/salesOrderModel.js';
import SKU from '../models/skuModel.js';
import Customer from '../models/customerModel.js';
import Transaction from '../models/transactionModel.js';

// @desc    Create new sales order
// @route   POST /api/sales-orders
// @access  Private
export const createSalesOrder = asyncHandler(async (req, res) => {
  const { customer, expectedDeliveryDate, items, notes } = req.body;

  // Validate customer exists
  const customerExists = await Customer.findById(customer);
  if (!customerExists) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Validate items and calculate totals
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  for (let item of items) {
    const sku = await SKU.findById(item.sku);
    if (!sku) {
      res.status(404);
      throw new Error(`SKU ${item.sku} not found`);
    }

    // Check stock availability
    if (sku.currentStock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${sku.name}. Available: ${sku.currentStock}, Required: ${item.quantity}`);
    }

    item.totalAmount = (item.quantity * item.unitPrice) - item.discount + item.tax;
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.discount;
    totalTax += item.tax;
  }

  const totalAmount = subtotal - totalDiscount + totalTax;

  const salesOrder = await SalesOrder.create({
    customer,
    expectedDeliveryDate,
    items,
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount,
    notes,
    createdBy: req.user._id
  });

  const populatedOrder = await SalesOrder.findById(salesOrder._id)
    .populate('customer', 'name email phone')
    .populate('items.sku', 'name sku currentStock')
    .populate('createdBy', 'name email');

  res.status(201).json(populatedOrder);
});

// @desc    Get all sales orders
// @route   GET /api/sales-orders
// @access  Private
export const getSalesOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const status = req.query.status;
  const customer = req.query.customer;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = {};

  if (status) query.status = status;
  if (customer) query.customer = customer;
  if (startDate || endDate) {
    query.orderDate = {};
    if (startDate) query.orderDate.$gte = new Date(startDate);
    if (endDate) query.orderDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const salesOrders = await SalesOrder.find(query)
    .populate('customer', 'name email phone')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await SalesOrder.countDocuments(query);

  res.json({
    salesOrders,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total
  });
});

// @desc    Get single sales order
// @route   GET /api/sales-orders/:id
// @access  Private
export const getSalesOrderById = asyncHandler(async (req, res) => {
  const salesOrder = await SalesOrder.findById(req.params.id)
    .populate('customer')
    .populate('items.sku')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!salesOrder) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  res.json(salesOrder);
});

// @desc    Update sales order
// @route   PUT /api/sales-orders/:id
// @access  Private
export const updateSalesOrder = asyncHandler(async (req, res) => {
  const salesOrder = await SalesOrder.findById(req.params.id);

  if (!salesOrder) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  // Only allow updates if order is in draft status
  if (salesOrder.status !== 'draft') {
    res.status(400);
    throw new Error('Cannot update confirmed sales order');
  }

  const { customer, expectedDeliveryDate, items, notes, status } = req.body;

  if (items) {
    // Recalculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (let item of items) {
      const sku = await SKU.findById(item.sku);
      if (!sku) {
        res.status(404);
        throw new Error(`SKU ${item.sku} not found`);
      }

      if (sku.currentStock < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${sku.name}`);
      }

      item.totalAmount = (item.quantity * item.unitPrice) - item.discount + item.tax;
      subtotal += item.quantity * item.unitPrice;
      totalDiscount += item.discount;
      totalTax += item.tax;
    }

    salesOrder.items = items;
    salesOrder.subtotal = subtotal;
    salesOrder.totalDiscount = totalDiscount;
    salesOrder.totalTax = totalTax;
    salesOrder.totalAmount = subtotal - totalDiscount + totalTax;
  }

  if (customer) salesOrder.customer = customer;
  if (expectedDeliveryDate) salesOrder.expectedDeliveryDate = expectedDeliveryDate;
  if (notes) salesOrder.notes = notes;

  // Handle status changes
  if (status && status !== salesOrder.status) {
    if (status === 'confirmed' && salesOrder.status === 'draft') {
      salesOrder.approvedBy = req.user._id;
      salesOrder.approvedAt = new Date();
      
      // Reserve stock for confirmed orders
      for (let item of salesOrder.items) {
        await SKU.findByIdAndUpdate(item.sku, {
          $inc: { reservedStock: item.quantity }
        });
      }
    }
    salesOrder.status = status;
  }

  const updatedOrder = await salesOrder.save();
  const populatedOrder = await SalesOrder.findById(updatedOrder._id)
    .populate('customer', 'name email phone')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  res.json(populatedOrder);
});

// @desc    Delete sales order
// @route   DELETE /api/sales-orders/:id
// @access  Private
export const deleteSalesOrder = asyncHandler(async (req, res) => {
  const salesOrder = await SalesOrder.findById(req.params.id);

  if (!salesOrder) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  // Only allow deletion if order is in draft status
  if (salesOrder.status !== 'draft') {
    res.status(400);
    throw new Error('Cannot delete confirmed sales order');
  }

  await salesOrder.deleteOne();
  res.json({ message: 'Sales order deleted successfully' });
});

// @desc    Get sales order statistics
// @route   GET /api/sales-orders/stats
// @access  Private
export const getSalesOrderStats = asyncHandler(async (req, res) => {
  const stats = await SalesOrder.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalOrders = await SalesOrder.countDocuments();
  const totalRevenue = await SalesOrder.aggregate([
    { $match: { status: { $in: ['delivered', 'shipped'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.json({
    statusBreakdown: stats,
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0
  });
});
