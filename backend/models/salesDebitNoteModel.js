
import mongoose from 'mongoose';

const debitNoteItemSchema = mongoose.Schema({
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
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  }
});

const salesDebitNoteSchema = mongoose.Schema({
  debitNoteNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  debitNoteDate: {
    type: Date,
    default: Date.now
  },
  items: [debitNoteItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: ['price_increase', 'additional_charges', 'penalty', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'accepted', 'disputed', 'cancelled'],
    default: 'draft'
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate debit note number
salesDebitNoteSchema.pre('save', async function (next) {
  if (!this.debitNoteNumber) {
    const lastNote = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    const lastNumber = lastNote ? parseInt(lastNote.debitNoteNumber.split('-')[1]) : 0;
    this.debitNoteNumber = `SDN-${String(lastNumber + 1).padStart(6, '0')}`;
  }
  next();
});

const SalesDebitNote = mongoose.model('SalesDebitNote', salesDebitNoteSchema);
export default SalesDebitNote;
