import StockAdjustment from '../models/stockAdjustmentModel.js';
import SKU from '../models/skuModel.js';
import asyncHandler from 'express-async-handler';

// Create stock adjustment
export const createStockAdjustment = asyncHandler(async (req, res) => {
  const { sku, adjustmentType, quantity, reason, notes } = req.body; // REMOVE warehouse

  // Validate SKU
  const skuDoc = await SKU.findById(sku);
  if (!skuDoc) {
    res.status(404);
    throw new Error('SKU not found');
  }

  // REMOVE warehouse validation
  // if (!warehouse) {
  //   res.status(400);
  //   throw new Error('Warehouse is required');
  // }

  // Calculate updated stock
  const adjustmentQuantity = parseInt(quantity);
  skuDoc.currentStock = parseInt(skuDoc.currentStock);

  let updatedStock;
  if (adjustmentType === 'increase') {
    updatedStock = skuDoc.currentStock + adjustmentQuantity;
  } else {
    updatedStock = skuDoc.currentStock - adjustmentQuantity;
  }

  // Validate stock won't go negative
  if (updatedStock < 0) {
    res.status(400);
    throw new Error('Stock cannot be negative');
  }

  // Create adjustment
  const adjustment = await StockAdjustment.create({
    sku,
    adjustmentType,
    quantity: adjustmentQuantity,
    reason,
    notes,
    user: req.user._id,
    previousStock: skuDoc.currentStock,
    updatedStock: updatedStock
  });

  // Update SKU stock
  skuDoc.currentStock = updatedStock;
  await skuDoc.save();

  // Populate the response
  const populatedAdjustment = await StockAdjustment.findById(adjustment._id)
    .populate('sku')
    .populate('user', 'name email');

  res.status(201).json(populatedAdjustment);
});

// Get all adjustments with filters
export const getStockAdjustments = asyncHandler(async (req, res) => {
  const { 
    sku,
    adjustmentType,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const query = {};

  if (sku) query.sku = sku;
  if (adjustmentType) query.adjustmentType = adjustmentType;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (search) {
    query.$or = [
      { 'sku.name': { $regex: search, $options: 'i' } },
      { 'sku.sku': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const adjustments = await StockAdjustment.find(query)
    .populate('sku')
    .populate('user', 'name email')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await StockAdjustment.countDocuments(query);

  res.json({
    adjustments,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    total
  });
});

// Get adjustment by ID
export const getStockAdjustmentById = asyncHandler(async (req, res) => {
  const adjustment = await StockAdjustment.findById(req.params.id)
    .populate('sku')
    .populate('user', 'name email');

  if (!adjustment) {
    res.status(404);
    throw new Error('Stock adjustment not found');
  }

  res.json(adjustment);
});

// Get stock adjustment statistics
export const getStockAdjustmentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateQuery = {};
  if (startDate || endDate) {
    dateQuery.createdAt = {};
    if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
    if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
  }

  const stats = await StockAdjustment.aggregate([
    { $match: dateQuery },
    {
      $group: {
        _id: '$adjustmentType',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  res.json(stats);
});