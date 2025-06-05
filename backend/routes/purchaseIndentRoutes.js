const express = require('express');
const router = express.Router();
const PurchaseIndent = require('../models/purchaseIndentModel');
const PurchaseIndentApproval = require('../models/purchaseIndentApprovalModel'); // Import the new model

// Create draft indent
router.post('/', async (req, res) => {
  try {
    const indent = new PurchaseIndent(req.body);
    await indent.save();
    res.status(201).json(indent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all indents
router.get('/', async (req, res) => {
  try {
    const indents = await PurchaseIndent.find().populate('items.sku').populate('items.vendor');
    res.json(indents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update indent
router.put('/:id', async (req, res) => {
  try {
    const indent = await PurchaseIndent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(indent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete indent
router.delete('/:id', async (req, res) => {
  try {
    await PurchaseIndent.findByIdAndUpdate(req.params.id, { status: 'deleted' });
    res.json({ message: 'Indent deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve indent
router.post('/:id/approve', async (req, res) => {
  try {
    const { userId, items, approvalRemarks } = req.body;
    const indentIdParam = req.params.id;

    // 1. Update the original PurchaseIndent status to "Approved"
    const originalIndent = await PurchaseIndent.findByIdAndUpdate(
      indentIdParam,
      { status: 'Approved', approvedBy: userId },
      { new: true }
    ).populate('items.sku');

    if (!originalIndent) {
      return res.status(404).json({ error: 'Original indent not found' });
    }

    // 2. Create a new PurchaseIndentApproval document
    const newApproval = new PurchaseIndentApproval({
      indent: originalIndent._id,
      indentId: originalIndent.indentId, // Use the auto-generated indentId
      items: items || originalIndent.items, // Use provided items, or fallback to original if not provided/editable
      approvedBy: userId,
      status: 'PO Pending', // Default status for new approvals
      approvalRemarks: approvalRemarks || '',
    });

    await newApproval.save();

    res.status(200).json({
      message: 'Indent approved and approval record created.',
      approvedIndent: originalIndent,
      approvalRecord: newApproval,
    });

  } catch (err) {
    console.error("Error approving indent:", err);
    res.status(500).json({ error: err.message || 'Failed to approve indent' });
  }
});

// Get indents pending approval
router.get('/pending-for-approval', async (req, res) => {
  try {
    const pendingIndents = await PurchaseIndent.find({ status: 'Pending' })
      .populate('items.sku', 'name skuCode') // Populate SKU name and code
      .populate('items.vendor', 'name') // Populate vendor name
      .populate('createdBy', 'name email') // Populate creator details
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(pendingIndents);
  } catch (err) {
    console.error("Error fetching pending indents:", err);
    res.status(500).json({ error: err.message || 'Failed to fetch pending indents' });
  }
});

// Get all approved indents (from PurchaseIndentApproval collection)
router.get('/approved-indents', async (req, res) => {
  try {
    const approvedIndents = await PurchaseIndentApproval.find({})
      .populate('indent', 'indentId createdAt') // Populate original indent's ID and creation date
      .populate('items.sku', 'name skuCode') // Populate SKU name and code
      .populate('items.vendor', 'name') // Populate vendor name
      .populate('approvedBy', 'name email') // Populate approver details
      .sort({ createdAt: -1 }); // Sort by newest first
    res.json(approvedIndents);
  } catch (err) {
    console.error("Error fetching approved indents:", err);
    res.status(500).json({ error: err.message || 'Failed to fetch approved indents' });
  }
});

module.exports = router;
