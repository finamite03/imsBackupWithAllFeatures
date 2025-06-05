
import asyncHandler from 'express-async-handler';
import Invoice from '../models/invoiceModel.js';
import SalesOrder from '../models/salesOrderModel.js';
import Customer from '../models/customerModel.js';
import SKU from '../models/skuModel.js';
import Transaction from '../models/transactionModel.js';

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = asyncHandler(async (req, res) => {
  const { salesOrder, customer, dueDate, items, paymentTerms, notes } = req.body;

  // Validate customer exists
  const customerExists = await Customer.findById(customer);
  if (!customerExists) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // If salesOrder is provided, validate it exists
  if (salesOrder) {
    const orderExists = await SalesOrder.findById(salesOrder);
    if (!orderExists) {
      res.status(404);
      throw new Error('Sales order not found');
    }
  }

  // Calculate totals
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  for (let item of items) {
    const sku = await SKU.findById(item.sku);
    if (!sku) {
      res.status(404);
      throw new Error(`SKU ${item.sku} not found`);
    }

    item.totalAmount = (item.quantity * item.unitPrice) - item.discount + item.tax;
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.discount;
    totalTax += item.tax;
  }

  const totalAmount = subtotal - totalDiscount + totalTax;

  const invoice = await Invoice.create({
    salesOrder,
    customer,
    dueDate,
    items,
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount,
    paymentTerms,
    notes,
    createdBy: req.user._id
  });

  // Create transaction record
  await Transaction.create({
    type: 'sales',
    referenceType: 'Invoice',
    referenceId: invoice._id,
    customer,
    items: items.map(item => ({
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.totalAmount
    })),
    totalAmount,
    status: 'pending',
    createdBy: req.user._id
  });

  const populatedInvoice = await Invoice.findById(invoice._id)
    .populate('customer', 'name email phone')
    .populate('salesOrder', 'orderNumber')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email');

  res.status(201).json(populatedInvoice);
});

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
export const getInvoices = asyncHandler(async (req, res) => {
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
    query.invoiceDate = {};
    if (startDate) query.invoiceDate.$gte = new Date(startDate);
    if (endDate) query.invoiceDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const invoices = await Invoice.find(query)
    .populate('customer', 'name email phone')
    .populate('salesOrder', 'orderNumber')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Invoice.countDocuments(query);

  res.json({
    invoices,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalInvoices: total
  });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer')
    .populate('salesOrder')
    .populate('items.sku')
    .populate('createdBy', 'name email');

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  res.json(invoice);
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const { status, paidAmount } = req.body;

  if (status) {
    invoice.status = status;
    
    // Update transaction status when invoice status changes
    if (status === 'paid') {
      await Transaction.findOneAndUpdate(
        { referenceType: 'Invoice', referenceId: invoice._id },
        { status: 'completed' }
      );
      
      // Update stock levels when invoice is paid
      for (let item of invoice.items) {
        await SKU.findByIdAndUpdate(item.sku, {
          $inc: { 
            currentStock: -item.quantity,
            reservedStock: -item.quantity
          }
        });
      }
    }
  }

  if (paidAmount !== undefined) {
    invoice.paidAmount = paidAmount;
    
    // Auto-update status based on payment
    if (paidAmount >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else if (paidAmount > 0) {
      invoice.status = 'partially_paid';
    }
  }

  const updatedInvoice = await invoice.save();
  const populatedInvoice = await Invoice.findById(updatedInvoice._id)
    .populate('customer', 'name email phone')
    .populate('salesOrder', 'orderNumber')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email');

  res.json(populatedInvoice);
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'paid' || invoice.status === 'partially_paid') {
    res.status(400);
    throw new Error('Cannot delete paid or partially paid invoice');
  }

  // Delete associated transaction
  await Transaction.findOneAndDelete({
    referenceType: 'Invoice',
    referenceId: invoice._id
  });

  await invoice.deleteOne();
  res.json({ message: 'Invoice deleted successfully' });
});

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const stats = await Invoice.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$paidAmount' }
      }
    }
  ]);

  const totalInvoices = await Invoice.countDocuments();
  const totalRevenue = await Invoice.aggregate([
    { $group: { _id: null, total: { $sum: '$paidAmount' } } }
  ]);

  const overdueInvoices = await Invoice.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $in: ['sent', 'partially_paid'] }
  });

  res.json({
    statusBreakdown: stats,
    totalInvoices,
    totalRevenue: totalRevenue[0]?.total || 0,
    overdueInvoices
  });
});
