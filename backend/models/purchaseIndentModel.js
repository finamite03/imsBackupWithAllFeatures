const mongoose = require('mongoose');

const purchaseIndentSchema = new mongoose.Schema({
  indentId: {
    type: Number,
    unique: true
  },
  items: [
    {
      sku: { type: mongoose.Schema.Types.ObjectId, ref: 'SKU', required: true },
      quantity: { type: Number, required: true },
      // Vendor might be selected later in PO, or can be optional here
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // Assuming 'Supplier' model exists
    }
  ],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'PO Pending', 'PO Created', 'Deleted'],
    default: 'Pending'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // removed redundant timestamps field, { timestamps: true } handles createdAt and updatedAt
}, { timestamps: true });

// Pre-save hook to auto-increment indentId
purchaseIndentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastIndent = await this.constructor.findOne({}, {}, { sort: { 'indentId': -1 } });
    if (lastIndent && lastIndent.indentId) {
      this.indentId = lastIndent.indentId + 1;
    } else {
      this.indentId = 1;
    }
  }
  next();
});

module.exports = mongoose.model('PurchaseIndent', purchaseIndentSchema);
