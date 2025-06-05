const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/purchaseOrderModel');
const PurchaseIndentApproval = require('../models/purchaseIndentApprovalModel');
const mongoose = require('mongoose'); // Required for ObjectId validation

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get approved indent items pending PO by vendor
router.get('/approved-items-by-vendor/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!isValidObjectId(vendorId)) {
      return res.status(400).json({ error: 'Invalid vendor ID format.' });
    }

    // Find approved indents for the specific vendor that are pending PO creation
    const approvedItems = await PurchaseIndentApproval.find({
      'items.vendor': vendorId, // Query within the items array
      status: 'PO Pending'
    })
    .populate('items.sku', 'name skuCode')
    .populate('indent', 'indentId'); // Populate indentId from the original indent

    if (!approvedItems || approvedItems.length === 0) {
      return res.status(404).json({ message: 'No approved items pending PO found for this vendor.' });
    }

    // Filter and restructure items to be specific to the vendor
    const vendorSpecificItems = approvedItems.reduce((acc, approval) => {
      approval.items.forEach(item => {
        if (item.vendor && item.vendor.toString() === vendorId) {
          acc.push({
            _id: item._id, // ID of the item in the approval document
            sku: item.sku,
            quantity: item.quantity,
            indentId: approval.indent.indentId, // Original Indent ID
            indentApprovalId: approval._id // ID of the approval document
          });
        }
      });
      return acc;
    }, []);

    if (vendorSpecificItems.length === 0) {
        return res.status(404).json({ message: 'No approved items specifically matching this vendor found (double check vendor IDs in items).' });
    }

    res.json(vendorSpecificItems);
  } catch (err) {
    console.error("Error fetching approved items by vendor:", err);
    res.status(500).json({ error: err.message || 'Failed to fetch approved items' });
  }
});

// Create a new Purchase Order
router.post('/', async (req, res) => {
  try {
    const { vendor, items, createdBy, indentApprovalIds, deliveryDueDate, paymentDays, freight } = req.body;

    // Added deliveryDueDate, paymentDays, freight to the required fields check if they are mandatory
    // For now, assuming they are optional as per model, but vendor, items, createdBy, indentApprovalIds are core.
    if (!vendor || !items || items.length === 0 || !createdBy || !indentApprovalIds || indentApprovalIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: vendor, items, createdBy, indentApprovalIds' });
    }
    if (!isValidObjectId(vendor) || !isValidObjectId(createdBy)) {
        return res.status(400).json({ error: 'Invalid vendor or createdBy ID format.' });
    }
    for (const id of indentApprovalIds) {
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: `Invalid indentApprovalId format: ${id}` });
        }
    }


    // For simplicity, this example assumes items in the PO directly map to items from one or more approvals.
    // More complex logic might be needed for partial POs from a single approval item.
    const newPO = new PurchaseOrder({
      vendor,
      items, // These items should include SKU, quantity, and potentially price
      createdBy,
      deliveryDueDate,
      paymentDays,
      freight,
      // We can link to multiple approval documents if a PO consolidates them
      // For now, let's assume the frontend sends the relevant indentApproval IDs
      // If indentApprovalIds is an array, the model should also support it or this logic needs adjustment
      // For now, assuming the model's 'indentApproval' field can handle an array or is meant to be singular.
      // If it's singular and multiple are passed, this might need to be a loop or other logic.
      // The current model has 'indentApproval' as a single ObjectId.
      // If a PO can be generated from multiple approvals, the model needs `indentApprovals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseIndentApproval'}]`
      // For now, we'll assume the first ID in indentApprovalIds is the primary one if the model is singular.
      // Or, if the PO is not directly tied to one approval but rather a collection of items, this field might be optional or handled differently.
      indentApprovals: indentApprovalIds // Changed to indentApprovals and passing the array
    });

    const savedPO = await newPO.save();

    // Update status in PurchaseIndentApproval documents
    // This assumes that all items in the selected indentApprovalIds are included in this PO.
    // If only partial items from an approval are used, logic needs to be more granular.
    await PurchaseIndentApproval.updateMany(
      { _id: { $in: indentApprovalIds } },
      { $set: { status: 'PO Created' } }
    );

    res.status(201).json({ message: 'Purchase Order created successfully', purchaseOrder: savedPO });
  } catch (err) {
    console.error("Error creating Purchase Order:", err);
    res.status(500).json({ error: err.message || 'Failed to create Purchase Order' });
  }
});

// Get all Purchase Orders (optional, for a PO listing page)
router.get('/', async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({})
      .populate('vendor', 'name')
      .populate('items.sku', 'name skuCode')
      .populate('createdBy', 'name email')
      .populate('indentApprovals', 'indentId') // if single approval linked // Changed to indentApprovals
      .sort({ createdAt: -1 });
    res.json(purchaseOrders);
  } catch (err) {
    console.error("Error fetching purchase orders:", err);
    res.status(500).json({ error: err.message || 'Failed to fetch purchase orders' });
  }
});


// Update PO Stock-In Status
router.put('/:id/stock-in', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid Purchase Order ID format.' });
    }

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    // Potentially add logic here: e.g., can only mark as 'Stocked In' if status is 'Issued' or 'Partially Received'
    // For now, directly updating.
    purchaseOrder.stockInStatus = 'Stocked In';
    // Optionally, update the main 'status' if business logic dictates (e.g., to 'Received' or 'Partially Received')
    // purchaseOrder.status = 'Received'; // Example: if stocking in means it's fully received.

    const updatedPO = await purchaseOrder.save();
    res.json({ message: 'Purchase Order marked as Stocked In.', purchaseOrder: updatedPO });

  } catch (err) {
    console.error("Error updating PO stock-in status:", err);
    res.status(500).json({ error: err.message || 'Failed to update PO stock-in status' });
  }
});

module.exports = router;