
import mongoose from 'mongoose';

const salesReturnSchema = mongoose.Schema({
  returnNumber: {
    type: String,
    required: true,
    unique: true
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['damaged', 'defective', 'wrong_item', 'customer_request', 'quality_issue', 'other']
  },
  actionRequired: {
    type: String,
    required: true,
    enum: ['refund', 'exchange', 'repair', 'credit_note']
  },
  items: [{
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processed', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate return number
salesReturnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const lastReturn = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    const lastNumber = lastReturn ? parseInt(lastReturn.returnNumber.split('-')[1]) : 0;
    this.returnNumber = `SR-${String(lastNumber + 1).padStart(6, '0')}`;
  }
  next();
});

const SalesReturn = mongoose.model('SalesReturn', salesReturnSchema);
export default SalesReturn;
