const mongoose = require('mongoose');

const purchaseIndentApprovalSchema = new mongoose.Schema({
  indent: { // Reference to the original PurchaseIndent document
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseIndent',
    required: true,
  },
  indentId: { // The indentId from the original PurchaseIndent
    type: Number,
    required: true,
  },
  items: [
    {
      sku: { type: mongoose.Schema.Types.ObjectId, ref: 'SKU', required: true },
      quantity: { type: Number, required: true },
      // Vendor might be confirmed or changed during approval
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, 
    }
  ],
  status: {
    type: String,
    enum: ['PO Pending', 'PO Created', 'Cancelled'], // Statuses for the approval lifecycle
    default: 'PO Pending',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvalRemarks: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseIndentApproval', purchaseIndentApprovalSchema);