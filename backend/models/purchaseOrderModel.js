const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { // Auto-incrementing PO number
    type: Number,
    unique: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier', // Assuming you have a Supplier model
    required: true,
  },
  items: [
    {
      sku: { type: mongoose.Schema.Types.ObjectId, ref: 'SKU', required: true },
      quantity: { type: Number, required: true },
      // Price might be added here or managed separately
      // unitPrice: { type: Number, required: true }, 
      // indentApprovalItem: { type: mongoose.Schema.Types.ObjectId } // Optional: to link back to specific item in approval
    }
  ],
  // Link to the PurchaseIndentApproval document(s) this PO is for.
  // A PO could potentially consolidate multiple approved indents for the same vendor.
  // For simplicity, starting with a single approval link.
  // A PO can consolidate multiple approved indents for the same vendor.
  indentApprovals: [{ // Changed from indentApproval to indentApprovals (array)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseIndentApproval',
  }],
  deliveryDueDate: {
    type: Date,
  },
  paymentDays: { // e.g., "Net 30", "On Delivery", or a number like 30
    type: String, // Using String for flexibility like "Net 30"
  },
  freight: { // e.g., "FOB Destination", "Prepaid", or a numeric value for cost
    type: String, // Using String for flexibility
  },
  status: {
    type: String,
    enum: ['Issued', 'Partially Received', 'Received', 'Cancelled'],
    default: 'Issued',
    required: true,
  },
  stockInStatus: {
    type: String,
    enum: ['Pending to be Stock In', 'Stocked In'],
    default: 'Pending to be Stock In',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Add other relevant PO fields like shippingAddress, paymentTerms, etc.
}, { timestamps: true });

// Pre-save hook to auto-increment poNumber
purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'poNumber': -1 } });
    if (lastOrder && lastOrder.poNumber) {
      this.poNumber = lastOrder.poNumber + 1;
    } else {
      this.poNumber = 1001; // Starting PO number from 1001 or any preferred number
    }
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);