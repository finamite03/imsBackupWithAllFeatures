
import asyncHandler from 'express-async-handler';
import SalesOrder from '../models/salesOrderModel.js';
import Invoice from '../models/invoiceModel.js';
import Transaction from '../models/transactionModel.js';
import SKU from '../models/skuModel.js';
import Customer from '../models/customerModel.js';
import Supplier from '../models/supplierModel.js';

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
export const getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, customer, status } = req.query;
  
  let query = {};
  if (startDate || endDate) {
    query.orderDate = {};
    if (startDate) query.orderDate.$gte = new Date(startDate);
    if (endDate) query.orderDate.$lte = new Date(endDate);
  }
  if (customer) query.customer = customer;
  if (status) query.status = status;

  const orders = await SalesOrder.find(query)
    .populate('customer', 'name email')
    .populate('items.sku', 'name sku')
    .sort({ orderDate: -1 });

  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

  // Sales by status
  const salesByStatus = await SalesOrder.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  // Monthly sales trend
  const monthlySales = await SalesOrder.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: '$orderDate' },
          month: { $month: '$orderDate' }
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    summary: {
      totalOrders,
      totalAmount,
      averageOrderValue
    },
    orders,
    salesByStatus,
    monthlySales
  });
});

// @desc    Get financial report
// @route   GET /api/reports/financial
// @access  Private
export const getFinancialReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  let dateQuery = {};
  if (startDate || endDate) {
    dateQuery.createdAt = {};
    if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
    if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
  }

  // Sales revenue
  const salesRevenue = await Invoice.aggregate([
    { $match: { ...dateQuery, status: { $in: ['paid', 'partially_paid'] } } },
    { $group: { _id: null, total: { $sum: '$paidAmount' } } }
  ]);

  // Outstanding invoices
  const outstandingInvoices = await Invoice.aggregate([
    { $match: { status: { $in: ['sent', 'partially_paid'] } } },
    { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }
  ]);

  // Overdue invoices
  const overdueInvoices = await Invoice.aggregate([
    { 
      $match: { 
        dueDate: { $lt: new Date() },
        status: { $in: ['sent', 'partially_paid'] }
      }
    },
    { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }
  ]);

  res.json({
    salesRevenue: salesRevenue[0]?.total || 0,
    outstandingAmount: outstandingInvoices[0]?.total || 0,
    overdueAmount: overdueInvoices[0]?.total || 0
  });
});

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
export const getInventoryReport = asyncHandler(async (req, res) => {
  const { category, warehouse, lowStock } = req.query;
  
  let query = {};
  if (category) query.category = category;
  if (warehouse) query.warehouse = warehouse;
  if (lowStock === 'true') {
    query.$expr = { $lt: ['$currentStock', '$minStock'] };
  }

  const skus = await SKU.find(query)
    .populate('warehouse', 'name')
    .populate('supplier', 'name');

  const totalSKUs = await SKU.countDocuments();
  const lowStockItems = await SKU.countDocuments({
    $expr: { $lt: ['$currentStock', '$minStock'] }
  });
  const outOfStockItems = await SKU.countDocuments({ currentStock: 0 });

  const totalInventoryValue = await SKU.aggregate([
    { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } } } }
  ]);

  // Stock by category
  const stockByCategory = await SKU.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalStock: { $sum: '$currentStock' },
        totalValue: { $sum: { $multiply: ['$currentStock', '$purchasePrice'] } }
      }
    }
  ]);

  res.json({
    summary: {
      totalSKUs,
      lowStockItems,
      outOfStockItems,
      totalInventoryValue: totalInventoryValue[0]?.total || 0
    },
    skus,
    stockByCategory
  });
});

// @desc    Get customer report
// @route   GET /api/reports/customers
// @access  Private
export const getCustomerReport = asyncHandler(async (req, res) => {
  const customers = await Customer.aggregate([
    {
      $lookup: {
        from: 'salesorders',
        localField: '_id',
        foreignField: 'customer',
        as: 'orders'
      }
    },
    {
      $lookup: {
        from: 'invoices',
        localField: '_id',
        foreignField: 'customer',
        as: 'invoices'
      }
    },
    {
      $addFields: {
        totalOrders: { $size: '$orders' },
        totalSpent: { $sum: '$invoices.paidAmount' },
        outstandingAmount: {
          $sum: {
            $map: {
              input: '$invoices',
              as: 'invoice',
              in: { $subtract: ['$$invoice.totalAmount', '$$invoice.paidAmount'] }
            }
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        totalOrders: 1,
        totalSpent: 1,
        outstandingAmount: 1
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);

  res.json(customers);
});

// @desc    Get supplier report
// @route   GET /api/reports/suppliers
// @access  Private
export const getSupplierReport = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.aggregate([
    {
      $lookup: {
        from: 'skus',
        localField: '_id',
        foreignField: 'supplier',
        as: 'skus'
      }
    },
    {
      $addFields: {
        totalSKUs: { $size: '$skus' },
        totalInventoryValue: {
          $sum: {
            $map: {
              input: '$skus',
              as: 'sku',
              in: { $multiply: ['$$sku.currentStock', '$$sku.purchasePrice'] }
            }
          }
        }
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        totalSKUs: 1,
        totalInventoryValue: 1
      }
    },
    { $sort: { totalInventoryValue: -1 } }
  ]);

  res.json(suppliers);
});

// @desc    Get purchase report
// @route   GET /api/reports/purchase
// @access  Private
export const getPurchaseReport = asyncHandler(async (req, res) => {
  // This would be implemented when purchase orders are fully developed
  res.json({
    message: 'Purchase reports will be available when purchase order system is complete'
  });
});
